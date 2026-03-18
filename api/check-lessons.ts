// @ts-nocheck
import { createClient } from 'redis';
import webpush from 'web-push';
import { format, addMinutes, isAfter, isBefore, parse } from 'date-fns';

// --- CONFIGURATION ---
const NOTIFICATION_WINDOW_MINUTES = 15; // Point 1: 15 minutes window
const REDIS_SCHEDULE_TTL = 900; // Point 3: 15 minutes cache for Uni API (900s)
const REDIS_NOTIFIED_TTL = 10800; // Point 2: 3 hours idempotency (10800s)

let redisClient;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => console.error('Errore Redis Client:', err));
    await redisClient.connect();
  } else if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}

// Web Push Configuration
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BBB-NGYcP_fNTNrlGBSIDVPhLlzcQme4lRD67aWaGUywWTSWJCvJvkcMEf45V69w4BP_eKcOjdtpJR7b0T188bE';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'DPO4obXLNPVVeviyX0hsPd7MFVbYBH4thA3q-SvDfzE';

webpush.setVapidDetails(
  'mailto:info@nextlesson.it',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

/**
 * Point 3: Unified function to fetch schedule with Redis caching.
 */
async function fetchScheduleWithCache(client, corsoCodice, annoCodice, dateStr) {
  const cacheKey = `uni_cache:${corsoCodice}:${annoCodice}:${dateStr}`;
  
  // Check Redis Cache
  const cached = await client.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Fetch from University API
  const formData = new URLSearchParams();
  formData.append('view', 'easycourse');
  formData.append('form-type', 'corso');
  formData.append('include', 'corso');
  formData.append('anno', '2025'); // Dynamic update needed?
  formData.append('corso', corsoCodice);
  formData.append('anno2[]', annoCodice);
  formData.append('date', dateStr);
  formData.append('_lang', 'it');

  try {
    const response = await fetch('https://logistica.unisalento.it/PortaleStudenti/grid_call.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });

    if (!response.ok) return { celle: [] };
    
    const data = await response.json();
    
    // Save to Redis
    await client.setEx(cacheKey, REDIS_SCHEDULE_TTL, JSON.stringify(data));
    return data;
  } catch (err) {
    console.error(`Error fetching schedule for ${corsoCodice}:`, err);
    return { celle: [] };
  }
}

export default async function handler(req, res) {
  // Authorization check (Vercel Cron or Secret)
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const isAuthorized = req.query.secret === process.env.CRON_SECRET || req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron && !isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const isTest = req.query.test === 'true';

  try {
    const client = await getRedisClient();
    const now = new Date();
    const windowEnd = addMinutes(now, NOTIFICATION_WINDOW_MINUTES);
    const todayStr = format(now, 'dd-MM-yyyy');

    // Fetch all subscription keys
    const keys = await client.keys('*'); // Ideally use SCAN for > 1000 users
    const notificationPromises = [];
    const localScheduleCache = new Map(); // Avoid redundant Redis calls in same execution

    if (isTest) {
      // --- TEST MODE ---
      for (const key of keys) {
        if (key.startsWith('uni_cache:') || key.startsWith('notified:')) continue;
        
        const dataStr = await client.get(key);
        if (!dataStr) continue;

        const { subscription } = JSON.parse(dataStr);
        if (!subscription?.endpoint) continue;

        const promise = (async () => {
          try {
            await webpush.sendNotification(subscription, JSON.stringify({
              title: '🔔 Test Sistema Operativo!',
              body: 'Se leggi questo, il sistema di notifiche push, Redis e Vercel funzionano alla perfezione.',
              data: { url: '/home' }
            }));
            return { key, status: 'sent', type: 'test' };
          } catch (err) {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await client.del(key);
              return { key, status: 'removed' };
            }
            return { key, status: 'error', error: err.message };
          }
        })();
        notificationPromises.push(promise);
      }
    } else {
      // --- REGULAR MODE ---
      for (const key of keys) {
        if (key.startsWith('uni_cache:') || key.startsWith('notified:')) continue;

        const dataStr = await client.get(key);
        if (!dataStr) continue;

        const { subscription, corsi } = JSON.parse(dataStr);
        if (!corsi?.corso?.codice) continue;

        // Identify courses to check (Main + Extra)
        const coursesToCheck = [
          { codice: corsi.corso.codice, anno: corsi.corso.annoCodice },
          ...(corsi.materieExtra || []).map(m => ({ codice: m.corsoCodice, anno: m.annoCodice }))
        ];

        // Remove duplicates
        const uniqueCourses = Array.from(new Map(coursesToCheck.map(c => [`${c.codice}-${c.anno}`, c])).values());

        for (const course of uniqueCourses) {
          const cacheId = `${course.codice}-${course.anno}`;
          let schedule = localScheduleCache.get(cacheId);
          
          if (!schedule) {
            schedule = await fetchScheduleWithCache(client, course.codice, course.anno, todayStr);
            localScheduleCache.set(cacheId, schedule);
          }

          if (!schedule?.celle) continue;

          for (const cell of schedule.celle) {
            // Filter by user blacklist
            const cleanMateria = cell.nome_insegnamento.replace(/<[^>]+>/g, '').trim();
            if (corsi.blacklist?.includes(cleanMateria)) continue;

            // Parse lesson time
            const [startTimeStr] = cell.orario.split(' - ');
            const lessonDate = parse(`${cell.data} ${startTimeStr}`, 'dd-MM-yyyy HH:mm', new Date());

            // Point 1: Check 15-minute window
            if (isAfter(lessonDate, now) && isBefore(lessonDate, windowEnd)) {
              
              // Point 2: Idempotency with Redis
              const idempotencyKey = `notified:${subscription.endpoint}:${cleanMateria}:${startTimeStr}`;
              const alreadyNotified = await client.get(idempotencyKey);
              
              if (!alreadyNotified) {
                // Prepare Notification Promise
                const promise = (async () => {
                  try {
                    await webpush.sendNotification(subscription, JSON.stringify({
                      title: 'Lezione in arrivo! 🎓',
                      body: `${cleanMateria} inizia alle ${startTimeStr} in ${cell.aula || 'aula non specificata'}`,
                      tag: `lesson-${cleanMateria}-${startTimeStr}`,
                      data: { url: '/home' }
                    }));
                    
                    // Mark as notified in Redis (Point 2)
                    await client.setEx(idempotencyKey, REDIS_NOTIFIED_TTL, '1');
                    return { key, status: 'sent', materia: cleanMateria };
                  } catch (err) {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                      await client.del(key); // Cleanup dead subscriptions
                      return { key, status: 'removed' };
                    }
                    return { key, status: 'error', error: err.message };
                  }
                })();
                
                notificationPromises.push(promise);
              }
            }
          }
        }
      }
    }

    // Point 4: Parallel execution (Promise.allSettled)
    const summary = await Promise.allSettled(notificationPromises);
    
    return res.status(200).json({
      success: true,
      mode: isTest ? 'test' : 'regular',
      timestamp: now.toISOString(),
      notifications_attempted: notificationPromises.length,
      results: summary.map(s => s.status === 'fulfilled' ? s.value : { status: 'failed', error: s.reason })
    });

  } catch (error) {
    console.error('CRITICAL ERROR:', error);
    return res.status(500).json({ error: error.message });
  }
}

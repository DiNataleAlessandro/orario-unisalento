import { createClient } from 'redis';
import webpush from 'web-push';
import { addMinutes, isAfter, format } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

// --- CONFIGURATION ---
const TIMEZONE = 'Europe/Rome';
const NOTIFICATION_WINDOW_MINUTES = 15; 
const REDIS_NOTIFIED_TTL = 10800; // 3 ore

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
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
  'mailto:info@nextlesson.it',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

async function fetchUniversitySchedule(corsoCodice, annoCodice, dateStr) {
  const formData = new URLSearchParams();
  formData.append('view', 'easycourse');
  formData.append('form-type', 'corso');
  formData.append('include', 'corso');
  formData.append('anno', '2025'); 
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
    return await response.json();
  } catch (err) {
    console.error(`Error fetching schedule for ${corsoCodice}:`, err);
    return { celle: [] };
  }
}

export default async function handler(req, res) {
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const isAuthorized = req.query.secret === process.env.CRON_SECRET || req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron && !isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const isTest = req.query.test === 'true';

  try {
    const client = await getRedisClient();
    
    // Forza il fuso orario italiano per "now"
    const nowSystem = new Date();
    const now = toZonedTime(nowSystem, TIMEZONE);
    
    const windowEnd = addMinutes(now, NOTIFICATION_WINDOW_MINUTES);
    const todayStr = format(now, 'dd-MM-yyyy');

    const keys = await client.keys('*'); 
    const notificationPromises = [];
    const localScheduleCache = new Map(); 

    if (isTest) {
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
      for (const key of keys) {
        if (key.startsWith('uni_cache:') || key.startsWith('notified:')) continue;

        const dataStr = await client.get(key);
        if (!dataStr) continue;

        const { subscription, corsi } = JSON.parse(dataStr);
        if (!corsi?.corso?.codice) continue;

        const coursesToCheck = [
          { codice: corsi.corso.codice, anno: corsi.corso.annoCodice },
          ...(corsi.materieExtra || []).map(m => ({ codice: m.corsoCodice, anno: m.annoCodice }))
        ];

        const uniqueCourses = Array.from(new Map(coursesToCheck.map(c => [`${c.codice}-${c.anno}`, c])).values());

        for (const course of uniqueCourses) {
          const cacheId = `${course.codice}-${course.anno}`;
          let schedule = localScheduleCache.get(cacheId);
          
          if (!schedule) {
            schedule = await fetchUniversitySchedule(course.codice, course.anno, todayStr);
            localScheduleCache.set(cacheId, schedule);
          }

          if (!schedule?.celle) continue;

          for (const cell of schedule.celle) {
            const cleanMateria = cell.nome_insegnamento.replace(/<[^>]+>/g, '').trim();
            if (corsi.blacklist?.includes(cleanMateria)) continue;

            const [startTimeStr] = cell.orario.split(' - ');
            
            // Parsing esplicito come Europe/Rome
            // cell.data (dd-MM-yyyy) + startTimeStr (HH:mm)
            const [g, m, a] = cell.data.split('-');
            const [ore, min] = startTimeStr.split(':');
            const dateStrISO = `${a}-${m}-${g}T${ore}:${min}:00`;
            const lessonDate = fromZonedTime(dateStrISO, TIMEZONE);

            // Confronto tra orari entrambi in Europe/Rome (o normalizzati)
            if (isAfter(lessonDate, now) && !isAfter(lessonDate, windowEnd)) {
              const idempotencyKey = `notified:${subscription.endpoint}:${cleanMateria}:${startTimeStr}`;
              const alreadyNotified = await client.get(idempotencyKey);
              
              if (!alreadyNotified) {
                const promise = (async () => {
                  try {
                    await webpush.sendNotification(subscription, JSON.stringify({
                      title: 'Lezione in arrivo! 🎓',
                      body: `${cleanMateria} inizia alle ${startTimeStr} in ${cell.aula || 'aula non specificata'}`,
                      tag: `lesson-${cleanMateria}-${startTimeStr}`,
                      data: { url: '/home' }
                    }));
                    
                    await client.setEx(idempotencyKey, REDIS_NOTIFIED_TTL, '1');
                    return { key, status: 'sent', materia: cleanMateria };
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
            }
          }
        }
      }
    }

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

import { createClient } from 'redis';
import webpush from 'web-push';
import { addMinutes, subMinutes, isAfter, format } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

// --- CONFIGURATION ---
const TIMEZONE = 'Europe/Rome';
const REDIS_NOTIFIED_TTL = 7200; // 2 ore (auto-pulizia dopo l'inizio lezione)

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

async function fetchRoomSchedule(area, dateStr) {
  const params = new URLSearchParams();
  params.append('form-type', 'rooms');
  params.append('view', 'rooms');
  params.append('include', 'rooms');
  params.append('sede[]', area);
  params.append('aula[]', 'all');
  params.append('date', dateStr);
  params.append('_lang', 'it');
  params.append('all_events', '0');

  try {
    const response = await fetch('https://logistica.unisalento.it/PortaleStudenti/rooms_call.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!response.ok) return { events: [] };
    return await response.json();
  } catch (err) {
    console.error(`Error fetching room schedule for ${area}:`, err);
    return { events: [] };
  }
}

export default async function handler(req, res) {
  // Parsing dei parametri tramite WHATWG URL API per evitare DEP0169
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const fullUrl = new URL(req.url!, `${protocol}://${req.headers.host}`);
  
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const querySecret = fullUrl.searchParams.get('secret');
  const isAuthorized = querySecret === process.env.CRON_SECRET || req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron && !isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const isTest = fullUrl.searchParams.get('test') === 'true';

  try {
    const client = await getRedisClient();
    
    // Istante globale assoluto corretto
    const now = new Date();
    
    // Finestra temporale allargata per gestire jitter dei cron job
    const windowStart = subMinutes(now, 5);
    const windowEnd = addMinutes(now, 25);
    
    const todayStr = format(toZonedTime(now, TIMEZONE), 'dd-MM-yyyy');

    const keys = await client.keys('*'); 
    const notificationPromises = [];
    const localScheduleCache = new Map(); 
    const localRoomCache = new Map(); 

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

        // --- CONTROLLO LEZIONI SINGOLE ---
        const singleLessons = corsi.lezioniSingolePrenotate || [];
        for (const single of singleLessons) {
          if (single.data !== todayStr) continue;

          const [startTimeStr] = single.orario.split(' - ');
          const [ore, min] = startTimeStr.split(':');
          const [g, m, a] = single.data.split('-');
          const dateStrISO = `${a}-${m}-${g}T${ore}:${min}:00`;
          const lessonDate = fromZonedTime(dateStrISO, TIMEZONE);

          if (isAfter(lessonDate, windowStart) && !isAfter(lessonDate, windowEnd)) {
            // Verifica opzionale: esiste ancora l'evento in quell'aula?
            if (single.buildingId) {
              let roomData = localRoomCache.get(single.buildingId);
              if (!roomData) {
                roomData = await fetchRoomSchedule(single.buildingId, todayStr);
                localRoomCache.set(single.buildingId, roomData);
              }
              const exists = roomData.events?.find(ev => 
                String(ev.timestamp_from) === String(single.timestamp_from) && 
                (ev.name === single.nome_insegnamento || ev.nome === single.nome_insegnamento)
              );
              if (!exists) continue;
            }

            const idempotencyKey = `notified:${subscription.endpoint}:${single.nome_insegnamento}:${single.data}:${startTimeStr}`;
            const alreadyNotified = await client.get(idempotencyKey);
            
            if (!alreadyNotified) {
              const promise = (async () => {
                try {
                  await webpush.sendNotification(subscription, JSON.stringify({
                    title: 'Promemoria Lezione! 📌',
                    body: `${single.nome_insegnamento} inizia alle ${startTimeStr} in ${single.aula}`,
                    tag: `single-${single.id}`,
                    data: { url: '/home' }
                  }));
                  await client.set(idempotencyKey, '1', { EX: REDIS_NOTIFIED_TTL });
                  return { key, status: 'sent', materia: single.nome_insegnamento, type: 'single' };
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
            const [g, m, a] = cell.data.split('-');
            const [ore, min] = startTimeStr.split(':');
            const dateStrISO = `${a}-${m}-${g}T${ore}:${min}:00`;
            const lessonDate = fromZonedTime(dateStrISO, TIMEZONE);

            // Controllo all'interno della finestra temporale resiliente
            if (isAfter(lessonDate, windowStart) && !isAfter(lessonDate, windowEnd)) {
              // Chiave di idempotenza perfezionata con data per evitare conflitti
              const idempotencyKey = `notified:${subscription.endpoint}:${cleanMateria}:${cell.data}:${startTimeStr}`;
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
                    
                    // Salvataggio con TTL per auto-pulizia del database Redis
                    await client.set(idempotencyKey, '1', { EX: REDIS_NOTIFIED_TTL });
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

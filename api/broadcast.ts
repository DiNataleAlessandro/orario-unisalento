// @ts-nocheck
import { createClient } from 'redis';
import webpush from 'web-push';

let redisClient;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => console.error('Errore Redis:', err));
    await redisClient.connect();
  } else if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails('mailto:info@nextlesson.it', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export default async function handler(req, res) {
  const { secret } = req.query;
  
  // Usa lo stesso segreto del Cron Job per uniformità e sicurezza
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }

  try {
    const client = await getRedisClient();
    const allKeys = await client.keys('*');
    // Le iscrizioni WebPush usano l'URL endpoint come chiave
    const subscriptionKeys = allKeys.filter(k => k.startsWith('https://'));

    let countSuccess = 0;
    let countFail = 0;

    const payload = JSON.stringify({
      title: 'Nuovo Anno Accademico! 🎓',
      body: 'Ricordati di andare nelle Impostazioni, uscire e selezionare il tuo nuovo anno per ricevere gli orari aggiornati.',
      tag: 'broadcast-nuovo-anno'
    });

    for (const key of subscriptionKeys) {
      try {
        const dataStr = await client.get(key);
        if (!dataStr) continue;
        
        const { subscription } = JSON.parse(dataStr);
        if (!subscription || !subscription.endpoint) continue;

        await webpush.sendNotification(subscription, payload);
        countSuccess++;
      } catch (e) {
        if (e.statusCode === 410 || e.statusCode === 404) {
          await client.del(key);
        }
        countFail++;
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Broadcast completato!', 
      stats: { 
        totali: subscriptionKeys.length, 
        successo: countSuccess, 
        falliti_o_rimossi: countFail 
      } 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
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

    const CHUNK_SIZE = 50; // Inviamo a blocchi di 50 per evitare di sovraccaricare la rete o il servizio di push
    for (let i = 0; i < subscriptionKeys.length; i += CHUNK_SIZE) {
      const chunk = subscriptionKeys.slice(i, i + CHUNK_SIZE);
      
      const promises = chunk.map(async (key) => {
        try {
          const dataStr = await client.get(key);
          if (!dataStr) return;
          
          const { subscription } = JSON.parse(dataStr);
          if (!subscription || !subscription.endpoint) return;

          await webpush.sendNotification(subscription, payload);
          countSuccess++;
        } catch (e) {
          if (e.statusCode === 410 || e.statusCode === 404) {
            await client.del(key); // Rimuove gli utenti che hanno revocato i permessi
          }
          countFail++;
        }
      });

      // Aspettiamo che tutto il blocco termini prima di passare al successivo
      await Promise.allSettled(promises);
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
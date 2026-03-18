// @ts-nocheck
import { createClient } from 'redis';
import webpush from 'web-push';

// Gestione client Redis persistente
let redisClient;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL
    });
    redisClient.on('error', (err) => console.error('Errore Redis Client:', err));
    await redisClient.connect();
  } else if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}

// Configurazione Web Push con fallback per lo sviluppo locale
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BBB-NGYcP_fNTNrlGBSIDVPhLlzcQme4lRD67aWaGUywWTSWJCvJvkcMEf45V69w4BP_eKcOjdtpJR7b0T188bE';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'DPO4obXLNPVVeviyX0hsPd7MFVbYBH4thA3q-SvDfzE';

webpush.setVapidDetails(
  'mailto:example@unisalento.it',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  try {
    const client = await getRedisClient();
    const keys = await client.keys('*');
    if (keys.length === 0) {
      return res.status(404).json({ error: 'Nessuna sottoscrizione trovata su Redis. Registrati prima dall\'app.' });
    }

    // Prendi l'ultima sottoscrizione (la tua)
    const lastKey = keys[keys.length - 1];
    const dataStr = await redisClient.get(lastKey);
    const { subscription } = JSON.parse(dataStr);

    const payload = JSON.stringify({
      title: 'Test Notifica 🚀',
      body: 'Se vedi questo, il sistema Push funziona perfettamente!',
      tag: 'test-notif'
    });

    await webpush.sendNotification(subscription, payload);

    return res.status(200).json({ success: true, message: 'Notifica inviata a ' + lastKey });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}

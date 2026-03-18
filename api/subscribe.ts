// @ts-nocheck
import { createClient } from 'redis';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  try {
    const client = await getRedisClient();
    const { subscription, corsi } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Dati mancanti' });
    }

    await redisClient.set(
      subscription.endpoint, 
      JSON.stringify({ subscription, corsi })
    );

    return res.status(200).json({ message: 'Successo!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Errore' });
  }
}
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
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint mancante' });
    }

    // Eliminazione proattiva della sottoscrizione
    const result = await client.del(endpoint);

    return res.status(200).json({ 
      success: true, 
      message: result ? 'Sottoscrizione rimossa' : 'Sottoscrizione non trovata' 
    });
  } catch (error) {
    console.error('Errore durante l\'unsubscription:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}

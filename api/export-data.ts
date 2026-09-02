import { createClient } from 'redis';

export default async function handler(req, res) {
  const { secret } = req.query;

  // Usa la stessa sicurezza del broadcast
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }

  try {
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();

    const allKeys = await client.keys('https://*');
    const users = [];

    for (const key of allKeys) {
      const dataStr = await client.get(key);
      if (!dataStr) continue;

      try {
        const parsed = JSON.parse(dataStr);
        // Salviamo solo i dati statistici (corsi), omettendo i dati sensibili della sottoscrizione
        if (parsed.corsi) {
          users.push(parsed.corsi);
        }
      } catch (e) {
        // Ignora JSON non validi
      }
    }

    await client.quit();

    return res.status(200).json({
      totale_utenti: users.length,
      dati: users
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}

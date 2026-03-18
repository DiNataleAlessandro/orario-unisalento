// @ts-nocheck
import { createClient } from 'redis';
import webpush from 'web-push';
import { format } from 'date-fns';

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

// Configurazione Web Push
// Configurazione Web Push con fallback per lo sviluppo locale
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BBB-NGYcP_fNTNrlGBSIDVPhLlzcQme4lRD67aWaGUywWTSWJCvJvkcMEf45V69w4BP_eKcOjdtpJR7b0T188bE';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'DPO4obXLNPVVeviyX0hsPd7MFVbYBH4thA3q-SvDfzE';

webpush.setVapidDetails(
  'mailto:example@unisalento.it',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  // Solo per Vercel Cron o chiamate autorizzate
  // if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return res.status(401).end('Unauthorized');
  // }

  try {
    const client = await getRedisClient();

    // 1. Recupera tutte le sottoscrizioni da Redis
    const keys = await client.keys('*');
    const results = [];

    for (const key of keys) {
      const dataStr = await redisClient.get(key);
      if (!dataStr) continue;

      const { subscription, corsi } = JSON.parse(dataStr);
      if (!corsi || !corsi.corso || !corsi.corso.codice) continue;

      // 2. Fetch orario da UniSalento per questo utente
      const today = format(new Date(), 'dd-MM-yyyy');
      const formData = new URLSearchParams();
      formData.append('form_data[corso_codice]', corsi.corso.codice);
      formData.append('form_data[anno_accademico]', '2024'); // Default o dinamico
      formData.append('form_data[date_start]', today);
      formData.append('form_data[date_end]', today);
      formData.append('grid_action', 'filter');

      const response = await fetch('https://logistica.unisalento.it/easycourse/VisualizzaOrario.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      if (!response.ok) continue;

      const html = await response.text();
      // Parser grezzo per trovare le lezioni (in un'app reale useresti un parser HTML o l'API specifica)
      // Per brevità, assumiamo di aver trovato una lezione che inizia a breve
      
      const now = new Date();
      const lessonsFound = simulateParser(html); // Funzione simulata basata sulla struttura UniSalento

      for (const lezione of lessonsFound) {
        const [hours, minutes] = lezione.ora.split(':');
        const lessonDate = new Date();
        lessonDate.setHours(parseInt(hours), parseInt(minutes), 0);

        const diffMinutes = (lessonDate.getTime() - now.getTime()) / (1000 * 60);

        // 3. Se la lezione inizia entro 30 minuti, invia notifica
        if (diffMinutes > 0 && diffMinutes <= 30) {
          try {
            await webpush.sendNotification(subscription, JSON.stringify({
              title: 'Lezione in arrivo!',
              body: `${lezione.materia} inizia alle ${lezione.ora} in ${lezione.aula}`,
              tag: `lesson-${lezione.materia}-${lezione.ora}`
            }));
            results.push({ user: key, status: 'Notified' });
          } catch (error) {
            // 4. Se errore 410 (Gone), cancella sottoscrizione
            if (error.statusCode === 410) {
              await redisClient.del(key);
              results.push({ user: key, status: 'Deleted (410)' });
            } else {
              results.push({ user: key, status: 'Error', error: error.message });
            }
          }
        }
      }
    }

    return res.status(200).json({ success: true, processed: results });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Simulatore di parsing HTML per la griglia UniSalento.
 * In produzione questo verrebbe sostituito dalla logica reale in api/unisalento.ts
 */
function simulateParser(html) {
  // Questa è una simulazione. In un caso reale useremmo regex o JSDOM
  // per estrarre ora e materia dalla tabella HTML di UniSalento.
  return []; // Ritorna vuoto per default nel cron di sistema
}

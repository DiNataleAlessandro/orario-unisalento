# 🎓 NextLesson UniSalento

**NextLesson UniSalento** è una Progressive Web App (PWA) premium progettata per gli studenti dell'Università del Salento. L'obiettivo è fornire un'interfaccia ultra-rapida, mobile-first e affidabile per la consultazione degli orari delle lezioni, con un sistema di notifiche push intelligente che avvisa lo studente prima dell'inizio di ogni lezione.

## 🚀 Caratteristiche Principali

-   **Notifiche Push Real-time**: Ricevi una notifica 30 minuti prima dell'inizio della lezione, direttamente sul tuo smartphone o desktop.
-   **Offline-First**: Consulta l'orario anche senza connessione internet grazie alla cache intelligente del Service Worker.
-   **Dashboard "In Corso"**: Visualizzazione dinamica della lezione attuale e di quelle successive.
-   **Personalizzazione**: Sistema di "Blacklist" per nascondere materie non seguite e supporto per "Materie Extra" da altri corsi.
-   **Esportazione Calendario**: Generazione di file `.ics` per sincronizzare l'intero semestre con Google Calendar o Apple Calendar.
-   **Privacy & Performance**: OLED Dark Mode nativa e caricamento dinamico dei metadati dei corsi per ridurre il bundle size.

## 🛠️ Tech Stack

-   **Frontend**: React 19, TypeScript, Vite 8.
-   **Styling**: Tailwind CSS v4.
-   **Backend (Serverless)**: Vercel Functions (Node.js).
-   **Database**: Redis (per l'archiviazione sicura delle sottoscrizioni Push).
-   **Notifiche**: Web Push API (VAPID) tramite la libreria `web-push`.
-   **PWA**: `vite-plugin-pwa` con strategia `injectManifest`.

## ⚙️ Configurazione Variabili d'Ambiente

Per far funzionare il sistema di notifiche e il backend, è necessario configurare le seguenti variabili nel file `.env.local` (e nella dashboard di Vercel):

```env
# Connessione Redis (es. Redis Labs o Upstash)
REDIS_URL="redis://default:password@host:port"

# Chiavi per Web Push (Generate con 'npx web-push generate-vapid-keys')
VAPID_PUBLIC_KEY="la-tua-chiave-pubblica"
VAPID_PRIVATE_KEY="la-tua-chiave-privata"

# Sicurezza per il Cron Job
CRON_SECRET="una-stringa-segreta-a-tua-scelta"
```

## 🤖 Architettura del Cron Job (Hobby Plan Bypass)

Vercel limita l'esecuzione dei Cron Job a una volta al giorno per i piani gratuiti (Hobby). Per garantire un controllo degli orari ogni 15 minuti senza costi aggiuntivi, abbiamo implementato la seguente architettura:

1.  **Endpoint Dedicato**: Creato `/api/check-lessons.ts` che scansiona Redis e invia le notifiche.
2.  **Configurazione Vercel**: Nel file `vercel.json`, lo schedule è impostato su `0 5 * * *` (una volta al giorno) per soddisfare i requisiti di validazione del deploy.
3.  **Trigger Esterno**: Abbiamo configurato [cron-job.org](https://cron-job.org/) per chiamare l'endpoint ogni 15 minuti.
4.  **Sicurezza**: L'endpoint è protetto tramite `CRON_SECRET`. Accetta chiamate solo se contengono l'header `Authorization: Bearer <secret>` o il parametro URL `?secret=<secret>`, garantendo che solo il nostro trigger esterno possa attivare le notifiche.

## 📦 Installazione e Sviluppo

```bash
# Installa le dipendenze
npm install

# Avvia l'ambiente di sviluppo (Frontend + Backend)
npx vercel dev

# Build per la produzione
npm run build
```

## 📄 Licenza
Questo progetto è sviluppato per uso personale e didattico. Tutti i dati degli orari sono proprietà dell'Università del Salento.

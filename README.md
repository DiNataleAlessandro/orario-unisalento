# 🎓 NextLesson UniSalento

**NextLesson UniSalento** è una Progressive Web App (PWA) premium progettata per gli studenti dell'Università del Salento. L'obiettivo è fornire un'interfaccia ultra-rapida, mobile-first e affidabile per la consultazione degli orari delle lezioni, con un sistema di notifiche push intelligente e strumenti avanzati di personalizzazione.

## 🚀 Caratteristiche Principali

-   **Dashboard "In Corso"**: Identificazione automatica e risalto visivo della lezione attualmente in svolgimento.
-   **Notifiche Push Real-time**: Ricevi avvisi 30 minuti prima dell'inizio delle lezioni (necessita configurazione VAPID).
-   **Disponibilità Aule**: Scansione in tempo reale delle aule libere e occupate in tutti i plessi dell'Ateneo (Ecotekne, Studium, ecc.).
-   **Personalizzazione Avanzata**: 
    - **Smart Notes**: Aggiungi note testuali specifiche per ogni materia.
    - **Color Coding**: Personalizza il colore delle card lezioni per una distinzione visiva immediata.
    - **Blacklist**: Nascondi le materie che non segui per pulire l'agenda.
    - **Piano di Studi Dinamico**: Aggiungi singoli esami da qualsiasi altro corso di laurea dell'Ateneo.
-   **Esportazione Calendario**: Genera file `.ics` per sincronizzare il semestre con Google/Apple Calendar.
-   **Offline-First & PWA**: Funzionamento completo senza rete e tutorial integrato per l'installazione su iOS e Android.
-   **Multi-Tema**: Supporto per Dark Mode OLED-friendly (#121212), Light Mode e sincronizzazione con il sistema.
-   **Portabilità Dati**: Sistema di backup e ripristino istantaneo tramite stringhe Base64 compresse.

## 🛠️ Tech Stack

-   **Frontend**: React 19, TypeScript, Vite 8.
-   **Styling**: Tailwind CSS v4.
-   **Routing**: React Router DOM v7.
-   **PWA**: `vite-plugin-pwa` con strategia `injectManifest`.
-   **Backend**: Vercel Functions (Node.js) + Redis (per le sottoscrizioni Push).

## ⚙️ Variabili d'Ambiente

Configura queste chiavi in `.env.local` per abilitare le notifiche:

```env
REDIS_URL="redis://default:password@host:port"
VAPID_PUBLIC_KEY="chiave-pubblica"
VAPID_PRIVATE_KEY="chiave-privata"
CRON_SECRET="stringa-segreta"
```

## 📦 Installazione

```bash
npm install
npm run dev # Sviluppo
npm run build # Produzione
```

## 📄 Licenza
Sviluppato per uso personale e didattico. I dati degli orari sono forniti dai sistemi grid UniSalento.

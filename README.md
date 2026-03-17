# 🎓 NextLesson UniSalento

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-Testing-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-orange?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**L'agenda universitaria definitiva, ripensata per un'esperienza premium e ultra-veloce.**

NextLesson UniSalento è una Progressive Web App (PWA) progettata specificamente per gli studenti dell'Università del Salento. Supera i limiti dei portali tradizionali offrendo un'interfaccia mobile-first, accesso offline e una gestione intelligente del piano di studi.

---

## 🌟 Perché NextLesson?

Consultare gli orari delle lezioni non dovrebbe essere un compito stressante. NextLesson risolve il problema della frammentazione dei dati accademici centralizzando orari, aule e contatti dei docenti in un'unica applicazione fluida e reattiva.

### 🚀 Performance & Highlights Recenti
*   **Bundle size ridotto del 50%**: Grazie alla migrazione verso un'architettura a caricamento dinamico dei dati (JSON on-demand).
*   **Architettura Modulare**: Refactoring completo della codebase per separare logica di business (Hooks), UI (Features) e layer API.
*   **Robusta & Testata**: Integrazione di Vitest per garantire la correttezza dei dati trasformati dalle API universitarie.
*   **Offline-First**: Accesso immediato ai dati salvati anche senza connessione internet.

## ✨ Features Principali

-   📱 **Esperienza Native-like**: UI ottimizzata per mobile con supporto per Safe Areas e Dark Mode OLED.
-   📅 **Gestione Orari Avanzata**: Filtra le materie che non segui, aggiungi esami a scelta da altri corsi e visualizza le lezioni "In Corso Ora".
-   👨‍🏫 **Contatti Docenti**: Generazione automatica delle email e popup informativi rapidi.
-   📝 **Smart Notes**: Aggiungi appunti personali direttamente sulle schede delle lezioni.
-   📂 **Portabilità Dati**: Sistema di backup e importazione tramite stringhe codificate per non perdere mai la configurazione.

## 🛠️ Tech Stack

-   **Core**: React 19 + TypeScript
-   **Bundler**: Vite (ottimizzato per build ultra-rapide)
-   **Styling**: Tailwind CSS v4
-   **Routing**: React Router 7
-   **Testing**: Vitest + JSDOM
-   **PWA**: `vite-plugin-pwa` per caching e service workers.

---

## 🏗️ Struttura del Progetto

Il progetto segue una struttura modulare basata sulle responsabilità:

```text
src/
├── api/           # Client API UniSalento e trasformatori di dati
├── assets/        # Risorse statiche (stili CSS e immagini)
├── components/    # Componenti UI (common/ e features/)
├── hooks/         # Custom hooks per fetching e logica di stato
├── pages/         # View principali (Home, Calendario, Onboarding)
├── types/         # Definizioni TypeScript globali
└── utils/         # Helper puri e utility di formattazione
```

---

## ⚡ Quick Start

Assicurati di avere [Node.js](https://nodejs.org/) installato sul tuo sistema.

1.  **Clona la repository**
    ```bash
    git clone https://github.com/DiNataleAlessandro/orario-unisalento.git
    cd orario-unisalento
    ```

2.  **Installa le dipendenze**
    ```bash
    npm install
    ```

3.  **Avvia il server di sviluppo**
    ```bash
    npm run dev
    ```
    L'app sarà disponibile all'indirizzo `http://localhost:5173`.

---

## 🧪 Testing

La qualità del codice è garantita da una suite di test unitari che validano la manipolazione dei dati sensibili.

Esegui i test con:
```bash
npm run test
```

Per visualizzare l'interfaccia grafica di Vitest:
```bash
npx vitest --ui
```

---

## 🤝 Contribuire

Le Pull Request sono le benvenute! Se vuoi proporre nuove feature o segnalare un bug:
1. Fai un fork del progetto.
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`).
3. Fai un commit dei tuoi cambiamenti (`git commit -m 'Add some AmazingFeature'`).
4. Pusha verso il branch (`git push origin feature/AmazingFeature`).
5. Apri una Pull Request.

## 📄 Licenza

Distribuito sotto licenza **MIT**. Consulta il file `LICENSE` per maggiori informazioni.

---

<div align="center">
  <p>Sviluppato con ❤️ da <b>Λlεx</b></p>
</div>

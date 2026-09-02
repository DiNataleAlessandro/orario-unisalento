# 🗺️ Roadmap NextLesson UniSalento

Questo documento traccia gli obiettivi futuri, le nuove funzionalità e le aree di miglioramento per il progetto NextLesson.

## 🎯 Prossimi Sviluppi

### ☕ Supporto al Progetto ("Buy me a coffee")
L'infrastruttura di NextLesson (funzioni serverless, Redis, proxy) ha dei costi operativi e il suo sviluppo richiede molto tempo ed effort continuo. Per consentire agli studenti e agli utilizzatori di sostenere attivamente l'applicazione, implementeremo un sistema di supporto basato su donazioni volontarie.

**Dettaglio dei Task e Implementazione:**

- [ ] **Analisi e Scelta della Piattaforma:**
  - Valutare i migliori servizi per micro-donazioni orientate ai creatori (es. [Buy Me a Coffee](https://www.buymeacoffee.com/), [Ko-fi](https://ko-fi.com/) o [GitHub Sponsors](https://github.com/sponsors)).
- [ ] **Setup Operativo degli Account:**
  - Creazione del profilo del progetto (grafica, descrizione della missione di NextLesson).
  - Configurazione dei metodi di pagamento per la ricezione delle donazioni (es. collegamento con Stripe o PayPal).
  - Configurazione dei messaggi di ringraziamento automatici.
- [ ] **Integrazione UI/UX nell'Applicazione:**
  - Disegnare un componente dedicato (es. un bottone galleggiante, una card nella pagina delle impostazioni o nel footer) che sia in perfetta sintonia con la UI Tailwind 4 (design pulito, animazioni micro, mobile-first).
  - Assicurarsi che la CTA (Call to Action) sia chiara ma *non* invasiva, rispettando l'esperienza utente principale (consultazione orari).
- [ ] **Gestione Sostenitori (Opzionale/Fase 2):**
  - Valutare la creazione di una sezione "Hall of Fame" o "Sostenitori" all'interno dell'app per riconoscere pubblicamente chi ha donato un caffè allo sviluppo del progetto.

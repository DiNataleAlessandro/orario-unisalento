# 🎓 NextLesson UniSalento

**L'Agenda Universitaria definitiva, ripensata per un'esperienza premium.** Una Progressive Web App (PWA) costruita in React per gestire orari, lezioni ed esami a scelta dell'Università del Salento, superando i limiti dei sistemi tradizionali.

---

## ✨ Features Principali

* 📱 **Esperienza Nativa (PWA):** Installabile direttamente sulla Home di iOS e Android. Zero bordi del browser, navigazione fluida e supporto per la Dynamic Island.
* 📴 **Extreme Offline Mode:** L'app funziona perfettamente anche nei sotterranei dell'università. Scarica l'orario una volta e consultalo ovunque, con indicatori di stato della connessione in tempo reale.
* 🛠️ **Piano di Studi 100% Custom:** Non limitarti al tuo corso di base. Aggiungi "Esami a Scelta" (extra) prelevandoli da altri indirizzi, fondendoli nel tuo orario con un badge dedicato.
* 🚫 **Blacklist Materie:** Nascondi con un tap le materie che non segui o che hai già dato, mantenendo l'agenda sempre pulita.
* 📧 **Smart Click-to-Mail:** Algoritmo intelligente che divide i professori multipli e accoppia (o genera automaticamente) le email istituzionali corrette. Un tap e sei su Mail.
* ⚡ **Motore di Fusione:** Unifica i duplicati forniti dalle API dell'università in un unico menù pulito e facile da navigare.
* 🎨 **Design Premium:** Dark Mode profonda (`#121212`) progettata per schermi OLED, con accenti dorati e micro-interazioni curate (animazioni, glow effects).

---

## 🛠️ Tech Stack

Questo progetto è stato costruito utilizzando le migliori tecnologie moderne per il frontend:

* **Framework:** React + TypeScript
* **Styling:** Tailwind CSS (per un design system solido e custom)
* **Build Tool:** Vite (per un hot-reload istantaneo e build super veloci)
* **Routing:** React Router DOM
* **Calendario:** React Day Picker + date-fns
* **Architettura:** Progressive Web App (PWA) ottimizzata per Mobile

---

## 💡 Utilizzo API
L'app si interfaccia con le API pubbliche (`grid_call.php`) dell'Università del Salento per il recupero degli orari. I dati vengono poi parsati, puliti e unificati localmente per garantire una visualizzazione coerente. Tutte le preferenze dell'utente (Onboarding, Blacklist, Esami Extra) sono salvate localmente sul dispositivo (`localStorage`) garantendo massima privacy.

---

<div align="center">
  <p>Progettato e sviluppato con cura.</p>
  <p><b>made by Λlεx</b></p>
</div>
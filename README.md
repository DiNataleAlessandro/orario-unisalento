# 🎓 NextLesson UniSalento: The Student's Companion

[![Status](https://img.shields.io/badge/Status-Production--Ready-success?style=flat-square)](https://nextlesson.it)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=flat-square)](https://github.com/aless/orario-unisalento)
[![Tech Stack](https://img.shields.io/badge/Stack-React_19_|_Vercel_|_Redis-000000?style=flat-square)](https://nextlesson.it)

**NextLesson** is a meticulously crafted Progressive Web App (PWA) that reimagines how students at the **Università del Salento** interact with their academic schedules. Built for speed and reliability, it bridges the gap between complex university portals and the modern mobile experience.

---

## ✨ Experience the Future of Study

### 🚀 Performance & Accessibility
-   **Instant Load:** Near-zero latency through intelligent `localStorage` caching and Service Worker asset management.
-   **Offline-First:** View your timetable anywhere, even in the most isolated classroom, thanks to advanced precaching.
-   **Native Experience:** Installable on iOS and Android with a dedicated splash screen and standalone display mode.

### 🔔 Intelligent Notification System
-   **Timely Alerts:** Stay ahead with push notifications sent before your classes begin.
-   **Smart Merging:** Unified timetable that aggregates your primary course with "Extra Subjects" from any other degree program.
-   **Idempotent Delivery:** Powered by **Redis**, ensuring you never get the same notification twice.

### 🗺️ Context-Aware Features
-   **Dynamic Maps:** One-tap navigation to classroom locations via integrated Leaflet maps.
-   **Blacklist Support:** Hide subjects you've already passed or aren't interested in to keep your view clean.
-   **Day Picker:** Effortlessly jump between weeks and months with a native-feeling date picker.

---

## 🏗️ Architecture & Stack

| Layer | Technology | Role |
|:--- |:--- |:--- |
| **Frontend** | React 19 + TypeScript | Core UI and state management |
| **Styles** | Tailwind CSS 4 | Modern, utility-first design system |
| **Runtime** | Vite + PWA Plugin | Build toolchain and Service Worker |
| **Backend** | Vercel Edge Functions | Serverless logic and scraping |
| **Database** | Redis (Upstash) | Notification tracking and session storage |

---

## 🚀 Deployment & Installation

### For Developers

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/yourusername/orario-unisalento.git
    cd orario-unisalento
    ```

2.  **Install & Start:**
    ```bash
    npm install
    npm run dev
    ```

3.  **Environment Configuration:**
    Ensure these secrets are available in your `.env` or Vercel dashboard:
    -   `REDIS_URL`: Endpoint for your Redis instance.
    -   `VAPID_PUBLIC_KEY` & `VAPID_PRIVATE_KEY`: Generated for Web-Push notifications.
    -   `CRON_SECRET`: Authorization key for the Vercel Cron service.

### For Students
Simply visit [nextlesson.it](https://nextlesson.it) on your mobile browser and select **"Add to Home Screen"** for the full experience.

---

## 🛠️ Project Ecosystem

-   `/api`: Serverless functions for backend operations.
-   `/src/hooks`: Custom hooks (`useLessons`, `useNotifications`) encapsulating business logic.
-   `/src/sw.ts`: Advanced Service Worker for PWA capabilities and push events.
-   `/public/data`: Static metadata for courses and classroom locations.

---

## 🤝 Contribution & Support

We believe in open-source for students, by students. If you find a bug or have a feature idea:
1.  Check the existing [Issues](https://github.com/aless/orario-unisalento/issues).
2.  Fork the repo and create a branch.
3.  Submit a Pull Request with a clear description of your changes.

---

*Designed and developed to make university life just a little bit easier.*  
**Made with ❤️ in Salento.**

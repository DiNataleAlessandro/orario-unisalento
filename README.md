<div align="center">

# 🎓 NextLesson UniSalento: The Student's Companion

[![Status](https://img.shields.io/badge/Status-Production--Ready-success?style=for-the-badge)](https://orario-unisalento.vercel.app)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)](https://github.com/DiNataleAlessandro/orario-unisalento)
[![Tech Stack](https://img.shields.io/badge/Stack-React_19_|_Vercel_|_Redis-000000?style=for-the-badge)](https://orario-unisalento.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

*A blazing fast, offline-first Progressive Web App (PWA) that reimagines how students at the **Università del Salento** interact with their academic schedules.*

[**Live Demo**](https://orario-unisalento.vercel.app) • [**Report Bug**](https://github.com/DiNataleAlessandro/orario-unisalento/issues) • [**Request Feature**](https://github.com/DiNataleAlessandro/orario-unisalento/issues)

</div>

---

## 📖 Table of Contents
- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 About the Project

**NextLesson** bridges the gap between complex university portals and the modern mobile experience. Designed specifically for UniSalento students, it extracts timetable data and presents it in a clean, installable, and notification-ready mobile interface.

### For Students
Simply visit [orario-unisalento.vercel.app](https://orario-unisalento.vercel.app) on your mobile browser (Safari/Chrome) and select **"Add to Home Screen"** for the full native-like experience.

---

## ✨ Key Features

### ⚡ Performance & Accessibility
- **Instant Load:** Near-zero latency through intelligent `localStorage` caching and Service Worker asset management.
- **Offline-First:** View your timetable anywhere—even in the most isolated classroom—thanks to advanced precaching.
- **Native Experience:** Installable on iOS and Android with a dedicated splash screen and standalone display mode.

### 🔔 Intelligent Notification System
- **Timely Alerts:** Stay ahead with push notifications sent automatically before your classes begin.
- **Smart Merging:** A unified timetable that aggregates your primary course with "Extra Subjects" from any other degree program.
- **Idempotent Delivery:** Powered by **Redis**, ensuring you never get spammed with the same notification twice.

### 🗺️ Context-Aware Tools
- **Dynamic Maps:** One-tap navigation to classroom locations via integrated Leaflet maps.
- **Blacklist Support:** Hide subjects you've already passed or aren't interested in to keep your view distraction-free.
- **Intuitive Navigation:** Effortlessly jump between weeks and months with a native-feeling date picker.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript | Core UI, components, and state management |
| **Styling** | Tailwind CSS 4 | Modern, utility-first responsive design |
| **Tooling** | Vite + PWA Plugin | Lightning-fast build toolchain and SW generation |
| **Backend** | Vercel Edge Functions | Serverless logic and data scraping |
| **Database** | Redis (Upstash) | Notification tracking, deduplication, and sessions |

---

## 💻 Getting Started

Want to run NextLesson locally or contribute to the codebase? Follow these steps.

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm
- An Upstash Redis account (free tier is sufficient)

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/DiNataleAlessandro/orario-unisalento.git
   cd orario-unisalento
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Rename `.env.example` to `.env` (or create one) and add your secrets:
   ```env
   REDIS_URL="your_upstash_redis_url"
   VAPID_PUBLIC_KEY="your_web_push_public_key"
   VAPID_PRIVATE_KEY="your_web_push_private_key"
   CRON_SECRET="your_vercel_cron_secret"
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

---

## 🛠️ Project Structure

- `/api` - Serverless functions for backend operations and CRON jobs.
- `/src/components` - Reusable UI components.
- `/src/hooks` - Custom React hooks (`useLessons`, `useNotifications`) encapsulating business logic.
- `/src/sw.ts` - Advanced Service Worker for PWA offline capabilities and push events.
- `/public/data` - Static metadata for courses and classroom locations.

---

## 🤝 Contributing

We believe in open-source for students, by students. Contributions are what make the open source community such an amazing place to learn, inspire, and create.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please check the existing [Issues](https://github.com/DiNataleAlessandro/orario-unisalento/issues) before starting to work on a major feature.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
<em>Designed and developed to make university life just a little bit easier.</em> <br>
<strong>Made with ❤️ by Λlεx</strong>
</div>

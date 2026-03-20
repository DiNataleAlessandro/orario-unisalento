# 🖋️ NextLesson UniSalento: Core Mandates & Architecture

This document provides a comprehensive technical guide for development within the NextLesson ecosystem. It establishes the architectural boundaries and operational standards necessary for maintaining high code quality and system reliability.

## 🏗️ Architectural Blueprint

### 1. Hybrid Rendering & Data Fetching
NextLesson operates as a high-performance Progressive Web App (PWA) with a decoupled backend:
- **Client-Side:** React 19 handles the reactive UI and complex timetable merging logic.
- **Serverless Edge:** Vercel functions handle high-stakes operations like scraping, push notification orchestration, and Redis synchronization.
- **The Proxy Layer:** A specialized proxy (`/api-unisalento`) is used to bypass CORS when interacting with the legacy `logistica.unisalento.it` endpoint.

### 2. Timetable Merging Strategy
The core business logic resides in `src/hooks/useLessons.ts`. It performs a multi-stage data merge:
1. **Primary Course Fetch:** Retrieves the main schedule for the user's selected course and year.
2. **Extra Subject Merging:** Iteratively fetches schedules for "materie extra" (subjects from other courses) and filters them before merging into the main array.
3. **Deduplication:** Uses a `Map`-based strategy to ensure no overlapping or duplicate lesson IDs are rendered.

### 3. Notification Lifecycle
Push notifications follow a strict state-machine flow:
- **Subscription:** Client generates a VAPID-signed push subscription, stored in Redis.
- **Orchestration:** `api/check-lessons.ts` (Cron) iterates through all active Redis subscriptions.
- **Idempotency:** A unique `notified:{endpoint}:{materia}:{time}` key is set in Redis with a 2-hour TTL to prevent duplicate notifications for the same event.
- **Service Worker:** `src/sw.ts` intercepts the `push` event, parses the JSON payload, and renders a native-feeling notification with vibration patterns.

---

## 🛠️ Technical Standards

### ⚙️ State & Storage
- **Local Persistence:** Use `localStorage` sparingly for configuration (`corsoCodice`, `annoCodice`, `materieExtra`).
- **Cache Management:** Timetable data is cached in `localStorage` with keys formatted as `orario_{course}_{year}_{date}`.
- **Forced Refresh:** The `isForced` flag in API calls must bypass local caches to ensure students see real-time changes (e.g., room changes or cancellations).

### 🎨 Styling & UI
- **Tailwind 4:** Leverage `@tailwindcss/vite` for a zero-runtime CSS experience. Prefer CSS variables for theme-specific colors.
- **Responsive Design:** Every component must be mobile-first. Desktop views are secondary but must remain functional.

### 🧪 Testing & Validation
- **Vitest:** All utility functions (especially `transformers.ts`) must have corresponding unit tests.
- **Offline Testing:** Changes to the Service Worker (`sw.ts`) must be validated in Incognito/Private modes to ensure proper lifecycle management (`skipWaiting`, `clientsClaim`).

---

## 📡 Backend & Redis Key Schema

| Key Pattern | Purpose | Expiration (TTL) |
|:--- |:--- |:--- |
| `user_sub:{id}` | Stores Web-Push subscription + course metadata | Permanent |
| `notified:{hash}` | Idempotency lock for notifications | 2 Hours |
| `uni_cache:{id}` | Server-side cache for UniSalento API responses | 30 Minutes |

## ⚠️ Critical Safety Rules
- **DO NOT** modify the scraping logic in `api/check-lessons.ts` without verifying the POST payload requirements for `grid_call.php`.
- **DO NOT** remove the `idempotencyKey` check; doing so will cause notification spam for thousands of users.
- **ALWAYS** ensure `VAPID` keys are treated as sensitive environment secrets.

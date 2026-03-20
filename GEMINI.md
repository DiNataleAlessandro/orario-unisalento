# 🎓 NextLesson UniSalento - GEMINI.md

This file contains foundational mandates, architectural patterns, and a detailed functional map of the project. Adhere to these instructions for all development tasks.

## 🚀 Project Overview
**NextLesson UniSalento** is a premium, mobile-first Progressive Web App (PWA) designed for students of the University of Salento. It provides a highly optimized interface for managing lesson schedules, exam plans, and academic calendars, with a focus on offline reliability and a "native-like" mobile experience.

## 🛠️ Tech Stack & Standards
- **Framework:** React 19 (TypeScript)
- **Build Tool:** Vite 8
- **Styling:** Tailwind CSS v4 (with custom light/dark theme overrides)
- **Routing:** React Router DOM v7
- **Testing:** Vitest + JSDOM
- **Date Management:** `date-fns` and `react-day-picker`
- **PWA:** `vite-plugin-pwa` with custom manifest and service worker.
- **Persistence:** `localStorage` for user preferences, notes, and color coding.

## 🎨 Architectural Mandates
1. **Mobile-First & PWA:** Optimized for mobile devices, respecting safe areas (`env(safe-area-inset-top)`). Includes a PWA installation tutorial for browser users.
2. **Offline-First:** All core features function offline using cached data in `localStorage`.
3. **Multi-Theme:** OLED-friendly Dark Mode (#121212) by default, with Light Mode and System sync support.
4. **Data Integrity:** API responses are sanitized (HTML cleaning) and transformed in a dedicated layer.

---

## 🗺️ Functional Map

### 📡 API Layer (`src/api/`)
- **`unisalento.ts`**: Client for UniSalento PHP APIs. Implements caching per course/week.
- **`easyroom.ts`**: Integration with UniSalento EasyRoom for classroom availability.
- **`transformers.ts`**: HTML sanitization and professor email prediction logic.

### 🪝 Custom Hooks (`src/hooks/`)
- **`useLessons.ts`**: Orchestrates current/next week schedules, merging main course with extra exams.
- **`useCourses.ts`**: Dynamically fetches the `courses.json` metadata.
- **`useNotifications.ts`**: Manages Web Push subscriptions and permissions.

### 📄 Pages (`src/pages/`)
- **`Home.tsx`**: Main dashboard with "Live" lesson highlighting, grouping, and settings (theme/reset).
- **`Aule.tsx`**: Real-time classroom availability scanner with gap-filling logic (Free/Busy slots).
- **`PianoDiStudi.tsx`**: Add extra exams from any course and manage data portability (Export/Import).
- **`Calendario.tsx`**: Daily lookup and full-semester `.ics` calendar export.
- **`Onboarding.tsx`**: Initial setup and backup recovery.

### 🧩 Components (`src/components/`)
- **`features/CardLezione.tsx`**: Atomic unit with Smart Notes and Color Customization per subject.
- **`features/PwaTutorial.tsx`**: Context-aware tutorial for PWA installation on iOS/Android.
- **`features/SplashScreen.tsx`**: Initial animated loading screen with brand logo.
- **`common/Select.tsx`**: Styled searchable dropdown component.

---

## 📝 Coding Conventions
- **Path Aliasing**: Always use `@/` for imports.
- **Persistence Keys**: 
    - `orario_`: cache
    - `nota_`: subject notes
    - `color_`: subject color coding
    - `blacklist_materie`: hidden subjects
    - `theme`: user theme preference
    - `materieExtra`: additional exams

## ✅ Quality Checklist
- [ ] **Build Check**: `npm run build` must pass without chunk warnings.
- [ ] **Theme Check**: Ensure UI elements are readable in both Light and Dark modes.
- [ ] **PWA Audit**: Verify the installation tutorial triggers correctly on mobile browsers.
- [ ] **Responsive**: Test on narrow screens (iPhone SE) for layout shifts.

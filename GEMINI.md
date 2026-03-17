# 🎓 NextLesson UniSalento - GEMINI.md

This file contains foundational mandates, architectural patterns, and a detailed functional map of the project. Adhere to these instructions for all development tasks.

## 🚀 Project Overview
**NextLesson UniSalento** is a premium, mobile-first Progressive Web App (PWA) designed for students of the University of Salento. It provides a highly optimized interface for managing lesson schedules, exam plans, and academic calendars, with a focus on offline reliability and a "native-like" mobile experience.

## 🛠️ Tech Stack & Standards
- **Framework:** React 19 (TypeScript)
- **Build Tool:** Vite 8
- **Styling:** Tailwind CSS v4
- **Routing:** React Router DOM v7
- **Testing:** Vitest + JSDOM
- **Date Management:** `date-fns` and `react-day-picker`
- **PWA:** `vite-plugin-pwa`
- **Persistence:** `localStorage` for user preferences; JSON dynamic loading for course metadata.

## 🎨 Architectural Mandates
1. **Mobile-First & PWA:** Optimized for mobile devices, respecting safe areas (`env(safe-area-inset-top)`).
2. **Offline-First:** All core features function offline using cached data in `localStorage`.
3. **Performance:** Dark Mode OLED-friendly (#121212). Main bundle size optimized by moving static data to dynamic JSON.
4. **Data Integrity:** API responses are sanitized (HTML cleaning) and transformed in a dedicated layer.

---

## 🗺️ Functional Map (File by File)

### 📡 API Layer (`src/api/`)
- **`unisalento.ts`**: Core client for UniSalento PHP APIs. Handles POST requests to `grid_call.php` with appropriate form data. Implements a caching strategy per course/week in `localStorage`.
- **`transformers.ts`**: Data sanitization logic.
    - `cleanHtmlTags`: Removes `<b>`, `<i>`, etc., from subject names and rooms.
    - `parseDocenteEmail`: Predicts professor emails using the `name.surname@unisalento.it` pattern, handling academic titles and multiple names.
    - `getProfessorsData`: Maps raw professor strings to structured name/email pairs.

### 🪝 Custom Hooks (`src/hooks/`)
- **`useLessons.ts`**: Complex orchestrator for the schedule. 
    - Fetches current and next week schedules.
    - Merges the "Main Course" schedule with "Extra Exams" from other courses.
    - Processes raw date/time strings into JS `Date` objects for sorting and "Live Lesson" detection.
- **`useCourses.ts`**: Dynamically fetches `courses.json` from the `public/` folder. Unifies courses that have multiple paths or years under a single label for cleaner search UI.

### 📄 Pages (`src/pages/`)
- **`Home.tsx`**: The main dashboard.
    - Identifies and highlights the "In Corso Ora" (Live) lesson.
    - Groups future lessons by day (Today, Tomorrow, Week).
    - Implements "Blacklist" filtering to hide unwanted subjects.
    - Manages connectivity status and manual refresh logic.
- **`Onboarding.tsx`**: First-run experience. 
    - Searchable course selection.
    - Handles configuration import from backup strings.
- **`PianoDiStudi.tsx`**: Advanced customization.
    - Allows users to search and add specific subjects from *any* university course.
    - Manages "Extra Exams" persistence.
    - Provides Data Portability (Export/Import of full app state).
- **`Calendario.tsx`**: Date-specific lookup.
    - Daily view using `react-day-picker`.
    - **Semester Export**: Logic to fetch 15 weeks of data and generate a downloadable `.ics` calendar file.

### 🧩 Components (`src/components/`)
- **`features/CardLezione.tsx`**: The atomic unit of the schedule UI.
    - Displays time, room, and structural info.
    - **Smart Notes**: Subject-specific notes saved in `localStorage`.
    - Professor Popup: Quick access to email and contact buttons.

### 🛠️ Utils & Types (`src/utils/`, `src/types/`)
- **`utils/date.ts`**: Standardizes the `DD-MM-YYYY` format required by UniSalento APIs.
- **`types/lezione.ts`**: Global TypeScript interfaces for `Lezione` and `ProfessorData`.

---

## 📝 Coding Conventions
- **Path Aliasing**: Always use `@/` for imports (e.g., `import { ... } from '@/api/...'`).
- **Logic Extraction**: Keep components thin. Business logic (fetching, complex filtering) MUST go into Hooks or API transformers.
- **Type Safety**: Use `import type` for interfaces to avoid bloat and build issues.
- **Persistence Keys**: Prefixes used: `orario_` (cache), `nota_` (notes), `blacklist_materie`, `materieExtra`.

## ✅ Quality Checklist
- [ ] **Build Check**: `npm run build` must pass without chunk warnings.
- [ ] **Tests**: Run `npm run test` after any change to `transformers.ts` or `useLessons.ts`.
- [ ] **PWA Audit**: Ensure the Service Worker precaches the new `courses.json` file.
- [ ] **Responsive**: Test UI on narrow screens (iPhone SE/Mini) for overflow issues.

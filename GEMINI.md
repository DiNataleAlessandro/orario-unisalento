# 🎓 NextLesson UniSalento - GEMINI.md

This file contains foundational mandates, architectural patterns, and project-specific conventions for the **NextLesson UniSalento** project. Adhere to these instructions for all development tasks.

## 🚀 Project Overview
**NextLesson UniSalento** is a premium, mobile-first Progressive Web App (PWA) designed for students of the University of Salento. It provides a highly optimized interface for managing lesson schedules, exam plans, and academic calendars, with a focus on offline reliability and a "native-like" mobile experience.

## 🛠️ Tech Stack & Standards
- **Framework:** React 19 (TypeScript)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4 (using `@tailwindcss/vite`)
- **Routing:** React Router DOM v7
- **Date Management:** `date-fns` and `react-day-picker`
- **PWA:** `vite-plugin-pwa`
- **Persistence:** `localStorage` for all user preferences (course codes, blacklist, extra exams).

## 🎨 Architectural Mandates
1. **Mobile-First & PWA:** The UI must be optimized for mobile devices, respecting safe areas (`env(safe-area-inset-top)`) and providing a "no-browser-chrome" experience.
2. **Offline-First:** All features should function offline using cached data. Always handle connection state gracefully (see `Home.tsx` for implementation examples).
3. **Performance:** Prioritize OLED-friendly dark mode (`#121212`) and minimize unnecessary re-renders.
4. **Data Integrity:** The app interacts with UniSalento PHP APIs. Parsing and "cleaning" of API responses (e.g., removing HTML tags, splitting teacher emails) must be centralized or handled consistently.

## 📂 Project Structure
- `src/components/`: Reusable UI components (e.g., `CardLezione.tsx`).
- `src/pages/`: Main application views (`Home.tsx`, `Calendario.tsx`, `Onboarding.tsx`, `PianoDiStudi.tsx`).
- `src/assets/`: Static assets (icons, images).
- `public/`: PWA manifests, icons, and public static files.

## 📝 Coding Conventions
- **Language:** UI labels and some internal business logic use Italian (matching the target audience). Code comments and new architectural decisions should prefer English or follow the existing pattern.
- **Styling:** Use Tailwind CSS utility classes exclusively. Avoid external CSS files unless strictly necessary for global resets or specific library overrides.
- **State Management:** Keep it simple. Use React hooks (`useState`, `useEffect`) and `localStorage` for persistence. Avoid adding complex state management libraries (Redux, Zustand) unless the complexity significantly increases.
- **Hooks:** Ensure exhaustive dependency arrays in `useEffect`. Use custom hooks for shared logic (e.g., fetching schedules).

## ⚠️ Critical Files
- `package.json`: Dependency management and build scripts.
- `vite.config.ts`: Vite and PWA configuration.
- `src/App.tsx`: Routing and protected routes (Onboarding check).
- `src/pages/Home.tsx`: Main logic for fetching and merging schedules.
- `src/components/CardLezione.tsx`: Core component for displaying lessons.

## ✅ Quality Checklist
- [ ] Verify responsive design on small screens.
- [ ] Ensure offline functionality is maintained.
- [ ] Check accessibility (contrast, aria-labels).
- [ ] Validate that new dependencies don't bloat the PWA bundle significantly.

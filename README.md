# NPTEL Ace

A practice platform for NPTEL assignments. Students pick a course, pick a week, and answer multiple-choice questions one at a time with instant feedback, streaks, and celebration animations. Practice is free and fully client-side.

**Live site:** https://nptel-cloud-mcq.onrender.com/

## Purpose

NPTEL students want to rehearse assignment questions before they attempt the graded version. NPTEL Ace collects the assignment questions for four courses, lets students drill them in a Duolingo-style single-question flow, and records their best scores locally so progress is visible on the week dashboard.

Questions and answer keys come from each course's published assignment PDFs (stored in `assets/`) and are verified against the bold answer keys in those PDFs.

## Supported courses

| Course | Weeks | Questions |
|---|---|---|
| Cloud Computing | 1-12 | 120 |
| Blockchain & Applications | 1-11 | 109 |
| Introduction to IoT | 1-12 | 180 |
| Entrepreneurship | 1-12 | 120 |

Only the Entrepreneurship bank is fully reconciled against the assignment PDFs so far; the other three are unverified.

## Architecture

- **React 18 + Vite**: single-page app, routes rendered with React Router 6 (`/#/course/:id` and `/#/quiz/:courseId/:week`).
- **Data-driven courses**: each course is a JSON file in `src/data/` (`cloud.json`, `blockchain.json`, `iot.json`, `entrepreneurship.json`). Course metadata and the split into per-course lazy-loaded chunks live in `src/data/courses.js` — the quiz page fetches only the routed course's bank, so a course quiz load stays ~60% smaller than a single all-in-one bundle. No backend; the quiz page reads JSON, shuffles question order at runtime, and shows options as tappable cards with immediate feedback.
- **Scoring**: best score per course/week lives in `localStorage` via `useScoreHistory` — no accounts, nothing sent to a server.
- **Theming**: dark/light mode plus a per-course color theme injected as CSS custom properties via `useTheme` (`data-course` on `<html>`); course colors drive icons, buttons, and the progress bar.
- **Gamification**: milestone overlays every 3 correct answers, streak badge, mascot celebration video from `public/celebration.mp4` on scores above 50%.
- **Styling**: hand-written CSS design system in `src/index.css` (theme variables, keyframe animations, mobile-first breakpoints). No CSS framework.
- **Deployment**: Render static site, defined in `render.yaml`. `buildCommand` runs `npm install && npm run build`; `dist/` is generated fresh by the build and published with a `/* -> /index.html` rewrite for SPA routing, so tracked sources only.

## Project layout

```
NPTEL-Ace/
├── public/              # logo, celebration video, SPA redirects
├── src/
│   ├── components/      # header, confetti, milestone overlay, celebration video, admin toast
│   ├── data/            # JSON question banks per course + courses.js loader
│   ├── hooks/           # useTheme (course + dark/light), useScoreHistory (localStorage)
│   ├── pages/
│   │   ├── HomePage.jsx # course list and week dashboard
│   │   ├── QuizPage.jsx # quiz flow, progress bar, results screen
│   │   └── ...          # login / register pages
│   ├── utils/shuffle.js # randomizes question order
│   ├── index.css        # design system
│   └── main.jsx         # entry point
├── assets/              # assignment PDF answer keys
├── index.html           # Vite entry page
├── render.yaml          # Render deployment spec
└── vite.config.js
```

## Local development

```bash
npm install
npm run dev    # dev server
npm run build  # production build to dist/
```

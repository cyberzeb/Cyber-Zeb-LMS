# Berana LMS (Cyber-Zeb-LMS)

A multi-portal Learning Management System demo built with React, TypeScript, and Vite. It includes **Student**, **Instructor**, and **Institution Admin** portals with a localStorage-backed data layer for demos and presentations. A FastAPI backend scaffold lives in `backend/` for future API integration.

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 8 |
| Routing | React Router DOM v7 |
| Styling | Tailwind CSS v4, custom design tokens |
| State / data | localStorage + custom hooks; TanStack Query (wired, lightly used) |
| Icons | lucide-react |
| Backend (future) | FastAPI Python in `backend/` |

## Getting started

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

### Other scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Portals

| Portal | Base path | Access |
|--------|-----------|--------|
| Marketing | `/` | Public landing page |
| Student | `/student/*` | Pick a student account (session stored in localStorage) |
| Instructor | `/instructor/*` | Pick an instructor account |
| Institution Admin | `/admin/*` | No login picker — demo admin shell |

### Demo accounts

On first visit to the Student or Instructor portal, choose a user from the account picker. The selection is saved under `berana:session` in localStorage.

Suggested demo users:

- **Student:** Amina Lemma (`u-demo-amina`) — enrolled in CS-201, CS-340, and CYB-101
- **Instructor:** Dr. Aaron Selassie (`u2`) — teaches CS-201 and related courses

## Features

### Institution Admin

- Institution overview, org structure, departments, programs
- People management (students, instructors, staff, guardians, admins)
- Courses, enrollments, attendance, certificates
- Announcements and discussion forum
- **Live Classes** — schedule and manage virtual sessions
- **Assignments** — create, publish, and close coursework
- **Quizzes & Exams** — timed assessments linked to the question bank
- **Question Bank** — reusable MCQ, true/false, and short-answer items
- **Reports & Analytics** — enrollment, revenue, attendance, engagement charts + exportable reports
- **Payments** — invoices, tuition, fee tracking and reconciliation
- **API Integrations** — Zoom, SSO, Stripe, email/SMS connectors
- **Help Desk** — ticket queue for all roles
- **Settings** — institution profile, branding, modules, integrations toggles

### Student portal

Dashboard, courses, live classes, quizzes, assignments, grades, attendance, announcements, certificates, and more — scoped to the signed-in student’s enrollments.

### Instructor portal

Dashboard, courses, students, live classes, quizzes, assignments, grading, attendance, announcements, certificates — scoped to the instructor’s assigned courses.

## Assessments & localStorage

Assessment data is stored in localStorage and shared across all three portals:

| Key | Contents |
|-----|----------|
| `berana:live-sessions` | Scheduled live class sessions |
| `berana:assignments` | Assignment definitions |
| `berana:quizzes` | Quiz/exam definitions |
| `berana:question-bank` | Reusable questions |
| `berana:student-submissions` | Student quiz/assignment submission records |
| `berana:payments` | Tuition and fee invoices |
| `berana:help-desk-tickets` | Support tickets (all roles) |
| `berana:integrations` | API integration connectors |
| `berana:settings` | Institution settings (admin) |
| `berana:reports` | Generated report exports |

**Data flow:** Admin creates or updates records → `dashboardBuilders.ts` aggregates by enrollment (students) or course assignment (instructors) → portal pages reload via `berana:assessments-updated` or `berana:platform-updated`.

Demo seed data is loaded on startup. Bump `STORAGE_VERSION` in `src/shared/storage/keys.ts` to reset all Berana localStorage keys.

## Project structure

```
src/
├── app/                 # Router and admin layout
├── modules/
│   ├── students/        # Student portal pages, layout, hooks
│   ├── instructors/     # Instructor portal
│   ├── institution/     # Admin pages, hooks, seed data
│   └── marketing/       # Landing page
├── shared/
│   ├── components/      # UI primitives (Button, Modal, PageHeader, …)
│   ├── layout/          # Sidebar, GlassCard
│   ├── storage/         # localStorage keys, readers, seed, dashboard builders
│   └── hooks/           # useLocalStorageState, useAnnouncements, …
└── styles/globals.css   # Theme tokens

backend/                 # FastAPI scaffold (not connected to frontend yet)
```

## Backend (planned)

The `backend/` folder contains a modular FastAPI monolith with planned modules for live sessions, assessments, enrollments, and more. See `backend/ARCHITECTURE.md` for the target API design. The frontend currently uses localStorage instead of HTTP calls.

## License

Private project — see repository owner for usage terms.

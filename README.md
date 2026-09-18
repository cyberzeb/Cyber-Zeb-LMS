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
| Backend | FastAPI (Python) in `backend/`, SQLite or PostgreSQL |

## Getting started

The frontend needs the FastAPI backend: Vite proxies `/api` to `127.0.0.1:8001`.

### 1. One-time setup

```bash
npm install

cd backend
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt      # macOS/Linux: .venv/bin/pip
cp .env.example .env
```

Edit `backend/.env`. The simplest local setup uses SQLite (no database server):

```ini
DATABASE_URL=sqlite+aiosqlite:///./brana_lms_local.db
DATABASE_URL_SYNC=sqlite:///./brana_lms_local.db
JWT_SECRET_KEY=<any long random string>
DEMO_LOGIN_ENABLED=true        # sign in with code 000000, no email needed
```

To use PostgreSQL instead, start it with `docker compose -f docker-compose.postgres.yml up -d`
and keep the `postgresql+asyncpg://…` URLs from `.env.example`.

### 2. Run

```bash
npm run dev:full        # backend on :8001 + frontend on :5173
```

Open `http://127.0.0.1:5173`. On first start the backend creates the tables, the
demo university (`berana`) and the super admin `superadmin@berana.edu`. The API
restarts automatically when you change a backend `.py` file.

### Running the backend on its own

```bash
cd backend
.venv/Scripts/python -m uvicorn app.main:app --host 127.0.0.1 --port 8001    # macOS/Linux: .venv/bin/python
.venv/Scripts/python -m pytest -q                                               # 45 tests
```

- API docs (Swagger): `http://127.0.0.1:8001/docs`
- Health check: `http://127.0.0.1:8001/health`
- Real emailed sign-in codes: set `DEMO_LOGIN_ENABLED=false` plus `GMAIL_USER` / `GMAIL_APP_PASSWORD`
- Online payments: set `CHAPA_SECRET_KEY` (otherwise demo servers settle invoices instantly,
  and real servers refuse online payment)

For the feature status of each edition, see [docs/FEATURE_MATRIX.md](docs/FEATURE_MATRIX.md).
For the Super Admin console step by step, see [docs/SUPER_ADMIN.md](docs/SUPER_ADMIN.md).

### Other scripts

| Command | Description |
|---------|-------------|
| `npm run dev:full` | Start backend (8001) and frontend (5173) together |
| `npm run dev` | Start the frontend only (backend must already run on 8001) |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Portals

| Portal | Base path | Access |
|--------|-----------|--------|
| Marketing | `/` | Public landing page |
| Sign in | `/login` | Email → role → 6-digit code |
| Student | `/student/*` | Student accounts |
| Instructor | `/instructor/*` | Instructor accounts |
| Admin | `/admin/*` | Institution admins (layout follows the tenant's edition) |
| Staff / Guardian / Help desk | `/staff`, `/guardian`, `/help-desk` | Matching roles |
| Super Admin | `/super-admin/*` | Platform super admin |

### Sign-in and demo accounts

Every portal requires sign-in; the API rejects anonymous requests. Codes are
random, emailed, single-use, expire after 10 minutes and allow 5 attempts.

With `DEMO_LOGIN_ENABLED=true` in `backend/.env` (demo and development only), the
code is always `000000` and is shown on screen, so no email setup is needed.

| Role | Demo email |
|------|------------|
| Student | `amina.lemma@student.berana.edu` (enrolled in CS-201, CS-340, CYB-101) |
| Instructor | `a.selassie@berana.edu` |
| Admin | `h.desta@berana.edu` |
| Staff | `g.nega@berana.edu` |
| Guardian | `yonas.t@gmail.com` |
| Help desk | `m.haile@berana.edu` |

### Data access rules

Tenant admins can change all of their tenant's data. Other roles can only change
what the write policy in `backend/app/modules/lms_store/policy.py` allows (for example,
a student's own submissions, lesson progress and settings). The frontend saves
record-level changes (`PATCH /data/{collection}`), so people editing different
records no longer overwrite each other.

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

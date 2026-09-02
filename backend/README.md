# Berana LMS — Backend

FastAPI + PostgreSQL backend for **Berana LMS** (Cyber-Zeb Consulting).

This is a **modular monolith**: one deployable API, one database, domain modules separated by folder — not microservices.

- Architecture rules: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- Team operating guide: [`docs/backend_team_blueprint.md`](./docs/backend_team_blueprint.md)

---

## Stack

| Layer | Technology |
|-------|------------|
| API | FastAPI (async) + Uvicorn |
| ORM | SQLAlchemy 2.0 (async) + asyncpg |
| Migrations | Alembic |
| Auth | JWT (access + refresh), bcrypt |
| Queue | Celery + Redis (wired; no business tasks yet) |
| Email | Gmail SMTP (sync send via onboarding email service) |
| Local infra | Docker Compose — Postgres 16, Redis 7, API, worker, Adminer |

---

## What’s done

### Platform / Super Admin (onboarding module) — **complete**

End-to-end APIs powering the Super Admin console and public landing-page intake:

| Area | Status | Notes |
|------|--------|--------|
| Super Admin login | Done | `POST /api/v1/auth/super-admin/login` → platform JWT |
| Service requests | Done | Create → send invoice → confirm payment → activate / reject / resend email |
| Add-on module requests | Done | Same lifecycle as service requests (invoice → pay → activate / resend) |
| Estimated module pricing | Done | Live `estimated_total` / `estimated_currency` via `calculate_module_total()` |
| Module catalog & pricing | Done | Public `GET /modules`; Super Admin CRUD under `/super-admin/modules` |
| Renewals | Done | List upcoming, mark renewed, expire overdue |
| Overview dashboard | Done | Institutions, pending requests, revenue estimate, renewals, recent activity |
| Institutions browse | Done | List + detail (read-only; creation is via activation flow) |
| Landing page content CMS | Done | `SiteContentBlock` + announcement banner (public + admin APIs) |
| Audit logs | Done | `PlatformAuditLog` list/filter |
| System settings | Done | Editable keys (e.g. `SUPER_ADMIN_NOTIFY_EMAIL`, `PUBLIC_BASE_DOMAIN`) |
| Roles & invite | Done | List platform admins + invite (emails temp password) |
| Notifications | Done | Platform-wide email log viewer (`/super-admin/email-logs`) |
| Data export | Done | CSV export for service requests and tenants |
| Email delivery | Done | Invoice / welcome / notify emails; failed emails stored; resend replays stored body |
| Background notify | Done | New service-request alert + add-on invoice email via FastAPI `BackgroundTasks` |

### Tenants & identity — **implemented (MVP)**

| Area | Status |
|------|--------|
| Tenants + campuses CRUD | Done (`/api/v1/tenants`) |
| Institution user login / refresh / logout | Done (`/api/v1/auth`) |
| Create / get users | Done |
| Activation creates tenant + institution admin account | Done (via service-request activate) |

### LMS domain modules — **stubs only**

These routers are mounted but have **no real endpoints** yet (generated stubs with `TODO(Sprint N)`):

`academic`, `courses`, `enrollment`, `live_sessions`, `attendance`, `assessments`, `communication`, `payments`, `certificates`, `parent_portal`, `reports`, `integrations`, `admin`

---

## What’s next

Prioritized follow-up work for the backend:

### 1. Schema & migrations (high priority)

- Add a proper **baseline Alembic migration** for core tables that today rely on `scripts/bootstrap_onboarding.py` + `create_all` (`tenants`, `users`, `service_requests`, `platform_admin_users`, `email_logs`, `platform_audit_logs`, etc.).
- Keep incremental revisions for new features only.

### 2. Super Admin console — Tier 2 / infrastructure pages

Nav entries exist in the frontend as “Not yet available”. Backend needed when product is ready:

| Page | Needs |
|------|--------|
| System Health | Process/queue/DB health metrics |
| Backup & Restore | Backup jobs + restore API |
| Security Center | Security events, lockouts, policy |
| Integrations | Zoom / payment / storage wiring |
| Analytics | Aggregations beyond Overview |
| Appearance & Branding | Theme/assets (landing text already covered by Site Content) |

### 3. Queue & async work

- Celery worker is in Compose but **no tasks are registered**.
- Move long-running / retryable work off FastAPI `BackgroundTasks` where appropriate (email retries, expire-overdue cron, future Zoom webhooks).

### 4. Tenant LMS (Sprint map)

Implement real APIs for the stub modules in blueprint order (courses → enrollment → live sessions → attendance → assessments → communication → payments → certificates → reports).

### 5. Auth / session hardening

- Redis-backed refresh-token blacklist on logout.
- Tighter RBAC beyond single `super_admin` platform role if product needs it.

### 6. Tests

- Expand coverage for Super Admin console endpoints (overview, institutions, site content, settings, export, resend-email).
- Keep the required pattern: allowed / denied / unauthenticated / cross-tenant denied.

---

## Getting started

### 1. Environment

```bash
cd backend
cp .env.example .env
```

Set at least:

- `PLATFORM_SUPER_ADMIN_PASSWORD` — required to seed the first Super Admin
- `JWT_SECRET_KEY` — change for any non-local environment
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` (or `SMTP_*`) — if you want real email

Default DB URLs point at Compose Postgres on port **5433**.

### 2. Docker Compose (full stack)

```bash
docker compose up --build
```

| Service | Port |
|---------|------|
| API | http://localhost:8000 |
| Postgres | localhost:5433 |
| Redis | localhost:6379 |
| Adminer | http://localhost:8080 |

Compose does **not** run bootstrap or Alembic automatically — run those once (see below).

### 3. Local API (venv) against Compose DB

```bash
docker compose up -d db redis

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Create core tables + seed platform super admin
python -m scripts.bootstrap_onboarding

# Apply incremental migrations (module catalog, site content, settings, …)
alembic upgrade head

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Optional schema reset (destructive):

```bash
RESET_SCHEMA=1 python -m scripts.bootstrap_onboarding
alembic upgrade head
```

- OpenAPI docs: http://localhost:8000/docs  
- Health: http://localhost:8000/health  
- API prefix: `/api/v1`

### 4. Tests

```bash
pytest
```

Needs a reachable `DATABASE_URL`. Onboarding tests exercise auth boundaries and the service-request state machine.

---

## Important API map (current)

All paths are under `/api/v1`.

### Public

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/auth/super-admin/login` | Platform Super Admin login |
| POST | `/service-requests` | Landing: new institution request (`Idempotency-Key` required) |
| POST | `/addon-module-requests` | Landing: add modules for existing tenant |
| GET | `/modules` | Active module catalog + prices |
| GET | `/site-content` | Active landing content blocks |
| GET | `/tenants/by-subdomain/{slug}/{type_segment}` | Resolve institution by slug + type path (`college`, `training`, `corporate`) |
| GET | `/tenants/by-subdomain/{slug}` | Legacy slug-only resolve (no type validation) |

### Super Admin (Bearer platform token)

| Area | Paths |
|------|--------|
| Service requests | `/service-requests`, `.../{id}`, `.../send-invoice`, `confirm-payment`, `activate`, `reject`, `resend-email` |
| Add-ons | `/addon-module-requests` (+ same action pattern) |
| Console | `/super-admin/overview`, `/institutions`, `/institutions/{id}` |
| Modules | `/super-admin/modules` |
| Renewals | `/super-admin/renewals`, `/super-admin/tenants/{id}/renew` |
| Content | `/super-admin/site-content`, `/super-admin/announcements` |
| System | `/super-admin/audit-logs`, `/settings`, `/admins`, `/email-logs`, `/export/{kind}` |

### Institution auth & tenants

| Method | Path |
|--------|------|
| POST | `/auth/login`, `/auth/refresh`, `/auth/logout` |
| GET/POST | `/auth/users`, `/auth/users/me` |
| CRUD-ish | `/tenants`, `/tenants/{id}/campuses` |

---

## Auth model (two principals)

| Principal | Login | Token | Access |
|-----------|-------|--------|--------|
| **Platform Super Admin** | `/auth/super-admin/login` | `principal_type=platform_admin` | Super Admin / onboarding routes only |
| **Tenant user** | `/auth/login` | includes `tenant_id` + role | Tenant-scoped routes only |

Platform tokens cannot call tenant routes; institution tokens cannot call Super Admin routes. Expired tenants are rejected on tenant routes.

---

## Project layout

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, /health
│   ├── api/v1/router.py     # ONLY aggregator of module routers
│   ├── core/                # config, DB, JWT, deps, permissions, Celery, exceptions
│   ├── common/              # base mixins, pagination, audit, middleware
│   └── modules/             # one folder per domain
│       ├── onboarding/      # Super Admin + landing intake (fully built)
│       ├── tenants/         # tenants + campuses (implemented)
│       ├── identity/        # institution auth/users (implemented)
│       └── …                # LMS stubs (courses, enrollment, …)
├── alembic/versions/        # incremental migrations
├── scripts/
│   ├── bootstrap_onboarding.py   # create_all + seed super admin
│   └── generate_stub_modules.py  # regenerate stubs (destructive)
├── tests/
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── .env.example
```

### Module pattern

Every module should follow:

| File | Responsibility |
|------|----------------|
| `models.py` | SQLAlchemy models only |
| `schemas.py` | Pydantic request/response |
| `service.py` | Business rules (no HTTP objects) |
| `router.py` | HTTP endpoints + deps only |

`tenants` and `identity` are the original reference modules. `onboarding` is the richest production module today (includes `repository.py`).

Do **not** run `python scripts/generate_stub_modules.py` after real logic exists — it overwrites stub modules.

---

## Migrations

Current head: `20260821_superadmin`

| Revision | Adds |
|----------|------|
| `20260816_onboarding` | Module catalog, add-on requests, subscription/renewal columns, `request_kind` |
| `20260821_superadmin` | Site content blocks, platform settings, add-on FK on email logs |

Until a baseline migration exists, **bootstrap first**, then `alembic upgrade head`.

---

## Environment variables (summary)

See `.env.example` for the full list. Most used today:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` / `DATABASE_URL_SYNC` | Async / sync Postgres URLs |
| `JWT_SECRET_KEY` | JWT signing |
| `PLATFORM_SUPER_ADMIN_EMAIL` / `PASSWORD` | Seeded Super Admin |
| `SUPER_ADMIN_NOTIFY_EMAIL` | Alert target for new service requests (also editable in System Settings) |
| `PUBLIC_BASE_DOMAIN` | Institution link host (also editable in System Settings) |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Outbound email |
| `CORS_ORIGINS` | Allowed frontend origins |
| `REDIS_URL` | Celery broker (future tasks) |

Zoom / Stripe / Chapa / S3 keys are reserved for upcoming integrations.

---

## Useful commands

```bash
# Infra
docker compose up -d db redis
docker compose up --build          # full stack

# Schema
python -m scripts.bootstrap_onboarding
alembic upgrade head
alembic current

# API
uvicorn app.main:app --reload

# Tests
pytest
pytest tests/modules/test_onboarding.py -q

# Worker (no tasks registered yet)
celery -A app.core.celery_app worker --loglevel=info
```

---

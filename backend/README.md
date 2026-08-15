# Brana LMS - Backend

FastAPI + PostgreSQL implementation of the Brana LMS blueprint
(Cyber-Zeb Consulting, Version 1.0, July 2026).

This is a **modular monolith** (Blueprint Section 17.1): one deployable
backend, one database, clearly separated modules, no premature
microservices.

Read `ARCHITECTURE.md` before writing any code. It is the rulebook this
repo must follow. For a shorter backend operating guide aimed at the
implementation team, see `docs/backend_team_blueprint.md`.

## Stack

- **API**: FastAPI (async)
- **DB**: PostgreSQL 16, SQLAlchemy 2.0 (async), Alembic migrations
- **Auth**: JWT (access + refresh), bcrypt password hashing, RBAC
- **Queue**: Celery + Redis (webhooks, email/SMS, sync jobs)
- **Containers**: Docker Compose for local dev (db, redis, api, worker, adminer)

## Getting started

```bash
git clone <this-repo>
cd brana-lms-backend
cp .env.example .env          # fill in real secrets before non-local use

# Option A: Docker (recommended)
docker compose up --build

# Option B: local venv
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

API docs once running: http://localhost:8000/docs
Health check: http://localhost:8000/health

## Project layout

```
app/
  core/        settings, DB engine, security (JWT/hashing), auth dependencies, exceptions
  common/      shared base ORM mixins, pagination, audit log, middleware
  api/v1/      router.py aggregates every module's router - the ONLY place that does
  modules/     one folder per business module (see ARCHITECTURE.md)
alembic/       migrations - every module's models.py must be imported in alembic/env.py
tests/         mirrors app/modules structure
```

## Module pattern (every module MUST follow this)

Each `app/modules/<name>/` folder has exactly four files:

| File | Responsibility |
|---|---|
| `models.py` | SQLAlchemy ORM models only. Inherit `(Base, TenantScopedMixin)` for every tenant-owned table. |
| `schemas.py` | Pydantic request/response schemas (`*Create`, `*Out`). |
| `service.py` | Business rules, validation, audit logging. Routers call services; services never touch `request`/`response` objects. |
| `router.py` | FastAPI endpoints. Auth via `Depends(require_roles(...))`, DB via `Depends(get_db)`. No business logic here. |

`app/modules/tenants` and `app/modules/identity` are **fully implemented
reference modules** — copy their structure exactly for every other
module. Every other module currently contains generated stubs with
`TODO(Sprint N)` markers pointing at the relevant blueprint section.

Run `python scripts/generate_stub_modules.py` only if you need to
regenerate a stub from scratch (it overwrites the 4 files for every
module listed in that script - don't run it after real logic has been
added, or you will lose work).

## Sprint order

Follow `ARCHITECTURE.md` → "Sprint Map". Do not start Sprint N+1 work
until Sprint N's Definition of Done (Blueprint Section 19.1) is met.

## Testing

```bash
pytest
```

Every module PR must include: role-allowed test, role-denied test,
unauthenticated test, and a cross-tenant-denied test (see
`tests/modules/test_tenants.py` for the pattern).

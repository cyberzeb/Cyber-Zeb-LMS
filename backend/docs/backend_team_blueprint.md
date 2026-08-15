# Brana LMS Backend Team Blueprint

This document is the backend-only implementation guide for the Brana LMS project. It is intended to keep the backend team aligned on architecture, module boundaries, coding standards, and delivery expectations.

## 1. Purpose

The backend must be built as a secure, modular, multi-tenant, API-first system that supports the product roadmap without over-engineering. The team should optimize for clarity, consistency, testability, and maintainability.

## 2. Delivery model

Use a modular monolith for the MVP:

- One FastAPI backend
- One relational database
- Clear module boundaries
- No premature microservices
- Separate services only when scale or operational need is proven

This is the default architecture for all new work unless a product owner and technical lead explicitly approve an exception.

## 3. Backend architecture principles

### 3.1 Module structure

Each business module must live under `app/modules/<module_name>/` and follow the same pattern:

- `models.py`: ORM models only
- `schemas.py`: request/response schemas
- `service.py`: business logic and validation
- `router.py`: HTTP endpoints only

Routers should not contain business logic. Services should not depend on request/response objects directly.

### 3.2 API composition

The versioned router is assembled in `app/api/v1/router.py`.

- New modules must be registered there
- Modules must be exposed under `/api/v1/...`
- The router file is the single entry point for API assembly

### 3.3 Multi-tenancy

Multi-tenancy is a core requirement, not an optional feature.

- Every tenant-owned table must be scoped by `tenant_id`
- Tenant context must come from the authenticated principal, never from user input
- Cross-tenant access must be tested and denied
- Platform-level access must be separately audited

### 3.4 Security by default

Every feature must support:

- Authentication
- Authorization by role and scope
- Input validation
- Audit logging for sensitive actions
- Error handling with structured responses
- Correlation IDs for support and tracing

## 4. Working rules for the backend team

### 4.1 Feature workflow

For every feature or story, follow this sequence:

1. Understand the business requirement and acceptance criteria
2. Identify affected domain models and permissions
3. Define or update API contracts
4. Add or update tests first where practical
5. Implement the module changes
6. Add migrations if the schema changes
7. Update API docs and examples
8. Verify with tests and manual checks

### 4.2 Module responsibility boundaries

- `router.py`: parse requests, call service methods, return responses
- `service.py`: enforce rules, orchestrate workflows, call persistence logic
- `models.py`: define persistence shape and relationships
- `schemas.py`: define validation and output contracts

If a change starts to mix multiple concerns, split it into a new service or module.

### 4.3 Data ownership

Every domain object must have a clear owner:

- Brana owns core LMS business data by default
- External systems may own identity, grade, or payment truth in specific cases
- System-of-record decisions must be documented and consistent

## 5. Coding standards

### 5.1 Naming and structure

- Use clear, domain-driven names
- Prefer singular nouns for domain objects
- Keep routes and schema names consistent with the domain
- Avoid shortcuts that hide business intent

### 5.2 Error handling

- Use structured application errors
- Do not expose raw stack traces to clients
- Return consistent error payloads with a correlation ID
- Handle validation, authorization, and business-rule failures explicitly

### 5.3 Logging and observability

- Log important workflow actions
- Include correlation IDs in logs
- Record audit events for sensitive actions
- Do not log secrets or tokens

### 5.4 Migrations

- Every schema change must have an Alembic migration
- Migrations must be backward-compatible where practical
- Consider rollback impact during review

## 6. Required backend quality bar

Every completed feature must satisfy the following:

- Acceptance criteria are met
- Allowed and denied authorization paths are covered
- Tenant isolation is enforced
- Validation and error handling are implemented
- Sensitive actions are audited
- Unit and integration tests exist
- API documentation stays current
- Migration impact is reviewed
- Demo evidence is available

## 7. Definition of done for backend stories

A backend story is not complete until:

- The feature works end to end in the relevant flow
- Tests pass for success and failure paths
- Cross-tenant access is denied
- Permissions are enforced correctly
- Logs and audit records are created where required
- The code is reviewed and documented

## 8. Sprint order and scope

The backend work should follow the sprint sequence in the project architecture document:

1. Tenant and identity
2. Course foundation
3. Enrollment and portals
4. Assessment and gradebook
5. Attendance and schedules
6. Zoom/live sessions and integrations
7. Communication
8. Payments
9. Parent/guardian portal and reports
10. Certificates and hardening

Do not jump ahead to later phases unless earlier capabilities are stable and verified.

## 9. What to avoid for now

Do not introduce the following during MVP unless approved by the product owner and technical lead:

- Advanced AI tutoring
- Complex microservices
- Blockchain credentials
- Full offline mobile sync
- Advanced proctoring
- Sensitive profiling analytics
- Large marketplace features
- Multiple payment providers at the same time

## 10. Team reference files

Use these repository files as the authoritative implementation references:

- `backend/ARCHITECTURE.md` for the broader blueprint
- `backend/app/api/v1/router.py` for API composition
- `backend/app/core/dependencies.py` for auth and scope handling
- `backend/app/common/audit.py` for audit logging patterns
- `backend/tests/modules/test_tenants.py` for tenant-isolation expectations

## 11. Backend team expectation

The backend team should build in a way that is:

- Consistent across modules
- Easy for junior developers to follow
- Safe for production use
- Explicit about ownership and authorization
- Simple enough to evolve without rework

If a developer is unsure whether a change fits the blueprint, the default answer is to keep it small, explicit, testable, and aligned to the existing module pattern.

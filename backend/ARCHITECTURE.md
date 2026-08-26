# Brana LMS Backend - Architecture & Rules

This document translates the Cyber-Zeb Brana LMS Blueprint (v1.0, July
2026) into a concrete backend structure. It is binding: PRs that
deviate from it without discussion should be rejected in review.

## 1. Architecture style

Modular monolith (Blueprint Section 17.1): one FastAPI app, one
PostgreSQL database, modules separated by folder + router, not by
network boundary. Do not introduce separate services/repos per module
until there is a proven scale or operational reason (Section 17.1).

## 2. Module map

Each module = one folder in `app/modules/`. This table is the
authoritative mapping from the blueprint's functional modules
(Section 5) to this repo.

| Folder | Blueprint module(s) | Key entities | Sprint |
|---|---|---|---|
| `tenants` | 1. Tenant & Institution Management | Tenant, Campus, College, Department | 1 |
| `identity` | 2. Identity & Access, 3. User Profiles | User, UserRoleAssignment, GuardianLink | 1 |
| `academic` | 4. Academic / Training Structure | AcademicYear, AcademicTerm, Program, Cohort | 2 |
| `courses` | 5. Course Catalog & Authoring, 6. Content Management | Course, CourseOffering, Module, Lesson, ContentItem | 2 |
| `enrollment` | 7. Enrollment & Cohorts | Enrollment | 3 |
| `live_sessions` | 8. Virtual Classroom | LiveSession | 6 |
| `attendance` | 9. Attendance | AttendanceEvent, AttendanceRecord, LearningProgress | 5 |
| `assessments` | 10. Assignments & Assessments, 11. Gradebook & Progress | Assignment, Quiz, Question, Submission, GradeItem, Grade | 4 |
| `communication` | 12. Communication | Message, Announcement, Notification, Discussion | 7 |
| `payments` | 13. Payments & Billing | Order, Invoice, Payment, Refund, Discount | 8 |
| `certificates` | 14. Certificates & Credentials | Certificate | 10 |
| `parent_portal` | 15. Parent / Manager Portal | (reuses `identity.GuardianLink`) | 9 |
| `reports` | 16. Reports & Analytics | read-model only, no owned tables | cross-cutting |
| `integrations` | 19. Integration Hub & API | IntegrationConnection, WebhookEvent | cross-cutting |
| `admin` | 20. Administration & Support | SupportTicket (+ `common.audit.AuditLog`) | cross-cutting |

"AI Services" (17) and "IoT / Physical Integration" (18) are
**intentionally not scaffolded**. Blueprint Section 18.2 explicitly
delays advanced AI/analytics/IoT until core workflows are stable -
do not start these modules before Phase 5 exit criteria are met.

## 3. Sprint map (Blueprint Section 19)

Work strictly in this order. Do not start a sprint until the previous
sprint's Definition of Done (below) is met for every story in it.

| Sprint | Focus | Modules touched | Demo goal |
|---|---|---|---|
| 0 | Repo, CI, environments, coding standards | (infra only) | Running skeleton, approved backlog |
| 1 | Tenant & identity | `tenants`, `identity` | Secure admin login + tenant setup |
| 2 | Course foundation | `academic`, `courses` | Admin/instructor publishes a course |
| 3 | Enrollment & portals | `enrollment` | Learner sees enrolled course |
| 4 | Assessment | `assessments` | Instructor grades learner work |
| 5 | Attendance & schedules | `attendance` | Attendance captured and reported |
| 6 | Zoom integration | `live_sessions`, `integrations` | Live session works in test account |
| 7 | Communication | `communication` | Role-based communication works |
| 8 | Payments | `payments` | Test payment grants access once |
| 9 | Parent portal & reports | `parent_portal`, `reports` | Parent sees only linked child |
| 10 | Certificates & hardening | `certificates`, `admin` | Pilot release candidate |

## 4. Definition of Done (Blueprint Section 19.1)

Every story/PR must satisfy all of these before merge:

- [ ] Acceptance criteria passed
- [ ] Authorization tested for allowed **and** denied roles
- [ ] Tenant isolation tested (cross-tenant access proven denied)
- [ ] Input validation and error handling implemented
- [ ] Audit logging added for any high-risk action (see Section 6 below)
- [ ] Unit and integration tests added
- [ ] OpenAPI docs updated (automatic via FastAPI, verify at `/docs`)
- [ ] Alembic migration + rollback considered
- [ ] Demo evidence and code review completed

## 5. Multi-tenancy rule (Blueprint Section 17.3) - non-negotiable

- Every tenant-owned table inherits `TenantScopedMixin`
  (`app/common/base_model.py`), which forces a `tenant_id` FK.
- Every query MUST derive `tenant_id` from the authenticated
  `Principal` (`app/core/dependencies.py`), **never** from a path
  param, query string, or request body, except where explicitly
  cross-checked via `scoped_to_tenant(...)`.
- Every module's test suite must include at least one test that
  proves cross-tenant access is denied (see `tests/modules/test_tenants.py`).

## 6. High-risk actions requiring audit (Blueprint Section 16.1)

Call `app.common.audit.write_audit_log(...)` from the **service layer**
immediately after these succeed:

- Grade change after publication
- Manual attendance correction
- Refund or payment status override
- Parent-child (guardian) relationship creation/change
- User impersonation
- Role or permission change
- Course completion / certificate override
- Integration connection or secret change
- Bulk export of learner data

## 7. Role model (Blueprint Section 3)

Single source of truth: `app/core/permissions.py::Role`. Never
introduce a role string anywhere else. Route guards use
`Depends(require_roles(Role.X, Role.Y))` from `app/core/dependencies.py`.

## 8. API standards (Blueprint Section 15.3)

- All routes versioned under `/api/v1` (see `app/main.py` +
  `app/api/v1/router.py`).
- List endpoints accept `app.common.pagination.PaginationParams` and
  return `Page[T]`.
- Errors are raised as `app.core.exceptions.AppError` subclasses and
  return `{"error": {"code", "message", "correlation_id"}}` - never
  return raw stack traces or ad-hoc error shapes.
- Every response carries `X-Correlation-ID` (see
  `app/common/middleware.py`) - log it with every log line for support.
- Payment, enrollment, and webhook-sensitive endpoints must use
  idempotency keys once implemented (Section 15.3 / 15.4).

## 9. Webhook processing pattern (Blueprint Section 15.4)

`receive -> verify signature -> persist event -> acknowledge quickly ->
process via queue -> update state -> reconcile`. Zoom and payment
webhooks (Sprints 6 and 8) must follow this exact order — never do slow
work before returning the provider's HTTP response, and always store
the provider's event ID to reject duplicates.

## 10. What NOT to build yet (Blueprint Section 18.2)

Do not start, even opportunistically: advanced AI tutoring, additional
microservices, blockchain credentials, full offline mobile sync,
advanced proctoring, predictive analytics with sensitive profiling, a
course/instructor marketplace, or a second simultaneous payment
provider. Raise a product-owner conversation first if a sprint seems to
need one of these.

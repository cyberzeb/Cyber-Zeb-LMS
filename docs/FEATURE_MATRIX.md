# Berana LMS — Edition Feature Matrix

This is the "definition of done" for Berana. One codebase serves three editions.
The edition is chosen per tenant (institution type set by the Super Admin) and
resolved at runtime in `src/shared/config/tenant.ts`.

| Edition | Institution type | Admin layout |
|---|---|---|
| Berana University Edition | `college_university` | `InstitutionAdminLayout` |
| Berana Corporate Edition | `corporate` | `CorporateAdminLayout` |
| Berana Training Edition | `training` | `TrainingAdminLayout` |

**Legend**
- ✅ Done: works end to end in the UI and is saved through the data layer
- 🟡 Partial: a UI exists, but data is fake, the flow is incomplete, or it is not adapted to the edition
- ❌ Missing: not built
- ➖ Not applicable to this edition

Status as of Phase 1 (2026-09-18). Update this file whenever a row changes.

---

## 1. Platform and cross-cutting

| Feature | Status | Notes |
|---|---|---|
| Runtime edition switching (terminology and module toggles) | ✅ | `src/shared/config/editions/*` |
| Edition-specific admin dashboard at `/admin` | ✅ | Fixed in Phase 0 (`EditionDashboardPage`) |
| Login (email + OTP) and role routing | ✅ | Random, emailed, single-use codes with expiry, attempt limit and resend cooldown. Sessions renew automatically. Demo mode (`DEMO_LOGIN_ENABLED`) uses code 000000 |
| Backend authorization and tenant isolation | ✅ | Every data call requires a token, and the tenant comes from the token. Role/ownership write policy in `lms_store/policy.py`. 16 security tests |
| Data persistence | 🟡 | Record-level saves (no lost updates across records). Failed saves roll back and show an error. Still JSON collections, not normalized tables |
| Normalized backend domain modules | ❌ | 12 of 17 backend modules are empty stubs (courses, enrollment, assessments, …) |
| Dark mode / light mode | ✅ | |
| Multi-language (i18n) | 🟡 | Provider exists. Coverage is not complete |
| Zoom live sessions | ✅ | Real Zoom API (`live_sessions/zoom_client.py`). Only instructors/admins can create or end meetings |
| Payment gateway | ❌ | Invoices are records only. No Stripe/Chapa/Telebirr checkout |
| Email notifications | 🟡 | SMTP for onboarding only. No LMS event emails |
| Report PDF export | ✅ | `exportInstitutionReport.ts` |
| Automated tests | 🟡 | Backend: 25 tests (onboarding, tenants, security). Frontend: none |
| Lint / type-check / build | ✅ | 0 lint errors (60 warnings tracked), `tsc` clean, build passes |
| Read scoping per role | ❌ | Any signed-in user can still read the whole tenant (e.g. all people and payments). Needs server-side views (Phase 2) |
| Per-person portal settings | ✅ | Fixed in Phase 1 (previously one shared object for all users) |

## 2. Super Admin console (`/super-admin`)

| Feature | Status | Notes |
|---|---|---|
| Service requests → activate institution (with edition) | ✅ | |
| Institutions list / detail | ✅ | |
| Manage modules, add-ons, renewals | 🟡 | To verify end to end in Phase 6 |
| Landing page announcement banner | ✅ | Banner display restored in Phase 0 |
| Audit logs, roles, settings, notifications, export | 🟡 | To verify in Phase 6 |
| Appearance, integrations, system health, backup, security, analytics | 🟡 | Pages exist. Depth not verified |
| Demo tenant per edition | ❌ | Only the university demo tenant (`berana`) is seeded |

## 3. Shared learning engine (all editions)

| Feature | University | Corporate | Training | Notes |
|---|---|---|---|---|
| Course catalog and authoring | ✅ | 🟡 | 🟡 | Corporate/Training reuse university pages with relabeling only |
| Course content / lessons (learner player) | ✅ | 🟡 | 🟡 | |
| Library & Resources | ✅ | ❌ | ❌ | Restored from `main` in Phase 0. Not in corp/training nav |
| Enrollment | ✅ | 🟡 | 🟡 | Corporate = "Training Assignments" (relabel only) |
| Live classes | ✅ | ✅ | ✅ | |
| Assignments | ✅ | ✅ | ✅ | |
| Quizzes / exams | ✅ | ✅ | ✅ | |
| Question bank | ✅ | ❌ | ❌ | Not in corp/training nav |
| Grading / gradebook | ✅ | 🟡 | 🟡 | Learner view is university-shaped (GPA) |
| Attendance | ✅ | ❌ | ❌ | Not in corp/training admin nav |
| Certificates | ✅ | 🟡 | 🟡 | No automatic issue on completion |
| Announcements | ✅ | ✅ | ✅ | |
| Discussion forum | ✅ | ✅ | ✅ | |
| Help desk | ✅ | ✅ | ✅ | |
| Reports & analytics | ✅ | 🟡 | 🟡 | University-oriented metrics |
| Settings | ✅ | 🟡 | 🟡 | |

## 4. Berana University Edition

| Feature | Status | Notes |
|---|---|---|
| Campuses | ✅ | |
| Colleges / faculties → departments → programs | ✅ | |
| Academic years → terms / semesters | ✅ | |
| Course offerings (course per term) | ✅ | |
| Students, instructors, staff, guardians, admins | ✅ | |
| People verification workflow (staff submits, admin verifies) | ✅ | |
| Tuition / fees (records) | 🟡 | No gateway |
| Transcripts | ❌ | |
| GPA computed from real grades | 🟡 | Seeded grade history |
| Guardian portal | 🟡 | 4 pages |
| Staff portal | 🟡 | 5 pages |

## 5. Berana Corporate Edition

Target model: Company → Departments → Teams → Employees → Job roles → Required skills → Required training.

| Feature | Status | Notes |
|---|---|---|
| Corporate dashboard | 🟡 | Now reachable at `/admin`. Links fixed in Phase 0 |
| Organization structure | ✅ | |
| Departments | ✅ | |
| Teams | ✅ | |
| Employees | 🟡 | Uses the shared students page, relabeled |
| Trainers | 🟡 | Uses the shared instructors page, relabeled |
| Job roles | ✅ | |
| Skills | ✅ | |
| Job role → required skills → required training mapping | 🟡 | Job role holds requirements. No automation |
| Automatic training assignment from job role | ❌ | |
| Compliance tracking | 🟡 | Page and utilities exist |
| Compliance deadlines, overdue alerts, re-certification | ❌ | |
| Manager / team-lead view | ❌ | |
| Employee portal (no GPA, semesters or transcripts) | ❌ | Employees see the student portal |
| University-only features hidden (guardians, tuition, semesters) | 🟡 | Hidden in admin nav. Still visible in the learner portal |

## 6. Berana Training Edition

Target flow: create program → create cohort → open enrollment → learner registers → payment → training → attendance → assessment → completion → certificate.

| Feature | Status | Notes |
|---|---|---|
| Training dashboard | 🟡 | Reachable at `/admin`. **Numbers are hardcoded** (`useTrainingOverview.ts`) |
| Training programs (create/edit/delete) | 🟡 | Restored from the `training-edition` branch in Phase 0. Needs QA |
| Cohorts (seats, dates, trainer, delivery mode) | 🟡 | Restored in Phase 0. Needs QA |
| Training divisions | 🟡 | Uses the shared departments page |
| Learners | 🟡 | Two sources: the `people` collection (login accounts, in nav) and the restored `learners` collection (`/admin/training/learners`, not in nav). Must be unified (Phase 5) |
| Trainers | 🟡 | Same split as learners (`/admin/training/trainers`) |
| Open enrollment / public learner registration | ❌ | |
| Payment at registration | ❌ | |
| Cohort attendance | ❌ | |
| Completion rules → automatic certificate | ❌ | |
| Learner portal organized around cohorts | ❌ | Learners see the student portal |
| Training demo seed data | 🟡 | Frontend seed only (`training/data/trainingSeedData.ts`). No backend demo tenant |

## 7. Role portals

| Portal | Route | University | Corporate | Training |
|---|---|---|---|---|
| Admin | `/admin` | ✅ | 🟡 | 🟡 |
| Learner (student) | `/student` | ✅ | 🟡 | 🟡 |
| Instructor / trainer | `/instructor` | ✅ | 🟡 | 🟡 |
| Staff | `/staff` | 🟡 | ➖ | ➖ |
| Guardian | `/guardian` | 🟡 | ➖ | ➖ |
| Help desk | `/help-desk` | ✅ | ✅ | ✅ |
| Super Admin | `/super-admin` | ✅ (platform-wide) | | |

---

## Unmerged branch inventory (Phase 0)

Every remote branch was compared with `uni-superadmin`. Result:

| Branch | Missing work | Action |
|---|---|---|
| `training-edition` | Programs, Cohorts, Learners and Trainers pages, plus seed data (~4,400 lines) | **Restored** |
| `main` | Library & Resources admin page. Learner/instructor resources were always empty | **Restored** |
| `integration`, `betel` | Landing-page announcement banner | **Restored** |
| all branches | `eslint.config.js` | **Restored** (lint was broken) |
| `integration`, `betel` | `InstitutionLandingPage` (placeholder only), `SuperAdminLoginPage`, `EditionSwitcher` | Not restored: placeholder, or replaced by the shared `/login` |
| `corporate-edition` | Corporate org/people/course seed data | Not restored yet: use it for the corporate demo tenant (Phase 4/6) |
| `corporate-edition`, `training-edition` | Old `AdminLayout` / placeholder pages, `localDataSource` mock mode | Superseded by the current edition layouts and API data layer |
| `Osama` | `backend/scripts/set_admin_bekele.py` | One-off script. Not needed |
| `main`, `Arsema`, `Yonisha` | `initStorage`, `seedDemoData`, `ThemeContext` | Superseded by backend seeding and the current theme provider |

After this Phase 0 work is merged, `uni-superadmin` should become the single main line (merge into `main`) and the other branches should be archived.

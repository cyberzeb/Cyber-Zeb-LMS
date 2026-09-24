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

Status as of Phase 4 (2026-09-21) — Corporate Edition complete, including its demo tenant. Super Admin details: [SUPER_ADMIN.md](SUPER_ADMIN.md). Update this file whenever a row changes.

---

## 1. Platform and cross-cutting

| Feature | Status | Notes |
|---|---|---|
| Runtime edition switching (terminology and module toggles) | ✅ | `src/shared/config/editions/*` |
| Edition-specific admin dashboard at `/admin` | ✅ | Fixed in Phase 0 (`EditionDashboardPage`) |
| Login (email + OTP) and role routing | ✅ | Random, emailed, single-use codes with expiry, attempt limit and resend cooldown. Sessions renew automatically. Demo mode (`DEMO_LOGIN_ENABLED`) uses code 000000 |
| Per-institution module entitlement | ✅ | An institution only gets the modules it chose at registration. Enforced on module routers and on `/data/<collection>`; locked areas show in the nav with "Request this module" |
| Backend authorization and tenant isolation | ✅ | Every data call requires a token, and the tenant comes from the token. Role/ownership write policy in `lms_store/policy.py`. 16 security tests |
| Data persistence | 🟡 | Record-level saves (no lost updates across records). Failed saves roll back and show an error. Still JSON collections, not normalized tables |
| Normalized backend domain modules | ❌ | 12 of 17 backend modules are empty stubs (courses, enrollment, assessments, …) |
| Dark mode / light mode | ✅ | |
| Multi-language (i18n) | 🟡 | Provider exists. Coverage is not complete |
| Zoom live sessions | ✅ | Real Zoom API (`live_sessions/zoom_client.py`). Only instructors/admins can create or end meetings |
| Payment gateway | 🟡 | Server checkout: Chapa (ETB) when `CHAPA_SECRET_KEY` is set, verified with Chapa before marking paid; demo provider on demo servers. Chapa not yet tested with real keys |
| Email notifications | 🟡 | SMTP for onboarding only. No LMS event emails |
| Report PDF export | ✅ | `exportInstitutionReport.ts` |
| Automated tests | 🟡 | Backend: 74 tests (onboarding, tenants, security, scoping, structure, grading, payments, tenant controls). Frontend: none |
| Lint / type-check / build | ✅ | 0 lint errors (60 warnings tracked), `tsc` clean, build passes |
| Read scoping per role | ✅ | Server builds each role's view (`lms_store/scope.py`): own records, own/taught courses, linked children; others as directory entries only. Answer keys never sent to students |
| Per-person portal settings | ✅ | Fixed in Phase 1 (previously one shared object for all users) |

## 2. Super Admin console (`/super-admin`)

| Feature | Status | Notes |
|---|---|---|
| Service requests → activate institution (with edition) | ✅ | |
| Institutions list / detail | ✅ | |
| Manage modules, add-ons, renewals | 🟡 | Renewals ✅. Add-ons cannot be created and module prices are unused (decision needed, see SUPER_ADMIN.md) |
| Landing page announcement banner | ✅ | Banner display restored in Phase 0 |
| Audit logs, roles, settings, notifications, export | ✅ | Verified in Phase 2 |
| Appearance, integrations, system health, backup, security, analytics | 🟡 | Backup/analytics fixed for SQLite; super admin suspension enforced. User reports/bans not connected to portal users (decision needed) |
| Institution controls (suspend, reactivate, reset admin code, renew) | ✅ | Added in Phase 2 |
| Demo tenant per edition | 🟡 | University (`berana`) and Corporate (`horizon` — Horizon Bank) are seeded. Training still has no backend demo tenant |

## 3. Shared learning engine (all editions)

| Feature | University | Corporate | Training | Notes |
|---|---|---|---|---|
| Course catalog and authoring | ✅ | ✅ | 🟡 | Corporate has its own catalog of mandatory training, driven by job roles. Training still reuses the university pages with relabeling |
| Course content / lessons (learner player) | ✅ | ✅ | 🟡 | Shared player; the corporate learner portal is edition-correct |
| Library & Resources | ✅ | ✅ | ✅ | Added to the corporate and training admin nav in Phase 4 |
| Enrollment | ✅ | ✅ | 🟡 | Corporate assignments come from job roles with due dates and recertification, not manual enrolment |
| Live classes | ✅ | ✅ | ✅ | Hosts get a fresh Zoom start link on each start (Zoom's expires after ~2h). Status follows the clock without a reload |
| Assignments | ✅ | ✅ | ✅ | |
| Quizzes / exams | ✅ | ✅ | ✅ | |
| Question bank | ✅ | ✅ | ✅ | Added to the corporate and training admin nav in Phase 4 |
| Grading / gradebook | ✅ | ✅ | 🟡 | Quizzes graded on the server. The corporate learner view shows an assessment average instead of GPA; training still shows GPA wording |
| Attendance | ✅ | ✅ | ✅ | Added to the corporate and training admin nav in Phase 4 |
| Certificates | ✅ | 🟡 | 🟡 | Template designer (presets, colours, frames, patterns, seals, fonts, placeholders, logo, signatures), PDF download for admins and learners, QR code to the public `/verify` page. No automatic issue on completion |
| Announcements | ✅ | ✅ | ✅ | |
| Discussion forum | ✅ | ✅ | ✅ | |
| Help desk | ✅ | ✅ | ✅ | |
| Reports & analytics | ✅ | ✅ | 🟡 | Corporate gets a compliance report pack (by department and job role, CSV export). Training still uses the university metrics |
| Settings | ✅ | ✅ | 🟡 | Corporate reads "Organization" and "Training Defaults", adds a completion window, and drops tuition |

## 4. Berana University Edition

| Feature | Status | Notes |
|---|---|---|
| Campus → College → Department → Program → Course → Offering | ✅ | Enforced on the server: a record cannot point at a parent that does not exist |
| Colleges / faculties → departments → programs | ✅ | Programs are first-class records owned by a department |
| University report pack | ✅ | Enrolment by program, term summary, grade and standing distribution, students needing attention, Dean's List — all CSV exportable |
| University roles (registrar, head of department) | ✅ | Registrar uses the admin portal; head of department uses the staff portal |
| Academic years → terms / semesters | ✅ | Offerings now run in a term; grades and reports are grouped by it |
| Course offerings (course per term) | ✅ | |
| Students, instructors, staff, guardians, admins | ✅ | |
| People verification workflow (staff submits, admin verifies) | ✅ | |
| Tuition / fees | 🟡 | Server checkout (Chapa / demo). Students and guardians can pay |
| Transcripts | ✅ | Per term with GPA, credits and standing; PDF download. Student, registrar and guardian views |
| GPA computed from real grades | ✅ | Credit-weighted from graded work (`shared/academics`). Term GPA, cumulative GPA and academic standing |
| Guardian portal | ✅ | Child's grades/transcript, attendance, fees (can pay online) and announcements |
| Staff portal | ✅ | Department view (programs, sections, instructors, average GPA) for staff and heads of department |

## 5. Berana Corporate Edition

Target model: Company → Departments → Teams → Employees → Job roles → Required skills → Required training.

| Feature | Status | Notes |
|---|---|---|
| Corporate dashboard | ✅ | Reachable at `/admin`; KPIs come from the compliance engine |
| Organization structure | ✅ | |
| Departments | ✅ | |
| Teams | ✅ | |
| Employees | ✅ | Shared people page, relabeled, with job role and team on each record and compliance tracked against them |
| Trainers | ✅ | Shared people page, relabeled |
| Job roles | ✅ | |
| Skills | ✅ | |
| Job role → required skills → required training mapping | ✅ | A job role carries required skills, required training, a completion window and a recertification interval |
| Automatic training assignment from job role | ✅ | `useRequiredTraining`: assign per employee, per role, or organization-wide. Idempotent, sets due dates, and reassigns expired certifications |
| Compliance tracking | ✅ | Per-employee required/completed/overdue/due-soon/recertification counts, with unassigned requirements called out |
| Compliance deadlines, overdue alerts, re-certification | ✅ | Due dates from the job role, a prioritised alerts list (overdue → unassigned → due soon → recertification), and expired certifications stop counting as complete |
| Manager / team-lead view | ✅ | Team detail at `/admin/corporate/teams/:teamId`: members, team compliance rate, overdue members and the team's alerts |
| Employee portal (no GPA, semesters or transcripts) | ✅ | Transcript and tuition hidden for corporate; "Grades" reads "My Results" and breadcrumbs use training wording |
| University-only features hidden (guardians, tuition, semesters) | ✅ | Hidden in the admin nav and now in the learner portal too |

### Corporate demo tenant

`horizon` (Horizon Bank) is seeded alongside `berana`, from
`backend/seed_data/corporate.json`. Sign in with any employee email and the
demo code — the email lookup resolves the tenant, and the workspace switches to
the Corporate Edition automatically.

Its data is built from the job roles, so the compliance page has one employee in
each state: fully compliant, due soon, overdue and recertification due. Dates are
relative to when the seed was generated — re-run `npm run export-seed` if they
drift out of date.

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
| Admin | `/admin` | ✅ | ✅ | 🟡 |
| Learner (student) | `/student` | ✅ | ✅ | 🟡 |
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

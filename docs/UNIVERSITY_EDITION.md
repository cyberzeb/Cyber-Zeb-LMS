# Berana University Edition

Canonical model for **Berana University Edition** — the higher-education tenant
profile within the multi-edition Berana LMS platform.

Other editions (Corporate, Training) reuse the same core engine with different
organizational defaults and role packs. This document is the source of truth for
University Edition only.

> **Platform Super Admin** is owned by a separate team and is intentionally
> excluded from this edition spec.

---

## 1. Edition positioning

| Edition | Primary org model | Term model | Learner label |
|---------|-------------------|------------|---------------|
| **University** | Campus → Department → Program | Academic Year → Semester/Term → Course Offering | Student |
| Corporate | Business unit → Team | Cohort / Learning path | Employee |
| Training | Provider → Cohort | Session / Intake | Trainee |

The current codebase defaulted all demos to a university skin without enforcing
the **Academic Year → Term → Course Offering** spine. University Edition closes
that gap.

---

## 2. Organizational hierarchy

```
Tenant (University)
 └── Campus
      └── Department
           └── Program (BSc, MSc, PhD, Diploma … — a department can offer several)
                ├── Curriculum (which catalog courses run in each year + semester)
                └── Students (each studies one program, in a year + semester)
Course (catalog — reusable template, owned by a department)
 └── Course Offering (section: one curriculum course of a program, in a term)
      └── Enrollment (student registered in the section)
```

### Rules

1. **Course (catalog)** holds reusable content: code, title, credits, syllabus,
   modules, learning outcomes. It does **not** carry instructor, dates, or
   enrollment counts.
2. **Course Offering** is the operational unit: links `course_id` +
   `academic_term_id`, section code, instructor(s), schedule, capacity,
   delivery mode, registration window.
3. **Enrollment** always points to `course_offering_id`, never directly to
   catalog `course_id`.
4. **Grades, attendance, certificates, and progress** are scoped to
   `course_offering_id` (and optionally aggregated to program/transcript level).
5. **Programs, not departments, are degrees.** A program has its own duration
   (years), semesters per year, credits and curriculum. Students and sections
   point at a program (`programId`). Sections for a term are generated from
   each program's curriculum on the Course Offerings page. Existing data is moved
   with `python -m scripts.migrate_programs --apply`.
6. **No colleges, faculties or schools.** A department belongs directly to a
   campus; the server refuses a new department without an existing campus.
   Existing data is moved with `python -m scripts.remove_colleges --apply`.

---

## 3. Academic calendar

```
AcademicYear (e.g. 2025–2026)
 └── AcademicTerm (Fall 2025, Spring 2026, Summer 2026)
      ├── registration_opens / registration_closes
      ├── classes_start / classes_end
      ├── grading_deadline
      └── is_current (one active term per campus or tenant)
```

Terms are **first-class entities**, not display strings like `"Fall 2026"`.

---

## 4. Roles (University Edition)

University Edition has **exactly seven roles**. Each has its own permissions,
enforced by the API (`backend/app/modules/lms_store/policy.py` for writes,
`scope.py` for reads) and mirrored in the UI (`src/shared/auth/rolePermissions.ts`)
so nobody is shown an action the server would refuse.

| # | Role | Person `role` | Backend enum | Portal | Scope |
|---|------|---------------|--------------|--------|-------|
| 1 | Institution Admin | `Admin` | `institution_admin` | `/admin` (every page) | Whole institution |
| 2 | Registrar | `Registrar` | `registrar` | `/admin` (academic pages) | Whole institution, academic data only |
| 3 | Finance Officer | `FinanceOfficer` | `finance_officer` | `/admin` (finance pages) | Invoices and payments |
| 4 | Instructor | `Instructor` | `instructor` | `/instructor` | Courses they teach |
| 5 | Teaching Assistant | `TeachingAssistant` | `teaching_assistant` | `/instructor` (reduced) | Courses they are assigned to |
| 6 | Student | `Student` | `student` | `/student` | Own records |
| 7 | Parent / Guardian | `Guardian` | `parent_guardian` | `/guardian` | Linked students, read-only |

There is no Head of Department, Dean, department Staff or Help Desk role in the
University Edition. A department's head is recorded on the department itself
(informational, no extra permissions). Help desk tickets are answered by the
Institution Admin.

### What each role can do

| Area | Admin | Registrar | Finance | Instructor | TA | Student | Guardian |
|------|:-----:|:---------:|:-------:|:----------:|:--:|:-------:|:--------:|
| Institution settings, branding, integrations | ✅ | — | — | — | — | — | — |
| Campuses, organization structure | ✅ | — | — | — | — | — | — |
| Administrator / Registrar / Finance accounts | ✅ | — | — | — | — | — | — |
| Academic calendar, departments, programs | ✅ | ✅ | — | — | — | — | — |
| Course catalog, course offerings | ✅ | ✅ | — | propose own | view assigned | — | — |
| Students, instructors, TAs, guardians (accounts) | ✅ | ✅ | — | view own students | view own students | — | — |
| Enrollments | ✅ | ✅ | view | view own | view assigned | own | child's |
| Transcripts, academic reports | ✅ | ✅ | — | — | — | own | child's |
| Certificates | ✅ | ✅ | — | own courses | — | own | child's |
| Course content, assignments, quizzes, question bank | ✅ | — | — | own courses | — | take | — |
| Live classes | ✅ | — | — | host | join | join | — |
| Grading, attendance | ✅ | view | — | own courses | assigned courses | own | child's |
| Invoices and payments | ✅ | view | ✅ | — | — | pay own | pay child's |
| Announcements | ✅ | publish | publish | publish to own courses | read | read | read |
| Help desk tickets | answer all | — | — | raise | raise | raise | — |

### Where each role works

- **Institution Admin, Registrar and Finance Officer** share the admin portal.
  The sidebar shows only the pages of each person's office, and opening any
  other admin URL sends them back to their dashboard. Finance Officers get a
  Finance Dashboard (collected, outstanding, overdue, collection rate).
- **Instructors and Teaching Assistants** share the instructor portal.
  Assistants have no Quizzes or Certificates pages and no buttons to create
  courses, assignments, live classes, library items or announcements.
- Admins manage office accounts under **People → Administrators** and teaching
  assistants under **People → Teaching Assistants**, where each assistant is
  assigned to one or more courses (`course.teachingAssistantIds`).

### Cross-edition roles (not used by University)

`department_admin` (Staff), `support_agent` (Help Desk), `manager`,
`training_admin`, `academic_admin` and `auditor` serve the Corporate and
Training editions.

### Moving an existing university to these roles

```bash
cd backend
python -m scripts.migrate_university_roles          # dry run: lists what changes
python -m scripts.migrate_university_roles --apply
```

Head of Department accounts become Instructors. Staff and Help Desk accounts
are listed for an admin to re-assign (Registrar or Finance Officer) or remove.

---

## 5. Setup workflow (University Edition)

Ordered checklist shown in Institution Setup:

```
1. University Setup          → Tenant profile, timezone, branding
2. Academic Structure        → Campuses and their departments
3. Academic Year / Term      → Define calendar, set current term
4. Programs                  → Degree tracks under departments
5. Course Catalog            → Reusable courses (no instructor/dates)
6. Course Offerings          → Sections for current term
7. Instructor Assignment     → Primary + TA on each offering
8. Student Enrollment        → Register students into offerings
9. Learning                  → Content delivery, live sessions
10. Attendance               → Session events per offering
11. Assignments / Exams      → Assessments scoped to offering
12. Grading                  → Gradebook per offering / term
13. Progress                 → Completion tracking
14. Course Completion        → Final status per enrollment
15. Certificate / Record     → Credential or transcript line item
16. Reports / Analytics      → Term, department, program views
```

Steps 1–8 are **configuration** (Institution Admin + Registrar). Steps 9–15 are
**term operations** (Instructor + automated pipelines). Step 16 is
**institutional reporting**.

---

## 6. What changed from the previous model

| Area | Before | University Edition |
|------|--------|-------------------|
| Course entity | Single `CourseRecord` = catalog + offering | Split: `CourseRecord` (catalog) + `CourseOfferingRecord` |
| Term | String on grades/payments | `AcademicYear` + `AcademicTerm` entities |
| Enrollment | `studentId` + `courseId` | `studentId` + `courseOfferingId` (+ optional `programId`) |
| Grades | UI grouping by term label | FK to `course_offering_id` |
| Attendance | Per student + course | Per offering session (`AttendanceEvent`) |
| Certificates | Per course | Per offering completion |
| Roles | 6 demo roles; `academic_admin` = registrar only | Full HE role pack incl. registrar, HoD |
| Setup steps | Profile → Structure → Catalog | Full 8-step config pipeline |
| Editions | `TenantType` only, unused | `BeranaEdition` + edition-specific defaults |

---

## 7. Implementation status (Phase 3, 2026-09-20)

| Layer | Status |
|-------|--------|
| Hierarchy enforced on writes | ✅ `backend/app/modules/lms_store/validation.py` — a record cannot point at a missing parent |
| Programs as first-class records | ✅ Owned by a department; `/admin/institution/programs` |
| Offering = catalog course + curriculum slot + **academic term** | ✅ Term is required for new offerings and shown in the list |
| Enrollment → offering (with term) | ✅ Seeded and validated |
| Grades, GPA, academic standing | ✅ `src/shared/academics` — credit-weighted, from graded work |
| Transcripts (student, registrar, guardian) + PDF | ✅ |
| University report pack | ✅ `/admin/academic-reports`, CSV exports |
| Guardian portal | ✅ Grades/transcript, attendance, fees (online payment) |
| Staff portal (department / head of department) | ✅ `/staff/department` |
| Roles: registrar, head of department | ✅ Registrar → admin portal, HoD → staff portal |
| Alembic migration for academic tables | 🔲 Data still lives in the `lms_store` JSON collections |
| Normalized `/academic` + `/courses` API routes | 🔲 Phase: backend modules |

Known gaps: grade weighting uses total points across graded work (no per-category
weights yet), and there is no retake/grade-replacement policy.

## 8. Recommended next sprint (Sprint 2)

1. Run Alembic migration for academic + course tables.
2. Build **Academic Calendar** admin page (years, terms, current term picker).
3. Build **Course Offerings** admin page (create offering from catalog course).
4. Migrate `EnrollmentsPage` to enroll by offering + term filter.
5. Add Registrar dashboard widgets: registration window, enrollment counts by term.
6. Scope grade/attendance/certificate seeds to `courseOfferingId`.

---

## 9. Corporate & Training editions (future)

Do **not** fork the codebase. Use `BeranaEdition` on the tenant plus edition
feature flags in `tenant.settings`:

- **Corporate**: hide programs; use `manager` role; cohort = team intake.
- **Training**: emphasize `cohort` entity; shorter terms; `training_admin` role pack.

University Edition remains the default demo tenant (`berana`).

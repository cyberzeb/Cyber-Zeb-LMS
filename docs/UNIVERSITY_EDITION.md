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
| **University** | Campus → College → Department → Program | Academic Year → Semester/Term → Course Offering | Student |
| Corporate | Business unit → Team | Cohort / Learning path | Employee |
| Training | Provider → Cohort | Session / Intake | Trainee |

The current codebase defaulted all demos to a university skin without enforcing
the **Academic Year → Term → Course Offering** spine. University Edition closes
that gap.

---

## 2. Organizational hierarchy

```
Tenant (University)
 └── Campus (optional, multi-campus institutions)
      └── College / Faculty / School
           └── Department
                └── Program (degree / diploma track)
                     └── Course (catalog — reusable template)
                          └── Course Offering (section in a specific term)
                               └── Enrollment (student registered in offering)
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
5. **College** exists in both backend (`colleges` table) and frontend collections.

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

Single backend source of truth: `backend/app/core/permissions.py`.

### University administration

| Role | Backend enum | Scope | Primary responsibilities |
|------|--------------|-------|--------------------------|
| Institution Admin | `institution_admin` | Tenant | Tenant setup, policies, all modules |
| Registrar | `registrar` | Tenant | Enrollment, transcripts, student records |
| Academic Admin | `academic_admin` | Tenant | Programs, academic calendar, curriculum |
| Department Admin | `department_admin` | Department | Department users, local offerings |
| Finance Admin | `finance_officer` | Tenant | Tuition, invoices, payment holds |

### Academic users

| Role | Backend enum | Scope | Primary responsibilities |
|------|--------------|-------|--------------------------|
| Head of Department | `head_of_department` | Department | Approve offerings, assign instructors, dept reports |
| Instructor | `instructor` | Course offering | Teach, grade, attendance, content delivery |
| Teaching Assistant | `teaching_assistant` | Course offering | Grading support, forum moderation |

### Learners

| Role | Backend enum | Scope |
|------|--------------|-------|
| Student | `student` | Own enrollments |

### Cross-edition (inactive in University demo)

`training_admin`, `manager`, `parent_guardian`, `support_agent`, `auditor` —
available for other editions or optional modules (e.g. parent portal).

### Demo portal mapping

The React demo collapses admin roles into portals for UX simplicity:

| Demo portal | Backend roles routed there |
|-------------|----------------------------|
| Admin (`/admin`) | `institution_admin`, `academic_admin`, `registrar`, `finance_officer` |
| Staff (`/staff`) | `department_admin`, `head_of_department` |
| Instructor | `instructor`, `teaching_assistant` |
| Student | `student` |

---

## 5. Setup workflow (University Edition)

Ordered checklist shown in Institution Setup:

```
1. University Setup          → Tenant profile, timezone, branding
2. Academic Structure        → Campuses, colleges, departments
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

Steps 1–8 are **configuration** (Registrar + Academic Admin). Steps 9–15 are
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
| College | Frontend JSON only | Backend `colleges` table |
| Roles | 6 demo roles; `academic_admin` = registrar only | Full HE role pack incl. registrar, HoD |
| Setup steps | Profile → Structure → Catalog | Full 8-step config pipeline |
| Editions | `TenantType` only, unused | `BeranaEdition` + edition-specific defaults |

---

## 7. Implementation status

| Layer | Status |
|-------|--------|
| Spec (this doc) | ✅ |
| Backend roles | ✅ Updated in `permissions.py` |
| Backend models | ✅ `academic`, `courses`, `colleges` |
| Alembic migration | 🔲 Sprint 2 — run when DB ready |
| Frontend types | ✅ `types/academic.ts` |
| JSON collections | ✅ `academic-years`, `academic-terms`, `course-offerings` |
| UI pages for calendar/offerings | ✅ Sprint 2 admin pages |
| Enrollment migration | ✅ Offering-based enrollments |
| API routes | 🔲 Sprint 2 (`/academic`, `/courses`) |

---

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

- **Corporate**: hide programs/colleges; use `manager` role; cohort = team intake.
- **Training**: emphasize `cohort` entity; shorter terms; `training_admin` role pack.

University Edition remains the default demo tenant (`berana`).

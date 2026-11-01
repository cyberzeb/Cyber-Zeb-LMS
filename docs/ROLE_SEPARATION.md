# University Edition — Role Separation Design

**Status:** Proposal, awaiting approval. Nothing here is built yet.
**Scope:** University Edition only. Corporate and Training are unchanged.

---

## 1. Why the roles still feel mixed

The seven roles exist and the server enforces them, but the product still
shows them as one blended system:

| Problem | Where it shows |
|---|---|
| **Three office roles share one portal.** Admin, Registrar and Finance all land on `/admin`, with the same layout, logo, URL and dashboard style. They differ only in which menu items are hidden. | Sign in as Registrar: it looks like a cut-down admin, not a registrar's office. |
| **The Admin does everyone's job.** The Admin can enroll students, create assignments, write quizzes, issue certificates and mark invoices paid. Nobody owns anything alone. | Admin menu has ~30 items covering every role's work. |
| **Teaching work sits in the admin portal.** Admin pages create assignments, quizzes and question-bank items that belong to instructors. | `/admin/assignments`, `/admin/quizzes-exams`, `/admin/question-bank`. |
| **The same task lives in several places.** An instructor is assigned to a course in three places (course form, Instructors page, Course Offerings), and they don't agree: the instructor portal only reads the course form. | Assign on an offering → the instructor does not see it. |
| **TA is a hidden mode of the instructor portal.** Same URL, same menu minus two items. | `/instructor` for both. |
| **No hand-offs between roles.** Grades go straight to the transcript, course approvals go to the Admin, unpaid fees never reach the Registrar. | No "submit → approve" steps. |
| **Duplicate or confusing pages.** "Calendar" and "Academic Calendar" both titled *Academic Calendar*; "Reports & Analytics" and "Academic Reports"; "All People" plus a page per role. | Admin menu. |

## 2. Design principles

1. **One home per role.** Every role gets its own portal: its own URL,
   header, menu and dashboard built for its daily work.
2. **One owner per task.** Each piece of data has exactly one role that
   creates and changes it. Others may read it if they need to, never edit it.
3. **Hand-offs, not shared editing.** When work crosses roles, one role
   *submits* and the owner *approves* (grades, course proposals, fee holds).
4. **Each task in one place.** Remove the duplicate pages and assignment paths.
5. **Same rules on screen and on the server.** The menu, the buttons and the
   API permissions come from one matrix, so no screen offers an action the
   server refuses.

## 3. The seven portals

| Role | Portal | Who they are | Their job in one line |
|---|---|---|---|
| Institution Admin | `/admin` | IT / system owner, executive office | Sets the institution up and governs it; sees everything, runs nobody's daily work |
| Registrar | `/registrar` *(new)* | Registrar's office | Runs the academic year: structure, catalog, sections, enrollment, records |
| Finance Officer | `/finance` *(new)* | Finance / bursar's office | Bills and collects tuition and fees |
| Instructor | `/instructor` | Faculty | Teaches their sections: content, assessments, grades, attendance |
| Teaching Assistant | `/assistant` *(new)* | Graduate assistants | Helps on assigned sections: grading and attendance |
| Student | `/student` | Learners | Learns, submits work, pays, follows their record |
| Parent / Guardian | `/guardian` | Family | Follows a linked student, pays their fees |

The new portals reuse today's page components: no logic is duplicated, but each
role gets its own layout, menu and dashboard.

## 4. Who owns what

**Own** = the only role that creates and changes it. **View** = read-only.
**—** = not visible.

### Institution setup and accounts

| Data | Admin | Registrar | Finance | Instructor | TA | Student | Guardian |
|---|---|---|---|---|---|---|---|
| Institution profile, branding, modules, integrations | **Own** | — | — | — | — | — | — |
| Campuses | **Own** | View | — | — | — | — | — |
| Admin, Registrar, Finance accounts | **Own** | — | — | — | — | — | — |
| Student, Instructor, TA, Guardian accounts | View | **Own** | View (students) | — | — | — | — |
| Audit log (who changed what) | **Own** | — | — | — | — | — | — |

### Academic structure and records

| Data | Admin | Registrar | Finance | Instructor | TA | Student | Guardian |
|---|---|---|---|---|---|---|---|
| Academic years and terms | View | **Own** | View | View | — | View | — |
| Departments and programs | View | **Own** | — | View | — | View | — |
| Course catalog | View | **Own** (approves proposals) | — | Propose | — | View | — |
| Course sections (offerings) | View | **Own** | — | View own | View own | View | — |
| Instructor and TA assignment | View | **Own** — on the section, one place only | — | View own | View own | — | — |
| Enrollment | View | **Own** | View | View own sections | View own sections | Request / self-enroll if allowed | View child |
| Final grades and transcripts | View | **Own** (approves and locks) | — | Submit | — | View own | View child |
| Certificates | View | **Own** (issues and revokes) | — | Request for own sections | — | View own | View child |
| Academic reports | View | **Own** | — | Own sections | — | — | — |

### Teaching

| Data | Admin | Registrar | Finance | Instructor | TA | Student | Guardian |
|---|---|---|---|---|---|---|---|
| Course content, modules, library | — | — | — | **Own** | View | View | — |
| Assignments, quizzes, question bank | — | — | — | **Own** | View | Take | — |
| Live classes | — | — | — | **Own** (host) | Join | Join | — |
| Grading submissions | — | — | — | **Own** (publishes) | Draft grades | View own | View child |
| Attendance | — | View | — | **Own** | Record | View own | View child |
| Teaching activity overview | View | View | — | — | — | — | — |

### Money

| Data | Admin | Registrar | Finance | Instructor | TA | Student | Guardian |
|---|---|---|---|---|---|---|---|
| Fee structure (tuition per program, fee types) | View | — | **Own** | — | — | — | — |
| Invoices and payments | View | — | **Own** | — | — | Pay own | Pay child |
| Financial holds | View | View | **Own** | — | — | View own | View child |
| Financial reports | View | — | **Own** | — | — | — | — |

### Communication and support

| Data | Admin | Registrar | Finance | Instructor | TA | Student | Guardian |
|---|---|---|---|---|---|---|---|
| Announcements | To everyone | To students / faculty | To students / guardians (fees) | To own sections | Read | Read | Read |
| Discussion forum | Moderate | — | — | Own sections | Own sections | Own sections | — |
| Help desk tickets | Answers technical / general | Answers academic | Answers payment | Raise | Raise | Raise | Raise |

## 5. Hand-offs between roles (new workflows)

1. **Course proposal:** Instructor proposes a course → **Registrar** approves
   or rejects (today: Admin).
2. **Grades:** TA enters draft grades → Instructor reviews and **submits final
   grades** for the section → **Registrar approves and locks** them → they
   appear on the transcript. (Today grades go straight to the transcript.)
3. **Financial hold:** Finance places a hold on a student with overdue fees →
   the Registrar sees a hold badge, and new enrollment is blocked until Finance
   lifts it. The student and guardian see why.
4. **Certificates:** a section completes → the Instructor requests certificates
   → the **Registrar issues** them.
5. **Help desk routing:** the ticket category picks the answering office:
   academic → Registrar, payment → Finance, everything else → Admin.

## 6. Each portal's menu

**Institution Admin — `/admin`** (oversight and setup)
- Dashboard: institution health (enrollment, revenue, activity, setup progress)
- Institution: Profile & Branding · Campuses · Modules · Integrations
- Staff Accounts: Administrators · Registrars · Finance Officers
- Oversight (read-only): People Directory · Academics · Teaching Activity · Finance Summary
- Reports & Analytics · Audit Log
- Announcements (institution-wide) · Help Desk (technical / general) · Settings

**Registrar — `/registrar`** (academic operations)
- Dashboard: current term, open registration, pending approvals, holds
- Academic Setup: Academic Calendar · Departments · Programs
- Courses: Course Catalog (+ proposals to approve) · Sections & Assignment (instructors and TAs)
- Students: Students · Enrollment · Guardians
- Faculty: Instructors · Teaching Assistants
- Records: Grade Approvals · Transcripts · Certificates · Attendance (view)
- Academic Reports · Announcements · Help Desk (academic)

**Finance Officer — `/finance`** (money)
- Dashboard: collected, outstanding, overdue, collection rate
- Fee Structure · Invoices · Payments · Financial Holds
- Students (read-only, with balance) · Financial Reports
- Announcements (fees) · Help Desk (payment)

**Instructor — `/instructor`** (teaching): as today, plus:
- Gradebook → **Submit final grades** for each section
- Certificates → **Request issuing** (Registrar issues)
- Assigned sections come from the section assignment (one source)

**Teaching Assistant — `/assistant`** (support teaching)
- Dashboard: my sections, grading queue, today's classes
- My Sections · Students · Grading (draft) · Attendance · Live Classes (join)
- Library (view) · Calendar · Announcements (read) · Forum · Help Desk · Settings

**Student** and **Parent / Guardian**: as today, plus hold notices and
help desk categories.

## 7. What gets removed or moved

| Today | After |
|---|---|
| `/admin/assignments`, `/admin/quizzes-exams`, `/admin/question-bank` (admin creates teaching content) | Removed from admin. Replaced by one read-only **Teaching Activity** page for Admin and Registrar |
| Registrar and Finance inside `/admin` | Their own portals `/registrar` and `/finance` |
| TA inside `/instructor` | Own portal `/assistant` |
| Instructor assigned in 3 places | One place: the section (Registrar). The Instructors page shows assignments read-only |
| Admin approves course proposals | Registrar approves |
| Admin enrolls, issues certificates, marks invoices paid | Admin views only; the owning office acts |
| "Calendar" page also titled "Academic Calendar" | **Academic Calendar** (terms, Registrar) and **Events** (everyone's schedule) |
| "All People" with invite buttons for every role | Admin: read-only **People Directory**. Accounts are created by their owner (Admin: office staff; Registrar: everyone else) |

## 8. Organization structure: Campus → Department (no colleges)

Colleges (faculties / schools) are removed. The structure becomes:

```
University
 └── Campus
      └── Department
           └── Program (degree track)
                └── Course → Section (offering) → Enrollment
```

| Area | Today | After |
|---|---|---|
| Organization page | Campus → College → Department tree, "Add College" button | Campus → Department tree; departments are added straight under a campus |
| Department form | Requires choosing a college | Campus only |
| Department cards and filters | Show the college; "All Colleges" filter | College label and filter removed |
| Institution header stats | "Colleges" count | "Departments" count |
| Institution registration form (`/request`) | Asks for a list of colleges | Field removed (campuses and departments only) |
| Super Admin institution details | Shows colleges | Removed |
| Data | `colleges` collection; every department has a `collegeId`; the server checks the college exists | `colleges` retired; departments point only at their campus; server checks the campus |
| Corporate / Training | Use a hidden default college behind the scenes | Same simpler model; nothing visible changes |

**Existing data:** each department keeps its campus, programs, courses,
students and staff. Only the college link is dropped, and the `colleges`
records are deleted by a migration script (dry run first, like the roles
migration). No department, program or student is lost.

## 9. What changes in the code

- **New layouts:** `RegistrarLayout`, `FinanceLayout`, `AssistantLayout`, each
  with its own menu and dashboard, reusing existing page components.
- **One permission matrix:** `src/shared/auth/rolePermissions.ts` becomes the
  single table of section 4 (pages + actions per role); menus and buttons read
  from it.
- **Server rules:** `backend/app/modules/lms_store/policy.py` follows the same
  table. The Admin becomes read-only on academic, teaching and finance data.
- **New data:** grade submission status per section, financial holds, fee
  structure, help desk category routing, section-level instructor and TA
  assignment (replacing the course-level fields, with a migration).
- **Login:** each role lands on its own portal. Old `/admin` links for
  Registrar and Finance redirect to their new portal.
- **Colleges removed:** the college type, list component, form fields and
  filters; `colleges` from the server's collections, policy and checks;
  `colleges` from the registration form and Super Admin views; demo data and
  a migration for existing institutions.
- **Docs and tests:** the matrix in `UNIVERSITY_EDITION.md`, new backend tests
  per hand-off, and a live sign-in check for every portal.

## 10. Suggested build order

1. Remove colleges (Campus → Department), since every later step builds on the
   structure.
2. Separate portals (`/registrar`, `/finance`, `/assistant`) and the single
   permission matrix: the biggest visible change.
3. One owner per task: Admin becomes read-only on academics, teaching and money;
   teaching pages leave the admin portal.
4. One place for instructor and TA assignment (sections).
5. Hand-offs: course approval to Registrar, grade submission and approval,
   financial holds, certificate requests, help desk routing.

Each step ships working on its own and can be demoed before the next.

## 11. Decisions needed

1. **Can the Admin step in for the Registrar?** Proposed: no, Admin is
   read-only on academics (clean separation). Alternative: Admin keeps edit
   rights as a fallback for small institutions without a registrar.
2. **Separate TA portal?** Proposed: yes, `/assistant`. Alternative: keep TAs
   in the instructor portal with a clearly labelled assistant mode.
3. **Scope of hand-offs:** all five workflows in section 5, or start with grade
   approval and financial holds only.

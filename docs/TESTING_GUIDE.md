# How to test Berana LMS

A practical pass over everything built so far (Phases 0–3 and the Super Admin
console). Work top to bottom; each check says what you should see. Anything that
does not match is a bug worth reporting.

Status of each feature: [FEATURE_MATRIX.md](FEATURE_MATRIX.md).
Super Admin step by step: [SUPER_ADMIN.md](SUPER_ADMIN.md).

---

## 1. Start the system

```bash
npm run dev:full
```

Open `http://127.0.0.1:5173`.

- The API runs on `http://127.0.0.1:8001` (API docs: `/docs`, health: `/health`).
- The backend restarts by itself when you edit a Python file.
- First start creates the demo university and the super admin account.

If ports are busy, close the previous run (Ctrl+C) and start again.

## 2. Sign in

Everyone signs in the same way: go to `/login`, type the email, then the 6-digit
code. On this demo build the code is always **`000000`** and is shown on screen.

| Role | Email | Lands on |
|---|---|---|
| Student | `amina.lemma@student.berana.edu` | `/student` |
| Instructor | `a.selassie@berana.edu` | `/instructor` |
| Institution Admin | `h.desta@berana.edu` | `/admin` |
| Registrar | `g.nega@berana.edu` | `/admin` |
| Head of Department | `h.girma@berana.edu` | `/staff` |
| Guardian | `yonas.t@gmail.com` | `/guardian` |
| Help Desk | `m.haile@berana.edu` | `/help-desk` |
| Super Admin | `superadmin@berana.edu` | `/super-admin` |

Use a separate browser window (or a private window) per role if you want two
roles open at once — signing in replaces the session in that window.

---

## 3. Security — the most important checks (Phases 1–2)

**3.1 Nothing is visible without signing in.**
Sign out (or open a private window) and go to `http://127.0.0.1:5173/admin`.
→ You are sent to the sign-in page. No data appears.

**3.2 Students only see their own records.**
Sign in as the student, open the browser console (F12) and run:

```js
await fetch('/api/v1/data/payments', {headers:{Authorization:'Bearer '+document.cookie.match(/berana_token=([^;]+)/)[1]}}).then(r=>r.json())
```

→ Only Amina's invoices come back, not the whole university's.
Repeat with `/api/v1/data/people` → other people appear with name and role only,
**no email addresses**. And `/api/v1/data/question-bank` → **no `correctAnswer`**
field anywhere.

**3.3 A student cannot change what they should not.**
Still as the student, in the console:

```js
await fetch('/api/v1/data/people', {method:'PATCH', headers:{'Content-Type':'application/json',Authorization:'Bearer '+document.cookie.match(/berana_token=([^;]+)/)[1]}, body: JSON.stringify({upserts:[{record:{id:'u-demo-amina',role:'Admin'}}]})}).then(r=>r.status)
```

→ `403`. The same request against `/api/v1/data/payments` (marking an invoice
paid) is also `403`.

**3.4 Wrong sign-in codes are limited.**
On `/login`, request a code and type a wrong one six times.
→ After five attempts it refuses and asks for a new code. Requesting a new code
immediately says to wait ~30 seconds.

**3.5 Sessions.** Leave a portal open for more than 30 minutes and keep using it.
→ You stay signed in (the session renews itself). Signing out returns you to `/login`.

---

## 4. Student portal

Sign in as the student.

| Check | Where | Expected |
|---|---|---|
| Dashboard | `/student` | Current GPA tile shows **2.75** and "Good Standing", not a dash |
| Grades | `/student/grades` | Real courses with percentages and letter grades |
| Transcript | `/student/transcript` | Terms with term GPA, credits, cumulative GPA |
| Transcript PDF | same page → **Download transcript (PDF)** | A PDF downloads with one table per term and the totals |
| Library | `/student/resources` | Course materials listed (this page used to be empty) |
| Pay a fee | `/student/payments` → **Pay now** | Invoice becomes "paid" and the button disappears |
| Take a quiz | `/student/quizzes` → **Start quiz** | After submitting, the toast shows the score the **server** calculated |

Note: quizzes only open when their due date is in the future; if no quiz is
open, that is expected with the seeded dates.

## 5. Instructor portal

Sign in as the instructor (`a.selassie@berana.edu`).

- `/instructor/courses` — only the courses this instructor teaches.
- `/instructor/grades` — the gradebook; grading a submission updates the
  student's GPA (check it afterwards as the student or in the registrar view).
- `/instructor/live-classes` — creating a Zoom session needs Zoom keys in `.env`;
  without them you get a clear error, not a crash.

## 6. Admin and Registrar portal (`/admin`)

Sign in as the admin or registrar (both land here; the registrar is the
records-focused role).

| Check | Where | Expected |
|---|---|---|
| Academic structure | Campuses → Colleges → Departments | Each level lists the one above it |
| Programs | `/admin/institution/programs` | 4 degree programs, each owned by a department |
| Academic calendar | `/admin/institution/academic-calendar` | Years and terms; one term marked current (Spring Semester 2026) |
| Course offerings | `/admin/course-offerings` | Every section shows a **term**; none says "No term set" |
| Create an offering | same page → Add | The form requires an academic term; saving without one is refused |
| Transcripts | `/admin/transcripts` | 195 students, 143 with grades, average GPA ≈ 2.71, 22 below 2.00 |
| One transcript | click **Open** on a student | Their full record; PDF download works |
| Academic reports | `/admin/academic-reports` | Enrolment by program, term summary, grade and standing distribution, students needing attention, Dean's List |
| CSV export | any **CSV** button on that page | A `.csv` file downloads and opens in Excel |
| People | `/admin/people` | Role filter includes Registrar and Head of Department |

**Structure enforcement (worth one test).** In the console as admin:

```js
await fetch('/api/v1/data/course-offerings', {method:'PATCH', headers:{'Content-Type':'application/json',Authorization:'Bearer '+document.cookie.match(/berana_token=([^;]+)/)[1]}, body: JSON.stringify({upserts:[{record:{id:'test-1',courseId:'nope',academicTermId:'nope'}}]})}).then(async r=>[r.status, await r.json()])
```

→ `422` with a message naming what is missing. Nothing is saved.

## 7. Head of Department portal (`/staff`)

Sign in as `h.girma@berana.edu`.

- `/staff/department` — Computer Science: 1 program, 7 courses, 7 sections,
  69 students, average GPA 2.58, and the instructor list.
- `/staff/submit-people` — submit a new person; they appear as **pending**.
  Then sign in as the admin → `/admin/verify-people` → the submission is waiting
  for approval.
- Sign in as `g.nega@berana.edu` (registrar, an office not a department) and open
  `/staff/department` → it explains that the account is not attached to an
  academic department, instead of showing zeros.

## 8. Guardian portal (`/guardian`)

Sign in as `yonas.t@gmail.com` (linked to the student Selam Girma).

- Dashboard — child's GPA, standing, attendance and outstanding fees.
- `/guardian/grades` — the child's transcript, with PDF download.
- `/guardian/attendance` — per-course attendance with a pass/fail rate.
- `/guardian/payments` — the child's invoices; **Pay now** settles one.
- Confirm the guardian sees **only** their own child: no other student appears.

## 9. Super Admin console (`/super-admin`)

Full walkthrough in [SUPER_ADMIN.md](SUPER_ADMIN.md). The short version:

1. **New institution, end to end.** On the public landing page (`/`), fill in
   "Request Service" (pick any edition). Then as super admin:
   Service Requests → open it → **Send Invoice** → **Confirm Payment** →
   **Activate & Send Link**. Copy the 6-digit access code shown once.
2. **New admin signs in.** `/login` with the email you registered and that code.
   → They land in the admin portal styled for the edition they chose
   (University, Corporate or Training).
3. **Institution controls.** Super Admin → Institutions → open one:
   - **Reset admin access code** → a new code appears; the old one stops working.
   - **Suspend** (a reason is required) → then try to sign in as that
     institution's admin: refused with "access is suspended".
   - **Reactivate** → that admin can sign in again.
4. **Operations pages.** Analytics, System Health and Backup & Restore all load
   and return real numbers (these were broken on SQLite before).

## 10. Editions

Register one institution per edition (step 9.1) and check the admin sidebar:

- **University** — Academic Calendar, Programs, Course Offerings, Transcripts, Academic Reports.
- **Corporate** — Organization, Departments, Teams, Job Roles, Skills, Compliance.
- **Training** — Training Programs, Cohorts, Course Catalog.

---

## 11. Automated checks

```bash
# backend tests (52) — uses a throwaway database, never your data
cd backend && .venv/Scripts/python -m pytest -q      # macOS/Linux: .venv/bin/python

# frontend type-check, lint and production build
npx tsc -b
npm run lint            # 0 errors (warnings are tracked debt)
npm run build
```

There are no automated frontend (browser) tests in the repo yet; section 3–10
above is the manual equivalent.

## 12. Resetting the demo data

The demo data lives in `backend/seed_data/demo.json` and is loaded on first
start. To start over, stop the app, delete `backend/brana_lms_local.db` and start
again — a fresh demo university is created. (Do this if you have paid invoices,
graded work or created test institutions while exploring.)

## 13. Reporting what you find

For each problem, note: the role you were signed in as, the page URL, what you
did, what you expected and what happened. If the screen showed an error message,
copy it. Console errors (F12 → Console) help a lot.

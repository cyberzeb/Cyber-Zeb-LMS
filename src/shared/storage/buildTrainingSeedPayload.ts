/**
 * Demo seed for the Training Edition tenant (Apex Training Institute).
 *
 * A training institute sells programs and runs them as cohorts, so the demo has
 * one example of every state the product handles: a finished cohort with its
 * certificates (and one learner who missed too many sessions), cohorts running
 * now with attendance, upcoming intakes taking registrations, unpaid seat holds
 * (one of them expired), a free open day, and an intake still missing a trainer.
 *
 * Registrations, invoices and enrollments are built exactly as the server
 * creates them (`backend/app/modules/training`), so the demo matches the product.
 */
import { TRAINING_COURSE_MODULES } from '../../modules/training/data/trainingCourseContent'
import type {
  Cohort,
  CohortRegistration,
  CohortSession,
  AttendanceMark,
  TrainingProgram,
} from '../../modules/training/types'
import type { CertificateRecord, CourseEnrollment, CourseRecord, PersonRow } from '../../modules/institution/types'
import type { PaymentRecord } from '../../modules/institution/types/platform'
import type { AssignmentRecord, LiveSessionRecord, QuestionRecord, QuizRecord } from '../../modules/institution/types/assessments'
import type { AnnouncementRecord } from '../types/announcements'
import { defaultInstitutionSettings } from './settingsUtils'

/** Dates are relative to when the seed is generated; re-run `npm run export-seed` if they drift. */
const SEED_TODAY = new Date().toISOString().slice(0, 10)

function day(offset: number): string {
  const d = new Date(`${SEED_TODAY}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + offset)
  return d.toISOString().slice(0, 10)
}

const STAMP = `${SEED_TODAY}T08:00:00.000Z`

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

// ── Organization ─────────────────────────────────────────────────────────────

const campuses = [
  { id: 'c1', name: 'Bole Training Center', code: 'BOLE', address: 'Bole Road, Addis Ababa', subtitle: 'Classrooms and computer lab', status: 'active' },
  { id: 'c2', name: 'Online Campus', code: 'ONLINE', address: 'Live online sessions', subtitle: 'Virtual classroom', status: 'active' },
]

const colleges = [{ id: 'col1', name: 'Apex Training Institute', deanName: 'Hana Wolde', campusId: 'c1', description: 'Training divisions' }]

const DIVISIONS = [
  { id: 'd1', name: 'Project & Business', head: 'Yonas Alemu', icon: '📐', description: 'Project management, agile delivery and business skills.' },
  { id: 'd2', name: 'Data & Technology', head: 'Meron Tesfaye', icon: '📊', description: 'Spreadsheets, analytics and dashboards.' },
  { id: 'd3', name: 'Leadership & People', head: 'Samuel Girma', icon: '🧭', description: 'Supervision, coaching and team leadership.' },
]

const departments = DIVISIONS.map((d) => ({
  id: d.id,
  name: d.name,
  headName: d.head,
  studentsCount: 0,
  facultyCount: 1,
  icon: d.icon,
  campusId: 'c1',
  collegeId: 'col1',
  description: d.description,
  status: 'active',
}))

// ── People ───────────────────────────────────────────────────────────────────

function staff(id: string, name: string, email: string, role: PersonRow['role'], department: string, departmentId?: string): PersonRow {
  return { id, name, email, role, department, departmentId, campusId: 'c1', status: 'active', verificationStatus: 'verified', lastActive: '1 hour ago', initials: initials(name) }
}

const ADMIN = staff('apx-admin', 'Hana Wolde', 'h.wolde@apexacademy.et', 'Admin', 'Administration')
const TRAINERS = [
  staff('apx-tr1', 'Yonas Alemu', 'y.alemu@apexacademy.et', 'Instructor', 'Project & Business', 'd1'),
  staff('apx-tr2', 'Meron Tesfaye', 'm.tesfaye@apexacademy.et', 'Instructor', 'Data & Technology', 'd2'),
  staff('apx-tr3', 'Samuel Girma', 's.girma@apexacademy.et', 'Instructor', 'Leadership & People', 'd3'),
]
const HELPDESK = staff('apx-help', 'Lidya Bekele', 'support@apexacademy.et', 'HelpDesk', 'Learner Support')

const LEARNER_ROWS: [string, string, string, string][] = [
  ['L1', 'Selam Hailu', 'selam.hailu@learner.apex.et', 'Self-sponsored'],
  ['L2', 'Abel Tesfaye', 'abel.tesfaye@learner.apex.et', 'Ethio Engineering Group'],
  ['L3', 'Ruth Mengistu', 'ruth.mengistu@learner.apex.et', 'Dashen Microfinance'],
  ['L4', 'Nahom Bekele', 'nahom.bekele@learner.apex.et', 'Self-sponsored'],
  ['L5', 'Eden Assefa', 'eden.assefa@learner.apex.et', 'Addis Logistics'],
  ['L6', 'Kaleb Worku', 'kaleb.worku@learner.apex.et', 'Self-sponsored'],
  ['L7', 'Mahlet Getachew', 'mahlet.getachew@learner.apex.et', 'Sheba Hotels'],
  ['L8', 'Biruk Tadesse', 'biruk.tadesse@learner.apex.et', 'Self-sponsored'],
  ['L9', 'Hiwot Alemayehu', 'hiwot.alemayehu@learner.apex.et', 'City Health Office'],
  ['L10', 'Dawit Mulugeta', 'dawit.mulugeta@learner.apex.et', 'Self-sponsored'],
  ['L11', 'Tsion Kebede', 'tsion.kebede@learner.apex.et', 'Blue Nile Insurance'],
  ['L12', 'Yared Solomon', 'yared.solomon@learner.apex.et', 'Self-sponsored'],
  ['L13', 'Blen Fikre', 'blen.fikre@learner.apex.et', 'Ethio Engineering Group'],
  ['L14', 'Robel Hailemariam', 'robel.hailemariam@learner.apex.et', 'Self-sponsored'],
]

const LEARNERS: PersonRow[] = LEARNER_ROWS.map(([key, name, email, organization]) => ({
  id: `apx-${key.toLowerCase()}`,
  name,
  email,
  role: 'Student',
  department: organization,
  organization,
  phone: `09${String(11000000 + Number(key.slice(1)) * 734521).slice(0, 8)}`,
  campusId: 'c1',
  status: 'active',
  verificationStatus: 'verified',
  lastActive: '2 days ago',
  initials: initials(name),
  joinedAt: day(-90),
  source: 'registration',
}))

const L = (key: string) => LEARNERS.find((p) => p.id === `apx-${key.toLowerCase()}`)!

// ── Catalog and programs ─────────────────────────────────────────────────────

const COURSE_ROWS: [string, string, string, string, number][] = [
  ['t1', 'PM-101', 'Project Management Foundations', 'd1', 0],
  ['t2', 'PM-201', 'Agile and Scrum in Practice', 'd1', 0],
  ['t3', 'DA-101', 'Excel for Data Analysis', 'd2', 1],
  ['t4', 'DA-201', 'Dashboards with Power BI', 'd2', 1],
  ['t5', 'LD-101', 'Leading Teams', 'd3', 2],
  ['t6', 'LD-102', 'Coaching and Feedback', 'd3', 2],
]

const courses: CourseRecord[] = COURSE_ROWS.map(([id, code, title, departmentId, trainerIndex]) => {
  const modules = TRAINING_COURSE_MODULES[id] ?? []
  const division = DIVISIONS.find((d) => d.id === departmentId)!
  const trainer = TRAINERS[trainerIndex]
  return {
    id,
    code,
    title,
    instructor: trainer.name,
    instructorId: trainer.id,
    department: division.name,
    departmentId,
    level: 'Professional',
    enrolledCount: 0,
    moduleCount: modules.length,
    status: 'published',
    progressPercent: 0,
    icon: division.icon,
    approvalStatus: 'approved',
    description: `${title} — part of Apex Training Institute's ${division.name} programs.`,
    shortDescription: division.description,
    credits: 0,
    modules,
    deliveryMode: 'Blended',
    certificateEnabled: true,
    createdAt: STAMP,
    updatedAt: STAMP,
  } as unknown as CourseRecord
})

function program(p: Omit<TrainingProgram, 'createdAt' | 'updatedAt' | 'currency' | 'certificateEnabled' | 'status'>): TrainingProgram {
  return { ...p, currency: 'ETB', certificateEnabled: true, status: 'active', createdAt: STAMP, updatedAt: STAMP }
}

const programs: TrainingProgram[] = [
  program({
    id: 'prg-pm',
    code: 'PMP-PREP',
    name: 'Project Management Professional',
    description: 'Plan, schedule and deliver projects with confidence — from the work breakdown structure to agile sprints. Prepares you for PMP-style exams.',
    divisionId: 'd1',
    divisionName: 'Project & Business',
    level: 'Intermediate',
    deliveryMode: 'hybrid',
    durationWeeks: 6,
    totalHours: 36,
    courseIds: ['t1', 't2'],
    price: 12500,
    minAttendance: 80,
    credentialType: 'Professional Certificate',
    certificateTemplateId: 'tpl-professional',
    skills: ['Planning', 'Scheduling', 'Risk', 'Agile'],
  }),
  program({
    id: 'prg-da',
    code: 'DATA-ANL',
    name: 'Data Analytics with Excel & Power BI',
    description: 'Turn messy spreadsheets into clear dashboards. Hands-on lab sessions with real datasets.',
    divisionId: 'd2',
    divisionName: 'Data & Technology',
    level: 'Foundational',
    deliveryMode: 'in-person',
    durationWeeks: 8,
    totalHours: 48,
    courseIds: ['t3', 't4'],
    price: 15000,
    minAttendance: 75,
    credentialType: 'Certificate of Completion',
    certificateTemplateId: 'tpl-tech',
    skills: ['Excel', 'Pivot tables', 'Power BI', 'Data cleaning'],
  }),
  program({
    id: 'prg-ld',
    code: 'LEAD-SUP',
    name: 'Leadership & Supervisory Skills',
    description: 'For new and aspiring supervisors: set expectations, delegate, coach and give feedback that helps.',
    divisionId: 'd3',
    divisionName: 'Leadership & People',
    level: 'Intermediate',
    deliveryMode: 'in-person',
    durationWeeks: 4,
    totalHours: 24,
    courseIds: ['t5', 't6'],
    price: 9500,
    minAttendance: 80,
    credentialType: 'Certificate of Completion',
    certificateTemplateId: 'tpl-emerald',
    skills: ['Delegation', 'Coaching', 'Feedback'],
  }),
  program({
    id: 'prg-open',
    code: 'OPEN-XL',
    name: 'Excel Essentials Open Day',
    description: 'A free half-day online taster: clean data, lookups and pivot tables.',
    divisionId: 'd2',
    divisionName: 'Data & Technology',
    level: 'Foundational',
    deliveryMode: 'online',
    durationWeeks: 1,
    totalHours: 4,
    courseIds: ['t3'],
    price: 0,
    minAttendance: 0,
    credentialType: 'Certificate of Attendance',
    certificateTemplateId: 'tpl-minimal',
    skills: ['Excel'],
  }),
]

function cohort(c: Omit<Cohort, 'createdAt' | 'updatedAt' | 'status'> & { status?: Cohort['status'] }): Cohort {
  return { status: 'upcoming', ...c, createdAt: STAMP, updatedAt: STAMP }
}

const cohorts: Cohort[] = [
  cohort({ id: 'coh-pm-summer', programId: 'prg-pm', name: 'PMP — Summer evening cohort', code: 'PMP-SUM', startDate: day(-70), endDate: day(-28), seatCapacity: 20, trainerId: 'apx-tr1', deliveryMode: 'hybrid', location: 'Bole Training Center, Room 2', schedule: 'Mon & Wed, 18:00–21:00', enrollmentOpen: false }),
  cohort({ id: 'coh-pm-autumn', programId: 'prg-pm', name: 'PMP — Autumn evening cohort', code: 'PMP-AUT', startDate: day(-14), endDate: day(28), seatCapacity: 20, trainerId: 'apx-tr1', deliveryMode: 'hybrid', location: 'Bole Training Center, Room 2', schedule: 'Mon & Wed, 18:00–21:00', enrollmentOpen: false }),
  cohort({ id: 'coh-pm-winter', programId: 'prg-pm', name: 'PMP — Winter weekend cohort', code: 'PMP-WIN', startDate: day(45), endDate: day(87), seatCapacity: 20, trainerId: 'apx-tr1', deliveryMode: 'hybrid', location: 'Bole Training Center, Room 2', schedule: 'Saturdays, 09:00–15:00', enrollmentOpen: true, registrationDeadline: day(40) }),
  cohort({ id: 'coh-da-7', programId: 'prg-da', name: 'Data Analytics — Cohort 7', code: 'DA-C7', startDate: day(-7), endDate: day(49), seatCapacity: 15, trainerId: 'apx-tr2', deliveryMode: 'in-person', location: 'Bole Training Center, Lab 1', schedule: 'Tue & Thu, 17:30–20:30', enrollmentOpen: true, registrationDeadline: day(7) }),
  cohort({ id: 'coh-da-8', programId: 'prg-da', name: 'Data Analytics — Cohort 8', code: 'DA-C8', startDate: day(21), endDate: day(77), seatCapacity: 15, trainerId: 'apx-tr2', deliveryMode: 'in-person', location: 'Bole Training Center, Lab 1', schedule: 'Mon & Wed, 17:30–20:30', enrollmentOpen: true, price: 13500 }),
  cohort({ id: 'coh-ld-oct', programId: 'prg-ld', name: 'Leadership — New supervisors', code: 'LEAD-NS', startDate: day(10), endDate: day(38), seatCapacity: 12, trainerId: null, deliveryMode: 'in-person', location: 'Bole Training Center, Room 1', schedule: 'Fridays, 09:00–16:00', enrollmentOpen: true }),
  cohort({ id: 'coh-open-xl', programId: 'prg-open', name: 'Excel Essentials — Open Day', code: 'OPEN-XL', startDate: day(5), endDate: day(5), seatCapacity: 100, trainerId: 'apx-tr2', deliveryMode: 'online', schedule: '09:00–13:00', meetingUrl: 'https://zoom.us/j/5550000000', enrollmentOpen: true }),
]

// ── Registrations, invoices, enrollments ─────────────────────────────────────

type Seat = { key: string; cohortId: string; status: CohortRegistration['status']; created: number; waived?: boolean; progress?: number[] }

/** progress: one value per program course, in order. */
const SEATS: Seat[] = [
  // Finished cohort: three certified, Eden finished the work but missed too many sessions.
  { key: 'L2', cohortId: 'coh-pm-summer', status: 'enrolled', created: -85, progress: [100, 100] },
  { key: 'L3', cohortId: 'coh-pm-summer', status: 'enrolled', created: -84, progress: [100, 100] },
  { key: 'L4', cohortId: 'coh-pm-summer', status: 'enrolled', created: -80, progress: [100, 100] },
  { key: 'L5', cohortId: 'coh-pm-summer', status: 'enrolled', created: -78, progress: [100, 100] },
  // Running now.
  { key: 'L1', cohortId: 'coh-pm-autumn', status: 'enrolled', created: -30, progress: [60, 0] },
  { key: 'L6', cohortId: 'coh-pm-autumn', status: 'enrolled', created: -28, progress: [100, 40] },
  { key: 'L7', cohortId: 'coh-pm-autumn', status: 'enrolled', created: -26, progress: [30, 0] },
  { key: 'L8', cohortId: 'coh-pm-autumn', status: 'enrolled', created: -25, progress: [80, 10] },
  { key: 'L9', cohortId: 'coh-pm-autumn', status: 'enrolled', created: -20, waived: true, progress: [10, 0] },
  { key: 'L10', cohortId: 'coh-pm-autumn', status: 'pending_payment', created: -2 },
  { key: 'L11', cohortId: 'coh-da-7', status: 'enrolled', created: -21, progress: [40, 0] },
  { key: 'L12', cohortId: 'coh-da-7', status: 'enrolled', created: -20, progress: [25, 0] },
  { key: 'L13', cohortId: 'coh-da-7', status: 'enrolled', created: -18, progress: [50, 0] },
  { key: 'L3', cohortId: 'coh-da-7', status: 'enrolled', created: -15, progress: [60, 0] },
  // Upcoming intakes.
  { key: 'L1', cohortId: 'coh-da-8', status: 'pending_payment', created: -1 },
  { key: 'L14', cohortId: 'coh-da-8', status: 'enrolled', created: -6, progress: [0, 0] },
  { key: 'L2', cohortId: 'coh-da-8', status: 'enrolled', created: -4, progress: [0, 0] },
  { key: 'L4', cohortId: 'coh-ld-oct', status: 'enrolled', created: -9, progress: [0, 0] },
  { key: 'L6', cohortId: 'coh-ld-oct', status: 'pending_payment', created: -3 },
  { key: 'L12', cohortId: 'coh-pm-winter', status: 'pending_payment', created: -10 },
  { key: 'L13', cohortId: 'coh-pm-winter', status: 'enrolled', created: -8, progress: [0, 0] },
  { key: 'L5', cohortId: 'coh-open-xl', status: 'enrolled', created: -3, progress: [0] },
  { key: 'L9', cohortId: 'coh-open-xl', status: 'enrolled', created: -2, progress: [0] },
  { key: 'L10', cohortId: 'coh-open-xl', status: 'enrolled', created: -1, progress: [0] },
]

function priceOf(c: Cohort): number {
  const p = programs.find((x) => x.id === c.programId)!
  return c.price != null ? c.price : p.price
}

const registrations: CohortRegistration[] = []
const payments: PaymentRecord[] = []
const enrollments: CourseEnrollment[] = []

SEATS.forEach((seat, index) => {
  const learner = L(seat.key)
  const c = cohorts.find((x) => x.id === seat.cohortId)!
  const p = programs.find((x) => x.id === c.programId)!
  const price = priceOf(c)
  const id = `reg-${seat.cohortId}-${seat.key.toLowerCase()}`
  const amount = seat.waived ? 0 : price
  const created = day(seat.created)
  const reg: CohortRegistration = {
    id,
    cohortId: c.id,
    programId: p.id,
    studentId: learner.id,
    studentName: learner.name,
    studentEmail: learner.email,
    phone: learner.phone,
    organization: learner.organization,
    status: seat.status,
    source: index % 3 === 2 ? 'admin' : 'public',
    amount,
    currency: 'ETB',
    createdAt: created,
    registeredAt: `${created}T09:${String(10 + (index % 50)).padStart(2, '0')}:00.000Z`,
  }
  if (amount > 0) {
    reg.invoiceId = `inv-${id}`
    const paid = seat.status === 'enrolled'
    const due = day(seat.created + 7)
    payments.push({
      id: reg.invoiceId,
      studentId: learner.id,
      studentName: learner.name,
      label: `${p.name} — ${c.name}`,
      amount,
      currency: 'ETB',
      dueAt: due,
      paidAt: paid ? `${day(seat.created + 1)}T11:00:00.000Z` : undefined,
      status: paid ? 'paid' : due < SEED_TODAY ? 'overdue' : 'pending',
      category: 'registration',
      term: c.name,
      campusId: 'c1',
      reference: paid ? `CHAPA-${String(482910 + index * 37)}` : undefined,
      registrationId: id,
      cohortId: c.id,
      programId: p.id,
      method: paid ? 'chapa' : undefined,
    } as PaymentRecord)
  }
  if (seat.status === 'enrolled') {
    reg.confirmedAt = `${day(seat.created + 1)}T11:00:00.000Z`
    reg.confirmedBy = seat.waived ? 'waived' : amount > 0 ? 'chapa' : 'free'
    p.courseIds.forEach((courseId, i) => {
      const course = courses.find((x) => x.id === courseId)!
      const progress = seat.progress?.[i] ?? 0
      enrollments.push({
        id: `enr-${id}-${courseId}`,
        studentId: learner.id,
        studentName: learner.name,
        courseId,
        courseCode: course.code,
        courseTitle: course.title,
        enrolledOn: day(seat.created + 1),
        status: 'active',
        progress,
        completedOn: progress >= 100 ? (c.endDate < SEED_TODAY ? day(-29) : day(-3)) : undefined,
        cohortId: c.id,
        programId: p.id,
        registrationId: id,
      })
    })
  }
  registrations.push(reg)
})

/** Tick off lessons in order so each learner's course view matches their progress. */
function lessonProgress(): Record<string, Record<string, string[]>> {
  const store: Record<string, Record<string, string[]>> = {}
  for (const e of enrollments) {
    const lessons = (courses.find((c) => c.id === e.courseId)?.modules ?? []).flatMap((m) => m.lessons.map((l) => l.id))
    const done = Math.round((Math.min(100, e.progress) / 100) * lessons.length)
    if (done) store[e.studentId] = { ...store[e.studentId], [e.courseId]: lessons.slice(0, done) }
  }
  return store
}

// ── Attendance ───────────────────────────────────────────────────────────────

const TOPICS = ['Kick-off and project charter', 'Scope and WBS', 'Scheduling and critical path', 'Cost and risk', 'Agile and Scrum', 'Sprint simulation', 'Stakeholders and communication', 'Exam preparation']

function sessionsFor(cohortId: string, offsets: number[], exceptions: Record<string, Record<number, AttendanceMark>>, topics = TOPICS): CohortSession[] {
  const c = cohorts.find((x) => x.id === cohortId)!
  const trainer = TRAINERS.find((t) => t.id === c.trainerId)
  const roster = registrations.filter((r) => r.cohortId === cohortId && r.status === 'enrolled').map((r) => r.studentId)
  return offsets.map((offset, i) => ({
    id: `att-${cohortId}-${i + 1}`,
    cohortId,
    date: day(offset),
    topic: topics[i % topics.length],
    marks: Object.fromEntries(roster.map((sid) => [sid, exceptions[sid]?.[i] ?? 'present'])),
    takenById: trainer?.id,
    takenByName: trainer?.name,
    takenAt: `${day(offset)}T21:05:00.000Z`,
  }))
}

const cohortAttendance: CohortSession[] = [
  // Eden (L5) missed half the summer sessions, so she is not certified.
  ...sessionsFor('coh-pm-summer', [-70, -68, -63, -61, -56, -54, -49, -47], {
    'apx-l5': { 2: 'absent', 3: 'absent', 5: 'absent', 6: 'absent' },
    'apx-l4': { 4: 'late' },
    'apx-l3': { 1: 'excused' },
  }),
  ...sessionsFor('coh-pm-autumn', [-14, -12, -7, -5], {
    'apx-l1': { 2: 'late' },
    'apx-l7': { 1: 'absent' },
    'apx-l9': { 0: 'absent', 2: 'absent' },
  }),
  ...sessionsFor('coh-da-7', [-7, -5], { 'apx-l12': { 1: 'absent' } }, ['Clean data and tables', 'Fixing messy data']),
]

// ── Certificates for the finished cohort ─────────────────────────────────────

function certificateId(n: number): string {
  // Fixed but random-looking IDs, in a range the other demo tenants do not use.
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
  let x = (n + 311) * 2246822519
  let out = ''
  for (let i = 0; i < 8; i++) {
    out += alphabet[x % 32]
    x = Math.floor(x / 32) + (i + 3) * 131
  }
  return `BER-CERT-${SEED_TODAY.slice(0, 4)}-${out.slice(0, 4)}-${out.slice(4)}`
}

const pm = programs.find((p) => p.id === 'prg-pm')!
const summer = cohorts.find((c) => c.id === 'coh-pm-summer')!
const certificates: CertificateRecord[] = ['L2', 'L3', 'L4'].map((key, i) => {
  const learner = L(key)
  return {
    id: `cert-apx-${key.toLowerCase()}`,
    certificateId: certificateId(i),
    studentId: learner.id,
    studentName: learner.name,
    courseId: pm.id,
    courseCode: pm.code,
    courseTitle: pm.name,
    programId: pm.id,
    cohortId: summer.id,
    cohortName: summer.name,
    totalHours: pm.totalHours,
    instructorId: 'apx-tr1',
    instructorName: 'Yonas Alemu',
    department: 'Project & Business',
    campusId: 'c1',
    completionDate: day(-29),
    issueDate: day(-27),
    templateId: 'tpl-professional',
    templateName: 'Professional Certificate',
    status: 'issued',
  }
})

// ── Assessments, live sessions, announcements ────────────────────────────────

function assessments() {
  const t1 = courses.find((c) => c.id === 't1')!
  const t4 = courses.find((c) => c.id === 't4')!
  const base = (c: CourseRecord) => ({
    courseId: c.id,
    courseCode: c.code,
    courseTitle: c.title,
    instructorId: c.instructorId ?? 'apx-tr1',
    instructorName: c.instructor,
    campusId: 'c1',
    department: c.department,
  })
  const questions: QuestionRecord[] = [
    { stem: 'The longest chain of dependent tasks in a schedule is the…', options: ['Critical path', 'Float', 'Baseline'], correctAnswer: 'Critical path' },
    { stem: 'A work breakdown structure lists deliverables, not tasks.', options: ['True', 'False'], correctAnswer: 'True' },
    { stem: 'Adding scope without more time usually needs more…', options: ['Resources or budget', 'Stakeholders', 'Meetings'], correctAnswer: 'Resources or budget' },
    { stem: 'A project is temporary and creates a unique result.', options: ['True', 'False'], correctAnswer: 'True' },
  ].map((q, i) => ({
    id: `q-pm-${i + 1}`,
    stem: q.stem,
    type: q.options.length === 2 ? ('true-false' as const) : ('mcq' as const),
    options: q.options,
    correctAnswer: q.correctAnswer,
    tags: ['project-management'],
    courseId: t1.id,
    courseCode: t1.code,
    department: t1.department,
    difficulty: 'medium' as const,
    points: 5,
    createdAt: STAMP,
  }))
  const quizzes: QuizRecord[] = [
    {
      id: 'quiz-pm-foundations',
      title: 'Project Management Foundations — check',
      ...base(t1),
      dueAt: `${day(10)}T20:00`,
      durationMinutes: 15,
      questionIds: questions.map((q) => q.id),
      status: 'published',
      maxPoints: questions.length * 5,
    },
  ]
  const assignments: AssignmentRecord[] = [
    {
      id: 'asg-da-dashboard',
      title: 'Build a sales dashboard',
      ...base(t4),
      dueAt: `${day(40)}T20:00`,
      brief: 'Use the practice sales file from the lab to build a one-page Power BI dashboard: revenue trend, sales by branch, and the top five products. Submit the .pbix file and a screenshot.',
      acceptedFormats: ['pbix', 'pdf', 'png'],
      status: 'published',
      maxPoints: 20,
    },
  ]
  return { questions, quizzes, assignments }
}

function liveSessions(): LiveSessionRecord[] {
  const t3 = courses.find((c) => c.id === 't3')!
  const t1 = courses.find((c) => c.id === 't1')!
  return [
    {
      id: 'live-da-lab',
      title: 'Lab clinic — pivot tables Q&A',
      courseId: t3.id,
      courseCode: t3.code,
      courseTitle: t3.title,
      instructorId: 'apx-tr2',
      instructorName: 'Meron Tesfaye',
      campusId: 'c1',
      department: t3.department,
      startAt: `${day(2)}T14:00:00.000Z`,
      durationMinutes: 60,
      platform: 'Zoom',
      meetingUrl: 'https://zoom.us/j/5550000001',
      status: 'upcoming',
    },
    {
      id: 'live-pm-review',
      title: 'Scheduling workshop — critical path',
      courseId: t1.id,
      courseCode: t1.code,
      courseTitle: t1.title,
      instructorId: 'apx-tr1',
      instructorName: 'Yonas Alemu',
      campusId: 'c1',
      department: t1.department,
      startAt: `${day(3)}T15:00:00.000Z`,
      durationMinutes: 90,
      platform: 'Zoom',
      meetingUrl: 'https://zoom.us/j/5550000002',
      status: 'upcoming',
    },
  ]
}

function announcements(): AnnouncementRecord[] {
  return [
    {
      id: 'ann-apx-1',
      title: 'Data Analytics Cohort 8 is open for registration',
      body: 'Seats are limited to 15 and the early price of 13,500 ETB applies to this intake. Share the registration page with colleagues who want to build dashboards.',
      authorId: 'apx-admin',
      authorName: 'Hana Wolde',
      authorRole: 'admin',
      targetRoles: ['Student', 'Instructor'],
      priority: 'important',
      postedAt: STAMP,
      createdAt: STAMP,
      views: 0,
      viewedBy: [],
    },
    {
      id: 'ann-apx-2',
      title: 'Attendance counts towards your certificate',
      body: 'Each program has a minimum attendance. Your trainer records it after every session — check your Attendance page, and tell your trainer in advance if you cannot come.',
      authorId: 'apx-admin',
      authorName: 'Hana Wolde',
      authorRole: 'admin',
      targetRoles: ['Student'],
      priority: 'normal',
      postedAt: STAMP,
      createdAt: STAMP,
      views: 0,
      viewedBy: [],
    },
  ] as AnnouncementRecord[]
}

export function buildTrainingSeedPayload(): Record<string, unknown> {
  const { questions, quizzes, assignments } = assessments()
  return {
    campuses,
    colleges,
    departments,
    people: [ADMIN, ...TRAINERS, HELPDESK, ...LEARNERS],
    courses,
    'training-programs': programs,
    cohorts,
    'cohort-registrations': registrations,
    'cohort-attendance': cohortAttendance,
    enrollments,
    payments,
    certificates,
    'lesson-progress': lessonProgress(),

    // A training institute has no academic terms or degree programs.
    'academic-years': [],
    'academic-terms': [],
    'course-offerings': [],
    programs: [],

    settings: {
      ...defaultInstitutionSettings,
      general: {
        ...(defaultInstitutionSettings as { general?: Record<string, unknown> }).general,
        name: 'Apex Training Institute',
      },
      // A program is complete when its courses are finished and passed; certified at once.
      certificates: { autoIssue: true, rule: 'both', minPercent: 60, requireApproval: false },
    },
    selectedCampus: 'all',

    attendances: [],
    reports: [],
    announcements: announcements(),
    'forum-chats': [],
    'forum-messages': [],
    'forum-read-state': {},
    'live-sessions': liveSessions(),
    assignments,
    quizzes,
    'question-bank': questions,
    'student-submissions': [],
    'help-desk-tickets': [],
    integrations: [],
    'lesson-responses': {},
    'student-settings': {},
    'instructor-settings': {},
    'staff-settings': {},
    'guardian-settings': {},
    'help-desk-settings': {},
  }
}

/**
 * Demo seed for the Corporate Edition tenant (Horizon Bank).
 *
 * The university demo (`buildSeedPayload`) is academic: colleges, programs,
 * terms, GPAs. A corporate tenant needs a different shape — departments and
 * teams instead of colleges, job roles and skills, and mandatory training with
 * due dates so the compliance engine has something real to report on.
 *
 * Deliberately built from the corporate job roles: every employee's assignments
 * come from `requiredCourseIds`, exactly as `useRequiredTraining` would create
 * them, so the demo matches what the product actually does.
 */
import {
  seedCorporateCampuses,
  seedCorporateColleges,
  seedCorporateDepartments,
} from '../../modules/corporate/data/corporateOrgSeedData'
import { buildCorporatePeopleSeed } from '../../modules/corporate/data/corporatePeopleSeedData'
import { seedCorporateCourses } from '../../modules/corporate/data/corporateCourseSeedData'
import { seedCorporateTeams } from '../../modules/corporate/data/teamsSeedData'
import { seedJobRoles } from '../../modules/corporate/data/jobRolesSeedData'
import { seedSkills } from '../../modules/corporate/data/skillsSeedData'
import { defaultInstitutionSettings } from './settingsUtils'
import { CORPORATE_COURSE_MODULES } from '../../modules/corporate/data/corporateCourseContent'
import type {
  CertificateRecord,
  CourseEnrollment,
  CourseRecord,
  PersonRow,
} from '../../modules/institution/types'
import type {
  AssignmentRecord,
  LiveSessionRecord,
  QuestionRecord,
  QuizRecord,
} from '../../modules/institution/types/assessments'
import type { Team } from '../../modules/corporate/types'
import type { AnnouncementRecord } from '../types/announcements'

/**
 * Dates are relative to when the seed is generated, not a fixed day. A hardcoded
 * date silently rots: "due in 7 days" becomes overdue, and the demo stops showing
 * the states it is meant to. Re-run `npm run export-seed` to refresh.
 */
const SEED_TODAY = new Date().toISOString().slice(0, 10)

function shiftDate(days: number): string {
  const d = new Date(`${SEED_TODAY}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** The catalog summaries carry display fields; the store keeps full course records with lessons. */
function toCourseRecords(people: PersonRow[]): CourseRecord[] {
  return seedCorporateCourses.map((course, index) => {
    const modules = CORPORATE_COURSE_MODULES[course.id] ?? []
    const trainer = people.find((p) => p.role === 'Instructor' && p.name === course.instructor)
    return {
      ...course,
      description: `${course.title} — mandatory training for ${course.department}.`,
      shortDescription: `Required training for ${course.department}.`,
      credits: 0,
      departmentId: `d${(index % 4) + 1}`,
      instructorId: trainer?.id,
      modules,
      moduleCount: modules.length,
      deliveryMode: 'Self-paced',
      certificateEnabled: true,
      certificateTemplateId: 'tpl-professional',
      createdAt: `${SEED_TODAY}T09:00:00.000Z`,
      updatedAt: `${SEED_TODAY}T09:00:00.000Z`,
    }
  }) as unknown as CourseRecord[]
}

/** Line managers for the demo teams: the manager portal needs someone to sign in as. */
const MANAGERS: PersonRow[] = [
  {
    id: 'u-mgr-1',
    name: 'Dawit Kebede',
    email: 'd.kebede@horizonbank.et',
    role: 'Manager',
    department: 'Risk & Compliance',
    departmentId: 'd3',
    campusId: 'c1',
    status: 'active',
    lastActive: '1 hour ago',
    initials: 'DK',
    verificationStatus: 'verified',
  },
  {
    id: 'u-mgr-2',
    name: 'Liya Mekonnen',
    email: 'l.mekonnen@horizonbank.et',
    role: 'Manager',
    department: 'Digital Channels',
    departmentId: 'd2',
    campusId: 'c1',
    status: 'active',
    lastActive: '3 hours ago',
    initials: 'LM',
    verificationStatus: 'verified',
  },
]

function withManagers(teams: Team[]): Team[] {
  // Dawit leads the first two teams, Liya the rest.
  return teams.map((team, i) => ({ ...team, managerId: i < 2 ? 'u-mgr-1' : 'u-mgr-2' }))
}

/** Tick off lessons in order so the learner's view matches each assignment's progress. */
function buildLessonProgress(enrollments: CourseEnrollment[], courses: CourseRecord[]): Record<string, Record<string, string[]>> {
  const store: Record<string, Record<string, string[]>> = {}
  for (const e of enrollments) {
    const course = courses.find((c) => c.id === e.courseId)
    const lessons = (course?.modules ?? []).flatMap((m) => m.lessons.map((l) => l.id))
    if (!lessons.length) continue
    const done = Math.round((Math.min(100, e.progress ?? 0) / 100) * lessons.length)
    if (!done) continue
    store[e.studentId] = { ...store[e.studentId], [e.courseId]: lessons.slice(0, done) }
  }
  return store
}

/** Fixed-but-random-looking IDs, so the seed is reproducible. */
function seedCertificateId(n: number): string {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
  let x = (n + 7) * 2654435761
  let out = ''
  for (let i = 0; i < 8; i++) {
    out += alphabet[x % 32]
    x = Math.floor(x / 32) + (i + 1) * 97
  }
  return `BER-CERT-${SEED_TODAY.slice(0, 4)}-${out.slice(0, 4)}-${out.slice(4)}`
}

function addMonths(isoDate: string, months: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + months)
  return d.toISOString().slice(0, 10)
}

/** Completed training earns a certification that expires with the job role's interval. */
function buildCertifications(enrollments: CourseEnrollment[], people: PersonRow[], courses: CourseRecord[]): CertificateRecord[] {
  return enrollments
    .filter((e) => (e.progress ?? 0) >= 100 && e.completedOn)
    .map((e, i) => {
      const person = people.find((p) => p.id === e.studentId)
      const role = seedJobRoles.find((r) => r.id === person?.jobRoleId)
      const course = courses.find((c) => c.id === e.courseId)
      const months = role?.recertificationMonths ?? 0
      return {
        id: `cert-${e.id}`,
        certificateId: seedCertificateId(i),
        studentId: e.studentId,
        studentName: e.studentName,
        courseId: e.courseId,
        courseCode: e.courseCode,
        courseTitle: e.courseTitle,
        instructorId: course?.instructorId,
        instructorName: course?.instructor ?? 'Learning team',
        department: person?.department ?? '',
        campusId: person?.campusId ?? 'c1',
        completionDate: e.completedOn,
        issueDate: e.completedOn,
        expirationDate: months ? addMonths(e.completedOn as string, months) : undefined,
        templateId: 'tpl-professional',
        templateName: 'Professional Certificate',
        status: 'issued' as const,
      }
    })
}

function buildAssessments(courses: CourseRecord[]) {
  const aml = courses.find((c) => c.id === 'c1')!
  const fraud = courses.find((c) => c.id === 'c4')!
  const base = (c: CourseRecord) => ({
    courseId: c.id,
    courseCode: c.code,
    courseTitle: c.title,
    instructorId: c.instructorId ?? 'u2',
    instructorName: c.instructor ?? 'Sara Tadesse',
    campusId: 'c1',
    department: c.department,
  })
  const questions: QuestionRecord[] = [
    { stem: 'Which stage of money laundering hides the audit trail?', options: ['Placement', 'Layering', 'Integration'], correctAnswer: 'Layering' },
    { stem: 'Splitting cash into deposits just under the reporting limit is called:', options: ['Structuring', 'Smurfing prevention', 'Netting'], correctAnswer: 'Structuring' },
    { stem: 'You may tell a customer that you have filed a suspicious activity report.', options: ['True', 'False'], correctAnswer: 'False' },
    { stem: 'A politically exposed person requires enhanced due diligence.', options: ['True', 'False'], correctAnswer: 'True' },
  ].map((q, i) => ({
    id: `q-aml-${i + 1}`,
    stem: q.stem,
    type: q.options.length === 2 ? ('true-false' as const) : ('mcq' as const),
    options: q.options,
    correctAnswer: q.correctAnswer,
    tags: ['aml'],
    courseId: aml.id,
    courseCode: aml.code,
    department: aml.department,
    difficulty: 'medium' as const,
    points: 5,
    createdAt: `${SEED_TODAY}T09:00:00.000Z`,
  }))
  const quizzes: QuizRecord[] = [
    {
      id: 'quiz-aml-final',
      title: 'AML & KYC — final assessment',
      ...base(aml),
      dueAt: `${shiftDate(21)}T17:00`,
      durationMinutes: 15,
      questionIds: questions.map((q) => q.id),
      status: 'published',
      maxPoints: questions.length * 5,
    },
  ]
  const assignments: AssignmentRecord[] = [
    {
      id: 'asg-fraud-case',
      title: 'Fraud case review',
      ...base(fraud),
      dueAt: `${shiftDate(14)}T17:00`,
      brief:
        'Read the attached scenario of a suspected authorised push-payment scam. In one page, list the red flags you see and the steps you would take at the counter.',
      acceptedFormats: ['pdf', 'docx'],
      status: 'published',
      maxPoints: 20,
    },
  ]
  return { questions, quizzes, assignments }
}

function buildAnnouncements(): AnnouncementRecord[] {
  const now = `${SEED_TODAY}T08:00:00.000Z`
  return [
    {
      id: 'ann-corp-1',
      title: 'Annual AML refresher is now open',
      body: 'Everyone in customer-facing roles must complete AML & KYC by the due date shown in your training. Managers can see their team’s progress in the manager portal.',
      authorId: 'u3',
      authorName: 'Martha Bekele',
      authorRole: 'admin',
      targetRoles: ['Student', 'Manager'],
      priority: 'important',
      postedAt: now,
      createdAt: now,
      views: 0,
      viewedBy: [],
    },
    {
      id: 'ann-corp-2',
      title: 'New phishing simulation next month',
      body: 'IT & Security will run a phishing simulation. Report anything suspicious using the “Report phishing” button — that is exactly what we want to see.',
      authorId: 'u3',
      authorName: 'Martha Bekele',
      authorRole: 'admin',
      targetRoles: ['Student', 'Instructor', 'Manager', 'Staff'],
      priority: 'normal',
      postedAt: now,
      createdAt: now,
      views: 0,
      viewedBy: [],
    },
  ] as AnnouncementRecord[]
}

function buildLiveSessions(courses: CourseRecord[]): LiveSessionRecord[] {
  const cyber = courses.find((c) => c.id === 'c2')!
  return [
    {
      id: 'live-cyber-qa',
      title: 'Cybersecurity awareness — live Q&A',
      courseId: cyber.id,
      courseCode: cyber.code,
      courseTitle: cyber.title,
      instructorId: cyber.instructorId ?? 'u6',
      instructorName: cyber.instructor ?? 'Mekonnen Alemu',
      campusId: 'c1',
      department: cyber.department,
      startAt: `${shiftDate(3)}T10:00:00.000Z`,
      durationMinutes: 45,
      platform: 'Microsoft Teams',
      meetingUrl: 'https://teams.microsoft.com/l/meetup-join/horizon-demo',
      status: 'upcoming',
    },
  ]
}

type TrainingState = 'done' | 'due-soon' | 'in-progress' | 'overdue' | 'expired'

/**
 * Each employee gets a profile rather than a random mix, so the compliance page
 * shows one clear example of every state: fully compliant, something due shortly,
 * something late, and a certification that has expired.
 *
 * The first course in a profile applies to the employee's first required course,
 * the second to the next, and the last entry repeats for any remaining ones.
 */
const EMPLOYEE_PROFILES: TrainingState[][] = [
  ['done', 'done', 'done'], // fully compliant
  ['done', 'due-soon', 'in-progress'], // on track, something due shortly
  ['done', 'overdue'], // late
  ['expired', 'done'], // recertification due
  ['in-progress', 'overdue', 'due-soon'], // mixed, needs attention
]

function buildCorporateEnrollments(
  people: PersonRow[],
  courses: CourseRecord[],
): CourseEnrollment[] {
  const rows: CourseEnrollment[] = []
  const employees = people.filter((p) => p.role === 'Student' && p.status === 'active')

  employees.forEach((person, personIndex) => {
    const role = seedJobRoles.find((r) => r.id === person.jobRoleId)
    if (!role) return
    const profile = EMPLOYEE_PROFILES[personIndex % EMPLOYEE_PROFILES.length]

    role.requiredCourseIds.forEach((courseId, courseIndex) => {
      const course = courses.find((c) => c.id === courseId)
      if (!course) return

      const state = profile[Math.min(courseIndex, profile.length - 1)]
      const base: Omit<CourseEnrollment, 'progress' | 'dueDate' | 'completedOn'> = {
        id: `enr-${person.id}-${courseId}`,
        studentId: person.id,
        studentName: person.name,
        courseId: course.id,
        courseCode: course.code,
        courseTitle: course.title,
        enrolledOn: shiftDate(-60),
        status: 'active',
        isMandatory: true,
        assignedBy: 'Job role',
      }

      switch (state) {
        case 'done':
          rows.push({ ...base, progress: 100, completedOn: shiftDate(-20), dueDate: shiftDate(-5) })
          break
        case 'due-soon':
          rows.push({ ...base, progress: 45, dueDate: shiftDate(5) })
          break
        case 'in-progress':
          rows.push({ ...base, progress: 60, dueDate: shiftDate(25) })
          break
        case 'overdue':
          rows.push({ ...base, progress: 20, dueDate: shiftDate(-12) })
          break
        case 'expired':
          // Completed over a year ago, so an annual recertification is due.
          rows.push({
            ...base,
            enrolledOn: shiftDate(-430),
            progress: 100,
            completedOn: shiftDate(-400),
            dueDate: shiftDate(-380),
          })
          break
      }
    })
  })

  return rows
}

/**
 * The roster includes the shared demo student, who arrives with no corporate
 * fields. Give every employee a job role, team and department so nobody shows up
 * on the compliance page as untracked.
 */
function withCorporatePlacement(people: PersonRow[]): PersonRow[] {
  const roles = seedJobRoles.filter((r) => r.status === 'active')
  const teams = seedCorporateTeams
  let cursor = 0
  return people.map((raw) => {
    // The shared demo learner gets a bank address, so the same email never exists in two tenants.
    const person = raw.email.endsWith('@student.berana.edu')
      ? { ...raw, email: raw.email.replace('@student.berana.edu', '@horizonbank.et') }
      : raw
    if (person.role !== 'Student' || person.jobRoleId) return person
    const role = roles[cursor % roles.length]
    const team = teams[cursor % teams.length]
    cursor += 1
    return {
      ...person,
      jobRoleId: role.id,
      teamId: person.teamId ?? team.id,
      departmentId: person.departmentId ?? role.departmentId,
      department: person.department || 'Retail Banking',
    }
  })
}

export function buildCorporateSeedPayload(): Record<string, unknown> {
  const people = [...withCorporatePlacement(buildCorporatePeopleSeed()), ...MANAGERS]
  const courses = toCourseRecords(people)
  const enrollments = buildCorporateEnrollments(people, courses)
  const { questions, quizzes, assignments } = buildAssessments(courses)

  return {
    // Organization: branches and departments, no academic hierarchy.
    campuses: seedCorporateCampuses,
    colleges: seedCorporateColleges,
    departments: seedCorporateDepartments,
    teams: withManagers(seedCorporateTeams),
    'job-roles': seedJobRoles,
    skills: seedSkills,

    people,
    courses,
    enrollments,

    // Academic structures stay empty — a company has no terms or programs.
    'academic-years': [],
    'academic-terms': [],
    'course-offerings': [],
    programs: [],

    settings: {
      ...defaultInstitutionSettings,
      general: {
        ...(defaultInstitutionSettings as { general?: Record<string, unknown> }).general,
        name: 'Horizon Bank',
      },
      // Training is complete when it is finished; certifications need no approval.
      certificates: { autoIssue: true, rule: 'lessons', minPercent: 50, requireApproval: false },
    },
    selectedCampus: 'all',

    certificates: buildCertifications(enrollments, people, courses),
    'lesson-progress': buildLessonProgress(enrollments, courses),
    attendances: [],
    reports: [],
    announcements: buildAnnouncements(),
    'forum-chats': [],
    'forum-messages': [],
    'forum-read-state': {},
    'live-sessions': buildLiveSessions(courses),
    assignments,
    quizzes,
    'question-bank': questions,
    'student-submissions': [],
    // Employees are not billed for their own training.
    payments: [],
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

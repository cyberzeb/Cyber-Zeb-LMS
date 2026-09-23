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
import type { CourseEnrollment, CourseRecord, PersonRow } from '../../modules/institution/types'

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

/** The catalog summaries carry display fields; the store keeps full course records. */
function toCourseRecords(): CourseRecord[] {
  return seedCorporateCourses.map((course, index) => ({
    ...course,
    description: `${course.title} — mandatory training for ${course.department}.`,
    credits: 0,
    departmentId: `d${(index % 4) + 1}`,
    instructorId: undefined,
    createdAt: `${SEED_TODAY}T09:00:00.000Z`,
    updatedAt: `${SEED_TODAY}T09:00:00.000Z`,
  })) as unknown as CourseRecord[]
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
  return people.map((person) => {
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
  const people = withCorporatePlacement(buildCorporatePeopleSeed())
  const courses = toCourseRecords()
  const enrollments = buildCorporateEnrollments(people, courses)

  return {
    // Organization: branches and departments, no academic hierarchy.
    campuses: seedCorporateCampuses,
    colleges: seedCorporateColleges,
    departments: seedCorporateDepartments,
    teams: seedCorporateTeams,
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
    },
    selectedCampus: 'all',

    certificates: [],
    attendances: [],
    reports: [],
    announcements: [],
    'forum-chats': [],
    'forum-messages': [],
    'forum-read-state': {},
    'live-sessions': [],
    assignments: [],
    quizzes: [],
    'question-bank': [],
    'student-submissions': [],
    // Employees are not billed for their own training.
    payments: [],
    'help-desk-tickets': [],
    integrations: [],
    'lesson-progress': {},
    'lesson-responses': {},
    'student-settings': {},
    'instructor-settings': {},
    'staff-settings': {},
    'guardian-settings': {},
    'help-desk-settings': {},
  }
}

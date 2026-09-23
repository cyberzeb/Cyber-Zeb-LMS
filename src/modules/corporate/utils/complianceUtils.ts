/**
 * Corporate compliance: what training each employee owes, what is late, and what
 * needs taking again.
 *
 * The chain is Job role → required training → assignment → completion →
 * recertification. A job role names the courses its holders must complete;
 * assigning them creates mandatory enrollments with a due date, and a completed
 * course expires again after the role's recertification interval.
 */
import type { CourseEnrollment, PersonRow } from '../../institution/types'
import type {
  ComplianceAlert,
  ComplianceStatus,
  EmployeeComplianceRow,
  JobRole,
} from '../types'
import {
  readCourses,
  readEnrollments,
  readPeople,
  readJobRoles,
} from '../../../shared/storage/readers'

/** Default window an employee gets to finish newly assigned training. */
export const DEFAULT_TRAINING_DUE_DAYS = 30
/** Training due within this many days is flagged before it goes overdue. */
export const DUE_SOON_DAYS = 14
/** A certification within this many days of expiry is flagged for renewal. */
export const EXPIRING_SOON_DAYS = 30

const today = () => new Date().toISOString().slice(0, 10)

const toDateOnly = (value: string) => value.slice(0, 10)

function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${toDateOnly(from)}T00:00:00Z`)
  const b = Date.parse(`${toDateOnly(to)}T00:00:00Z`)
  if (Number.isNaN(a) || Number.isNaN(b)) return 0
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${toDateOnly(isoDate)}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function addMonths(isoDate: string, months: number): string {
  const d = new Date(`${toDateOnly(isoDate)}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + months)
  return d.toISOString().slice(0, 10)
}

export function isEnrollmentComplete(enrollment: CourseEnrollment): boolean {
  return enrollment.progress >= 100
}

export function isEnrollmentOverdue(enrollment: CourseEnrollment): boolean {
  if (enrollment.status === 'withdrawn' || isEnrollmentComplete(enrollment)) return false
  if (enrollment.dueDate) return toDateOnly(enrollment.dueDate) < today()
  if (enrollment.isMandatory) {
    // No explicit due date: fall back to the default window from assignment.
    return daysBetween(enrollment.enrolledOn, today()) > DEFAULT_TRAINING_DUE_DAYS * 3
  }
  return false
}

/** Assigned, incomplete, and due within DUE_SOON_DAYS (but not yet overdue). */
export function isEnrollmentDueSoon(enrollment: CourseEnrollment): boolean {
  if (enrollment.status === 'withdrawn' || isEnrollmentComplete(enrollment)) return false
  if (!enrollment.dueDate) return false
  const days = daysBetween(today(), enrollment.dueDate)
  return days >= 0 && days <= DUE_SOON_DAYS
}

/**
 * When a completed course stops counting. Returns null when the role does not
 * require recertification, or the completion date is unknown.
 */
export function recertificationDueDate(
  enrollment: CourseEnrollment,
  role: JobRole | undefined,
): string | null {
  const months = role?.recertificationMonths ?? 0
  if (!months || months <= 0) return null
  if (!isEnrollmentComplete(enrollment)) return null
  const completedOn = enrollment.completedOn || enrollment.enrolledOn
  if (!completedOn) return null
  return addMonths(completedOn, months)
}

/** True when a completed course is past its recertification date, or nearly so. */
export function needsRecertification(
  enrollment: CourseEnrollment,
  role: JobRole | undefined,
): boolean {
  const due = recertificationDueDate(enrollment, role)
  if (!due) return false
  return daysBetween(today(), due) <= EXPIRING_SOON_DAYS
}

export function getRequiredCourseIdsForEmployee(
  person: PersonRow,
  jobRoles: JobRole[],
): string[] {
  const role = person.jobRoleId
    ? jobRoles.find((r) => r.id === person.jobRoleId)
    : undefined
  return role?.requiredCourseIds ?? []
}

export function buildEmployeeComplianceRows(
  people: PersonRow[] = readPeople().filter(
    (p) => p.role === 'Student' && p.status === 'active',
  ),
  enrollments: CourseEnrollment[] = readEnrollments(),
  jobRoles: JobRole[] = readJobRoles(),
): EmployeeComplianceRow[] {
  return people.map((person) => {
    const role = person.jobRoleId
      ? jobRoles.find((r) => r.id === person.jobRoleId)
      : undefined
    const requiredCourseIds = getRequiredCourseIdsForEmployee(person, jobRoles)
    const personEnrollments = enrollments.filter(
      (e) => e.studentId === person.id && e.status !== 'withdrawn',
    )
    const mandatoryEnrollments = personEnrollments.filter((e) => e.isMandatory !== false)

    const assignedCourseIds = new Set(personEnrollments.map((e) => e.courseId))
    const missingAssignments = requiredCourseIds.filter(
      (id) => !assignedCourseIds.has(id),
    ).length

    const requiredTraining = Math.max(requiredCourseIds.length, mandatoryEnrollments.length)
    const expiringTraining = personEnrollments.filter((e) =>
      needsRecertification(e, role),
    ).length
    // An expired certification no longer counts as complete.
    const completedTraining = personEnrollments.filter(
      (e) => isEnrollmentComplete(e) && !needsRecertification(e, role),
    ).length
    const overdueTraining = personEnrollments.filter(isEnrollmentOverdue).length
    const dueSoonTraining = personEnrollments.filter(isEnrollmentDueSoon).length

    let compliancePercent = 100
    if (requiredTraining > 0) {
      compliancePercent = Math.round((completedTraining / requiredTraining) * 100)
    } else if (mandatoryEnrollments.length > 0) {
      const done = mandatoryEnrollments.filter(isEnrollmentComplete).length
      compliancePercent = Math.round((done / mandatoryEnrollments.length) * 100)
    }

    let status: ComplianceStatus = 'compliant'
    if (requiredTraining === 0 && mandatoryEnrollments.length === 0) {
      status = 'not-assigned'
    } else if (overdueTraining > 0) {
      status = 'overdue'
    } else if (expiringTraining > 0) {
      status = 'expiring'
    } else if (compliancePercent < 80 || missingAssignments > 0) {
      status = 'at-risk'
    }

    return {
      employeeId: person.id,
      employeeName: person.name,
      department: person.department,
      jobRoleId: role?.id,
      jobRoleTitle: role?.title ?? '—',
      requiredTraining,
      completedTraining,
      overdueTraining,
      dueSoonTraining,
      expiringTraining,
      missingAssignments,
      compliancePercent,
      status,
    }
  })
}

export function computeOrganizationComplianceRate(rows: EmployeeComplianceRow[]): number {
  const tracked = rows.filter((r) => r.status !== 'not-assigned')
  if (tracked.length === 0) return 100
  const compliant = tracked.filter((r) => r.status === 'compliant').length
  return Math.round((compliant / tracked.length) * 100)
}

export function countOverdueEnrollments(
  enrollments: CourseEnrollment[] = readEnrollments(),
): number {
  return enrollments.filter(
    (e) => e.status !== 'withdrawn' && isEnrollmentOverdue(e),
  ).length
}

/**
 * Everything that needs someone's attention, newest deadline first: training
 * that is late, training due shortly, certifications about to expire, and
 * required training that was never assigned.
 */
export function buildComplianceAlerts(
  people: PersonRow[] = readPeople().filter(
    (p) => p.role === 'Student' && p.status === 'active',
  ),
  enrollments: CourseEnrollment[] = readEnrollments(),
  jobRoles: JobRole[] = readJobRoles(),
  courses = readCourses(),
): ComplianceAlert[] {
  const alerts: ComplianceAlert[] = []
  const courseTitle = (id: string) =>
    courses.find((c) => c.id === id)?.title ?? id

  for (const person of people) {
    const role = person.jobRoleId
      ? jobRoles.find((r) => r.id === person.jobRoleId)
      : undefined
    const personEnrollments = enrollments.filter(
      (e) => e.studentId === person.id && e.status !== 'withdrawn',
    )

    for (const enrollment of personEnrollments) {
      if (isEnrollmentOverdue(enrollment)) {
        alerts.push({
          employeeId: person.id,
          employeeName: person.name,
          courseId: enrollment.courseId,
          courseTitle: enrollment.courseTitle || courseTitle(enrollment.courseId),
          kind: 'overdue',
          date: enrollment.dueDate,
          daysFromNow: enrollment.dueDate ? daysBetween(today(), enrollment.dueDate) : undefined,
        })
        continue
      }
      if (isEnrollmentDueSoon(enrollment)) {
        alerts.push({
          employeeId: person.id,
          employeeName: person.name,
          courseId: enrollment.courseId,
          courseTitle: enrollment.courseTitle || courseTitle(enrollment.courseId),
          kind: 'due-soon',
          date: enrollment.dueDate,
          daysFromNow: enrollment.dueDate ? daysBetween(today(), enrollment.dueDate) : undefined,
        })
        continue
      }
      const recertDue = recertificationDueDate(enrollment, role)
      if (recertDue && daysBetween(today(), recertDue) <= EXPIRING_SOON_DAYS) {
        alerts.push({
          employeeId: person.id,
          employeeName: person.name,
          courseId: enrollment.courseId,
          courseTitle: enrollment.courseTitle || courseTitle(enrollment.courseId),
          kind: 'recertification',
          date: recertDue,
          daysFromNow: daysBetween(today(), recertDue),
        })
      }
    }

    const assigned = new Set(personEnrollments.map((e) => e.courseId))
    for (const courseId of role?.requiredCourseIds ?? []) {
      if (assigned.has(courseId)) continue
      alerts.push({
        employeeId: person.id,
        employeeName: person.name,
        courseId,
        courseTitle: courseTitle(courseId),
        kind: 'unassigned',
      })
    }
  }

  const order: Record<ComplianceAlert['kind'], number> = {
    overdue: 0,
    unassigned: 1,
    'due-soon': 2,
    recertification: 3,
  }
  return alerts.sort(
    (a, b) =>
      order[a.kind] - order[b.kind] ||
      (a.daysFromNow ?? 0) - (b.daysFromNow ?? 0) ||
      a.employeeName.localeCompare(b.employeeName),
  )
}

/**
 * The enrollments that would be created to bring one employee up to date:
 * required training they have never been assigned, plus any certification that
 * has expired and must be taken again.
 *
 * Pure — it returns rows for the caller to persist.
 */
export function assignRequiredTrainingForRole(
  person: PersonRow,
  jobRole: JobRole,
  courses = readCourses(),
  existingEnrollments: CourseEnrollment[] = readEnrollments(),
): CourseEnrollment[] {
  const dueDays = jobRole.trainingDueDays ?? DEFAULT_TRAINING_DUE_DAYS
  const newEnrollments: CourseEnrollment[] = []

  for (const courseId of jobRole.requiredCourseIds) {
    const current = existingEnrollments.find(
      (e) => e.studentId === person.id && e.courseId === courseId && e.status !== 'withdrawn',
    )
    // Already assigned and still valid — nothing to do.
    if (current && !needsRecertification(current, jobRole)) continue

    const course = courses.find((c) => c.id === courseId)
    if (!course) continue

    newEnrollments.push({
      // Recertification creates a fresh round, so the id carries the date.
      id: `enr-${person.id}-${courseId}-${today()}`,
      studentId: person.id,
      studentName: person.name,
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      enrolledOn: today(),
      status: 'active',
      progress: 0,
      isMandatory: true,
      dueDate: addDays(today(), dueDays),
      assignedBy: 'Job role',
    })
  }
  return newEnrollments
}

/** Every employee holding this job role. */
export function employeesInRole(roleId: string, people: PersonRow[]): PersonRow[] {
  return people.filter(
    (p) => p.role === 'Student' && p.status === 'active' && p.jobRoleId === roleId,
  )
}

import type { CourseEnrollment, PersonRow } from '../../institution/types'
import type { JobRole } from '../types'
import type { ComplianceStatus, EmployeeComplianceRow } from '../types'
import {
  readCourses,
  readEnrollments,
  readPeople,
  readJobRoles,
} from '../../../shared/storage/readers'

const today = () => new Date().toISOString().slice(0, 10)

export function isEnrollmentOverdue(enrollment: CourseEnrollment): boolean {
  if (enrollment.status === 'withdrawn' || enrollment.progress >= 100) return false
  if (enrollment.dueDate && enrollment.dueDate < today()) return true
  if (enrollment.isMandatory && enrollment.progress < 100) {
    const enrolled = new Date(enrollment.enrolledOn)
    const daysSince = (Date.now() - enrolled.getTime()) / (1000 * 60 * 60 * 24)
    return daysSince > 90
  }
  return false
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
    const requiredTraining = Math.max(requiredCourseIds.length, mandatoryEnrollments.length)
    const completedTraining = personEnrollments.filter((e) => e.progress >= 100).length
    const overdueTraining = personEnrollments.filter(isEnrollmentOverdue).length

    let compliancePercent = 100
    if (requiredTraining > 0) {
      compliancePercent = Math.round((completedTraining / requiredTraining) * 100)
    } else if (mandatoryEnrollments.length > 0) {
      const done = mandatoryEnrollments.filter((e) => e.progress >= 100).length
      compliancePercent = Math.round((done / mandatoryEnrollments.length) * 100)
    }

    let status: ComplianceStatus = 'compliant'
    if (requiredTraining === 0 && mandatoryEnrollments.length === 0) {
      status = 'not-assigned'
    } else if (overdueTraining > 0) {
      status = 'overdue'
    } else if (compliancePercent < 80) {
      status = 'at-risk'
    }

    return {
      employeeId: person.id,
      employeeName: person.name,
      department: person.department,
      jobRoleTitle: role?.title ?? '—',
      requiredTraining,
      completedTraining,
      overdueTraining,
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

export function assignRequiredTrainingForRole(
  person: PersonRow,
  jobRole: JobRole,
  courses = readCourses(),
  existingEnrollments: CourseEnrollment[] = readEnrollments(),
): CourseEnrollment[] {
  const newEnrollments: CourseEnrollment[] = []
  for (const courseId of jobRole.requiredCourseIds) {
    const exists = existingEnrollments.some(
      (e) => e.studentId === person.id && e.courseId === courseId && e.status !== 'withdrawn',
    )
    if (exists) continue
    const course = courses.find((c) => c.id === courseId)
    if (!course) continue
    const due = new Date()
    due.setDate(due.getDate() + 30)
    newEnrollments.push({
      id: `enr-${person.id}-${courseId}`,
      studentId: person.id,
      studentName: person.name,
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      enrolledOn: today(),
      status: 'active',
      progress: 0,
      isMandatory: true,
      dueDate: due.toISOString().slice(0, 10),
      assignedBy: 'HR',
    })
  }
  return newEnrollments
}

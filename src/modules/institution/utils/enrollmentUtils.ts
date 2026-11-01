import type { CourseEnrollment, CourseRecord, Department, PersonRow, ProgramRow } from '../types'
import type { CourseOfferingRecord } from '../types/academic'
import { isEnrollableOffering } from './offeringUtils'
import { resolveOfferingProgramId, resolveStudentProgram, studentProgramName } from './programUtils'
import {
  resolveStudentDepartmentId,
  resolveStudentProgramSemester,
} from './studyYearUtils'

export function syncCourseEnrollmentCounts(
  courses: CourseRecord[],
  enrollments: CourseEnrollment[],
): CourseRecord[] {
  return courses.map((course) => ({
    ...course,
    enrolledCount: enrollments.filter(
      (e) => e.courseId === course.id && e.status === 'active',
    ).length,
  }))
}

export function isEnrollableStudent(status: string): boolean {
  return status === 'active' || status === 'invited'
}

export function isEnrollableCourse(course: CourseRecord): boolean {
  return course.status !== 'archived'
}

export function isAlreadyEnrolled(
  enrollments: CourseEnrollment[],
  studentId: string,
  offering: CourseOfferingRecord,
): boolean {
  return enrollments.some(
    (e) =>
      e.studentId === studentId &&
      e.status === 'active' &&
      (e.courseOfferingId === offering.id ||
        (!e.courseOfferingId && e.courseId === offering.courseId)),
  )
}

/** Students of one program in one year/semester slot (the cohort a section serves). */
export function getStudentsForProgramSlot(
  students: PersonRow[],
  programId: string,
  studyYear: number,
  programSemester: number,
  programs: ProgramRow[],
  departments: Department[],
): PersonRow[] {
  return students.filter((student) => {
    if (student.role !== 'Student' || !isEnrollableStudent(student.status)) return false
    if (resolveStudentProgram(student, programs, departments)?.id !== programId) return false
    if ((student.studyYear ?? 1) !== studyYear) return false
    return resolveStudentProgramSemester(student) === programSemester
  })
}

/** Sections that serve one program's year/semester slot. */
export function getOfferingsForProgramSlot(
  offerings: CourseOfferingRecord[],
  programId: string,
  studyYear: number,
  programSemester: number,
  programs: ProgramRow[],
): CourseOfferingRecord[] {
  return offerings.filter(
    (offering) =>
      isEnrollableOffering(offering) &&
      resolveOfferingProgramId(offering, programs) === programId &&
      offering.studyYear === studyYear &&
      (offering.programSemester ?? 1) === programSemester,
  )
}

/** Demo seeding only: students of a department slot, before programs exist. */
export function getStudentsForDepartmentSlot(
  students: PersonRow[],
  departmentId: string,
  studyYear: number,
  programSemester: number,
  departments: Department[],
): PersonRow[] {
  return students.filter((student) => {
    if (student.role !== 'Student' || !isEnrollableStudent(student.status)) return false
    const deptId = resolveStudentDepartmentId(student, departments)
    if (deptId !== departmentId) return false
    if ((student.studyYear ?? 1) !== studyYear) return false
    return resolveStudentProgramSemester(student) === programSemester
  })
}

/** Demo seeding only: sections of a department slot, before programs exist. */
export function getOfferingsForDepartmentSlot(
  offerings: CourseOfferingRecord[],
  departmentId: string,
  studyYear: number,
  programSemester: number,
): CourseOfferingRecord[] {
  return offerings.filter(
    (offering) =>
      isEnrollableOffering(offering) &&
      offering.departmentId === departmentId &&
      offering.studyYear === studyYear &&
      (offering.programSemester ?? 1) === programSemester,
  )
}

export interface BulkEnrollCohortResult {
  enrolled: number
  skipped: number
  capacityBlocked: number
  offeringsProcessed: number
  studentsInCohort: number
}

export function buildCohortEnrollmentRows(
  students: PersonRow[],
  offerings: CourseOfferingRecord[],
  existingEnrollments: CourseEnrollment[],
): { rows: Omit<CourseEnrollment, 'id'>[]; result: BulkEnrollCohortResult } {
  const rows: Omit<CourseEnrollment, 'id'>[] = []
  const pendingKeys = new Set<string>()
  let skipped = 0
  let capacityBlocked = 0
  const offeringAdds = new Map<string, number>()

  const activeCountForOffering = (offeringId: string) =>
    existingEnrollments.filter((e) => e.status === 'active' && e.courseOfferingId === offeringId)
      .length + (offeringAdds.get(offeringId) ?? 0)

  for (const offering of offerings) {
    for (const student of students) {
      const key = `${student.id}:${offering.id}`
      if (
        isAlreadyEnrolled(existingEnrollments, student.id, offering) ||
        pendingKeys.has(key)
      ) {
        skipped += 1
        continue
      }

      if (offering.maxEnrollment && activeCountForOffering(offering.id) >= offering.maxEnrollment) {
        capacityBlocked += 1
        continue
      }

      rows.push({
        studentId: student.id,
        studentName: student.name,
        courseId: offering.courseId,
        courseCode: offering.courseCode,
        courseTitle: offering.courseTitle,
        courseOfferingId: offering.id,
        program: studentProgramName(student),
        campus: student.campusId,
        enrolledOn: new Date().toISOString(),
        status: 'active',
        progress: 0,
      })
      pendingKeys.add(key)
      offeringAdds.set(offering.id, (offeringAdds.get(offering.id) ?? 0) + 1)
    }
  }

  return {
    rows,
    result: {
      enrolled: rows.length,
      skipped,
      capacityBlocked,
      offeringsProcessed: offerings.length,
      studentsInCohort: students.length,
    },
  }
}

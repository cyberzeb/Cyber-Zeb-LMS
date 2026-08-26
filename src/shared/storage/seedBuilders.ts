import type { CourseEnrollment, CourseRecord, PersonRow } from '../../modules/institution/types'
import { seedCourses } from '../../modules/institution/data/courseSeedData'
import { buildCourseOfferingsFromCatalog } from '../../modules/institution/data/academicSeedData'
import { seedDepartments } from '../../modules/institution/data/orgSeedData'
import { seedPeople } from '../../modules/institution/data/peopleSeedData'
import {
  buildCohortEnrollmentRows,
  getOfferingsForProgramSlot,
  getStudentsForProgramSlot,
  isEnrollableStudent,
} from '../../modules/institution/utils/enrollmentUtils'
import { createId } from '../hooks/useLocalStorageState'

const INSTRUCTOR_IDS: Record<string, string> = {
  'Dr. Aaron Selassie': 'u2',
  'Prof. Elias Hailu': 'u6',
  'Dr. Martha Bekele': 'u3',
  'Kidist Yohannes': 'u7',
}

export function seedCourseRecords(): CourseRecord[] {
  return seedCourses
    .filter((course) => course.status === 'published')
    .map((course) => ({
      ...course,
      approvalStatus: 'approved' as const,
      instructorId: INSTRUCTOR_IDS[course.instructor],
      discussionForumEnabled: true,
      allowSelfEnrollment: false,
      certificateEnabled: true,
      visibility: 'private' as const,
    }))
}

function seedProgress(studentId: string, courseId: string): number {
  let hash = 0
  const key = `${studentId}:${courseId}`
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 1000
  }
  return hash % 71
}

/** Cohort-based seed: each student is enrolled in every offering matching their program slot. */
export function seedEnrollmentRecords(
  _courses: CourseRecord[],
  offerings: ReturnType<typeof buildCourseOfferingsFromCatalog>,
  people: PersonRow[] = seedPeople,
): CourseEnrollment[] {
  const students = people.filter((p) => p.role === 'Student' && isEnrollableStudent(p.status))
  const enrollments: CourseEnrollment[] = []
  const slots = new Map<string, { departmentId: string; studyYear: number; programSemester: number }>()

  for (const student of students) {
    const deptId =
      student.departmentId ??
      seedDepartments.find((d) => d.name === student.department)?.id
    if (!deptId) continue
    const studyYear = student.studyYear ?? 1
    const programSemester = student.programSemester ?? 1
    slots.set(`${deptId}:${studyYear}:${programSemester}`, {
      departmentId: deptId,
      studyYear,
      programSemester,
    })
  }

  for (const slot of slots.values()) {
    const cohortStudents = getStudentsForProgramSlot(
      students,
      slot.departmentId,
      slot.studyYear,
      slot.programSemester,
      seedDepartments,
    )
    const catalog = getOfferingsForProgramSlot(
      offerings,
      slot.departmentId,
      slot.studyYear,
      slot.programSemester,
    )
    const { rows } = buildCohortEnrollmentRows(cohortStudents, catalog, enrollments)
    for (const row of rows) {
      enrollments.push({
        id: createId('enr'),
        ...row,
        progress: seedProgress(row.studentId, row.courseId),
        enrolledOn: '2026-01-10',
      })
    }
  }

  return enrollments
}

export function buildSeedOfferingsAndEnrollments(courses: CourseRecord[]) {
  const courseOfferings = buildCourseOfferingsFromCatalog(courses, seedDepartments)
  const enrollments = seedEnrollmentRecords(courses, courseOfferings)

  const enrollmentCounts = new Map<string, number>()
  enrollments.forEach((enrollment) => {
    if (enrollment.status !== 'active') return
    enrollmentCounts.set(enrollment.courseId, (enrollmentCounts.get(enrollment.courseId) ?? 0) + 1)
  })

  const coursesWithCounts = courses.map((course) => ({
    ...course,
    enrolledCount: enrollmentCounts.get(course.id) ?? course.enrolledCount,
  }))

  const offeringsWithCounts = courseOfferings.map((offering) => ({
    ...offering,
    programSemester: offering.programSemester ?? 1,
    enrolledCount: enrollments.filter(
      (e) => e.courseOfferingId === offering.id && e.status === 'active',
    ).length,
  }))

  return { courses: coursesWithCounts, courseOfferings: offeringsWithCounts, enrollments }
}

import type { AnnouncementPersonOption } from '../types/announcements'
import { courseTeachesInstructor } from '../../modules/institution/utils/courseAssignmentUtils'
import { readCourses, readEnrollments, readPeople } from './readers'

export function getInstructorCourseIds(instructorId: string, instructorName = ''): string[] {
  return readCourses()
    .filter((course) => courseTeachesInstructor(course, instructorId, instructorName))
    .map((course) => course.id)
}

export function getInstructorStudents(instructorId: string, instructorName = ''): AnnouncementPersonOption[] {
  const courseIds = new Set(getInstructorCourseIds(instructorId, instructorName))
  const enrollments = readEnrollments().filter(
    (enrollment) => enrollment.status === 'active' && courseIds.has(enrollment.courseId),
  )
  const people = readPeople()
  const seen = new Set<string>()
  const students: AnnouncementPersonOption[] = []

  for (const enrollment of enrollments) {
    if (seen.has(enrollment.studentId)) continue
    seen.add(enrollment.studentId)

    const person = people.find((row) => row.id === enrollment.studentId)
    students.push({
      id: enrollment.studentId,
      name: person?.name ?? enrollment.studentName,
      email: person?.email ?? '',
      department: enrollment.courseCode,
    })
  }

  return students.sort((a, b) => a.name.localeCompare(b.name))
}

export function getCourseStudentCount(courseId: string): number {
  return readEnrollments().filter(
    (enrollment) => enrollment.courseId === courseId && enrollment.status === 'active',
  ).length
}

export function isStudentOfInstructor(
  studentId: string,
  instructorId: string,
  instructorName = '',
): boolean {
  const courseIds = new Set(getInstructorCourseIds(instructorId, instructorName))
  return readEnrollments().some(
    (enrollment) =>
      enrollment.studentId === studentId &&
      enrollment.status === 'active' &&
      courseIds.has(enrollment.courseId),
  )
}

import type { CourseEnrollment, CourseRecord } from '../types'

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

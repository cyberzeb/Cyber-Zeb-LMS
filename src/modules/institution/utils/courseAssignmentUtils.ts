import { readPeople } from '../../../shared/storage/readers'
import { UNASSIGNED_DEPARTMENT } from '../data/courseSeedData'
import type { CourseCreateInput, CourseRecord, PersonRow } from '../types'

/** Instructors are not tied to an academic department — only to courses they teach. */
export const INSTRUCTOR_FACULTY_LABEL = 'Faculty'

export function getEligibleCourseInstructors(people: PersonRow[]): PersonRow[] {
  return people
    .filter((p) => p.role === 'Instructor' && p.status === 'active')
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function resolveInstructorFromId(
  instructorId: string | undefined,
  fallbackName = 'Unassigned',
): { instructorId?: string; instructor: string } {
  if (!instructorId) {
    return { instructorId: undefined, instructor: fallbackName }
  }
  const person = readPeople().find((p) => p.id === instructorId)
  return {
    instructorId,
    instructor: person?.name ?? fallbackName,
  }
}

export function applyCourseAssignmentFields(input: CourseCreateInput): {
  department: string
  instructorId?: string
  instructor: string
} {
  const { instructorId, instructor } = resolveInstructorFromId(input.instructorId)
  return {
    department: input.department?.trim() || UNASSIGNED_DEPARTMENT,
    instructorId,
    instructor,
  }
}

export function courseTeachesInstructor(
  course: { instructor?: string; instructorId?: string; submittedByInstructorId?: string },
  instructorId: string,
  instructorName: string,
): boolean {
  return (
    course.instructorId === instructorId ||
    course.submittedByInstructorId === instructorId ||
    course.instructor === instructorName
  )
}

export function getCoursesForInstructor(
  courses: CourseRecord[],
  instructorId: string,
  instructorName: string,
): CourseRecord[] {
  return courses.filter((c) => courseTeachesInstructor(c, instructorId, instructorName))
}

export function formatCourseAssignmentLabel(course: CourseRecord | undefined): string {
  if (!course) return 'No course assigned'
  return `${course.code} — ${course.title}`
}

export function instructorAssignmentLabel(
  courses: CourseRecord[],
  instructorId: string,
  instructorName: string,
): string {
  const assigned = getCoursesForInstructor(courses, instructorId, instructorName)
  if (assigned.length === 0) return 'No courses assigned'
  if (assigned.length === 1) return formatCourseAssignmentLabel(assigned[0])
  return `${assigned.length} courses`
}

export function instructorTeachingSummary(
  courses: CourseRecord[],
  instructorId: string,
  instructorName: string,
): { courseCount: number; label: string; departments: string[] } {
  const assigned = getCoursesForInstructor(courses, instructorId, instructorName)
  const departments = [...new Set(assigned.map((c) => c.department).filter(Boolean))]
  return {
    courseCount: assigned.length,
    label: instructorAssignmentLabel(courses, instructorId, instructorName),
    departments,
  }
}

/** Assign instructor to one course without affecting their other course assignments. */
export function assignInstructorToCourse(
  courses: CourseRecord[],
  courseId: string,
  instructorId: string,
  instructorName: string,
): CourseRecord[] {
  return courses.map((c) =>
    c.id === courseId ? { ...c, instructorId, instructor: instructorName } : c,
  )
}

/** Replace all course assignments for an instructor (supports multiple courses). */
export function syncInstructorCourseAssignments(
  courses: CourseRecord[],
  instructorId: string,
  instructorName: string,
  courseIds: string[],
): CourseRecord[] {
  const selected = new Set(courseIds)
  return courses.map((c) => {
    if (selected.has(c.id)) {
      return { ...c, instructorId, instructor: instructorName }
    }
    if (c.instructorId === instructorId) {
      return { ...c, instructorId: undefined, instructor: 'Unassigned' }
    }
    return c
  })
}

export function unassignInstructorFromCourses(
  courses: CourseRecord[],
  instructorId: string,
): CourseRecord[] {
  return courses.map((c) =>
    c.instructorId === instructorId
      ? { ...c, instructorId: undefined, instructor: 'Unassigned' }
      : c,
  )
}

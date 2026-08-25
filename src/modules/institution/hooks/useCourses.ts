import { useCallback } from 'react'
import { useApiCollection } from '../../../shared/hooks/useApiCollection'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { STORAGE_KEYS } from '../../../shared/storage/keys'
import { computeCourseProgress, courseInputToRecordFields } from '../data/courseFormOptions'
import { applyCourseAssignmentFields, courseTeachesInstructor } from '../utils/courseAssignmentUtils'
import type { CourseApprovalStatus, CourseCreateInput, CourseRecord } from '../types'

function formatSubmittedAt() {
  return new Date().toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function isCourseApproved(course: CourseRecord) {
  return !course.approvalStatus || course.approvalStatus === 'approved'
}

export function useCourses() {
  const [courses, setCourses] = useApiCollection<CourseRecord[]>(
    STORAGE_KEYS.courses,
    [],
  )

  const getCoursesForDepartment = useCallback(
    (departmentName: string) => courses.filter((c) => c.department === departmentName),
    [courses],
  )

  const addCourse = useCallback(
    (input: CourseCreateInput) => {
      const fields = courseInputToRecordFields(input)
      const assignment = applyCourseAssignmentFields(input)
      const course: CourseRecord = {
        id: createId('course'),
        icon: '',
        enrolledCount: 0,
        approvalStatus: 'approved',
        ...assignment,
        ...fields,
      }
      setCourses((prev) => [course, ...prev])
      return course
    },
    [setCourses],
  )

  const submitInstructorCourse = useCallback(
    (
      input: CourseCreateInput,
      instructor: { id: string; name: string },
    ) => {
      const fields = courseInputToRecordFields({
        ...input,
        status: 'draft',
      })
      const { department } = applyCourseAssignmentFields(input)
      const course: CourseRecord = {
        id: createId('course'),
        instructor: instructor.name,
        instructorId: instructor.id,
        department,
        icon: '',
        enrolledCount: 0,
        approvalStatus: 'pending',
        submittedByInstructorId: instructor.id,
        submittedByName: instructor.name,
        submittedAt: formatSubmittedAt(),
        ...fields,
      }
      setCourses((prev) => [course, ...prev])
      return course
    },
    [setCourses],
  )

  const approveCourse = useCallback(
    (courseId: string) => {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? {
                ...c,
                approvalStatus: 'approved' as CourseApprovalStatus,
                reviewedAt: formatSubmittedAt(),
                reviewNote: undefined,
              }
            : c,
        ),
      )
    },
    [setCourses],
  )

  const rejectCourse = useCallback(
    (courseId: string, reviewNote?: string) => {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? {
                ...c,
                approvalStatus: 'rejected' as CourseApprovalStatus,
                reviewedAt: formatSubmittedAt(),
                reviewNote: reviewNote?.trim() || 'Rejected by admin.',
              }
            : c,
        ),
      )
    },
    [setCourses],
  )

  const getCoursesByInstructor = useCallback(
    (instructorId: string, instructorName: string) =>
      courses.filter((c) => courseTeachesInstructor(c, instructorId, instructorName)),
    [courses],
  )

  const getPendingApprovalCourses = useCallback(
    () => courses.filter((c) => c.approvalStatus === 'pending'),
    [courses],
  )

  const updateCourseFromInput = useCallback(
    (courseId: string, input: CourseCreateInput) => {
      const fields = courseInputToRecordFields(input)
      const assignment = applyCourseAssignmentFields(input)
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, ...assignment, ...fields } : c)),
      )
      return { ...assignment, ...fields }
    },
    [setCourses],
  )

  const updateCourse = useCallback(
    (courseId: string, patch: Partial<Omit<CourseRecord, 'id'>>) => {
      setCourses((prev) =>
        prev.map((c) => {
          if (c.id !== courseId) return c
          const next = {
            ...c,
            ...patch,
            code: patch.code ? patch.code.trim().toUpperCase() : c.code,
          }
          if (patch.modules !== undefined) {
            next.moduleCount = patch.modules.length
          }
          next.progressPercent = computeCourseProgress(next)
          return next
        }),
      )
    },
    [setCourses],
  )

  const removeCourse = useCallback(
    (courseId: string) => {
      setCourses((prev) => prev.filter((c) => c.id !== courseId))
    },
    [setCourses],
  )

  const renameDepartmentInCourses = useCallback(
    (prevName: string, nextName: string) => {
      if (prevName === nextName) return
      setCourses((prev) =>
        prev.map((c) => (c.department === prevName ? { ...c, department: nextName } : c)),
      )
    },
    [setCourses],
  )

  return {
    courses,
    setCourses,
    getCoursesForDepartment,
    getCoursesByInstructor,
    getPendingApprovalCourses,
    addCourse,
    submitInstructorCourse,
    approveCourse,
    rejectCourse,
    updateCourse,
    updateCourseFromInput,
    removeCourse,
    renameDepartmentInCourses,
  }
}

import { useCallback } from 'react'
import { useLocalStorageState, createId } from '../../../shared/hooks/useLocalStorageState'
import { STORAGE_EVENTS, STORAGE_KEYS } from '../../../shared/storage/keys'
import type { CourseEnrollment } from '../types'

function notifyEnrollmentsUpdated() {
  window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.enrollmentsUpdated))
}

export function useEnrollments() {
  const [enrollments, setEnrollmentsRaw] = useLocalStorageState<CourseEnrollment[]>(
    STORAGE_KEYS.enrollments,
    [],
  )

  const setEnrollments = useCallback(
    (updater: CourseEnrollment[] | ((prev: CourseEnrollment[]) => CourseEnrollment[])) => {
      setEnrollmentsRaw(updater)
      notifyEnrollmentsUpdated()
    },
    [setEnrollmentsRaw],
  )

  const addEnrollment = useCallback(
    (input: Omit<CourseEnrollment, 'id'>) => {
      const row: CourseEnrollment = { id: createId('enr'), ...input }
      setEnrollments((prev) => [row, ...prev])
      return row
    },
    [setEnrollments],
  )

  const updateEnrollment = useCallback(
    (id: string, patch: Partial<Omit<CourseEnrollment, 'id'>>) => {
      setEnrollments((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
    },
    [setEnrollments],
  )

  const removeEnrollment = useCallback(
    (id: string) => {
      setEnrollments((prev) => prev.filter((e) => e.id !== id))
    },
    [setEnrollments],
  )

  const getEnrollmentsForStudent = useCallback(
    (studentId: string) => enrollments.filter((e) => e.studentId === studentId),
    [enrollments],
  )

  const getEnrollmentsForCourse = useCallback(
    (courseId: string) => enrollments.filter((e) => e.courseId === courseId),
    [enrollments],
  )

  const enrollStudent = useCallback(
    (
      studentId: string,
      courseId: string,
      meta: {
        studentName: string
        courseCode: string
        courseTitle: string
        program?: string
        campus?: string
      },
    ) => {
      return addEnrollment({
        studentId,
        studentName: meta.studentName,
        courseId,
        courseCode: meta.courseCode,
        courseTitle: meta.courseTitle,
        program: meta.program,
        campus: meta.campus,
        enrolledOn: new Date().toISOString(),
        status: 'active',
        progress: 0,
      })
    },
    [addEnrollment],
  )

  return {
    enrollments,
    setEnrollments,
    addEnrollment,
    enrollStudent,
    updateEnrollment,
    removeEnrollment,
    getEnrollmentsForStudent,
    getEnrollmentsForCourse,
  }
}

export function readEnrollmentsFromStorage(): CourseEnrollment[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.enrollments)
    if (stored) return JSON.parse(stored) as CourseEnrollment[]
  } catch {
    /* ignore */
  }
  return []
}

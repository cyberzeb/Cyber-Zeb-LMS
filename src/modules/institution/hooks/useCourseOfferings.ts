import { useCallback } from 'react'
import { useApiCollection } from '../../../shared/hooks/useApiCollection'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { STORAGE_EVENTS, STORAGE_KEYS } from '../../../shared/storage/keys'
import type { CourseOfferingRecord, CourseOfferingDeliveryMode, CourseOfferingStatus } from '../types/academic'

function notifyOfferingsUpdated() {
  window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.academicUpdated))
}

export type CreateOfferingInput = {
  courseId: string
  courseCode: string
  courseTitle: string
  departmentId: string
  departmentName: string
  studyYear: number
  programSemester: number
  campusId?: string
  sectionCode: string
  displayName?: string
  primaryInstructorId?: string
  primaryInstructorName?: string
  deliveryMode?: CourseOfferingDeliveryMode
  maxEnrollment?: number
  status?: CourseOfferingStatus
  scheduleSummary?: string
  location?: string
  allowSelfEnrollment?: boolean
  certificateEnabled?: boolean
}

export function useCourseOfferings() {
  const [offerings, setOfferingsRaw] = useApiCollection<CourseOfferingRecord[]>(
    STORAGE_KEYS.courseOfferings,
    [],
  )

  const setOfferings = useCallback(
    (updater: CourseOfferingRecord[] | ((prev: CourseOfferingRecord[]) => CourseOfferingRecord[])) => {
      setOfferingsRaw(updater)
      notifyOfferingsUpdated()
    },
    [setOfferingsRaw],
  )

  const addOffering = useCallback(
    (input: CreateOfferingInput) => {
      const row: CourseOfferingRecord = {
        id: createId('off'),
        enrolledCount: 0,
        deliveryMode: input.deliveryMode ?? 'in_person',
        status: input.status ?? 'planned',
        allowSelfEnrollment: input.allowSelfEnrollment ?? false,
        certificateEnabled: input.certificateEnabled ?? true,
        ...input,
      }
      setOfferings((prev) => [row, ...prev])
      return row
    },
    [setOfferings],
  )

  const updateOffering = useCallback(
    (id: string, patch: Partial<Omit<CourseOfferingRecord, 'id'>>) => {
      setOfferings((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))
    },
    [setOfferings],
  )

  const removeOffering = useCallback(
    (id: string) => {
      setOfferings((prev) => prev.filter((o) => o.id !== id))
    },
    [setOfferings],
  )

  const getOfferingsForProgramSlot = useCallback(
    (studyYear: number, programSemester: number, departmentId?: string) =>
      offerings.filter((o) => {
        if (o.studyYear !== studyYear) return false
        if ((o.programSemester ?? 1) !== programSemester) return false
        if (departmentId && o.departmentId !== departmentId) return false
        return true
      }),
    [offerings],
  )

  const getOfferingsForCourse = useCallback(
    (courseId: string) => offerings.filter((o) => o.courseId === courseId),
    [offerings],
  )

  return {
    offerings,
    setOfferings,
    addOffering,
    updateOffering,
    removeOffering,
    getOfferingsForProgramSlot,
    getOfferingsForCourse,
  }
}

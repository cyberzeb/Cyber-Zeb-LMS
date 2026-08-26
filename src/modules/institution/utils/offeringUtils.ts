import type { CourseEnrollment } from '../types'
import type { CourseOfferingRecord } from '../types/academic'
import { formatProgramSlot } from './studyYearUtils'

export function inferProgramSemester(offering: CourseOfferingRecord): number {
  if (offering.programSemester) return offering.programSemester
  const label = `${offering.academicTermName ?? ''} ${offering.academicTermId ?? ''}`.toLowerCase()
  if (label.includes('spring') || label.includes('-spr')) return 2
  return 1
}

export function normalizeOffering(offering: CourseOfferingRecord): CourseOfferingRecord {
  const programSemester = inferProgramSemester(offering)
  return { ...offering, programSemester }
}

export function normalizeOfferings(offerings: CourseOfferingRecord[]): CourseOfferingRecord[] {
  return offerings.map(normalizeOffering)
}

export function syncOfferingEnrollmentCounts(
  offerings: CourseOfferingRecord[],
  enrollments: CourseEnrollment[],
): CourseOfferingRecord[] {
  return offerings.map((offering) => ({
    ...offering,
    enrolledCount: enrollments.filter(
      (e) =>
        e.status === 'active' &&
        (e.courseOfferingId === offering.id ||
          (!e.courseOfferingId && e.courseId === offering.courseId)),
    ).length,
  }))
}

export function isEnrollableOffering(offering: CourseOfferingRecord): boolean {
  return offering.status !== 'cancelled' && offering.status !== 'completed'
}

export function offeringDisplayLabel(offering: CourseOfferingRecord): string {
  const slot = formatProgramSlot(offering.studyYear, offering.programSemester ?? 1)
  return `${offering.courseCode} §${offering.sectionCode} · ${slot} — ${offering.courseTitle}`
}

export function isRegistrationOpen(offering: CourseOfferingRecord): boolean {
  return offering.status === 'open' || offering.status === 'in_progress'
}

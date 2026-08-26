/**
 * University Edition — academic calendar and course offering types.
 * See docs/UNIVERSITY_EDITION.md for the canonical model.
 */

export type AcademicTermType = 'semester' | 'trimester' | 'quarter' | 'summer' | 'custom'

export type AcademicTermStatus =
  | 'planned'
  | 'registration'
  | 'in_progress'
  | 'grading'
  | 'closed'

export interface AcademicYearRecord {
  id: string
  code: string                    // e.g. "2025-2026"
  name: string
  campusId?: string
  startDate: string               // ISO date
  endDate: string
  isCurrent: boolean
}

export interface AcademicTermRecord {
  id: string
  academicYearId: string
  code: string                    // e.g. "2025-FALL"
  name: string                    // e.g. "Fall Semester 2025"
  campusId?: string
  termType: AcademicTermType
  status: AcademicTermStatus
  startDate: string
  endDate: string
  registrationOpens?: string
  registrationCloses?: string
  classesStart?: string
  classesEnd?: string
  gradingDeadline?: string
  isCurrent: boolean
}

export type CourseOfferingStatus =
  | 'planned'
  | 'open'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type CourseOfferingDeliveryMode =
  | 'in_person'
  | 'online'
  | 'hybrid'
  | 'self_paced'

/**
 * Term-bound section of a catalog course, placed on the program curriculum grid.
 * Identity: department + study year + program semester + catalog course + section.
 * Calendar terms are operational (scheduling) — not the primary offering anchor.
 */
export interface CourseOfferingRecord {
  id: string
  courseId: string
  courseCode: string
  courseTitle: string
  departmentId: string
  departmentName: string
  /** Target study year (Year 1, Year 2, …) within the department program */
  studyYear: number
  /** Semester within that study year (1 = first semester, 2 = second, …) */
  programSemester: number
  /** @deprecated Legacy calendar link — use programSemester + studyYear instead */
  academicTermId?: string
  /** @deprecated Legacy display — use formatProgramSlot instead */
  academicTermName?: string
  campusId?: string
  sectionCode: string             // e.g. "01", "A"
  displayName?: string
  primaryInstructorId?: string
  primaryInstructorName?: string
  deliveryMode: CourseOfferingDeliveryMode
  maxEnrollment?: number
  enrolledCount: number
  status: CourseOfferingStatus
  scheduleSummary?: string
  location?: string
  allowSelfEnrollment?: boolean
  certificateEnabled?: boolean
}

/** Ordered University Edition setup steps (configuration phase). */
export const UNIVERSITY_SETUP_STEPS = [
  { id: 'profile', title: 'University Setup', subtitle: 'Name, timezone and regional settings' },
  { id: 'structure', title: 'Academic Structure', subtitle: 'Campuses, colleges and departments with program duration' },
  { id: 'calendar', title: 'Academic Year / Term', subtitle: 'Define calendar and current term' },
  { id: 'catalog', title: 'Course Catalog', subtitle: 'Reusable courses without term binding' },
  { id: 'offerings', title: 'Course Offerings', subtitle: 'Sections by department, study year, and program semester' },
  { id: 'instructors', title: 'Instructor Assignment', subtitle: 'Assign teaching staff to offerings' },
  { id: 'enrollments', title: 'Student Enrollment', subtitle: 'Register students into offerings' },
] as const

export type UniversitySetupStepId = (typeof UNIVERSITY_SETUP_STEPS)[number]['id']

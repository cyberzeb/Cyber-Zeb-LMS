/**
 * Training Edition data model.
 *
 * A training program bundles catalog courses and has a price. It runs as
 * cohorts — dated intakes with a seat limit and a trainer. Learners register for
 * a cohort (paying the fee holds and then confirms the seat), are enrolled in
 * every course of the program, have their attendance taken per cohort session,
 * and earn one certificate for the whole program.
 *
 * Learners and trainers are ordinary people records (roles Student and
 * Instructor); divisions are the shared departments.
 */

export type TrainingProgramStatus = 'active' | 'draft' | 'archived'
export type TrainingProgramLevel = 'Foundational' | 'Intermediate' | 'Advanced' | 'Executive'
export type DeliveryMode = 'in-person' | 'online' | 'hybrid' | 'self-paced'

export interface TrainingProgram {
  id: string
  code: string
  name: string
  description: string
  /** A department (shown as a Training Division). */
  divisionId?: string
  divisionName?: string
  level: TrainingProgramLevel
  deliveryMode: DeliveryMode
  durationWeeks: number
  totalHours: number
  /** Catalog courses the program is made of. */
  courseIds: string[]
  /** 0 means free. */
  price: number
  currency: string
  /** Attendance (%) a learner needs to be certified. */
  minAttendance: number
  credentialType: string
  certificateTemplateId?: string
  certificateEnabled?: boolean
  skills: string[]
  status: TrainingProgramStatus
  createdAt: string
  updatedAt: string
}

export type CohortStatus = 'upcoming' | 'active' | 'completed' | 'cancelled'

export interface Cohort {
  id: string
  programId: string
  name: string
  code: string
  startDate: string
  endDate: string
  /** 0 means no limit. */
  seatCapacity: number
  trainerId: string | null
  deliveryMode: DeliveryMode
  location?: string
  schedule?: string
  meetingUrl?: string
  /** Stored status. Only "cancelled" and "completed" override the dates. */
  status: CohortStatus
  /** Shown on the public registration page and in the learner catalog. */
  enrollmentOpen: boolean
  registrationDeadline?: string
  /** Overrides the program price for this intake. */
  price?: number | null
  createdAt: string
  updatedAt: string
}

export type RegistrationStatus = 'pending_payment' | 'enrolled' | 'cancelled'
export type RegistrationSource = 'public' | 'self' | 'admin'

export interface CohortRegistration {
  id: string
  cohortId: string
  programId: string
  studentId: string
  studentName: string
  studentEmail?: string
  phone?: string | null
  organization?: string | null
  status: RegistrationStatus
  source: RegistrationSource
  amount: number
  currency: string
  invoiceId?: string
  createdAt: string
  registeredAt?: string
  confirmedAt?: string
  confirmedBy?: string
  cancelledAt?: string
  cancelReason?: string | null
}

export type AttendanceMark = 'present' | 'late' | 'absent' | 'excused'

export interface CohortSession {
  id: string
  cohortId: string
  date: string
  topic?: string
  marks: Record<string, AttendanceMark>
  takenById?: string
  takenByName?: string
  takenAt?: string
}

/** What the public registration page receives (no personal data). */
export interface PublicCohort {
  id: string
  name: string
  startDate: string
  endDate: string
  schedule?: string
  location?: string
  deliveryMode?: DeliveryMode
  trainerName?: string
  seatsLeft: number | null
  price: number
  currency: string
  registrationDeadline?: string
  open: boolean
  closedReason?: string | null
}

export interface PublicProgram {
  id: string
  code: string
  name: string
  description?: string
  level?: TrainingProgramLevel
  deliveryMode?: DeliveryMode
  durationWeeks?: number
  totalHours?: number
  credentialType?: string
  skills: string[]
  price: number
  currency: string
  courses: { code: string; title: string }[]
  cohorts: PublicCohort[]
}

export interface PublicCatalog {
  tenantCode: string
  organizationName: string
  programs: PublicProgram[]
}

export interface RegistrationResult {
  registrationId: string
  status: RegistrationStatus
  amount: number
  currency: string
  invoiceId?: string
  programName?: string
  cohortName?: string
  startDate?: string
  studentId?: string
  alreadyRegistered: boolean
  email?: string
  tenantCode?: string
}

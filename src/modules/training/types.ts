export type TrainingDivisionStatus = 'active' | 'inactive'

export interface TrainingDivision {
  id: string
  name: string
  description: string
  headOfDivisionId: string | null
  status: TrainingDivisionStatus
  createdAt: string
  updatedAt: string
}

export type TrainingProgramStatus = 'active' | 'draft' | 'archived'
export type TrainingProgramLevel = 'Foundational' | 'Intermediate' | 'Advanced' | 'Executive'

export interface TrainingProgram {
  id: string
  code: string
  name: string
  divisionId: string
  divisionName?: string
  description: string
  durationWeeks: number
  totalHours: number
  credentialType: string
  status: TrainingProgramStatus
  level?: TrainingProgramLevel
  deliveryMode?: DeliveryMode
  targetAudience?: string
  skills?: string[]
  leadTrainer?: string
  enrolledCount?: number
  activeCohortsCount?: number
  completionRate?: number
  modulesCount?: number
  createdAt: string
  updatedAt: string
}

export type DeliveryMode = 'in-person' | 'online' | 'hybrid' | 'blended'
export type CohortStatus = 'upcoming' | 'active' | 'completed' | 'cancelled'

export interface Cohort {
  id: string
  programId: string
  programName?: string
  programCode?: string
  name: string
  code: string
  startDate: string
  endDate: string
  seatCapacity: number
  enrolledCount: number
  trainerId: string | null
  trainerName?: string
  deliveryMode: DeliveryMode
  status: CohortStatus
  location?: string
  progress?: number
  schedule?: string
  createdAt: string
  updatedAt: string
}

export type LearnerStatus = 'active' | 'inactive' | 'graduated' | 'on-leave'

export interface Learner {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  jobTitle: string
  department: string
  branch?: string
  enrolledCohortId?: string
  cohortName?: string
  programName?: string
  enrolledProgramId?: string
  completionProgress: number
  attendanceRate: number
  status: LearnerStatus
  joinedDate: string
  certificationsCount?: number
  createdAt: string
  updatedAt: string
}

export type TrainerStatus = 'active' | 'available' | 'on-leave'

export interface Trainer {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  specialization: string
  divisionId: string
  divisionName?: string
  activeCohortsCount: number
  totalLearnersTrained: number
  rating: number
  status: TrainerStatus
  bio: string
  joinedDate: string
  certifications: string[]
  createdAt: string
  updatedAt: string
}

export interface TrainingOverviewKpis {
  totalLearners: number
  trainingPrograms: number
  activeCohorts: number
  trainers: number
  completionRate: number
  certificatesIssued: number
}

export interface TrainingProgressItem {
  label: string
  count: number
  tone: 'success' | 'info' | 'warning' | 'danger'
}

export interface TrainingOverviewData {
  organizationName: string
  organizationSubtitle: string
  kpis: TrainingOverviewKpis
  kpiTrends: Record<keyof TrainingOverviewKpis, number[]>
  cohortProgress: TrainingProgressItem[]
  attentionItems: import('../institution/types').AttentionItem[]
  recentAnnouncements: import('../institution/types').AnnouncementItem[]
}

export interface TrainingPlaceholderPageProps {
  title: string
  subtitle: string
  phase?: string
}

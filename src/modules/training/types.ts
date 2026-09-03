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

export interface TrainingProgram {
  id: string
  code: string
  name: string
  divisionId: string
  description: string
  durationWeeks: number
  totalHours: number
  credentialType: string
  status: TrainingProgramStatus
  createdAt: string
  updatedAt: string
}

export type DeliveryMode = 'in-person' | 'online' | 'hybrid' | 'blended'
export type CohortStatus = 'upcoming' | 'active' | 'completed' | 'cancelled'

export interface Cohort {
  id: string
  programId: string
  name: string
  code: string
  startDate: string
  endDate: string
  seatCapacity: number
  enrolledCount: number
  trainerId: string | null
  deliveryMode: DeliveryMode
  status: CohortStatus
  location?: string
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

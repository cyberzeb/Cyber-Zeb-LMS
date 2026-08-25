export type TeamStatus = 'active' | 'inactive'

export interface Team {
  id: string
  name: string
  description: string
  departmentId: string
  managerId: string | null
  status: TeamStatus
  createdAt: string
  updatedAt: string
}

export type JobRoleStatus = 'active' | 'inactive'

export interface JobRole {
  id: string
  title: string
  description: string
  departmentId?: string
  /** Required skill IDs from the skills catalog. */
  requiredSkillIds: string[]
  /** Required training (course) IDs. */
  requiredCourseIds: string[]
  status: JobRoleStatus
  createdAt: string
  updatedAt: string
}

export type SkillCategory =
  | 'technical'
  | 'leadership'
  | 'compliance'
  | 'soft-skills'
  | 'safety'
  | 'other'

export type SkillStatus = 'active' | 'inactive'

export interface Skill {
  id: string
  name: string
  category: SkillCategory
  description: string
  status: SkillStatus
  createdAt: string
  updatedAt: string
}

export type ComplianceStatus = 'compliant' | 'at-risk' | 'overdue' | 'not-assigned'

export interface EmployeeComplianceRow {
  employeeId: string
  employeeName: string
  department: string
  jobRoleTitle: string
  requiredTraining: number
  completedTraining: number
  overdueTraining: number
  compliancePercent: number
  status: ComplianceStatus
}

export interface CorporateOverviewKpis {
  totalEmployees: number
  trainingAssigned: number
  completedTraining: number
  inProgress: number
  overdueTraining: number
  complianceRate: number
  certificationsIssued: number
  trainingCompletionRate: number
}

export interface CorporateProgressItem {
  label: string
  count: number
  tone: 'success' | 'info' | 'warning' | 'danger'
}

export interface CorporateOverviewData {
  organizationName: string
  organizationSubtitle: string
  kpis: CorporateOverviewKpis
  kpiTrends: Record<keyof CorporateOverviewKpis, number[]>
  trainingProgress: CorporateProgressItem[]
  attentionItems: import('../institution/types').AttentionItem[]
  recentAnnouncements: import('../institution/types').AnnouncementItem[]
}

export interface CorporatePlaceholderPageProps {
  title: string
  subtitle: string
  phase?: string
}

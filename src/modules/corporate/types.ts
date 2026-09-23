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
  /**
   * Days an employee has to complete required training once it is assigned.
   * Drives the enrollment due date and the overdue alerts.
   */
  trainingDueDays?: number
  /**
   * Months a completed course stays valid before it must be taken again.
   * 0 or undefined means the training never expires.
   */
  recertificationMonths?: number
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

export type ComplianceStatus =
  | 'compliant'
  | 'at-risk'
  | 'overdue'
  | 'expiring'
  | 'not-assigned'

export interface EmployeeComplianceRow {
  employeeId: string
  employeeName: string
  department: string
  jobRoleId?: string
  jobRoleTitle: string
  requiredTraining: number
  completedTraining: number
  overdueTraining: number
  /** Assigned, not yet complete, and due within the "due soon" window. */
  dueSoonTraining: number
  /** Completed but past (or close to) its recertification date. */
  expiringTraining: number
  /** Required by the job role but never assigned — nothing to complete yet. */
  missingAssignments: number
  compliancePercent: number
  status: ComplianceStatus
}

/** One piece of required training that needs action, for the alerts list. */
export interface ComplianceAlert {
  employeeId: string
  employeeName: string
  courseId: string
  courseTitle: string
  kind: 'overdue' | 'due-soon' | 'recertification' | 'unassigned'
  /** Due date, or the recertification date for an expiring completion. */
  date?: string
  daysFromNow?: number
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

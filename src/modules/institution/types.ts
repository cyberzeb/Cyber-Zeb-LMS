export interface InstitutionStat {
  label: string
  value: string | number
}

export interface InstitutionEntity {
  id: string
  name: string
  subtitle: string
  status: 'active' | 'pending' | 'inactive'
  departmentsCount: number
  programsCount: number
  studentsCount: number
  facultyCount: number
  completionRate: number
}

export interface Department {
  id: string
  name: string
  headName: string
  studentsCount: number
  facultyCount: number
  icon: string
}

export interface Program {
  id: string
  level: string
  name: string
  subtitle: string
  enrolledCount: number
}

export interface Leader {
  id: string
  name: string
  role: string
  initials: string
}

export interface CalendarEvent {
  id: string
  day: string
  month: string
  title: string
  subtitle: string
}

export interface Campus {
  id: string
  name: string
  status: 'active' | 'pending'
  deptCount: number
}

export interface AuditLogEntry {
  id: string
  type: 'warn' | 'info' | 'ok'
  text: string
  timestamp: string
}

export interface SetupStep {
  id: string
  title: string
  subtitle: string
  done: boolean
}

export interface SsoProvider {
  id: string
  name: string
  subtitle: string
  status: 'connected' | 'enabled' | 'not-configured'
}

export interface InstitutionOverviewData {
  statTotals: {
    campusCount: number
    activeCampusCount: number
    totalUsers: number
    pendingInvitations: number
    activeIntegrations: number
    totalIntegrations: number
    setupProgressPercent: number
  }
  campuses: Campus[]
  setupSteps: SetupStep[]
  ssoProviders: SsoProvider[]
  auditLogEntries: AuditLogEntry[]
}

/* ── Programs ─────────────────────────────────────────────── */
export type ProgramLevel =
  | 'Undergraduate'
  | 'Postgraduate'
  | 'Doctoral'
  | 'Certificate'

export interface ProgramRow {
  id: string
  code: string
  name: string
  level: ProgramLevel
  department: string
  duration: string
  enrolledCount: number
  courseCount: number
  status: 'active' | 'draft' | 'archived'
}

/* ── Courses ──────────────────────────────────────────────── */
export interface CourseSummary {
  id: string
  code: string
  title: string
  instructor: string
  department: string
  level: string
  enrolledCount: number
  moduleCount: number
  status: 'published' | 'draft' | 'archived'
  progressPercent: number
  icon: string
}

/* ── People ───────────────────────────────────────────────── */
export type PersonRole =
  | 'Student'
  | 'Instructor'
  | 'Admin'
  | 'Parent'
  | 'Staff'

export interface PersonRow {
  id: string
  name: string
  email: string
  role: PersonRole
  department: string
  status: 'active' | 'invited' | 'suspended'
  lastActive: string
  initials: string
}

/* ── Reports ──────────────────────────────────────────────── */
export interface ReportCategory {
  id: string
  title: string
  description: string
  icon: string
  reportCount: number
}

export interface GeneratedReport {
  id: string
  name: string
  category: string
  generatedOn: string
  format: 'PDF' | 'Excel' | 'CSV'
  status: 'ready' | 'processing' | 'scheduled'
}

export interface TrendPoint {
  label: string
  value: number
}

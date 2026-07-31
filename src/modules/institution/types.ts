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

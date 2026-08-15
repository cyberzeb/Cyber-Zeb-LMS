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

export interface EnrollmentTrendPoint {
  label: string
  totalStudents: number
  activeStudents: number
}

export interface ProgressOverviewItem {
  label: string
  count: number
  tone: 'success' | 'info' | 'warning' | 'danger'
}

export interface CoursePerformanceItem {
  id: string
  courseCode: string
  title: string
  instructor: string
  enrolled: number
  completionRate: number
  status: 'healthy' | 'watch' | 'critical'
}

export interface AttentionItem {
  id: string
  title: string
  subtitle: string
  severity: 'low' | 'medium' | 'high'
}

export interface UpcomingClassItem {
  id: string
  title: string
  course: string
  instructor: string
  date: string
  time: string
}

export interface DeadlineItem {
  id: string
  title: string
  course: string
  dueIn: string
  status: 'upcoming' | 'today' | 'overdue'
}

export interface ActivityItem {
  id: string
  text: string
  timestamp: string
  type: 'student' | 'course' | 'assessment' | 'announcement'
}

export interface AnnouncementItem {
  id: string
  title: string
  audience: string
  postedAt: string
  priority: 'normal' | 'important'
}

export interface InstitutionOverviewData {
  institutionName: string
  institutionSubtitle: string
  kpis: {
    totalStudents: number
    activeStudents: number
    activeCourses: number
    instructors: number
    completionRate: number
    pendingApprovals: number
  }
  enrollmentTrend: EnrollmentTrendPoint[]
  progressOverview: ProgressOverviewItem[]
  coursePerformance: CoursePerformanceItem[]
  pendingEnrollments: AttentionItem[]
  learnersAtRisk: AttentionItem[]
  overdueAssessments: AttentionItem[]
  coursesRequiringAttention: AttentionItem[]
  upcomingLiveClasses: UpcomingClassItem[]
  upcomingDeadlines: DeadlineItem[]
  recentActivity: ActivityItem[]
  recentAnnouncements: AnnouncementItem[]
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


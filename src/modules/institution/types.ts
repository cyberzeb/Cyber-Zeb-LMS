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
  collegesCount: number
  studentsCount: number
  facultyCount: number
  completionRate: number
}

export interface College {
  id: string
  name: string
  deanName: string
  campusId: string
  description?: string
}

export interface Department {
  id: string
  name: string
  headName: string
  headId?: string
  studentsCount: number
  facultyCount: number
  icon: string
  campusId: string
  collegeId: string
  description?: string
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

export interface CampusRecord {
  id: string
  name: string
  code: string
  address: string
  subtitle: string
  status: 'active' | 'pending'
}

export interface Campus extends CampusRecord {
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
  href?: string
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

export interface HelpDeskTicket {
  id: string
  subject: string
  requester: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'in-review' | 'resolved'
  updatedAt: string
}

export interface AssignmentSubmission {
  id: string
  assignment: string
  course: string
  student: string
  submittedAt: string
  status: 'submitted' | 'late' | 'pending' | 'graded'
}

export interface IntegrationStatusItem {
  id: string
  name: string
  status: 'connected' | 'warning' | 'disconnected'
  lastSync: string
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
    upcomingLiveSessions: number
    certificatesIssued: number
  }
  kpiTrends: {
    totalStudents: number[]
    activeStudents: number[]
    activeCourses: number[]
    instructors: number[]
    completionRate: number[]
    pendingApprovals: number[]
    upcomingLiveSessions: number[]
    certificatesIssued: number[]
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
  calendarEvents: CalendarEvent[]
  helpDeskTickets: HelpDeskTicket[]
  assignmentSubmissions: AssignmentSubmission[]
  integrationStatus: IntegrationStatusItem[]
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
  campusId: string
  duration: string
  enrolledCount: number
  courseCount: number
  status: 'active' | 'draft' | 'archived'
}

/* ── Courses ──────────────────────────────────────────────── */
export type CourseDeliveryMode = 'Self-paced' | 'Instructor-led' | 'Hybrid' | 'Live cohort'
export type CourseResourceType = 'document' | 'video' | 'link' | 'slides' | 'worksheet' | 'other'
export type CourseLessonType = 'video' | 'reading' | 'quiz' | 'assignment' | 'live-session'
export type CourseVisibility = 'public' | 'private' | 'restricted'

export interface CourseLessonQuestion {
  id: string
  prompt: string
  type: 'multiple-choice' | 'short-answer'
  options?: string[]
  correctIndex?: number
  sampleAnswer?: string
  explanation?: string
}

export interface CourseLesson {
  id: string
  title: string
  type: CourseLessonType
  durationMinutes: number
  description?: string
  questions?: CourseLessonQuestion[]
}

export interface CourseModule {
  id: string
  title: string
  description?: string
  lessons: CourseLesson[]
}

export interface CourseVideo {
  id: string
  title: string
  url: string
  durationMinutes: number
  moduleId?: string
  description?: string
}

export interface CourseResource {
  id: string
  title: string
  type: CourseResourceType
  url: string
  fileName?: string
  description?: string
}

export interface CourseSummary {
  id: string
  code: string
  title: string
  instructor: string
  instructorId?: string
  department: string
  level: string
  enrolledCount: number
  moduleCount: number
  status: 'published' | 'draft' | 'archived'
  progressPercent: number
  icon: string
  approvalStatus?: CourseApprovalStatus
  submittedByInstructorId?: string
  submittedByName?: string
  submittedAt?: string
  reviewedAt?: string
  reviewNote?: string
}

export type CourseApprovalStatus = 'approved' | 'pending' | 'rejected'

export interface CourseRecord extends CourseSummary {
  shortDescription?: string
  description?: string
  credits?: number
  durationWeeks?: number
  deliveryMode?: CourseDeliveryMode
  language?: string
  prerequisites?: string
  learningOutcomes?: string
  tags?: string[]
  modules?: CourseModule[]
  videos?: CourseVideo[]
  resources?: CourseResource[]
  thumbnailUrl?: string
  syllabusUrl?: string
  maxEnrollment?: number
  allowSelfEnrollment?: boolean
  certificateEnabled?: boolean
  discussionForumEnabled?: boolean
  gradingPolicy?: string
  visibility?: CourseVisibility
  startDate?: string
  endDate?: string
}

export type CourseCreateInput = Omit<
  CourseRecord,
  | 'id'
  | 'enrolledCount'
  | 'moduleCount'
  | 'progressPercent'
  | 'instructor'
  | 'instructorId'
  | 'department'
  | 'icon'
> & {
  department?: string
  instructorId?: string
}

/* ── Enrollments ──────────────────────────────────────────── */
export interface CourseEnrollment {
  id: string
  studentId: string
  studentName: string
  courseId: string
  courseCode: string
  courseTitle: string
  program?: string
  campus?: string
  enrolledOn: string
  status: 'active' | 'pending' | 'withdrawn'
  progress: number
}

/* ── People ───────────────────────────────────────────────── */
export type PersonRole =
  | 'Student'
  | 'Instructor'
  | 'Admin'
  | 'Guardian'
  | 'Staff'

export interface PersonRow {
  id: string
  name: string
  email: string
  role: PersonRole
  department: string
  campusId?: string
  isDepartmentHead?: boolean
  verificationStatus?: 'verified' | 'pending' | 'rejected'
  addedByRole?: 'Admin' | 'Staff'
  submittedAt?: string
  submittedByName?: string
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


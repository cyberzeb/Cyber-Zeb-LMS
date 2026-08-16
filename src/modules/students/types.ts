export type ResourceKind = 'Syllabus' | 'Lecture Notes' | 'Reading' | 'Video'

export type QuizStatus = 'Open' | 'Locked' | 'Completed'

export type AssignmentStatus = 'Ready to submit' | 'Submitted' | 'Awaiting review'

export type EventType = 'Live class' | 'Exam' | 'Office hour' | 'Deadline'

export interface StudentStat {
  label: string
  value: string
  detail: string
}

export interface CourseResource {
  id: string
  title: string
  course: string
  kind: ResourceKind
  size: string
  updatedAt: string
  href: string
}

export interface QuizItem {
  id: string
  title: string
  course: string
  dueAt: string
  questions: number
  duration: string
  status: QuizStatus
  score?: string
}

export interface AssignmentItem {
  id: string
  title: string
  course: string
  dueAt: string
  brief: string
  acceptedFormats: string[]
  status: AssignmentStatus
  feedback?: string
}

export interface ScheduleItem {
  id: string
  title: string
  course: string
  startAt: string
  type: EventType
  location: string
  accent: string
}

export interface GradeComponent {
  id: string
  label: string
  category: 'assignment' | 'quiz' | 'midterm' | 'final' | 'participation' | 'project'
  weight: number
  score: number
  maxScore: number
  gradedAt?: string
}

export interface GradeItem {
  id: string
  courseCode: string
  course: string
  grade: string
  percent: number
  progress: number
  feedback: string
  instructor: string
  updatedAt: string
  credits: number
  components: GradeComponent[]
}

export interface SemesterGrades {
  id: string
  term: string
  status: 'current' | 'completed'
  gpa: number
  creditHours: number
  courses: GradeItem[]
}

export interface EnrolledCourse {
  id: string
  code: string
  title: string
  instructor: string
  progress: number
  nextSession: string
  credits: number
  status: 'active' | 'completed' | 'upcoming'
  department: string
}

export interface LiveClassSession {
  id: string
  title: string
  course: string
  instructor: string
  startAt: string
  duration: string
  platform: string
  status: 'live' | 'upcoming' | 'ended'
}

export interface AttendanceRecord {
  id: string
  course: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  sessionsAttended: number
  sessionsTotal: number
}

export interface AnnouncementItem {
  id: string
  title: string
  body: string
  author: string
  postedAt: string
  priority: 'normal' | 'important'
  course?: string
}

export interface ForumThread {
  id: string
  title: string
  course: string
  author: string
  replies: number
  lastActivity: string
  pinned?: boolean
}

export type CertificatePendingReason =
  | 'awaiting-completion'
  | 'awaiting-instructor-approval'
  | 'awaiting-admin-approval'

export interface CertificateItem {
  id: string
  title: string
  course: string
  /** e.g. "Jun 12, 2025" — formatted display string, or "Pending" */
  issuedAt: string
  /** ISO date string (YYYY-MM-DD) or undefined when not yet issued */
  issuedAtRaw?: string
  /** Date the course work was completed */
  completionDate?: string
  credentialId: string
  status: 'issued' | 'in-progress'
  /** Only present when status === 'in-progress' */
  pendingReason?: CertificatePendingReason
  /** Issuing institution name */
  institution?: string
  /** Instructor who signed/issued the certificate */
  instructorName?: string
  /** Department */
  department?: string
}

export interface PaymentItem {
  id: string
  label: string
  amount: string
  dueAt: string
  status: 'paid' | 'pending' | 'overdue'
}

export interface HelpDeskTicket {
  id: string
  subject: string
  category: string
  status: 'open' | 'in-review' | 'resolved'
  updatedAt: string
  priority: 'low' | 'medium' | 'high'
}

export interface TrendPoint {
  label: string
  value: number
}

export interface ProgressOverviewItem {
  label: string
  count: number
  tone: 'success' | 'info' | 'warning' | 'danger'
}

export interface StudentKpiTrends {
  gpa: number[]
  quizScores: number[]
  courseProgress: number[]
  attendanceRate: number[]
  assignmentsCompleted: number[]
  studyHours: number[]
}

export interface StudentKpis {
  activeCourses: number
  avgQuizScore: number
  gpa: number
  attendanceRate: number
  dueThisWeek: number
  upcomingSessions: number
  assignmentsCompleted: number
  studyHoursWeekly: number
}

export interface UpcomingDeadline {
  id: string
  title: string
  course: string
  dueIn: string
  status: 'upcoming' | 'today' | 'overdue'
}

export interface RecentActivityItem {
  id: string
  text: string
  timestamp: string
}

export interface StudentDashboardData {
  studentId: string
  studentName: string
  email: string
  department: string
  program: string
  term: string
  standing: string
  stats: StudentStat[]
  resources: CourseResource[]
  quizzes: QuizItem[]
  assignments: AssignmentItem[]
  schedule: ScheduleItem[]
  grades: GradeItem[]
  courses: EnrolledCourse[]
  liveClasses: LiveClassSession[]
  attendance: AttendanceRecord[]
  announcements: AnnouncementItem[]
  forumThreads: ForumThread[]
  certificates: CertificateItem[]
  payments: PaymentItem[]
  helpDeskTickets: HelpDeskTicket[]
  kpis: StudentKpis
  kpiTrends: StudentKpiTrends
  progressOverview: ProgressOverviewItem[]
  gradeTrend: TrendPoint[]
  gradeHistory: SemesterGrades[]
  quizScoreTrend: TrendPoint[]
  attendanceTrend: TrendPoint[]
  studyHoursTrend: TrendPoint[]
  upcomingDeadlines: UpcomingDeadline[]
  recentActivity: RecentActivityItem[]
}

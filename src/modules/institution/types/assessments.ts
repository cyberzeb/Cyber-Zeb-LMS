export type LiveSessionStatus = 'live' | 'upcoming' | 'ended' | 'cancelled'

export type AssessmentPublishStatus = 'draft' | 'published' | 'closed'

/** Question formats. Each one has its own editor and its own student input. */
export type QuestionType =
  | 'mcq'
  | 'multi-select'
  | 'true-false'
  | 'short-answer'
  | 'numeric'
  | 'fill-blank'
  | 'matching'
  | 'ordering'
  | 'essay'

/**
 * A student's answer: text for most formats, a list for multi-select,
 * fill-blank (one per blank) and ordering, and left → right for matching.
 */
export type QuizAnswer = string | string[] | Record<string, string>

export interface MatchingPair {
  left: string
  right: string
}

export type QuestionDifficulty = 'easy' | 'medium' | 'hard'

export type StudentSubmissionStatus = 'not-submitted' | 'submitted' | 'graded' | 'late'

export interface LiveSessionRecord {
  id: string
  title: string
  courseId: string
  courseCode: string
  courseTitle: string
  instructorId: string
  instructorName: string
  campusId: string
  department: string
  startAt: string
  durationMinutes: number
  platform: string
  meetingUrl?: string
  startUrl?: string
  zoomMeetingId?: string
  zoomPassword?: string
  status: LiveSessionStatus
  attendees?: number
}

export interface AssignmentRecord {
  id: string
  title: string
  courseId: string
  courseCode: string
  courseTitle: string
  instructorId: string
  instructorName: string
  campusId: string
  department: string
  dueAt: string
  brief: string
  acceptedFormats: string[]
  status: AssessmentPublishStatus
  maxPoints: number
}

export interface QuizRecord {
  id: string
  title: string
  courseId: string
  courseCode: string
  courseTitle: string
  instructorId: string
  instructorName: string
  campusId: string
  department: string
  dueAt: string
  durationMinutes: number
  questionIds: string[]
  status: AssessmentPublishStatus
  maxPoints: number
}

export interface QuestionRecord {
  id: string
  /** The question text. Fill-in-the-blank marks each blank with ___ (three underscores). */
  stem: string
  type: QuestionType
  /** mcq, multi-select: the choices shown to students. */
  options?: string[]
  /** mcq: the right option; true-false: "True" or "False". */
  correctAnswer?: string
  /** multi-select: every right option. */
  correctAnswers?: string[]
  /** short-answer: answers marked correct (empty = the instructor marks it). */
  acceptedAnswers?: string[]
  caseSensitive?: boolean
  /** numeric */
  numericAnswer?: number
  tolerance?: number
  unit?: string
  /** fill-blank: accepted answers for each blank, in order. */
  blanks?: string[][]
  /** matching: each left item and the right item it goes with. */
  pairs?: MatchingPair[]
  /** ordering: the items in the correct order. */
  orderItems?: string[]
  /** essay: optional word limit. */
  wordLimit?: number
  /** multi-select, fill-blank, matching, ordering: credit per correct part. */
  partialCredit?: boolean
  /** Shown to instructors (never to students before grading). */
  explanation?: string
  /* Student view (built by the server, never stored): */
  blankCount?: number
  matchLeft?: string[]
  matchRight?: string[]
  orderShuffled?: string[]
  tags: string[]
  courseId?: string
  courseCode?: string
  department: string
  difficulty: QuestionDifficulty
  points: number
  createdAt: string
}

export interface StudentSubmissionRecord {
  id: string
  studentId: string
  assessmentType: 'assignment' | 'quiz'
  assessmentId: string
  status: StudentSubmissionStatus
  score?: number
  maxScore?: number
  submittedAt?: string
  feedback?: string
  attachmentName?: string
  /** Quiz attempts: the answers given, points per question (null = not marked yet). */
  answers?: Record<string, QuizAnswer>
  questionScores?: Record<string, number | null>
  /** Question ids the instructor still has to mark (essays). */
  pendingReview?: string[]
  gradedBy?: string | null
}

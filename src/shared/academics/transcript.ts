/**
 * Academic record for one student: course grades, term GPAs and the cumulative
 * transcript, built from real data (enrollments → offerings → terms, graded
 * submissions and catalog credits).
 *
 * Used by the student gradebook and transcript, the guardian portal, the
 * registrar's transcript view and the university report pack, so every screen
 * shows the same numbers.
 */
import type { CourseEnrollment, CourseRecord, PersonRow } from '../../modules/institution/types'
import type { AcademicTermRecord, CourseOfferingRecord } from '../../modules/institution/types/academic'
import type {
  AssignmentRecord,
  QuizRecord,
  StudentSubmissionRecord,
} from '../../modules/institution/types/assessments'
import {
  academicStanding,
  gradePointAverage,
  isPassingPercent,
  percentToLetter,
  percentToPoints,
  type AcademicStanding,
} from './gradeScale'
import {
  readAcademicTerms,
  readAssignmentRecords,
  readCourseOfferings,
  readCourses,
  readEnrollments,
  readQuizRecords,
  readStudentSubmissions,
} from '../storage/readers'

export interface TranscriptComponent {
  id: string
  label: string
  category: 'assignment' | 'quiz'
  score: number
  maxScore: number
  gradedAt?: string
}

export interface TranscriptCourse {
  enrollmentId: string
  courseId: string
  courseOfferingId?: string
  code: string
  title: string
  credits: number
  instructor: string
  /** null while nothing has been graded yet. */
  percent: number | null
  letter: string | null
  points: number | null
  passed: boolean
  status: 'graded' | 'in_progress'
  components: TranscriptComponent[]
}

export interface TranscriptTerm {
  termId: string
  termName: string
  termCode: string
  startDate: string
  isCurrent: boolean
  courses: TranscriptCourse[]
  /** GPA of the graded courses in this term. */
  gpa: number | null
  creditsAttempted: number
  creditsEarned: number
}

export interface Transcript {
  studentId: string
  studentName: string
  program: string
  terms: TranscriptTerm[]
  cumulativeGpa: number | null
  creditsAttempted: number
  creditsEarned: number
  standing: AcademicStanding | null
}

export interface TranscriptSources {
  enrollments: CourseEnrollment[]
  offerings: CourseOfferingRecord[]
  terms: AcademicTermRecord[]
  courses: CourseRecord[]
  assignments: AssignmentRecord[]
  quizzes: QuizRecord[]
  submissions: StudentSubmissionRecord[]
}

export function readTranscriptSources(): TranscriptSources {
  return {
    enrollments: readEnrollments(),
    offerings: readCourseOfferings(),
    terms: readAcademicTerms(),
    courses: readCourses(),
    assignments: readAssignmentRecords(),
    quizzes: readQuizRecords(),
    submissions: readStudentSubmissions(),
  }
}

const UNSCHEDULED_TERM = 'unscheduled'

function gradedComponents(
  studentId: string,
  courseId: string,
  sources: TranscriptSources,
): TranscriptComponent[] {
  const assignments = sources.assignments.filter((a) => a.courseId === courseId)
  const quizzes = sources.quizzes.filter((q) => q.courseId === courseId)
  const byAssessment = new Map<string, { label: string; category: 'assignment' | 'quiz' }>()
  assignments.forEach((a) => byAssessment.set(a.id, { label: a.title, category: 'assignment' }))
  quizzes.forEach((q) => byAssessment.set(q.id, { label: q.title, category: 'quiz' }))

  return sources.submissions
    .filter(
      (s) =>
        s.studentId === studentId &&
        s.status === 'graded' &&
        typeof s.score === 'number' &&
        (s.maxScore ?? 0) > 0 &&
        byAssessment.has(s.assessmentId),
    )
    .map((s) => {
      const meta = byAssessment.get(s.assessmentId)!
      return {
        id: s.id,
        label: meta.label,
        category: meta.category,
        score: s.score as number,
        maxScore: s.maxScore as number,
        gradedAt: s.submittedAt,
      }
    })
}

/** Course result for one enrollment: points earned across every graded item. */
export function buildCourseResult(
  enrollment: CourseEnrollment,
  sources: TranscriptSources,
): TranscriptCourse {
  const offering = sources.offerings.find((o) => o.id === enrollment.courseOfferingId)
  const course = sources.courses.find((c) => c.id === enrollment.courseId)
  const components = gradedComponents(enrollment.studentId, enrollment.courseId, sources)

  const possible = components.reduce((sum, c) => sum + c.maxScore, 0)
  const earned = components.reduce((sum, c) => sum + c.score, 0)
  const percent = possible > 0 ? Math.round((earned / possible) * 100) : null

  return {
    enrollmentId: enrollment.id,
    courseId: enrollment.courseId,
    courseOfferingId: enrollment.courseOfferingId,
    code: enrollment.courseCode || course?.code || '—',
    title: enrollment.courseTitle || course?.title || 'Course',
    credits: course?.credits ?? 0,
    instructor: offering?.primaryInstructorName ?? course?.instructor ?? '—',
    percent,
    letter: percent === null ? null : percentToLetter(percent),
    points: percent === null ? null : percentToPoints(percent),
    passed: percent !== null && isPassingPercent(percent),
    status: percent === null ? 'in_progress' : 'graded',
    components,
  }
}

function termFor(
  enrollment: CourseEnrollment,
  sources: TranscriptSources,
): AcademicTermRecord | undefined {
  const offering = sources.offerings.find((o) => o.id === enrollment.courseOfferingId)
  const termId = offering?.academicTermId ?? enrollment.academicTermId
  return sources.terms.find((t) => t.id === termId)
}

export function buildTranscript(
  student: Pick<PersonRow, 'id' | 'name' | 'department'>,
  sources: TranscriptSources = readTranscriptSources(),
): Transcript {
  const enrollments = sources.enrollments.filter(
    (e) => e.studentId === student.id && e.status !== 'withdrawn',
  )

  const groups = new Map<string, TranscriptTerm>()
  for (const enrollment of enrollments) {
    const term = termFor(enrollment, sources)
    const key = term?.id ?? UNSCHEDULED_TERM
    if (!groups.has(key)) {
      groups.set(key, {
        termId: key,
        termName: term?.name ?? 'Not scheduled in a term',
        termCode: term?.code ?? '—',
        startDate: term?.startDate ?? '',
        isCurrent: term?.isCurrent ?? false,
        courses: [],
        gpa: null,
        creditsAttempted: 0,
        creditsEarned: 0,
      })
    }
    groups.get(key)!.courses.push(buildCourseResult(enrollment, sources))
  }

  const terms = [...groups.values()]
    .map((term) => {
      const graded = term.courses.filter((c) => c.status === 'graded' && c.credits > 0)
      return {
        ...term,
        courses: [...term.courses].sort((a, b) => a.code.localeCompare(b.code)),
        gpa: gradePointAverage(graded.map((c) => ({ points: c.points ?? 0, credits: c.credits }))),
        creditsAttempted: graded.reduce((sum, c) => sum + c.credits, 0),
        creditsEarned: graded.filter((c) => c.passed).reduce((sum, c) => sum + c.credits, 0),
      }
    })
    // Newest term first; terms with no calendar date sort last.
    .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))

  const allGraded = terms.flatMap((t) => t.courses.filter((c) => c.status === 'graded' && c.credits > 0))
  const cumulativeGpa = gradePointAverage(
    allGraded.map((c) => ({ points: c.points ?? 0, credits: c.credits })),
  )

  return {
    studentId: student.id,
    studentName: student.name,
    program: student.department || '—',
    terms,
    cumulativeGpa,
    creditsAttempted: allGraded.reduce((sum, c) => sum + c.credits, 0),
    creditsEarned: allGraded.filter((c) => c.passed).reduce((sum, c) => sum + c.credits, 0),
    standing: academicStanding(cumulativeGpa),
  }
}

/** GPA of the current (or most recent) term with grades. */
export function currentTermGpa(transcript: Transcript): number | null {
  const current = transcript.terms.find((t) => t.isCurrent && t.gpa !== null)
  return current?.gpa ?? transcript.terms.find((t) => t.gpa !== null)?.gpa ?? null
}

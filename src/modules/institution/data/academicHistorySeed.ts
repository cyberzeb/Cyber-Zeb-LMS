/**
 * Coursework and graded results for the demo university.
 *
 * Every course offering gets a term project and a final assessment. Work in
 * finished terms is graded, and part of the current term's work is graded too,
 * so transcripts, GPAs and the registrar's reports are built from real records
 * instead of hard-coded sample grades.
 */
import type { CourseEnrollment, CourseRecord } from '../types'
import type { AcademicTermRecord, CourseOfferingRecord } from '../types/academic'
import type {
  AssignmentRecord,
  QuizRecord,
  StudentSubmissionRecord,
} from '../types/assessments'

const ASSIGNMENT_POINTS = 100
const QUIZ_POINTS = 20

/** Stable pseudo-random value in [0, 1) so generated grades never change between runs. */
function hashUnit(key: string): number {
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 100_000
  }
  return hash / 100_000
}

function scoreFor(key: string, max: number, floor: number): number {
  return Math.round((floor + hashUnit(key) * (1 - floor)) * max)
}

export interface AcademicHistory {
  assignments: AssignmentRecord[]
  quizzes: QuizRecord[]
  submissions: StudentSubmissionRecord[]
}

export function buildAcademicHistory(
  offerings: CourseOfferingRecord[],
  enrollments: CourseEnrollment[],
  courses: CourseRecord[],
  terms: AcademicTermRecord[],
  today: string = new Date().toISOString().slice(0, 10),
): AcademicHistory {
  const assignments: AssignmentRecord[] = []
  const quizzes: QuizRecord[] = []
  const submissions: StudentSubmissionRecord[] = []

  for (const offering of offerings) {
    const term = terms.find((t) => t.id === offering.academicTermId)
    if (!term) continue
    const course = courses.find((c) => c.id === offering.courseId)
    const cohort = enrollments.filter(
      (e) => e.courseOfferingId === offering.id && e.status === 'active',
    )
    if (cohort.length === 0) continue

    const termFinished = (term.classesEnd ?? term.endDate) < today
    const dueAt = `${term.classesEnd ?? term.endDate}T23:59:00.000Z`
    const shared = {
      courseId: offering.courseId,
      courseCode: offering.courseCode,
      courseTitle: offering.courseTitle,
      instructorId: offering.primaryInstructorId ?? '',
      instructorName: offering.primaryInstructorName ?? 'TBD',
      campusId: offering.campusId ?? 'c1',
      department: offering.departmentName,
      dueAt,
      status: (termFinished ? 'closed' : 'published') as 'closed' | 'published',
    }

    const assignment: AssignmentRecord = {
      ...shared,
      id: `asg-${offering.id}`,
      title: `${offering.courseCode} Term Project`,
      brief: `Apply the ${course?.title ?? offering.courseTitle} coursework to a practical problem and submit a written report.`,
      acceptedFormats: ['pdf', 'docx'],
      maxPoints: ASSIGNMENT_POINTS,
    }
    const quiz: QuizRecord = {
      ...shared,
      id: `quiz-${offering.id}`,
      title: `${offering.courseCode} Final Assessment`,
      durationMinutes: 45,
      questionIds: [],
      maxPoints: QUIZ_POINTS,
    }
    assignments.push(assignment)
    quizzes.push(quiz)

    cohort.forEach((enrollment, index) => {
      const gradedAt = `${term.classesEnd ?? term.endDate}T10:00:00.000Z`
      // Finished terms are fully graded; in the current term two thirds of the
      // class have a graded project and the final assessment is still open.
      const gradeProject = termFinished || index % 3 !== 2
      if (gradeProject) {
        submissions.push({
          id: `sub-${assignment.id}-${enrollment.studentId}`,
          studentId: enrollment.studentId,
          assessmentType: 'assignment',
          assessmentId: assignment.id,
          status: 'graded',
          score: scoreFor(`${assignment.id}:${enrollment.studentId}`, ASSIGNMENT_POINTS, 0.55),
          maxScore: ASSIGNMENT_POINTS,
          submittedAt: gradedAt,
          feedback: 'Marked against the project rubric.',
        })
      }
      if (termFinished) {
        submissions.push({
          id: `sub-${quiz.id}-${enrollment.studentId}`,
          studentId: enrollment.studentId,
          assessmentType: 'quiz',
          assessmentId: quiz.id,
          status: 'graded',
          score: scoreFor(`${quiz.id}:${enrollment.studentId}`, QUIZ_POINTS, 0.5),
          maxScore: QUIZ_POINTS,
          submittedAt: gradedAt,
        })
      }
    })
  }

  return { assignments, quizzes, submissions }
}

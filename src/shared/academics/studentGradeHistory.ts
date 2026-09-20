/**
 * Adapts the academic transcript to the shapes the student portal renders
 * (semester gradebook + GPA), so the portal shows real grades instead of
 * seeded sample data.
 */
import type { GradeComponent, GradeItem, SemesterGrades } from '../../modules/students/types'
import type { PersonRow } from '../../modules/institution/types'
import { buildTranscript, readTranscriptSources, type Transcript, type TranscriptTerm } from './transcript'

function toComponents(course: TranscriptTerm['courses'][number]): GradeComponent[] {
  const possible = course.components.reduce((sum, c) => sum + c.maxScore, 0)
  return course.components.map((component) => ({
    id: component.id,
    label: component.label,
    category: component.category,
    // Each graded item counts for its share of the total points on offer.
    weight: possible > 0 ? Math.round((component.maxScore / possible) * 100) : 0,
    score: component.score,
    maxScore: component.maxScore,
    gradedAt: component.gradedAt ? new Date(component.gradedAt).toLocaleDateString() : undefined,
  }))
}

function toGradeItem(course: TranscriptTerm['courses'][number]): GradeItem {
  return {
    id: course.enrollmentId,
    courseCode: course.code,
    course: `${course.code} ${course.title}`,
    grade: course.letter ?? 'In progress',
    percent: course.percent ?? 0,
    progress: course.percent ?? 0,
    feedback:
      course.status === 'graded'
        ? `${course.components.length} graded item${course.components.length === 1 ? '' : 's'}`
        : 'No graded work yet',
    instructor: course.instructor,
    updatedAt: course.components.length ? 'From graded work' : '—',
    credits: course.credits,
    components: toComponents(course),
  }
}

export function toSemesterGrades(transcript: Transcript): SemesterGrades[] {
  return transcript.terms.map((term) => ({
    id: term.termId,
    term: term.termName,
    status: term.isCurrent ? 'current' : 'completed',
    gpa: term.gpa ?? 0,
    creditHours: term.creditsAttempted,
    courses: term.courses.map(toGradeItem),
  }))
}

export interface StudentAcademicRecord {
  transcript: Transcript
  gradeHistory: SemesterGrades[]
  /** Cumulative GPA, or 0 when nothing is graded yet (the UI shows a dash). */
  gpa: number
}

export function buildStudentAcademicRecord(
  student: Pick<PersonRow, 'id' | 'name' | 'department'>,
): StudentAcademicRecord {
  const transcript = buildTranscript(student, readTranscriptSources())
  return {
    transcript,
    gradeHistory: toSemesterGrades(transcript),
    gpa: transcript.cumulativeGpa ?? 0,
  }
}

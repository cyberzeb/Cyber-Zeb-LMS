/**
 * University report pack: the figures a registrar or academic admin needs —
 * enrolment by program and term, grade and GPA distribution, and students who
 * need attention. Everything is derived from the same academic record used by
 * transcripts, so reports and transcripts can never disagree.
 */
import type { PersonRow } from '../../modules/institution/types'
import {
  readAttendances,
  readCourseOfferings,
  readEnrollments,
  readPeople,
  readPrograms,
} from '../storage/readers'
import { GRADE_BANDS, type AcademicStanding } from './gradeScale'
import { buildTranscript, readTranscriptSources, type Transcript } from './transcript'

export interface ProgramEnrolmentRow {
  programId: string
  program: string
  department: string
  students: number
  sections: number
  enrolments: number
  averageGpa: number | null
}

export interface TermSummaryRow {
  termId: string
  term: string
  isCurrent: boolean
  sections: number
  enrolments: number
  averageGpa: number | null
  creditsEarned: number
}

export interface DistributionRow {
  label: string
  count: number
  share: number
}

export interface AtRiskRow {
  studentId: string
  student: string
  program: string
  gpa: number | null
  attendance: number | null
  reasons: string[]
}

export interface UniversityReportPack {
  generatedAt: string
  students: number
  studentsWithGrades: number
  averageGpa: number | null
  programEnrolment: ProgramEnrolmentRow[]
  termSummary: TermSummaryRow[]
  gradeDistribution: DistributionRow[]
  standingDistribution: DistributionRow[]
  atRisk: AtRiskRow[]
  deansList: { studentId: string; student: string; program: string; gpa: number }[]
}

const MIN_ATTENDANCE = 75
const PROBATION_GPA = 2

function share(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 1000) / 10 : 0
}

function averageOf(values: number[]): number | null {
  if (values.length === 0) return null
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 100) / 100
}

export function buildUniversityReportPack(): UniversityReportPack {
  const sources = readTranscriptSources()
  const people = readPeople()
  const students = people.filter((p: PersonRow) => p.role === 'Student' && p.status !== 'invited')
  const programs = readPrograms()
  const offerings = readCourseOfferings()
  const enrollments = readEnrollments()
  const attendances = readAttendances()

  const records = students.map((student) => ({
    student,
    transcript: buildTranscript(student, sources) as Transcript,
  }))
  const graded = records.filter((r) => r.transcript.cumulativeGpa !== null)

  // ── Enrolment by program ────────────────────────────────────────────────
  const programEnrolment: ProgramEnrolmentRow[] = programs.map((program) => {
    const inProgram = records.filter((r) => r.student.department === program.department)
    const sections = offerings.filter((o) => o.departmentName === program.department)
    return {
      programId: program.id,
      program: program.name,
      department: program.department,
      students: inProgram.length,
      sections: sections.length,
      enrolments: enrollments.filter((e) =>
        sections.some((section) => section.id === e.courseOfferingId),
      ).length,
      averageGpa: averageOf(
        inProgram.map((r) => r.transcript.cumulativeGpa).filter((g): g is number => g !== null),
      ),
    }
  })

  // ── Term summary ────────────────────────────────────────────────────────
  const termRows = new Map<string, TermSummaryRow & { gpas: number[] }>()
  for (const { transcript } of records) {
    for (const term of transcript.terms) {
      const row =
        termRows.get(term.termId) ??
        {
          termId: term.termId,
          term: term.termName,
          isCurrent: term.isCurrent,
          sections: offerings.filter((o) => o.academicTermId === term.termId).length,
          enrolments: 0,
          averageGpa: null,
          creditsEarned: 0,
          gpas: [] as number[],
        }
      row.enrolments += term.courses.length
      row.creditsEarned += term.creditsEarned
      if (term.gpa !== null) row.gpas.push(term.gpa)
      termRows.set(term.termId, row)
    }
  }
  const termSummary: TermSummaryRow[] = [...termRows.values()]
    .map(({ gpas, ...row }) => ({ ...row, averageGpa: averageOf(gpas) }))
    .sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent) || a.term.localeCompare(b.term))

  // ── Grade distribution ──────────────────────────────────────────────────
  const letters = new Map<string, number>()
  let gradedCourses = 0
  for (const { transcript } of records) {
    for (const term of transcript.terms) {
      for (const course of term.courses) {
        if (course.letter === null) continue
        gradedCourses += 1
        letters.set(course.letter, (letters.get(course.letter) ?? 0) + 1)
      }
    }
  }
  const gradeDistribution: DistributionRow[] = GRADE_BANDS.map((band) => ({
    label: band.letter,
    count: letters.get(band.letter) ?? 0,
    share: share(letters.get(band.letter) ?? 0, gradedCourses),
  })).filter((row) => row.count > 0)

  // ── Academic standing ───────────────────────────────────────────────────
  const standings = new Map<AcademicStanding, number>()
  graded.forEach(({ transcript }) => {
    if (transcript.standing) {
      standings.set(transcript.standing, (standings.get(transcript.standing) ?? 0) + 1)
    }
  })
  const standingDistribution: DistributionRow[] = [...standings.entries()].map(([label, count]) => ({
    label,
    count,
    share: share(count, graded.length),
  }))

  // ── Students needing attention ──────────────────────────────────────────
  const attendanceFor = (studentId: string): number | null => {
    const rows = attendances.filter((a) => a.studentId === studentId)
    const sessions = rows.reduce((sum, r) => sum + r.totalSessions, 0)
    if (sessions === 0) return null
    return Math.round((rows.reduce((sum, r) => sum + r.present + r.late, 0) / sessions) * 100)
  }

  const atRisk: AtRiskRow[] = records
    .map(({ student, transcript }) => {
      const attendance = attendanceFor(student.id)
      const reasons: string[] = []
      if (transcript.cumulativeGpa !== null && transcript.cumulativeGpa < PROBATION_GPA) {
        reasons.push(`GPA ${transcript.cumulativeGpa.toFixed(2)}`)
      }
      if (attendance !== null && attendance < MIN_ATTENDANCE) {
        reasons.push(`Attendance ${attendance}%`)
      }
      const failed = transcript.terms
        .flatMap((t) => t.courses)
        .filter((c) => c.status === 'graded' && !c.passed).length
      if (failed > 0) reasons.push(`${failed} failed course${failed === 1 ? '' : 's'}`)
      return {
        studentId: student.id,
        student: student.name,
        program: student.department || '—',
        gpa: transcript.cumulativeGpa,
        attendance,
        reasons,
      }
    })
    .filter((row) => row.reasons.length > 0)
    .sort((a, b) => (a.gpa ?? 9) - (b.gpa ?? 9))

  const deansList = graded
    .filter(({ transcript }) => (transcript.cumulativeGpa ?? 0) >= 3.75)
    .map(({ student, transcript }) => ({
      studentId: student.id,
      student: student.name,
      program: student.department || '—',
      gpa: transcript.cumulativeGpa as number,
    }))
    .sort((a, b) => b.gpa - a.gpa)

  return {
    generatedAt: new Date().toISOString(),
    students: records.length,
    studentsWithGrades: graded.length,
    averageGpa: averageOf(graded.map((r) => r.transcript.cumulativeGpa as number)),
    programEnrolment,
    termSummary,
    gradeDistribution,
    standingDistribution,
    atRisk,
    deansList,
  }
}

type CsvValue = string | number | boolean | null | undefined

/** Simple CSV for any of the report tables. */
export function toCsv<T extends object>(rows: readonly T[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0] as Record<string, CsvValue>)
  const escape = (value: CsvValue) => {
    const text = value === null || value === undefined ? '' : String(value)
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  return [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((header) => escape((row as Record<string, CsvValue>)[header])).join(','),
    ),
  ].join('\n')
}

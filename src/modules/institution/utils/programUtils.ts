/**
 * Programs and their curricula (University Edition).
 *
 *   Department → Program (BSc, MSc …) → Curriculum (courses by year and semester)
 *
 * Students belong to a program; a course section serves one program's
 * year/semester slot. Older records that only name a department fall back to
 * that department's first program.
 */
import type { CourseRecord, CurriculumEntry, Department, PersonRow, ProgramLevel, ProgramRow } from '../types'
import type { CourseOfferingRecord } from '../types/academic'
import { readDepartments, readPrograms } from '../../../shared/storage/readers'

export const DEFAULT_PROGRAM_YEARS = 4
export const DEFAULT_PROGRAM_SEMESTERS = 2

export const PROGRAM_LEVELS: ProgramLevel[] = ['Undergraduate', 'Postgraduate', 'Doctoral', 'Certificate']

/** Typical degree prefix per level, used to suggest program names. */
export const LEVEL_DEGREE: Record<ProgramLevel, string> = {
  Undergraduate: 'BSc',
  Postgraduate: 'MSc',
  Doctoral: 'PhD',
  Certificate: 'Certificate',
}

export function programYears(program: ProgramRow | undefined): number {
  return Math.max(1, program?.durationYears ?? DEFAULT_PROGRAM_YEARS)
}

export function programSemesters(program: ProgramRow | undefined): number {
  return Math.max(1, program?.semestersPerYear ?? DEFAULT_PROGRAM_SEMESTERS)
}

export function formatDuration(years: number): string {
  return `${years} year${years === 1 ? '' : 's'}`
}

export function programsForDepartment(programs: ProgramRow[], departmentId: string): ProgramRow[] {
  return programs.filter((p) => p.departmentId === departmentId)
}

/** The program a student studies; legacy students fall back to their department's first program. */
type StudentRef = Pick<PersonRow, 'department'> & Partial<Pick<PersonRow, 'programId' | 'departmentId'>>

export function resolveStudentProgram(
  student: StudentRef,
  programs: ProgramRow[],
  departments: Department[] = [],
): ProgramRow | undefined {
  if (student.programId) {
    const direct = programs.find((p) => p.id === student.programId)
    if (direct) return direct
  }
  const departmentId =
    student.departmentId ?? departments.find((d) => d.name === student.department)?.id
  return departmentId ? programs.find((p) => p.departmentId === departmentId) : undefined
}

/** The program a section serves; legacy sections fall back to their department's first program. */
export function resolveOfferingProgramId(
  offering: CourseOfferingRecord,
  programs: ProgramRow[],
): string | undefined {
  if (offering.programId) return offering.programId
  return programs.find((p) => p.departmentId === offering.departmentId)?.id
}

/** True when a section belongs to the student's program, year and semester. */
export function studentFitsOffering(
  student: PersonRow,
  offering: CourseOfferingRecord,
  programs: ProgramRow[],
  departments: Department[] = [],
): boolean {
  const program = resolveStudentProgram(student, programs, departments)
  if (!program || resolveOfferingProgramId(offering, programs) !== program.id) return false
  return (
    (student.studyYear ?? 1) === offering.studyYear &&
    (student.programSemester ?? 1) === (offering.programSemester ?? 1)
  )
}

/* ── Curriculum ──────────────────────────────────────────── */

export function curriculumOf(program: ProgramRow | undefined): CurriculumEntry[] {
  return program?.curriculum ?? []
}

export function curriculumForSlot(
  program: ProgramRow | undefined,
  studyYear: number,
  semester: number,
): CurriculumEntry[] {
  return curriculumOf(program).filter((e) => e.studyYear === studyYear && e.semester === semester)
}

export function curriculumCredits(program: ProgramRow | undefined, courses: CourseRecord[]): number {
  const byId = new Map(courses.map((c) => [c.id, c]))
  return curriculumOf(program).reduce((sum, e) => sum + (byId.get(e.courseId)?.credits ?? 3), 0)
}

export function addCurriculumEntry(program: ProgramRow, entry: CurriculumEntry): ProgramRow {
  const exists = curriculumOf(program).some(
    (e) => e.courseId === entry.courseId && e.studyYear === entry.studyYear && e.semester === entry.semester,
  )
  if (exists) return program
  const curriculum = [...curriculumOf(program), entry]
  return { ...program, curriculum, courseCount: new Set(curriculum.map((e) => e.courseId)).size }
}

export function removeCurriculumEntry(program: ProgramRow, entry: CurriculumEntry): ProgramRow {
  const curriculum = curriculumOf(program).filter(
    (e) => !(e.courseId === entry.courseId && e.studyYear === entry.studyYear && e.semester === entry.semester),
  )
  return { ...program, curriculum, courseCount: new Set(curriculum.map((e) => e.courseId)).size }
}

export function studentsInProgram(
  people: PersonRow[],
  program: ProgramRow,
  programs: ProgramRow[],
  departments: Department[] = [],
): PersonRow[] {
  return people.filter(
    (p) => p.role === 'Student' && resolveStudentProgram(p, programs, departments)?.id === program.id,
  )
}

/** Which semester of the year a calendar term is (Fall = 1, Spring = 2, Summer = 3). */
export function termSemesterNumber(term: { name?: string; code?: string; termType?: string }): number {
  const label = `${term.name ?? ''} ${term.code ?? ''} ${term.termType ?? ''}`.toLowerCase()
  if (label.includes('summer')) return 3
  if (label.includes('spring') || label.includes('-spr') || label.includes('second')) return 2
  return 1
}

/** Display name of a student's program (falls back to their department for old records). */
export function studentProgramName(student: StudentRef): string {
  return resolveStudentProgram(student, readPrograms(), readDepartments())?.name ?? (student.department || '—')
}

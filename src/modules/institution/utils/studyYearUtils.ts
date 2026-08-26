import type { Department } from '../types'
import type { PersonRow } from '../types'
import type { AcademicTermStatus } from '../types/academic'
import type { CourseOfferingRecord } from '../types/academic'

export const DEFAULT_MAX_YEARS = 4

export function departmentMaxYears(dept: Department | undefined): number {
  return dept?.maxYears ?? DEFAULT_MAX_YEARS
}

export function formatStudyYear(year: number): string {
  const suffix =
    year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'
  return `Year ${year} (${year}${suffix} year)`
}

export function formatStudyYearShort(year: number): string {
  return `Y${year}`
}

export function studyYearOptions(maxYears: number): number[] {
  return Array.from({ length: Math.max(1, maxYears) }, (_, i) => i + 1)
}

export function nextTermStatus(current: AcademicTermStatus): AcademicTermStatus | null {
  switch (current) {
    case 'planned':
      return 'registration'
    case 'registration':
      return 'in_progress'
    case 'in_progress':
      return 'grading'
    case 'grading':
      return 'closed'
    default:
      return null
  }
}

export function termStatusActionLabel(current: AcademicTermStatus): string | null {
  const next = nextTermStatus(current)
  if (!next) return null
  const labels: Record<AcademicTermStatus, string> = {
    planned: 'Open registration',
    registration: 'Start classes',
    in_progress: 'Begin grading',
    grading: 'Close term',
    closed: '',
  }
  return labels[current] ?? null
}

export function resolveStudentDepartmentId(
  student: PersonRow,
  departments: Department[],
): string | undefined {
  if (student.departmentId) return student.departmentId
  return departments.find((d) => d.name === student.department)?.id
}

export function programSemesterOptions(semestersPerYear = 2): number[] {
  return Array.from({ length: Math.max(1, semestersPerYear) }, (_, i) => i + 1)
}

export function formatProgramSemester(semester: number): string {
  return `Semester ${semester}`
}

export function formatProgramSlot(studyYear: number, programSemester: number): string {
  return `${formatStudyYearShort(studyYear)} · ${formatProgramSemester(programSemester)}`
}

export function resolveStudentProgramSemester(student: PersonRow): number {
  return student.programSemester ?? 1
}

export function departmentSemestersPerYear(dept: Department | undefined): number {
  return dept?.semestersPerYear ?? 2
}

export function studentMatchesOffering(
  student: PersonRow,
  offering: CourseOfferingRecord,
  departments: Department[],
): boolean {
  const deptId = resolveStudentDepartmentId(student, departments)
  if (deptId !== offering.departmentId) return false
  const year = student.studyYear ?? 1
  if (year !== offering.studyYear) return false
  const semester = resolveStudentProgramSemester(student)
  const offeringSemester = offering.programSemester ?? 1
  return semester === offeringSemester
}

import { createId } from '../../../shared/hooks/useLocalStorageState'
import type { AcademicTermRecord, AcademicYearRecord } from '../types/academic'

export const DEFAULT_SEMESTERS_PER_YEAR = 2

function parseYearStart(code: string): number {
  const match = code.match(/^(\d{4})/)
  return match ? Number(match[1]) : new Date().getFullYear()
}

function academicYearSpan(startYear: number) {
  return {
    code: `${startYear}-${startYear + 1}`,
    name: `Academic Year ${startYear}–${startYear + 1}`,
    startDate: `${startYear}-09-01`,
    endDate: `${startYear + 1}-08-31`,
  }
}

function fallTermForYear(startYear: number, academicYearId: string, campusId?: string): AcademicTermRecord {
  return {
    id: createId('term'),
    academicYearId,
    code: `${startYear}-FALL`,
    name: `Fall Semester ${startYear}`,
    campusId,
    termType: 'semester',
    status: 'planned',
    startDate: `${startYear}-09-15`,
    endDate: `${startYear}-12-20`,
    registrationOpens: `${startYear}-08-01`,
    registrationCloses: `${startYear}-09-10`,
    classesStart: `${startYear}-09-15`,
    classesEnd: `${startYear}-12-06`,
    gradingDeadline: `${startYear}-12-20`,
    isCurrent: false,
  }
}

function springTermForYear(endYear: number, academicYearId: string, campusId?: string): AcademicTermRecord {
  return {
    id: createId('term'),
    academicYearId,
    code: `${endYear}-SPRING`,
    name: `Spring Semester ${endYear}`,
    campusId,
    termType: 'semester',
    status: 'planned',
    startDate: `${endYear}-01-12`,
    endDate: `${endYear}-05-15`,
    registrationOpens: `${endYear - 1}-11-15`,
    registrationCloses: `${endYear}-01-05`,
    classesStart: `${endYear}-01-12`,
    classesEnd: `${endYear}-05-01`,
    gradingDeadline: `${endYear}-05-15`,
    isCurrent: false,
  }
}

function termExists(terms: AcademicTermRecord[], code: string) {
  return terms.some((t) => t.code.toUpperCase() === code.toUpperCase())
}

function yearExists(years: AcademicYearRecord[], code: string) {
  return years.some((y) => y.code === code)
}

/**
 * Ensures the institution calendar has `programYears` academic years, each with
 * `semestersPerYear` semesters (default 2: Fall + Spring).
 */
export function ensureProgramCalendar(
  years: AcademicYearRecord[],
  terms: AcademicTermRecord[],
  programYears: number,
  campusId?: string,
  semestersPerYear: number = DEFAULT_SEMESTERS_PER_YEAR,
): { years: AcademicYearRecord[]; terms: AcademicTermRecord[]; termsAdded: number } {
  const nextYears = [...years]
  let nextTerms = [...terms]
  let termsAdded = 0

  const countScopedYears = () =>
    (campusId ? nextYears.filter((y) => !y.campusId || y.campusId === campusId) : nextYears).length

  const scopedYears = campusId
    ? nextYears.filter((y) => !y.campusId || y.campusId === campusId)
    : nextYears

  let startYear =
    scopedYears.length > 0
      ? Math.max(...scopedYears.map((y) => parseYearStart(y.code))) + 1
      : new Date().getFullYear()

  if (scopedYears.length === 0) {
    startYear = new Date().getFullYear()
  }

  while (countScopedYears() < programYears) {
    const span = academicYearSpan(startYear)
    if (!yearExists(nextYears, span.code)) {
      nextYears.push({
        id: createId('ay'),
        ...span,
        campusId,
        isCurrent: nextYears.length === 0,
      })
    }
    startYear += 1
  }

  const targetYears = (campusId
    ? nextYears.filter((y) => !y.campusId || y.campusId === campusId)
    : nextYears
  )
    .sort((a, b) => parseYearStart(a.code) - parseYearStart(b.code))
    .slice(0, programYears)

  for (const year of targetYears) {
    const y0 = parseYearStart(year.code)
    const y1 = y0 + 1

    if (semestersPerYear >= 1 && !termExists(nextTerms, `${y0}-FALL`)) {
      nextTerms.push(fallTermForYear(y0, year.id, campusId))
      termsAdded += 1
    }
    if (semestersPerYear >= 2 && !termExists(nextTerms, `${y1}-SPRING`)) {
      nextTerms.push(springTermForYear(y1, year.id, campusId))
      termsAdded += 1
    }
  }

  return { years: nextYears, terms: nextTerms, termsAdded }
}

export function sortTermsChronologically(terms: AcademicTermRecord[]): AcademicTermRecord[] {
  return [...terms].sort((a, b) => a.startDate.localeCompare(b.startDate))
}

export function termAvailabilityLabel(
  term: AcademicTermRecord,
  currentTermId?: string,
): string {
  if (term.id === currentTermId || term.isCurrent) return 'Current'
  const today = new Date().toISOString().slice(0, 10)
  if (term.endDate < today) return 'Past'
  if (term.startDate > today) return 'Upcoming'
  return 'Active'
}

export function formatTermOptionLabel(term: AcademicTermRecord, currentTermId?: string): string {
  const tag = termAvailabilityLabel(term, currentTermId)
  return tag === 'Current' ? `${term.name} (current)` : `${term.name} (${tag.toLowerCase()})`
}

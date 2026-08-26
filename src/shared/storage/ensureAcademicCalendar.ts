import type { AcademicTermRecord, AcademicYearRecord } from '../../modules/institution/types/academic'
import type { Department } from '../../modules/institution/types'
import { seedAcademicTerms, seedAcademicYears } from '../../modules/institution/data/academicSeedData'
import { DEFAULT_SEMESTERS_PER_YEAR, ensureProgramCalendar } from '../../modules/institution/utils/academicTermUtils'

function readDepartments(collections: Record<string, unknown>): Department[] {
  const raw = collections.departments
  return Array.isArray(raw) ? (raw as Department[]) : []
}

function readCampusId(collections: Record<string, unknown>): string | undefined {
  const campuses = collections.campuses
  if (!Array.isArray(campuses) || campuses.length === 0) return undefined
  const first = campuses[0] as { id?: string }
  return first.id
}

/**
 * Ensures the academic calendar has enough years/semesters for program duration.
 * Only adds missing entries — never removes terms an admin created.
 */
export function ensureAcademicCalendarCollections(
  collections: Record<string, unknown>,
): Record<string, unknown> {
  const departments = readDepartments(collections)
  const programYears = Math.max(...departments.map((d) => d.maxYears ?? 4), 4)
  const semestersPerYear = DEFAULT_SEMESTERS_PER_YEAR
  const expectedTerms = programYears * semestersPerYear

  const years = Array.isArray(collections['academic-years'])
    ? (collections['academic-years'] as AcademicYearRecord[])
    : seedAcademicYears
  const terms = Array.isArray(collections['academic-terms'])
    ? (collections['academic-terms'] as AcademicTermRecord[])
    : seedAcademicTerms

  if (terms.length >= expectedTerms) {
    return collections
  }

  const campusId = readCampusId(collections)
  const result = ensureProgramCalendar(years, terms, programYears, campusId, semestersPerYear)

  if (result.years.length === years.length && result.terms.length === terms.length) {
    return collections
  }

  return {
    ...collections,
    'academic-years': result.years,
    'academic-terms': result.terms,
  }
}

export function academicCalendarWasPatched(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): boolean {
  const beforeTerms = before['academic-terms']
  const afterTerms = after['academic-terms']
  if (!Array.isArray(beforeTerms) || !Array.isArray(afterTerms)) return false
  return afterTerms.length > beforeTerms.length
}

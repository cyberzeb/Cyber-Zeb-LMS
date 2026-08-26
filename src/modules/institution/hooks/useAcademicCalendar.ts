import { useCallback, useMemo } from 'react'
import { useApiCollection } from '../../../shared/hooks/useApiCollection'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { STORAGE_EVENTS, STORAGE_KEYS } from '../../../shared/storage/keys'
import {
  seedAcademicTerms,
  seedAcademicYears,
} from '../data/academicSeedData'
import {
  DEFAULT_SEMESTERS_PER_YEAR,
  ensureProgramCalendar,
} from '../utils/academicTermUtils'
import type {
  AcademicTermRecord,
  AcademicTermStatus,
  AcademicTermType,
  AcademicYearRecord,
} from '../types/academic'

function notifyAcademicUpdated() {
  window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.academicUpdated))
}

export function useAcademicCalendar() {
  const [years, setYearsRaw] = useApiCollection<AcademicYearRecord[]>(
    STORAGE_KEYS.academicYears,
    seedAcademicYears,
  )
  const [terms, setTermsRaw] = useApiCollection<AcademicTermRecord[]>(
    STORAGE_KEYS.academicTerms,
    seedAcademicTerms,
  )

  const setYears = useCallback(
    (updater: AcademicYearRecord[] | ((prev: AcademicYearRecord[]) => AcademicYearRecord[])) => {
      setYearsRaw(updater)
      notifyAcademicUpdated()
    },
    [setYearsRaw],
  )

  const setTerms = useCallback(
    (updater: AcademicTermRecord[] | ((prev: AcademicTermRecord[]) => AcademicTermRecord[])) => {
      setTermsRaw(updater)
      notifyAcademicUpdated()
    },
    [setTermsRaw],
  )

  const currentTerm = useMemo(() => terms.find((t) => t.isCurrent), [terms])
  const currentYear = useMemo(
    () => (currentTerm ? years.find((y) => y.id === currentTerm.academicYearId) : years.find((y) => y.isCurrent)),
    [years, currentTerm],
  )

  const addYear = useCallback(
    (input: Omit<AcademicYearRecord, 'id'>) => {
      const row: AcademicYearRecord = { id: createId('ay'), ...input }
      setYears((prev) => [row, ...prev])
      return row
    },
    [setYears],
  )

  const addTerm = useCallback(
    (input: Omit<AcademicTermRecord, 'id'>) => {
      const row: AcademicTermRecord = { id: createId('term'), ...input }
      setTerms((prev) => [row, ...prev])
      return row
    },
    [setTerms],
  )

  const updateTerm = useCallback(
    (id: string, patch: Partial<Omit<AcademicTermRecord, 'id'>>) => {
      setTerms((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    },
    [setTerms],
  )

  const setCurrentTerm = useCallback(
    (termId: string) => {
      const target = terms.find((t) => t.id === termId)
      if (!target) return
      setTerms((prev) =>
        prev.map((t) => ({
          ...t,
          isCurrent: t.id === termId,
        })),
      )
      setYears((prev) =>
        prev.map((y) => ({
          ...y,
          isCurrent: y.id === target.academicYearId,
        })),
      )
    },
    [terms, setTerms, setYears],
  )

  const removeTerm = useCallback(
    (id: string) => {
      setTerms((prev) => prev.filter((t) => t.id !== id))
    },
    [setTerms],
  )

  const termsForYear = useCallback(
    (yearId: string) => terms.filter((t) => t.academicYearId === yearId),
    [terms],
  )

  const ensureCalendarForProgram = useCallback(
    (programYears: number, campusId?: string, semestersPerYear = DEFAULT_SEMESTERS_PER_YEAR) => {
      const result = ensureProgramCalendar(years, terms, programYears, campusId, semestersPerYear)
      if (result.years.length !== years.length) setYears(result.years)
      if (result.terms.length !== terms.length) setTerms(result.terms)
      return result.termsAdded
    },
    [years, terms, setYears, setTerms],
  )

  return {
    years,
    terms,
    currentTerm,
    currentYear,
    setYears,
    setTerms,
    addYear,
    addTerm,
    updateTerm,
    setCurrentTerm,
    removeTerm,
    termsForYear,
    ensureCalendarForProgram,
  }
}

export type CreateTermInput = {
  academicYearId: string
  code: string
  name: string
  campusId?: string
  termType?: AcademicTermType
  status?: AcademicTermStatus
  startDate: string
  endDate: string
  registrationOpens?: string
  registrationCloses?: string
  classesStart?: string
  classesEnd?: string
  gradingDeadline?: string
}

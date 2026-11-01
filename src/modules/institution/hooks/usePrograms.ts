import { useCallback, useMemo } from 'react'
import { useApiCollection } from '../../../shared/hooks/useApiCollection'
import { STORAGE_KEYS } from '../../../shared/storage/keys'
import { DEFAULT_CAMPUS_ID } from '../data/orgSeedData'
import type { ProgramRow } from '../types'
import { DEFAULT_PROGRAM_SEMESTERS, DEFAULT_PROGRAM_YEARS, formatDuration } from '../utils/programUtils'

type StoredProgram = Partial<ProgramRow> & Pick<ProgramRow, 'id' | 'name' | 'code'>

/** Fills fields older program records may lack (duration as a number, campus, curriculum). */
export function normalizeProgram(raw: StoredProgram): ProgramRow {
  const fromText = Number.parseInt(String(raw.duration ?? ''), 10)
  const durationYears = raw.durationYears ?? (Number.isFinite(fromText) && fromText > 0 ? fromText : DEFAULT_PROGRAM_YEARS)
  const curriculum = raw.curriculum ?? []
  return {
    level: 'Undergraduate',
    departmentId: '',
    department: '',
    enrolledCount: 0,
    status: 'active',
    ...raw,
    campusId: raw.campusId ?? DEFAULT_CAMPUS_ID,
    durationYears,
    semestersPerYear: raw.semestersPerYear ?? DEFAULT_PROGRAM_SEMESTERS,
    duration: formatDuration(durationYears),
    curriculum,
    courseCount: new Set(curriculum.map((e) => e.courseId)).size,
  } as ProgramRow
}

export function usePrograms() {
  const [raw, setRaw] = useApiCollection<StoredProgram[]>(STORAGE_KEYS.programs, [])
  const programs = useMemo(() => raw.map(normalizeProgram), [raw])

  const setPrograms = useCallback(
    (updater: ProgramRow[] | ((prev: ProgramRow[]) => ProgramRow[])) => {
      setRaw((prev) => {
        const current = prev.map(normalizeProgram)
        return typeof updater === 'function' ? updater(current) : updater
      })
    },
    [setRaw],
  )

  const saveProgram = useCallback(
    (program: ProgramRow) => {
      const next = normalizeProgram(program)
      setPrograms((prev) =>
        prev.some((p) => p.id === next.id) ? prev.map((p) => (p.id === next.id ? next : p)) : [next, ...prev],
      )
      return next
    },
    [setPrograms],
  )

  const removeProgram = useCallback(
    (id: string) => setPrograms((prev) => prev.filter((p) => p.id !== id)),
    [setPrograms],
  )

  return { programs, setPrograms, saveProgram, removeProgram }
}

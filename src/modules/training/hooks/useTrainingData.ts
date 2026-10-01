import { useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { refreshCollection, useApiCollection } from '../../../shared/hooks/useApiCollection'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { STORAGE_KEYS } from '../../../shared/storage/keys'
import type { Cohort, CohortRegistration, CohortSession, TrainingProgram } from '../types'

const NO_PROGRAMS: TrainingProgram[] = []
const NO_COHORTS: Cohort[] = []
const NO_REGISTRATIONS: CohortRegistration[] = []
const NO_SESSIONS: CohortSession[] = []

export function useTrainingPrograms() {
  const [programs, setPrograms, isLoading] = useApiCollection<TrainingProgram[]>(STORAGE_KEYS.trainingPrograms, NO_PROGRAMS)

  const saveProgram = useCallback(
    (input: Omit<TrainingProgram, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const now = new Date().toISOString()
      const id = input.id ?? createId('prg')
      setPrograms((prev) => {
        const existing = prev.find((p) => p.id === id)
        const record: TrainingProgram = { ...(existing ?? { createdAt: now }), ...input, id, updatedAt: now } as TrainingProgram
        return existing ? prev.map((p) => (p.id === id ? record : p)) : [record, ...prev]
      })
      return id
    },
    [setPrograms],
  )

  const deleteProgram = useCallback((id: string) => setPrograms((prev) => prev.filter((p) => p.id !== id)), [setPrograms])

  return { programs, setPrograms, saveProgram, deleteProgram, isLoading }
}

export function useCohorts() {
  const [cohorts, setCohorts, isLoading] = useApiCollection<Cohort[]>(STORAGE_KEYS.cohorts, NO_COHORTS)

  const saveCohort = useCallback(
    (input: Omit<Cohort, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const now = new Date().toISOString()
      const id = input.id ?? createId('coh')
      setCohorts((prev) => {
        const existing = prev.find((c) => c.id === id)
        const record: Cohort = { ...(existing ?? { createdAt: now }), ...input, id, updatedAt: now } as Cohort
        return existing ? prev.map((c) => (c.id === id ? record : c)) : [record, ...prev]
      })
      return id
    },
    [setCohorts],
  )

  const updateCohort = useCallback(
    (id: string, patch: Partial<Cohort>) =>
      setCohorts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c))),
    [setCohorts],
  )

  const deleteCohort = useCallback((id: string) => setCohorts((prev) => prev.filter((c) => c.id !== id)), [setCohorts])

  return { cohorts, setCohorts, saveCohort, updateCohort, deleteCohort, isLoading }
}

/** Registrations are written by the server (registration, payment, admin actions); the portal only reads them. */
export function useCohortRegistrations() {
  const [registrations] = useApiCollection<CohortRegistration[]>(STORAGE_KEYS.cohortRegistrations, NO_REGISTRATIONS)
  return { registrations }
}

export function useCohortAttendance() {
  const [sessions, setSessions] = useApiCollection<CohortSession[]>(STORAGE_KEYS.cohortAttendance, NO_SESSIONS)

  const saveSession = useCallback(
    (session: Omit<CohortSession, 'id'> & { id?: string }) => {
      const id = session.id ?? createId('att')
      setSessions((prev) => {
        const record = { ...session, id } as CohortSession
        return prev.some((s) => s.id === id) ? prev.map((s) => (s.id === id ? record : s)) : [record, ...prev]
      })
      return id
    },
    [setSessions],
  )

  const deleteSession = useCallback((id: string) => setSessions((prev) => prev.filter((s) => s.id !== id)), [setSessions])

  return { sessions, saveSession, deleteSession }
}

/** Re-read everything a server-side registration change touches. */
export function useRefreshTraining() {
  const queryClient = useQueryClient()
  return useCallback(async () => {
    await Promise.all(
      [
        STORAGE_KEYS.cohortRegistrations,
        STORAGE_KEYS.enrollments,
        STORAGE_KEYS.payments,
        STORAGE_KEYS.people,
        STORAGE_KEYS.certificates,
      ].map((key) => refreshCollection(queryClient, key).catch(() => undefined)),
    )
  }, [queryClient])
}

/** Lookups used on most training pages. */
export function useTrainingIndex() {
  const { programs } = useTrainingPrograms()
  const { cohorts } = useCohorts()
  return useMemo(
    () => ({
      programById: new Map(programs.map((p) => [p.id, p])),
      cohortById: new Map(cohorts.map((c) => [c.id, c])),
    }),
    [programs, cohorts],
  )
}

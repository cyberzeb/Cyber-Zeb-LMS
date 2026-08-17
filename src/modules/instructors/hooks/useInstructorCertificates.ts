import { useCallback, useEffect, useState } from 'react'
import { STORAGE_EVENTS, STORAGE_KEYS } from '../../../shared/storage/keys'
import { fetchInstructorCertificates } from '../api/instructorApi'
import type { InstructorCertificateRow } from '../types'

const RELOAD_KEYS = new Set<string>([
  STORAGE_KEYS.courses,
  STORAGE_KEYS.enrollments,
  STORAGE_KEYS.certificates,
  STORAGE_KEYS.people,
  STORAGE_KEYS.session,
])

export function useInstructorCertificates() {
  const [rows, setRows] = useState<InstructorCertificateRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchInstructorCertificates()
      setRows(data)
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Failed to load certificate data.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    void reload()
  }, [reload])

  // Reactive reload on storage changes
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key && RELOAD_KEYS.has(event.key)) void reload()
    }
    const onCustom = () => void reload()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void reload()
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener(STORAGE_EVENTS.certificatesUpdated, onCustom)
    window.addEventListener(STORAGE_EVENTS.enrollmentsUpdated, onCustom)
    window.addEventListener(STORAGE_EVENTS.coursesUpdated, onCustom)
    window.addEventListener(STORAGE_EVENTS.peopleUpdated, onCustom)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(STORAGE_EVENTS.certificatesUpdated, onCustom)
      window.removeEventListener(STORAGE_EVENTS.enrollmentsUpdated, onCustom)
      window.removeEventListener(STORAGE_EVENTS.coursesUpdated, onCustom)
      window.removeEventListener(STORAGE_EVENTS.peopleUpdated, onCustom)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [reload])

  return { rows, isLoading, isError: error !== null, error, reload }
}

import { useCallback, useEffect, useState } from 'react'
import { STORAGE_EVENTS } from '../../../shared/storage/keys'
import { fetchInstructorCertificates } from '../api/instructorApi'
import type { InstructorCertificateRow } from '../types'

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

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    const onCustom = () => void reload()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void reload()
    }

    window.addEventListener(STORAGE_EVENTS.certificatesUpdated, onCustom)
    window.addEventListener(STORAGE_EVENTS.enrollmentsUpdated, onCustom)
    window.addEventListener(STORAGE_EVENTS.coursesUpdated, onCustom)
    window.addEventListener(STORAGE_EVENTS.peopleUpdated, onCustom)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.removeEventListener(STORAGE_EVENTS.certificatesUpdated, onCustom)
      window.removeEventListener(STORAGE_EVENTS.enrollmentsUpdated, onCustom)
      window.removeEventListener(STORAGE_EVENTS.coursesUpdated, onCustom)
      window.removeEventListener(STORAGE_EVENTS.peopleUpdated, onCustom)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [reload])

  return { rows, isLoading, isError: error !== null, error, reload }
}

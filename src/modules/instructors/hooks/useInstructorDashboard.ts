import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { STORAGE_EVENTS, STORAGE_KEYS } from '../../../shared/storage/keys'
import { fetchInstructorDashboardData } from '../api/instructorApi'
import type { InstructorDashboardData } from '../types'

const RELOAD_KEYS = new Set<string>([
  STORAGE_KEYS.courses,
  STORAGE_KEYS.enrollments,
  STORAGE_KEYS.people,
  STORAGE_KEYS.departments,
  STORAGE_KEYS.session,
])

export function useInstructorDashboard() {
  const location = useLocation()
  const [data, setData] = useState<InstructorDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const nextData = await fetchInstructorDashboardData()
      setData(nextData)
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Failed to load instructor dashboard data.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [location.pathname, reload])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key && RELOAD_KEYS.has(event.key)) void reload()
    }

    const onCustom = () => void reload()

    const onVisible = () => {
      if (document.visibilityState === 'visible') void reload()
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener(STORAGE_EVENTS.enrollmentsUpdated, onCustom)
    window.addEventListener(STORAGE_EVENTS.coursesUpdated, onCustom)
    window.addEventListener(STORAGE_EVENTS.peopleUpdated, onCustom)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(STORAGE_EVENTS.enrollmentsUpdated, onCustom)
      window.removeEventListener(STORAGE_EVENTS.coursesUpdated, onCustom)
      window.removeEventListener(STORAGE_EVENTS.peopleUpdated, onCustom)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [reload])

  return {
    data,
    isLoading,
    isError: error !== null,
    error,
    reload,
  }
}

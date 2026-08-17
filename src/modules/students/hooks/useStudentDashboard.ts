import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { STORAGE_EVENTS, STORAGE_KEYS } from '../../../shared/storage/keys'
import { fetchStudentDashboardData } from '../api/studentpApi'
import type { StudentDashboardData } from '../types'

const RELOAD_KEYS = new Set<string>([
  STORAGE_KEYS.courses,
  STORAGE_KEYS.enrollments,
  STORAGE_KEYS.lessonProgress,
  STORAGE_KEYS.people,
  STORAGE_KEYS.departments,
  STORAGE_KEYS.session,
  STORAGE_KEYS.announcements,
  STORAGE_KEYS.certificates,
  STORAGE_KEYS.liveSessions,
  STORAGE_KEYS.assignments,
  STORAGE_KEYS.quizzes,
  STORAGE_KEYS.questionBank,
  STORAGE_KEYS.studentSubmissions,
])

export function useStudentDashboard() {
  const location = useLocation()
  const [data, setData] = useState<StudentDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const nextData = await fetchStudentDashboardData()
      setData(nextData)
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Failed to load student dashboard data.'))
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
    window.addEventListener(STORAGE_EVENTS.lessonProgressUpdated, onCustom)
    window.addEventListener(STORAGE_EVENTS.announcementsUpdated, onCustom)
    window.addEventListener(STORAGE_EVENTS.certificatesUpdated, onCustom)
    window.addEventListener(STORAGE_EVENTS.assessmentsUpdated, onCustom)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(STORAGE_EVENTS.enrollmentsUpdated, onCustom)
      window.removeEventListener(STORAGE_EVENTS.coursesUpdated, onCustom)
      window.removeEventListener(STORAGE_EVENTS.peopleUpdated, onCustom)
      window.removeEventListener(STORAGE_EVENTS.lessonProgressUpdated, onCustom)
      window.removeEventListener(STORAGE_EVENTS.announcementsUpdated, onCustom)
      window.removeEventListener(STORAGE_EVENTS.certificatesUpdated, onCustom)
      window.removeEventListener(STORAGE_EVENTS.assessmentsUpdated, onCustom)
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
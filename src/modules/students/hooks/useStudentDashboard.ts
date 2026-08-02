import { useCallback, useEffect, useState } from 'react'
import { fetchStudentDashboardData } from '../api/studentpApi'
import type { StudentDashboardData } from '../types'

export function useStudentDashboard() {
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
  }, [reload])

  return {
    data,
    isLoading,
    isError: error !== null,
    error,
    reload,
  }
}
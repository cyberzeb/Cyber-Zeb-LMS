import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getInstitutionOverview } from '../api/institutionApi'
import { STORAGE_EVENTS, STORAGE_KEYS } from '../../../shared/storage/keys'

export function useInstitutionOverview() {
  const query = useQuery({
    queryKey: ['institution-overview'],
    queryFn: getInstitutionOverview,
  })

  useEffect(() => {
    const invalidate = () => void query.refetch()
    const onStorage = (event: StorageEvent) => {
      if (!event.key) return
      const reloadKeys = new Set<string>([
        STORAGE_KEYS.people,
        STORAGE_KEYS.courses,
        STORAGE_KEYS.enrollments,
        STORAGE_KEYS.departments,
        STORAGE_KEYS.campuses,
        STORAGE_KEYS.settings,
        STORAGE_KEYS.announcements,
      ])
      if (reloadKeys.has(event.key)) invalidate()
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener(STORAGE_EVENTS.enrollmentsUpdated, invalidate)
    window.addEventListener(STORAGE_EVENTS.peopleUpdated, invalidate)
    window.addEventListener(STORAGE_EVENTS.announcementsUpdated, invalidate)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') invalidate()
    })
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(STORAGE_EVENTS.enrollmentsUpdated, invalidate)
      window.removeEventListener(STORAGE_EVENTS.peopleUpdated, invalidate)
      window.removeEventListener(STORAGE_EVENTS.announcementsUpdated, invalidate)
    }
  }, [query])

  return query
}

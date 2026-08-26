import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getInstitutionOverview } from '../api/institutionApi'
import { STORAGE_EVENTS } from '../../../shared/storage/keys'

export function useInstitutionOverview() {
  const query = useQuery({
    queryKey: ['institution-overview'],
    queryFn: getInstitutionOverview,
  })

  useEffect(() => {
    const invalidate = () => void query.refetch()

    window.addEventListener(STORAGE_EVENTS.enrollmentsUpdated, invalidate)
    window.addEventListener(STORAGE_EVENTS.peopleUpdated, invalidate)
    window.addEventListener(STORAGE_EVENTS.announcementsUpdated, invalidate)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') invalidate()
    })
    return () => {
      window.removeEventListener(STORAGE_EVENTS.enrollmentsUpdated, invalidate)
      window.removeEventListener(STORAGE_EVENTS.peopleUpdated, invalidate)
      window.removeEventListener(STORAGE_EVENTS.announcementsUpdated, invalidate)
    }
  }, [query])

  return query
}

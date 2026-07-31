import { useQuery } from '@tanstack/react-query'
import { getInstitutionOverview } from '../api/institutionApi'

export function useInstitutionOverview() {
  return useQuery({
    queryKey: ['institution-overview'],
    queryFn: getInstitutionOverview,
  })
}

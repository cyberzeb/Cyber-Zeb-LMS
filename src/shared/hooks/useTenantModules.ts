import { useQuery } from '@tanstack/react-query'

import { apiClient, getAccessToken } from '../api/client'
import type { ModuleKey } from '../constants/modules'

export interface TenantModules {
  enabled: ModuleKey[]
  locked: ModuleKey[]
  labels: Record<string, string>
}

/**
 * Which modules this institution bought.
 *
 * Advisory only — the API refuses a locked module whatever the browser believes.
 * This exists so the workspace can show those areas locked with a way to request
 * them, instead of linking to pages that answer 403.
 *
 * While it loads, and if it fails, nothing is treated as locked: a transient
 * network error must never hide an institution's own navigation.
 */
export function useTenantModules() {
  const signedIn = Boolean(getAccessToken())

  const { data, isLoading } = useQuery({
    queryKey: ['tenant-modules'],
    enabled: signedIn,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<TenantModules> => {
      const { data } = await apiClient.get<TenantModules>('/tenants/me/modules')
      return data
    },
  })

  const locked = new Set<string>(data?.locked ?? [])

  return {
    enabled: data?.enabled ?? [],
    lockedKeys: data?.locked ?? [],
    labels: data?.labels ?? {},
    isLoading: signedIn && isLoading,
    isLocked: (module?: string) => Boolean(module && locked.has(module)),
  }
}

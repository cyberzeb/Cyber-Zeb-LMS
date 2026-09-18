import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchCollection } from '../api/dataApi'
import { toApiKey } from '../api/collectionKeys'
import { getCachedCollection, hasCachedCollection, setCachedCollection } from '../storage/dataCache'
import { saveCollectionChange } from '../storage/collectionSync'

export function collectionQueryKey(apiKey: string) {
  return ['collection', apiKey] as const
}

export function useApiCollection<T>(storageKey: string, initialValue: T) {
  const apiKey = toApiKey(storageKey)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: collectionQueryKey(apiKey),
    queryFn: () => fetchCollection<T>(apiKey),
    initialData: () => getCachedCollection<T>(apiKey, initialValue),
    staleTime: 30_000,
  })

  const setValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      const prev = queryClient.getQueryData<T>(collectionQueryKey(apiKey)) ?? initialValue
      const next = typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater
      // Diff against the last state known to be on the server (the cache), not
      // the rendered fallback, so first-time writes of seed data are saved too.
      const base = hasCachedCollection(apiKey) ? getCachedCollection<T | undefined>(apiKey, undefined) : undefined
      queryClient.setQueryData(collectionQueryKey(apiKey), next)
      setCachedCollection(apiKey, next)
      saveCollectionChange(apiKey, base, next)
    },
    [apiKey, initialValue, queryClient],
  )

  const resolved =
    data == null ||
    (typeof data === 'object' &&
      !Array.isArray(data) &&
      Object.keys(data as object).length === 0 &&
      typeof initialValue === 'object' &&
      initialValue !== null &&
      !Array.isArray(initialValue))
      ? initialValue
      : (data ?? initialValue)

  return [resolved, setValue, isLoading, error] as const
}

/** Imperatively refresh a collection from the API. */
export async function refreshCollection<T>(queryClient: ReturnType<typeof useQueryClient>, storageKey: string) {
  const apiKey = toApiKey(storageKey)
  const data = await fetchCollection<T>(apiKey)
  setCachedCollection(apiKey, data)
  queryClient.setQueryData(collectionQueryKey(apiKey), data)
  return data
}

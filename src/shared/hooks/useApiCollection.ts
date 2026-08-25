import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchCollection, putCollection } from '../api/dataApi'
import { toApiKey } from '../api/collectionKeys'
import { isMockDataMode } from '../config/dataSource'
import { getCachedCollection, setCachedCollection } from '../storage/dataCache'
import { persistLocalCollection, readLocalCollection } from '../storage/localDataSource'

export function collectionQueryKey(apiKey: string) {
  return ['collection', apiKey] as const
}

export function useApiCollection<T>(storageKey: string, initialValue: T) {
  const apiKey = toApiKey(storageKey)
  const queryClient = useQueryClient()
  const mockMode = isMockDataMode()

  const { data, isLoading, error } = useQuery({
    queryKey: collectionQueryKey(apiKey),
    queryFn: () => {
      if (mockMode) {
        return Promise.resolve(readLocalCollection<T>(storageKey, initialValue))
      }
      return fetchCollection<T>(apiKey)
    },
    initialData: () => getCachedCollection<T>(apiKey, initialValue),
    staleTime: mockMode ? Infinity : 30_000,
  })

  const setValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      const prev = queryClient.getQueryData<T>(collectionQueryKey(apiKey)) ?? initialValue
      const next = typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater
      queryClient.setQueryData(collectionQueryKey(apiKey), next)
      if (mockMode) {
        persistLocalCollection(storageKey, next)
        return
      }
      setCachedCollection(apiKey, next)
      void putCollection(apiKey, next).catch((err) => {
        console.error(`Failed to persist collection "${apiKey}"`, err)
      })
    },
    [apiKey, initialValue, mockMode, queryClient, storageKey],
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

/** Imperatively refresh a collection from the API or local storage. */
export async function refreshCollection<T>(
  queryClient: ReturnType<typeof useQueryClient>,
  storageKey: string,
  initialValue: T,
) {
  const apiKey = toApiKey(storageKey)
  const data = isMockDataMode()
    ? readLocalCollection<T>(storageKey, initialValue)
    : await fetchCollection<T>(apiKey)
  setCachedCollection(apiKey, data)
  queryClient.setQueryData(collectionQueryKey(apiKey), data)
  return data
}

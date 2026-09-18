import { toApiKey } from '../api/collectionKeys'
import { getCachedCollection, hasCachedCollection, setCachedCollection } from './dataCache'
import { saveCollectionChange } from './collectionSync'

/** Update the in-memory cache and save the change to the backend (fire-and-forget). */
export function persistCollection(storageKey: string, data: unknown) {
  const apiKey = toApiKey(storageKey)
  const prev = hasCachedCollection(apiKey) ? getCachedCollection<unknown>(apiKey, undefined) : undefined
  setCachedCollection(apiKey, data)
  saveCollectionChange(apiKey, prev, data)
}

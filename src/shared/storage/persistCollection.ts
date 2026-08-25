import { putCollection } from '../api/dataApi'
import { toApiKey } from '../api/collectionKeys'
import { setCachedCollection } from './dataCache'

/** Update in-memory cache and persist to the backend (fire-and-forget). */
export function persistCollection(storageKey: string, data: unknown) {
  const apiKey = toApiKey(storageKey)
  setCachedCollection(apiKey, data)
  void putCollection(apiKey, data).catch((err) => {
    console.error(`Failed to persist "${apiKey}"`, err)
  })
}

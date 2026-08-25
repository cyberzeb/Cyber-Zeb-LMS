import { putCollection } from '../api/dataApi'
import { toApiKey } from '../api/collectionKeys'
import { isMockDataMode } from '../config/dataSource'
import { setCachedCollection } from './dataCache'
import { persistLocalCollection } from './localDataSource'

/** Update in-memory cache and persist (localStorage in mock mode, API otherwise). */
export function persistCollection(storageKey: string, data: unknown) {
  if (isMockDataMode()) {
    persistLocalCollection(storageKey, data)
    return
  }

  const apiKey = toApiKey(storageKey)
  setCachedCollection(apiKey, data)
  void putCollection(apiKey, data).catch((err) => {
    console.error(`Failed to persist "${apiKey}"`, err)
  })
}

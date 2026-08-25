import { STORAGE_TO_API_KEY, toApiKey } from '../api/collectionKeys'
import { buildSeedPayload } from './buildSeedPayload'
import { hydrateCache, setCachedCollection } from './dataCache'
import { initBeranaStorage } from './initStorage'
import { STORAGE_KEYS } from './keys'

const SKIP_STORAGE_KEYS = new Set<string>([STORAGE_KEYS.version, STORAGE_KEYS.session])

function storageKeyForApiKey(apiKey: string): string | undefined {
  for (const [storageKey, mappedApiKey] of Object.entries(STORAGE_TO_API_KEY)) {
    if (mappedApiKey === apiKey) return storageKey
  }
  return undefined
}

function readFromLocalStorage<T>(storageKey: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** Seed localStorage + hydrate the in-memory cache for frontend-only mode. */
export function bootstrapLocalMockData(): Record<string, unknown> {
  initBeranaStorage()

  const seed = buildSeedPayload()
  const collections: Record<string, unknown> = { ...seed }

  for (const storageKey of Object.values(STORAGE_KEYS)) {
    if (SKIP_STORAGE_KEYS.has(storageKey)) continue

    const apiKey = toApiKey(storageKey)
    const stored = readFromLocalStorage<unknown | null>(storageKey, null)

    if (stored !== null) {
      collections[apiKey] = stored
    } else if (apiKey in collections) {
      window.localStorage.setItem(storageKey, JSON.stringify(collections[apiKey]))
    }
  }

  hydrateCache(collections)
  return collections
}

export function readLocalCollection<T>(storageKey: string, fallback: T): T {
  return readFromLocalStorage(storageKey, fallback)
}

export function persistLocalCollection(storageKey: string, data: unknown) {
  const apiKey = toApiKey(storageKey)
  setCachedCollection(apiKey, data)
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(data))
  } catch (err) {
    console.error(`Failed to persist "${storageKey}" to localStorage`, err)
  }
}

export function persistLocalCollectionByApiKey(apiKey: string, data: unknown) {
  const storageKey = storageKeyForApiKey(apiKey)
  if (!storageKey) {
    setCachedCollection(apiKey, data)
    return
  }
  persistLocalCollection(storageKey, data)
}

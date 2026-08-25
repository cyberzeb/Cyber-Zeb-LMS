/**
 * In-memory sync cache populated from the API on bootstrap.
 * readers.ts reads from here so existing sync call sites keep working.
 */
const cache = new Map<string, unknown>()

export function setCachedCollection(key: string, data: unknown) {
  cache.set(key, data)
}

export function getCachedCollection<T>(key: string, fallback: T): T {
  if (cache.has(key)) return cache.get(key) as T
  return fallback
}

export function hydrateCache(collections: Record<string, unknown>) {
  for (const [key, data] of Object.entries(collections)) {
    cache.set(key, data)
  }
}

export function clearDataCache() {
  cache.clear()
}

export function getCacheKeys(): string[] {
  return [...cache.keys()]
}

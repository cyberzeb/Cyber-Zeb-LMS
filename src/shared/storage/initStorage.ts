import { STORAGE_KEYS, STORAGE_VERSION } from './keys'

const BERANA_PREFIX = 'berana:'

/** Clear seeded legacy data once when storage version changes. */
export function initBeranaStorage() {
  try {
    const current = Number(window.localStorage.getItem(STORAGE_KEYS.version) ?? '0')
    if (current >= STORAGE_VERSION) return

    const keysToRemove: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key?.startsWith(BERANA_PREFIX)) keysToRemove.push(key)
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key))
    window.localStorage.setItem(STORAGE_KEYS.version, String(STORAGE_VERSION))
  } catch {
    /* storage blocked */
  }
}

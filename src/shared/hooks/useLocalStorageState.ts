import { useCallback, useEffect, useState } from 'react'

/**
 * State that transparently persists to localStorage.
 * Used to simulate a working backend for the demo/presentation build.
 */
export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored !== null) return JSON.parse(stored) as T
    } catch {
      /* ignore corrupt storage */
    }
    return initialValue
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage may be full or blocked */
    }
  }, [key, value])

  const reset = useCallback(() => {
    setValue(initialValue)
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  }, [key, initialValue])

  return [value, setValue, reset] as const
}

/** Short unique id for locally-created records. */
export function createId(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

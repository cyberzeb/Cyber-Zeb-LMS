import { useCallback } from 'react'

import { useApiCollection } from './useApiCollection'

const NO_SETTINGS = {}

/**
 * Portal settings stored per person: the collection maps person id → settings.
 * (Previously one shared object, so every user overwrote everyone else's settings.)
 */
export function usePersonSettings<T>(storageKey: string, personId: string | undefined, fallback: T) {
  const [all, setAll] = useApiCollection<Record<string, T>>(storageKey, NO_SETTINGS)
  const stored = personId && all[personId] !== undefined ? all[personId] : fallback

  const setStored = useCallback(
    (value: T) => {
      if (!personId) return
      setAll((prev) => ({ ...prev, [personId]: value }))
    },
    [personId, setAll],
  )

  return [stored, setStored] as const
}

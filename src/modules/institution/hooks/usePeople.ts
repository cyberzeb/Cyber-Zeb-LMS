import { useCallback } from 'react'

import { useApiCollection } from '../../../shared/hooks/useApiCollection'
import { STORAGE_KEYS } from '../../../shared/storage/keys'
import { notifyPeopleUpdated } from '../utils/peopleVerification'
import { readPeople } from '../../../shared/storage/readers'

import type { PersonRow } from '../types'

export function usePeople() {
  const [people, setPeopleRaw] = useApiCollection<PersonRow[]>(STORAGE_KEYS.people, [])

  const setPeople = useCallback(
    (updater: PersonRow[] | ((prev: PersonRow[]) => PersonRow[])) => {
      setPeopleRaw(updater)
      notifyPeopleUpdated()
    },
    [setPeopleRaw],
  )

  return { people, setPeople }
}

export function readPeopleFromStorage(): PersonRow[] {
  return readPeople()
}

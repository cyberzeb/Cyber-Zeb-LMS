import { useCallback } from 'react'

import { useLocalStorageState } from '../../../shared/hooks/useLocalStorageState'

import { STORAGE_KEYS } from '../../../shared/storage/keys'

import { notifyPeopleUpdated } from '../utils/peopleVerification'

import type { PersonRow } from '../types'



export function usePeople() {

  const [people, setPeopleRaw] = useLocalStorageState<PersonRow[]>(STORAGE_KEYS.people, [])



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

  try {

    const stored = window.localStorage.getItem(STORAGE_KEYS.people)

    if (stored) return JSON.parse(stored) as PersonRow[]

  } catch {

    /* ignore */

  }

  return []

}


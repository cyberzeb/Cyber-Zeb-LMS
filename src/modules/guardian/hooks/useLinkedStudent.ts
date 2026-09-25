import { createContext, createElement, useContext, useMemo, useState, type ReactNode } from 'react'

import type { PersonRow } from '../../institution/types'
import { linkedStudentIdsOf } from '../../../shared/people/guardianLinks'
import { getSessionPerson } from '../../../shared/storage/session'
import { readPeople } from '../../../shared/storage/readers'

interface LinkedStudents {
  guardian: PersonRow | null
  /** Every student this guardian follows. */
  students: PersonRow[]
  /** The one the portal is currently showing. */
  student: PersonRow | null
  selectStudent: (id: string) => void
}

const SELECTED_KEY = 'berana:guardian-selected-child'

function readSelected(guardianId: string | undefined): string | null {
  if (!guardianId) return null
  try {
    return localStorage.getItem(`${SELECTED_KEY}:${guardianId}`)
  } catch {
    return null
  }
}

function useLinkedStudentsState(): LinkedStudents {
  const guardian = getSessionPerson()
  const students = useMemo(() => {
    const people = readPeople()
    return linkedStudentIdsOf(guardian, people)
      .map((id) => people.find((p) => p.id === id))
      .filter((p): p is PersonRow => Boolean(p))
    // The session person is stable for the life of the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guardian?.id])
  const [selectedId, setSelectedId] = useState<string | null>(() => readSelected(guardian?.id))

  const student = students.find((s) => s.id === selectedId) ?? students[0] ?? null

  function selectStudent(id: string) {
    setSelectedId(id)
    try {
      if (guardian) localStorage.setItem(`${SELECTED_KEY}:${guardian.id}`, id)
    } catch {
      /* private mode: the choice just is not remembered */
    }
  }

  return { guardian, students, student, selectStudent }
}

const LinkedStudentsContext = createContext<LinkedStudents | null>(null)

/** Shares the selected child across every guardian page. */
export function LinkedStudentsProvider({ children }: { children: ReactNode }) {
  const value = useLinkedStudentsState()
  return createElement(LinkedStudentsContext.Provider, { value }, children)
}

export function useLinkedStudent(): LinkedStudents {
  const shared = useContext(LinkedStudentsContext)
  const local = useLinkedStudentsState()
  return shared ?? local
}

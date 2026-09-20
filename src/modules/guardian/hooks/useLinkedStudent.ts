import { useMemo } from 'react'

import type { PersonRow } from '../../institution/types'
import { getSessionPerson } from '../../../shared/storage/session'
import { readPeople } from '../../../shared/storage/readers'

/**
 * The student this guardian is linked to.
 *
 * Newer records carry `linkedStudentId`; older demo records only name the child
 * in the guardian's `department` field, so both are supported.
 */
export function findLinkedStudent(guardian: PersonRow | null, people: PersonRow[]): PersonRow | null {
  if (!guardian) return null
  const byId = guardian.linkedStudentId
    ? people.find((p) => p.id === guardian.linkedStudentId)
    : undefined
  if (byId) return byId
  return (
    people.find(
      (p) => p.role === 'Student' && p.name === guardian.department && p.status !== 'suspended',
    ) ?? null
  )
}

export function useLinkedStudent() {
  const guardian = getSessionPerson()
  const student = useMemo(() => findLinkedStudent(guardian, readPeople()), [guardian])
  return { guardian, student }
}

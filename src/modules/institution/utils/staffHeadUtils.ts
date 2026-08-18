import type { PersonRow } from '../types'

/** Ensures only one staff member is head per office on a given campus. */
export function applyStaffHeadRules(people: PersonRow[], updated: PersonRow): PersonRow[] {
  return people.map((person) => {
    if (person.id === updated.id) return updated
    if (
      updated.isDepartmentHead &&
      person.role === 'Staff' &&
      person.campusId === updated.campusId &&
      person.department === updated.department
    ) {
      return { ...person, isDepartmentHead: false }
    }
    return person
  })
}

export function getOfficeHead(
  people: PersonRow[],
  office: string,
  campusId: string,
): PersonRow | undefined {
  return people.find(
    (p) =>
      p.role === 'Staff' &&
      p.department === office &&
      p.campusId === campusId &&
      p.isDepartmentHead,
  )
}

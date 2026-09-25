import type { PersonRow } from '../../modules/institution/types'

/**
 * The students a guardian follows. Newer records list them in `linkedStudentIds`,
 * some carry a single `linkedStudentId`, and the oldest demo records only name
 * the child in the guardian's `department` field — all three are honoured, as
 * the server does when it scopes a guardian's data.
 */
export function linkedStudentIdsOf(guardian: PersonRow | null | undefined, people: PersonRow[]): string[] {
  if (!guardian) return []
  const ids = new Set<string>(guardian.linkedStudentIds ?? [])
  if (guardian.linkedStudentId) ids.add(guardian.linkedStudentId)
  if (ids.size === 0 && guardian.department) {
    const byName = people.find(
      (p) => p.role === 'Student' && p.name === guardian.department && p.status !== 'suspended',
    )
    if (byName) ids.add(byName.id)
  }
  return [...ids]
}

/** Fields to store on a guardian record that links these students. */
export function guardianLinkFields(
  students: PersonRow[],
): Pick<PersonRow, 'linkedStudentId' | 'linkedStudentIds' | 'department' | 'campusId'> {
  return {
    linkedStudentId: students[0]?.id,
    linkedStudentIds: students.map((s) => s.id),
    // Shown in the people tables as "Linked student(s)".
    department: students.map((s) => s.name).join(', ') || '—',
    campusId: students[0]?.campusId,
  }
}

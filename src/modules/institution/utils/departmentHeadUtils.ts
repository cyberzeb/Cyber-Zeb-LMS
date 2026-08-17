import type { Department, PersonRow } from '../types'

const UNASSIGNED_HEAD = 'To be assigned'

function campusMatches(person: PersonRow, department: Department): boolean {
  return !person.campusId || person.campusId === department.campusId
}

/** Instructors/staff eligible to head a department (same campus; prefer same department name). */
export function getEligibleDepartmentHeads(
  people: PersonRow[],
  department: Department,
): PersonRow[] {
  const eligible = people.filter(
    (p) =>
      (p.role === 'Instructor' || p.role === 'Staff') &&
      p.status === 'active' &&
      campusMatches(p, department),
  )

  const inDepartment = eligible.filter((p) => p.department === department.name)
  const pool = inDepartment.length > 0 ? inDepartment : eligible.filter((p) => p.role === 'Instructor')

  return pool.sort((a, b) => a.name.localeCompare(b.name))
}

export function resolveDepartmentHeadId(department: Department, people: PersonRow[]): string {
  if (department.headId) {
    const linked = people.find((p) => p.id === department.headId)
    if (linked) return linked.id
  }

  if (department.headName && department.headName !== UNASSIGNED_HEAD) {
    const byName = people.find((p) => p.name === department.headName)
    if (byName) return byName.id
  }

  return ''
}

export function applyDepartmentHeadAssignments(
  departments: Department[],
  assignments: Record<string, string>,
  people: PersonRow[],
): Department[] {
  return departments.map((dept) => {
    const headId = assignments[dept.id] ?? resolveDepartmentHeadId(dept, people)
    if (!headId) {
      return { ...dept, headId: undefined, headName: UNASSIGNED_HEAD }
    }

    const person = people.find((p) => p.id === headId)
    return {
      ...dept,
      headId,
      headName: person?.name ?? dept.headName,
    }
  })
}

export function countAssignedHeads(departments: Department[], people: PersonRow[]): number {
  return departments.filter((d) => resolveDepartmentHeadId(d, people) !== '').length
}

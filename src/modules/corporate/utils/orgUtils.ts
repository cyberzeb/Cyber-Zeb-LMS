import { readPeople } from '../../../shared/storage/readers'
import type { Department } from '../../institution/types'
import type { PersonRow } from '../../institution/types'
import type { Team } from '../types'

export function getDepartmentStatus(department: Department): 'active' | 'inactive' {
  return department.status ?? 'active'
}

export function getTeamStatus(team: Team): 'active' | 'inactive' {
  return team.status
}

export function countEmployeesInDepartment(departmentId: string, people: PersonRow[] = readPeople()): number {
  return people.filter(
    (person) => person.departmentId === departmentId && person.status === 'active',
  ).length
}

export function countEmployeesInTeam(teamId: string, people: PersonRow[] = readPeople()): number {
  return people.filter(
    (person) => person.teamId === teamId && person.status === 'active',
  ).length
}

export function getTeamsForDepartment(teams: Team[], departmentId: string): Team[] {
  return teams.filter((team) => team.departmentId === departmentId)
}

export function getActiveTeamsForDepartment(teams: Team[], departmentId: string): Team[] {
  return getTeamsForDepartment(teams, departmentId).filter((team) => team.status === 'active')
}

export function getManagerName(managerId: string | null, people: PersonRow[] = readPeople()): string {
  if (!managerId) return '—'
  return people.find((person) => person.id === managerId)?.name ?? '—'
}

export interface DepartmentDeleteCheck {
  allowed: boolean
  reason?: string
}

export function canDeleteDepartment(
  departmentId: string,
  teams: Team[],
  people: PersonRow[] = readPeople(),
): DepartmentDeleteCheck {
  const activeTeams = getActiveTeamsForDepartment(teams, departmentId)
  if (activeTeams.length > 0) {
    return {
      allowed: false,
      reason: 'This department has active teams. Deactivate or remove them first.',
    }
  }

  const employeeCount = countEmployeesInDepartment(departmentId, people)
  if (employeeCount > 0) {
    return {
      allowed: false,
      reason: 'This department has assigned employees and cannot be removed yet.',
    }
  }

  return { allowed: true }
}

export interface TeamDeleteCheck {
  allowed: boolean
  reason?: string
}

export function canDeleteTeam(teamId: string, people: PersonRow[] = readPeople()): TeamDeleteCheck {
  const employeeCount = countEmployeesInTeam(teamId, people)
  if (employeeCount > 0) {
    return {
      allowed: false,
      reason: 'This team has assigned employees and cannot be removed yet.',
    }
  }

  return { allowed: true }
}

export function canDeactivateTeam(teamId: string, people: PersonRow[] = readPeople()): TeamDeleteCheck {
  return canDeleteTeam(teamId, people)
}

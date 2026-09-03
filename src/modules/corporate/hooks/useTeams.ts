import { useCallback } from 'react'
import { useApiCollection } from '../../../shared/hooks/useApiCollection'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { STORAGE_KEYS } from '../../../shared/storage/keys'
import { seedCorporateTeams } from '../data/teamsSeedData'
import type { Team, TeamStatus } from '../types'

export function useTeams() {
  const [teams, setTeamsRaw] = useApiCollection<Team[]>(STORAGE_KEYS.teams, seedCorporateTeams)

  const setTeams = useCallback(
    (updater: Team[] | ((prev: Team[]) => Team[])) => {
      setTeamsRaw(updater)
    },
    [setTeamsRaw],
  )

  const createTeam = useCallback(
    (input: {
      name: string
      description: string
      departmentId: string
      managerId?: string | null
      status?: TeamStatus
    }) => {
      const now = new Date().toISOString()
      const team: Team = {
        id: createId('team'),
        name: input.name.trim(),
        description: input.description.trim(),
        departmentId: input.departmentId,
        managerId: input.managerId ?? null,
        status: input.status ?? 'active',
        createdAt: now,
        updatedAt: now,
      }
      setTeams((prev) => [...prev, team])
      return team
    },
    [setTeams],
  )

  const updateTeam = useCallback(
    (teamId: string, patch: Partial<Omit<Team, 'id' | 'createdAt'>>) => {
      setTeams((prev) =>
        prev.map((team) =>
          team.id === teamId
            ? { ...team, ...patch, updatedAt: new Date().toISOString() }
            : team,
        ),
      )
    },
    [setTeams],
  )

  const deactivateTeam = useCallback(
    (teamId: string) => {
      updateTeam(teamId, { status: 'inactive' })
    },
    [updateTeam],
  )

  const deleteTeam = useCallback(
    (teamId: string) => {
      setTeams((prev) => prev.filter((team) => team.id !== teamId))
    },
    [setTeams],
  )

  return {
    teams,
    setTeams,
    createTeam,
    updateTeam,
    deactivateTeam,
    deleteTeam,
  }
}

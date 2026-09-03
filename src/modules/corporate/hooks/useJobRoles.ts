import { useCallback } from 'react'
import { useApiCollection } from '../../../shared/hooks/useApiCollection'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { STORAGE_KEYS } from '../../../shared/storage/keys'
import { seedJobRoles } from '../data/jobRolesSeedData'
import type { JobRole, JobRoleStatus } from '../types'

export function useJobRoles() {
  const [jobRoles, setJobRolesRaw] = useApiCollection<JobRole[]>(
    STORAGE_KEYS.jobRoles,
    seedJobRoles,
  )

  const setJobRoles = useCallback(
    (updater: JobRole[] | ((prev: JobRole[]) => JobRole[])) => {
      setJobRolesRaw(updater)
    },
    [setJobRolesRaw],
  )

  const createJobRole = useCallback(
    (input: {
      title: string
      description: string
      departmentId?: string
      requiredSkillIds?: string[]
      requiredCourseIds?: string[]
      status?: JobRoleStatus
    }) => {
      const now = new Date().toISOString()
      const role: JobRole = {
        id: createId('jr'),
        title: input.title.trim(),
        description: input.description.trim(),
        departmentId: input.departmentId,
        requiredSkillIds: input.requiredSkillIds ?? [],
        requiredCourseIds: input.requiredCourseIds ?? [],
        status: input.status ?? 'active',
        createdAt: now,
        updatedAt: now,
      }
      setJobRoles((prev) => [...prev, role])
      return role
    },
    [setJobRoles],
  )

  const updateJobRole = useCallback(
    (roleId: string, patch: Partial<Omit<JobRole, 'id' | 'createdAt'>>) => {
      setJobRoles((prev) =>
        prev.map((role) =>
          role.id === roleId ? { ...role, ...patch, updatedAt: new Date().toISOString() } : role,
        ),
      )
    },
    [setJobRoles],
  )

  const deleteJobRole = useCallback(
    (roleId: string) => {
      setJobRoles((prev) => prev.filter((role) => role.id !== roleId))
    },
    [setJobRoles],
  )

  return { jobRoles, setJobRoles, createJobRole, updateJobRole, deleteJobRole }
}

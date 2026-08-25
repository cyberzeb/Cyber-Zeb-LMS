import { useCallback } from 'react'
import { useApiCollection } from '../../../shared/hooks/useApiCollection'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { STORAGE_KEYS } from '../../../shared/storage/keys'
import { seedSkills } from '../data/skillsSeedData'
import type { Skill, SkillCategory, SkillStatus } from '../types'

export function useSkills() {
  const [skills, setSkillsRaw] = useApiCollection<Skill[]>(STORAGE_KEYS.skills, seedSkills)

  const setSkills = useCallback(
    (updater: Skill[] | ((prev: Skill[]) => Skill[])) => {
      setSkillsRaw(updater)
    },
    [setSkillsRaw],
  )

  const createSkill = useCallback(
    (input: {
      name: string
      category: SkillCategory
      description: string
      status?: SkillStatus
    }) => {
      const now = new Date().toISOString()
      const skill: Skill = {
        id: createId('sk'),
        name: input.name.trim(),
        category: input.category,
        description: input.description.trim(),
        status: input.status ?? 'active',
        createdAt: now,
        updatedAt: now,
      }
      setSkills((prev) => [...prev, skill])
      return skill
    },
    [setSkills],
  )

  const updateSkill = useCallback(
    (skillId: string, patch: Partial<Omit<Skill, 'id' | 'createdAt'>>) => {
      setSkills((prev) =>
        prev.map((skill) =>
          skill.id === skillId ? { ...skill, ...patch, updatedAt: new Date().toISOString() } : skill,
        ),
      )
    },
    [setSkills],
  )

  const deleteSkill = useCallback(
    (skillId: string) => {
      setSkills((prev) => prev.filter((skill) => skill.id !== skillId))
    },
    [setSkills],
  )

  return { skills, setSkills, createSkill, updateSkill, deleteSkill }
}

import type { Skill } from '../types'

const now = '2026-01-15T09:00:00.000Z'

export const seedSkills: Skill[] = [
  {
    id: 'sk-1',
    name: 'Application Development',
    category: 'technical',
    description: 'Design, build, and maintain software applications.',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'sk-2',
    name: 'Cybersecurity Fundamentals',
    category: 'compliance',
    description: 'Core security practices, threat awareness, and incident response.',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'sk-3',
    name: 'Cloud Infrastructure',
    category: 'technical',
    description: 'Deploy and operate cloud-based systems and services.',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'sk-4',
    name: 'Data Privacy & GDPR',
    category: 'compliance',
    description: 'Handle personal data according to privacy regulations.',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'sk-5',
    name: 'People Management',
    category: 'leadership',
    description: 'Lead teams, provide feedback, and support employee development.',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'sk-6',
    name: 'Workplace Safety',
    category: 'safety',
    description: 'Follow occupational health and safety procedures.',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
]

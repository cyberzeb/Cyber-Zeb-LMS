import type { Team } from '../types'

const now = '2026-01-15T09:00:00.000Z'

export const seedCorporateTeams: Team[] = [
  {
    id: 'team-1',
    name: 'AML & Regulatory',
    description: 'Anti-money laundering monitoring and regulatory reporting.',
    departmentId: 'd3',
    managerId: null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'team-2',
    name: 'Branch Operations',
    description: 'Frontline branch staff and teller services.',
    departmentId: 'd1',
    managerId: null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'team-3',
    name: 'Digital Product',
    description: 'Mobile and internet banking product delivery.',
    departmentId: 'd2',
    managerId: null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'team-4',
    name: 'Cybersecurity',
    description: 'Security operations, access control, and incident response.',
    departmentId: 'd5',
    managerId: null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
]

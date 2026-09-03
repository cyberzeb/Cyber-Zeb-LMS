import type { JobRole } from '../types'

const now = '2026-01-15T09:00:00.000Z'

export const seedJobRoles: JobRole[] = [
  {
    id: 'jr-1',
    title: 'Customer Service Officer',
    description: 'Handles customer transactions, account inquiries, and frontline service.',
    departmentId: 'd1',
    requiredSkillIds: ['sk-1', 'sk-3'],
    requiredCourseIds: ['c1', 'c4', 'c5'],
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'jr-2',
    title: 'Compliance Analyst',
    description: 'Monitors AML alerts, KYC reviews, and regulatory obligations.',
    departmentId: 'd3',
    requiredSkillIds: ['sk-2', 'sk-4'],
    requiredCourseIds: ['c1', 'c3'],
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'jr-3',
    title: 'Digital Banking Specialist',
    description: 'Supports digital channel products and customer onboarding flows.',
    departmentId: 'd2',
    requiredSkillIds: ['sk-5', 'sk-3'],
    requiredCourseIds: ['c2', 'c3'],
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'jr-4',
    title: 'Branch Manager',
    description: 'Leads branch teams and ensures training and compliance targets are met.',
    departmentId: 'd1',
    requiredSkillIds: ['sk-5'],
    requiredCourseIds: ['c1', 'c2', 'c5'],
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
]

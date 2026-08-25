import type { ReactNode } from 'react'

export type BeranaEdition = 'university' | 'corporate'

/** Informational only — not used for industry-specific UI branching. */
export type OrganizationTenantType =
  | 'business'
  | 'government'
  | 'ngo'
  | 'training_provider'
  | 'university'
  | 'school'

export interface TerminologyMap {
  organization: string
  location: string
  department: string
  team: string
  employee: string
  employees: string
  trainer: string
  training: string
  trainingCatalog: string
  trainingAssignment: string
  course: string
  enrollment: string
  certificate: string
  compliance: string
  adminRole: string
  learnerPortal: string
}

export interface EditionNavItem {
  id: string
  label: string
  to: string
  iconKey: string
  activePaths?: string[]
  badge?: number
  moduleKey?: keyof EditionModules
}

export interface EditionNavSection {
  title: string
  items: EditionNavItem[]
}

export interface EditionModules {
  campuses: boolean
  colleges: boolean
  programs: boolean
  students: boolean
  instructors: boolean
  guardians: boolean
  enrollments: boolean
  teams: boolean
  employees: boolean
  compliance: boolean
}

export interface EditionConfig {
  edition: BeranaEdition
  tenantType: OrganizationTenantType
  defaultOrganizationName: string
  terminology: TerminologyMap
  modules: EditionModules
  navSections: EditionNavSection[]
  breadcrumbLabels: Record<string, string>
}

export interface OrganizationConfig {
  edition: BeranaEdition
  tenantType: OrganizationTenantType
  organizationName: string
  terminology: TerminologyMap
  modules: EditionModules
}

export interface ResolvedNavItem {
  label: string
  to: string
  active: boolean
  icon: ReactNode
  badge?: number
}

export interface ResolvedNavSection {
  title: string
  items: ResolvedNavItem[]
}

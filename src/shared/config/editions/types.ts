/**
 * Multi-tenant edition framework.
 *
 * A single Berana LMS deployment serves three institution editions. The active
 * edition is resolved at runtime from the current tenant (see `../tenant.ts`),
 * which the Super Admin provisions with an `InstitutionType`.
 */

/** Canonical edition identifiers used across the frontend. */
export type BeranaEdition = 'university' | 'corporate' | 'training_organization'

/**
 * Terminology map — every user-facing noun that changes between editions.
 * Pages/layouts read these instead of hard-coding "Student", "Course", etc.
 */
export interface TerminologyMap {
  organization: string
  location: string
  department: string
  departments: string
  team: string
  teams: string
  employee: string
  employees: string
  trainer: string
  training: string
  trainingCatalog: string
  trainingAssignment: string
  course: string
  courses: string
  enrollment: string
  enrollments: string
  certificate: string
  certificates: string
  compliance: string
  adminRole: string
  learnerPortal: string
  cohort: string
  cohorts: string
  trainingProgram: string
  trainingPrograms: string
  trainingDivision: string
  trainingDivisions: string
  learner: string
  learners: string
  instructorPortal: string
}

/**
 * Feature/module visibility toggles per edition. Nav items and pages are hidden
 * when their backing module is disabled for the active edition.
 */
export interface EditionModules {
  campuses: boolean
  colleges: boolean
  programs: boolean
  students: boolean
  instructors: boolean
  guardians: boolean
  staff: boolean
  enrollments: boolean
  teams: boolean
  employees: boolean
  compliance: boolean
  payments: boolean
}

export interface EditionConfig {
  edition: BeranaEdition
  /** Default display name when a tenant has not set its own. */
  defaultOrganizationName: string
  terminology: TerminologyMap
  modules: EditionModules
  /** Overrides for admin breadcrumb labels keyed by pathname. */
  breadcrumbLabels: Record<string, string>
}

/** Resolved, tenant-aware organization config consumed by the UI. */
export interface OrganizationConfig {
  edition: BeranaEdition
  organizationName: string
  terminology: TerminologyMap
  modules: EditionModules
}

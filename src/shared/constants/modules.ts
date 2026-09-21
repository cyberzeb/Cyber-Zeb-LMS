/**
 * The Berana module catalog, mirroring backend `app/modules/onboarding/constants.py`.
 *
 * An institution picks its modules when it registers. The two core modules are
 * always included — without them nobody could sign in or administer the tenant —
 * so they are shown as locked-on rather than as choices.
 */

export type ModuleKey =
  | 'tenant_institution_mgmt'
  | 'identity_access'
  | 'user_profiles'
  | 'academic_structure'
  | 'course_catalog_authoring'
  | 'content_management'
  | 'enrollment_cohorts'
  | 'virtual_classroom'
  | 'attendance'
  | 'assignments_assessments'
  | 'gradebook_progress'
  | 'communication_notifications'
  | 'payments_billing'
  | 'certificates_credentials'
  | 'parent_manager_portal'
  | 'reports_analytics'
  | 'ai_services'
  | 'iot_physical_integration'
  | 'integration_hub_api'
  | 'administration_support'

export interface ModuleInfo {
  key: ModuleKey
  label: string
  description: string
  /** Always enabled; cannot be deselected (Blueprint 4.1). */
  core?: boolean
}

export const MODULE_CATALOG: ModuleInfo[] = [
  {
    key: 'tenant_institution_mgmt',
    label: 'Tenant & Institution Management',
    description: 'Your institution workspace, campuses and settings.',
    core: true,
  },
  {
    key: 'identity_access',
    label: 'Identity & Access',
    description: 'Sign-in, roles and permissions for everyone.',
    core: true,
  },
  {
    key: 'user_profiles',
    label: 'User Profiles',
    description: 'Staff, instructor and learner profile records.',
  },
  {
    key: 'academic_structure',
    label: 'Academic / Training Structure',
    description: 'Colleges, departments, programs and the academic calendar.',
  },
  {
    key: 'course_catalog_authoring',
    label: 'Course Catalog & Authoring',
    description: 'Build courses and offerings, and publish them.',
  },
  {
    key: 'content_management',
    label: 'Content Management',
    description: 'Lessons, files and learner progress through them.',
  },
  {
    key: 'enrollment_cohorts',
    label: 'Enrollment & Cohorts',
    description: 'Enrol learners, manage cohorts and class lists.',
  },
  {
    key: 'virtual_classroom',
    label: 'Virtual Classroom (Zoom)',
    description: 'Schedule and run live sessions from inside the LMS.',
  },
  {
    key: 'attendance',
    label: 'Attendance',
    description: 'Record and report attendance per session.',
  },
  {
    key: 'assignments_assessments',
    label: 'Assignments & Assessments',
    description: 'Assignments, quizzes, a question bank and submissions.',
  },
  {
    key: 'gradebook_progress',
    label: 'Gradebook & Progress',
    description: 'Grades, transcripts and progress tracking.',
  },
  {
    key: 'communication_notifications',
    label: 'Communication & Notifications',
    description: 'Announcements, discussion forums and alerts.',
  },
  {
    key: 'payments_billing',
    label: 'Payments & Billing',
    description: 'Learner invoices and online payment collection.',
  },
  {
    key: 'certificates_credentials',
    label: 'Certificates & Credentials',
    description: 'Issue and verify completion certificates.',
  },
  {
    key: 'parent_manager_portal',
    label: 'Parent / Manager Portal',
    description: 'A portal for guardians or line managers to follow progress.',
  },
  {
    key: 'reports_analytics',
    label: 'Reports & Analytics',
    description: 'Academic, financial and engagement reporting.',
  },
  {
    key: 'ai_services',
    label: 'AI Services',
    description: 'AI assistance for authoring and learner support.',
  },
  {
    key: 'iot_physical_integration',
    label: 'IoT / Physical Integration',
    description: 'Badge readers and other on-campus devices.',
  },
  {
    key: 'integration_hub_api',
    label: 'Integration Hub & API',
    description: 'Connect external systems and use the public API.',
  },
  {
    key: 'administration_support',
    label: 'Administration & Support',
    description: 'Help desk, ticketing and administrative tools.',
  },
]

export const MODULE_LABELS: Record<ModuleKey, string> = Object.fromEntries(
  MODULE_CATALOG.map((m) => [m.key, m.label]),
) as Record<ModuleKey, string>

export const ALWAYS_ON_MODULES: ModuleKey[] = MODULE_CATALOG.filter((m) => m.core).map(
  (m) => m.key,
)

export const ALL_MODULE_KEYS: ModuleKey[] = MODULE_CATALOG.map((m) => m.key)

export function moduleLabel(key: string): string {
  return MODULE_LABELS[key as ModuleKey] ?? key
}

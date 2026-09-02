export type InstitutionType = 'college_university' | 'training' | 'corporate'

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

/** @deprecated Use ModuleKey — kept as alias for form payload typing. */
export type RequestedModule = ModuleKey

export type ServiceRequestStatus =
  | 'new'
  | 'invoice_sent'
  | 'payment_confirmed'
  | 'activated'
  | 'rejected'

export interface ServiceRequestPayload {
  requestKind?: 'new_institution'
  institutionName: string
  institutionType: InstitutionType
  contactName: string
  email: string
  phone: string
  estimatedUsers: string
  preferredSubdomain: string
  modules: ModuleKey[]
  message: string
}

export interface AddOnModuleRequestPayload {
  requestKind: 'add_modules'
  tenantLookup: string
  contactName: string
  email: string
  phone: string
  modules: ModuleKey[]
  message: string
}

export interface ServiceLead extends ServiceRequestPayload {
  id: string
  createdAt: string
  status: ServiceRequestStatus
  subdomainLink?: string
}

export const ALWAYS_ON_MODULES: ModuleKey[] = [
  'tenant_institution_mgmt',
  'identity_access',
]

export const MODULE_LABELS: Record<ModuleKey, string> = {
  tenant_institution_mgmt: 'Tenant & Institution Management',
  identity_access: 'Identity & Access',
  user_profiles: 'User Profiles',
  academic_structure: 'Academic / Training Structure',
  course_catalog_authoring: 'Course Catalog & Authoring',
  content_management: 'Content Management',
  enrollment_cohorts: 'Enrollment & Cohorts',
  virtual_classroom: 'Virtual Classroom (Zoom)',
  attendance: 'Attendance',
  assignments_assessments: 'Assignments & Assessments',
  gradebook_progress: 'Gradebook & Progress',
  communication_notifications: 'Communication & Notifications',
  payments_billing: 'Payments & Billing',
  certificates_credentials: 'Certificates & Credentials',
  parent_manager_portal: 'Parent / Manager Portal',
  reports_analytics: 'Reports & Analytics',
  ai_services: 'AI Services',
  iot_physical_integration: 'IoT / Physical Integration',
  integration_hub_api: 'Integration Hub & API',
  administration_support: 'Administration & Support',
}

export const MODULE_GROUPS: { title: string; keys: ModuleKey[] }[] = [
  {
    title: 'Core',
    keys: ['tenant_institution_mgmt', 'identity_access', 'user_profiles', 'administration_support'],
  },
  {
    title: 'Teaching & Assessment',
    keys: [
      'academic_structure',
      'course_catalog_authoring',
      'content_management',
      'enrollment_cohorts',
      'virtual_classroom',
      'attendance',
      'assignments_assessments',
      'gradebook_progress',
    ],
  },
  {
    title: 'Engagement',
    keys: [
      'communication_notifications',
      'parent_manager_portal',
      'certificates_credentials',
      'payments_billing',
    ],
  },
  {
    title: 'Platform',
    keys: [
      'reports_analytics',
      'ai_services',
      'iot_physical_integration',
      'integration_hub_api',
    ],
  },
]

export interface PublicBranding {
  id: string
  logo_url: string | null
  favicon_url: string | null
  footer_text: string | null
  footer_links: { label: string; url: string }[] | null
  support_email: string | null
  support_phone: string | null
  updated_at: string
}

export interface ModuleCatalogItem {
  id: string
  key: ModuleKey | string
  display_name: string
  description: string
  annual_price: string
  currency: string
  is_active: boolean
  is_core: boolean
}

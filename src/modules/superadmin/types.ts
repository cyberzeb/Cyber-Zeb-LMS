export type ServiceRequestStatus =
  | 'new'
  | 'invoice_sent'
  | 'payment_confirmed'
  | 'activated'
  | 'rejected'

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

export interface EmailLog {
  id: string
  email_type: 'payment_invoice' | 'activation_welcome' | 'super_admin_alert'
  to_email: string
  subject: string
  body_preview: string
  status: 'sent' | 'failed'
  error_message: string | null
  sent_at: string
}

export interface TenantInfo {
  id: string
  name: string
  slug: string
  enabled_modules: string[]
  status: string
  institution_link: string
}

export interface ServiceRequest {
  id: string
  institution_name: string
  request_kind: 'new_institution' | 'add_modules'
  institution_type: string
  contact_name: string
  email: string
  phone: string
  estimated_users: string
  preferred_slug: string | null
  requested_modules: ModuleKey[]
  message: string | null
  status: ServiceRequestStatus
  invoice_amount: string | null
  invoice_currency: string | null
  invoice_notes: string | null
  invoice_sent_at: string | null
  payment_confirmed_at: string | null
  payment_confirmed_by: string | null
  activated_at: string | null
  rejected_at: string | null
  rejection_reason: string | null
  last_email_error: string | null
  created_at: string
  updated_at: string
  tenant: TenantInfo | null
  email_logs: EmailLog[]
}

export interface ModuleCatalogItem {
  id: string
  key: string
  display_name: string
  description: string
  annual_price: string
  currency: string
  is_active: boolean
  is_core: boolean
}

export interface AddOnModuleRequest {
  id: string
  request_kind: 'add_modules'
  tenant_id: string
  tenant_name: string
  tenant_slug: string
  contact_name: string
  email: string
  phone: string | null
  requested_modules: ModuleKey[]
  message: string | null
  status: ServiceRequestStatus
  invoice_amount: string | null
  invoice_currency: string | null
  invoice_notes: string | null
  invoice_sent_at: string | null
  payment_confirmed_at: string | null
  payment_confirmed_by: string | null
  activated_at: string | null
  rejected_at: string | null
  rejection_reason: string | null
  last_email_error: string | null
  created_at: string
  updated_at: string
}

export interface RenewalTenant {
  id: string
  name: string
  slug: string | null
  status: string
  enabled_modules: string[]
  subscription_start_date: string | null
  renewal_date: string | null
  institution_link: string
}

export const STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  new: 'New',
  invoice_sent: 'Invoice Sent',
  payment_confirmed: 'Payment Confirmed',
  activated: 'Activated',
  rejected: 'Rejected',
}

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

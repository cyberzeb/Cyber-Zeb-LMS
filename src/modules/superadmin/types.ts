export type InstitutionType = 'college_university' | 'training' | 'corporate'

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
  service_request_id?: string | null
  addon_module_request_id?: string | null
}

export interface TenantInfo {
  id: string
  name: string
  slug: string
  institution_type: InstitutionType
  enabled_modules: string[]
  status: string
  institution_link: string
}

export interface ServiceRequest {
  id: string
  institution_name: string
  request_kind: 'new_institution' | 'add_modules'
  institution_type: InstitutionType
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
  estimated_total: string | null
  estimated_currency: string | null
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
  estimated_total: string | null
  estimated_currency: string | null
  created_at: string
  updated_at: string
  email_logs?: EmailLog[]
}

export interface RenewalTenant {
  id: string
  name: string
  slug: string | null
  institution_type: InstitutionType
  status: string
  enabled_modules: string[]
  subscription_start_date: string | null
  renewal_date: string | null
  institution_link: string
}

export interface OverviewRecentRequest {
  id: string
  kind: string
  name: string
  status: string
  created_at: string
}

export interface OverviewActivityItem {
  id: string
  summary: string
  created_at: string
  action: string
}

export interface SuperAdminOverview {
  total_institutions: number
  active_institutions: number
  pending_service_requests: number
  pending_addon_requests: number
  estimated_annual_revenue: string
  revenue_currency: string
  renewing_within_30_days: number
  recent_requests: OverviewRecentRequest[]
  upcoming_renewals: RenewalTenant[]
  recent_activity: OverviewActivityItem[]
}

export interface InstitutionListItem {
  id: string
  name: string
  slug: string | null
  institution_type: InstitutionType
  status: string
  enabled_modules: string[]
  renewal_date: string | null
  institution_link: string
}

export interface InstitutionDetail {
  id: string
  name: string
  slug: string | null
  institution_type: InstitutionType
  status: string
  enabled_modules: string[]
  subscription_start_date: string | null
  renewal_date: string | null
  institution_link: string
  admin_email: string | null
  estimated_total: string | null
  estimated_currency: string | null
}

export interface SiteContentBlock {
  id: string
  key: string
  value: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PlatformAuditLog {
  id: string
  actor_type: string
  actor_id: string | null
  actor_email: string | null
  action: string
  entity_type: string
  entity_id: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  correlation_id: string | null
  created_at: string
  summary: string
}

export interface PlatformAuditLogList {
  items: PlatformAuditLog[]
  total: number
}

export interface PlatformSetting {
  id: string
  key: string
  value: string
  description: string
  created_at: string
  updated_at: string
}

export interface PlatformAdminUser {
  id: string
  email: string
  role: string
  created_at: string
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

// ── New types for Super Admin features ────────────────────────────────────────

export interface SystemHealth {
  db_ok: boolean
  db_latency_ms: number | null
  api_ok: boolean
  email_sent_count_24h: number
  email_failed_count_24h: number
  email_success_rate_pct: number | null
  db_size_bytes: number | null
  db_size_human: string | null
  checked_at: string
}

export interface Integration {
  id: string
  platform: string
  display_name: string
  is_connected: boolean
  connected_account: string | null
  token_expires_at: string | null
  last_health_check: string | null
  last_health_ok: boolean | null
  token_status: 'valid' | 'expired' | 'missing'
  updated_at: string
}

export interface IntegrationOAuthInit {
  authorization_url: string
  state: string
}

export interface RenewalReminder {
  tenant_id: string
  tenant_name: string
  reminder_sent_at: string
  email_ok: boolean
  error_message: string | null
}

export interface FooterLink {
  label: string
  url: string
}

export interface Branding {
  id: string
  logo_url: string | null
  favicon_url: string | null
  footer_text: string | null
  footer_links: FooterLink[] | null
  support_email: string | null
  support_phone: string | null
  updated_at: string
}

export interface SuspendedAdmin {
  id: string
  email: string
  role: string
  is_suspended: boolean
  suspension_reason: string | null
  suspended_at: string | null
  created_at: string
}

export interface AdminBan {
  id: string
  target_admin_id: string
  target_admin_email: string
  banned_by_admin_id: string
  reason: string
  is_active: boolean
  unbanned_at: string | null
  unban_reason: string | null
  created_at: string
}

export interface UserReport {
  id: string
  reporter_user_id: string | null
  reported_user_id: string
  reported_user_display_name: string | null
  reported_user_email: string | null
  tenant_id: string
  tenant_name: string | null
  reason: string
  description: string | null
  status: 'open' | 'reviewed' | 'dismissed' | 'banned'
  reviewed_by_admin_id: string | null
  reviewed_at: string | null
  review_notes: string | null
  created_at: string
}

export interface UserBan {
  id: string
  user_id: string
  user_display_name: string | null
  user_email: string | null
  tenant_id: string
  tenant_name: string | null
  banned_by_admin_id: string
  reason: string
  ban_scope: string
  is_active: boolean
  unbanned_at: string | null
  report_id: string | null
  created_at: string
}

export interface ModuleDemandItem {
  module_key: string
  display_name: string
  request_count: number
  addon_count: number
  total_count: number
}

export interface RevenueTrendItem {
  period: string
  revenue: string
  currency: string
  confirmed_count: number
}

export interface Analytics {
  module_demand: ModuleDemandItem[]
  revenue_trend: RevenueTrendItem[]
  avg_activation_days: number | null
  total_activated: number
  institution_type_counts: Record<string, number>
}

export interface BackupRun {
  id: string
  status: 'running' | 'success' | 'failed'
  file_path: string | null
  file_size_bytes: number | null
  file_size_human: string | null
  duration_seconds: string | null
  error_message: string | null
  triggered_by: string
  triggered_by_admin_id: string | null
  started_at: string
  completed_at: string | null
}

export interface BackupList {
  items: BackupRun[]
  total: number
}

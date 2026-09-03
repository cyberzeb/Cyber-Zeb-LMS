import { axiosClient } from '../../../lib/axiosClient'
import type {
  AddOnModuleRequest,
  EmailLog,
  InstitutionDetail,
  InstitutionListItem,
  ModuleCatalogItem,
  PlatformAdminUser,
  PlatformAuditLogList,
  PlatformSetting,
  RenewalTenant,
  ServiceRequest,
  ServiceRequestStatus,
  SiteContentBlock,
  SuperAdminOverview,
} from '../types'

export async function listServiceRequests(status?: ServiceRequestStatus | 'all') {
  const params =
    status && status !== 'all' ? { status } : undefined
  const { data } = await axiosClient.get<{ items: ServiceRequest[]; total: number }>(
    '/service-requests',
    { params },
  )
  return data
}

export async function getServiceRequest(id: string) {
  const { data } = await axiosClient.get<ServiceRequest>(`/service-requests/${id}`)
  return data
}

export async function sendInvoice(
  id: string,
  body: { invoice_amount: number; invoice_currency: string; invoice_notes: string },
) {
  const { data } = await axiosClient.post<ServiceRequest>(
    `/service-requests/${id}/send-invoice`,
    body,
  )
  return data
}

export async function confirmPayment(id: string) {
  const { data } = await axiosClient.post<ServiceRequest>(
    `/service-requests/${id}/confirm-payment`,
  )
  return data
}

export async function activateRequest(id: string) {
  const { data } = await axiosClient.post<{
    service_request: ServiceRequest
    tenant: NonNullable<ServiceRequest['tenant']>
    already_activated: boolean
    admin_access_code: string | null
  }>(`/service-requests/${id}/activate`, null, {
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  })
  return data
}

export async function rejectRequest(id: string, rejection_reason: string) {
  const { data } = await axiosClient.post<ServiceRequest>(
    `/service-requests/${id}/reject`,
    { rejection_reason },
  )
  return data
}

export async function resendServiceRequestEmail(id: string) {
  const { data } = await axiosClient.post<ServiceRequest>(
    `/service-requests/${id}/resend-email`,
  )
  return data
}

export async function listModules() {
  const { data } = await axiosClient.get<ModuleCatalogItem[]>('/super-admin/modules')
  return data
}

export async function createModule(body: {
  key: string
  display_name: string
  description: string
  annual_price: number
  currency: string
  is_active: boolean
  is_core: boolean
}) {
  const { data } = await axiosClient.post<ModuleCatalogItem>('/super-admin/modules', body)
  return data
}

export async function updateModule(id: string, body: Partial<{
  display_name: string
  description: string
  annual_price: number
  currency: string
  is_active: boolean
}>) {
  const { data } = await axiosClient.patch<ModuleCatalogItem>(`/super-admin/modules/${id}`, body)
  return data
}

export async function listAddOnRequests(status?: ServiceRequestStatus | 'all') {
  const params = status && status !== 'all' ? { status } : undefined
  const { data } = await axiosClient.get<{ items: AddOnModuleRequest[]; total: number }>(
    '/addon-module-requests',
    { params },
  )
  return data
}

export async function getAddOnRequest(id: string) {
  const { data } = await axiosClient.get<AddOnModuleRequest>(`/addon-module-requests/${id}`)
  return data
}

export async function sendAddOnInvoice(
  id: string,
  body: { invoice_amount: number; invoice_currency: string; invoice_notes: string },
) {
  const { data } = await axiosClient.post<AddOnModuleRequest>(
    `/addon-module-requests/${id}/send-invoice`,
    body,
  )
  return data
}

export async function confirmAddOnPayment(id: string) {
  const { data } = await axiosClient.post<AddOnModuleRequest>(
    `/addon-module-requests/${id}/confirm-payment`,
  )
  return data
}

export async function activateAddOnRequest(id: string) {
  const { data } = await axiosClient.post<AddOnModuleRequest>(
    `/addon-module-requests/${id}/activate`,
  )
  return data
}

export async function resendAddOnRequestEmail(id: string) {
  const { data } = await axiosClient.post<AddOnModuleRequest>(
    `/addon-module-requests/${id}/resend-email`,
  )
  return data
}

export async function listRenewals(days = 30) {
  const { data } = await axiosClient.get<RenewalTenant[]>('/super-admin/renewals', {
    params: { days },
  })
  return data
}

export async function markTenantRenewed(id: string) {
  const { data } = await axiosClient.post<RenewalTenant>(`/super-admin/tenants/${id}/renew`)
  return data
}

export async function getOverview() {
  const { data } = await axiosClient.get<SuperAdminOverview>('/super-admin/overview')
  return data
}

export async function listInstitutions() {
  const { data } = await axiosClient.get<InstitutionListItem[]>('/super-admin/institutions')
  return data
}

export async function getInstitution(id: string) {
  const { data } = await axiosClient.get<InstitutionDetail>(`/super-admin/institutions/${id}`)
  return data
}

export async function listSiteContent() {
  const { data } = await axiosClient.get<SiteContentBlock[]>('/super-admin/site-content')
  return data
}

export async function createSiteContent(body: {
  key: string
  value: string
  is_active: boolean
}) {
  const { data } = await axiosClient.post<SiteContentBlock>('/super-admin/site-content', body)
  return data
}

export async function updateSiteContent(
  id: string,
  body: Partial<{ value: string; is_active: boolean }>,
) {
  const { data } = await axiosClient.patch<SiteContentBlock>(
    `/super-admin/site-content/${id}`,
    body,
  )
  return data
}

export async function upsertAnnouncement(body: { value: string; is_active: boolean }) {
  const { data } = await axiosClient.post<{
    key: string
    value: string
    is_active: boolean
  }>('/super-admin/announcements', body)
  return data
}

export async function listAuditLogs(params?: {
  action?: string
  since?: string
  until?: string
  offset?: number
  limit?: number
}) {
  const { data } = await axiosClient.get<PlatformAuditLogList>('/super-admin/audit-logs', {
    params,
  })
  return data
}

export async function listSettings() {
  const { data } = await axiosClient.get<PlatformSetting[]>('/super-admin/settings')
  return data
}

export async function updateSetting(key: string, value: string) {
  const { data } = await axiosClient.patch<PlatformSetting>(`/super-admin/settings/${key}`, {
    value,
  })
  return data
}

export async function listPlatformAdmins() {
  const { data } = await axiosClient.get<PlatformAdminUser[]>('/super-admin/admins')
  return data
}

export async function invitePlatformAdmin(email: string) {
  const { data } = await axiosClient.post<PlatformAdminUser>('/super-admin/admins/invite', {
    email,
  })
  return data
}

export async function listEmailLogs(params?: {
  status?: 'sent' | 'failed'
  offset?: number
  limit?: number
}) {
  const { data } = await axiosClient.get<{ items: EmailLog[]; total: number }>(
    '/super-admin/email-logs',
    { params },
  )
  return data
}

export async function exportCsv(kind: 'service-requests' | 'tenants') {
  const { data } = await axiosClient.get<Blob>(`/super-admin/export/${kind}`, {
    responseType: 'blob',
  })
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = `${kind}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// ── New Super Admin Feature API functions ─────────────────────────────────────

import type {
  Analytics,
  BackupList,
  BackupRun,
  Branding,
  Integration,
  IntegrationOAuthInit,
  RenewalReminder,
  SuspendedAdmin,
  AdminBan,
  UserReport,
  UserBan,
  SystemHealth,
} from '../types'

// System Health
export async function getSystemHealth() {
  const { data } = await axiosClient.get<SystemHealth>('/super-admin/system-health')
  return data
}

// Integrations
export async function listIntegrations() {
  const { data } = await axiosClient.get<Integration[]>('/super-admin/integrations')
  return data
}

export async function beginOAuth(platform: string) {
  const { data } = await axiosClient.post<IntegrationOAuthInit>(
    `/super-admin/integrations/${platform}/connect`,
  )
  return data
}

export async function disconnectIntegration(platform: string) {
  const { data } = await axiosClient.post<Integration>(
    `/super-admin/integrations/${platform}/disconnect`,
  )
  return data
}

// Renewal Reminder
export async function sendRenewalReminder(tenantId: string) {
  const { data } = await axiosClient.post<RenewalReminder>(
    `/super-admin/tenants/${tenantId}/renewal-reminder`,
  )
  return data
}

// Branding
export async function getBranding() {
  const { data } = await axiosClient.get<Branding>('/super-admin/branding')
  return data
}

export async function updateBranding(body: {
  footer_text?: string | null
  footer_links?: { label: string; url: string }[] | null
  support_email?: string | null
  support_phone?: string | null
}) {
  const { data } = await axiosClient.patch<Branding>('/super-admin/branding', body)
  return data
}

export async function uploadBrandingAsset(assetType: 'logo' | 'favicon', file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await axiosClient.post<Branding>(
    `/super-admin/branding/upload/${assetType}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

// Security — Admins
export async function listAdminsWithStatus() {
  const { data } = await axiosClient.get<SuspendedAdmin[]>('/super-admin/security/admins')
  return data
}

export async function banPlatformAdmin(adminId: string, reason: string) {
  const { data } = await axiosClient.post<AdminBan>(
    `/super-admin/security/admins/${adminId}/ban`,
    { reason },
  )
  return data
}

export async function unbanPlatformAdmin(adminId: string, reason: string) {
  const { data } = await axiosClient.post<SuspendedAdmin>(
    `/super-admin/security/admins/${adminId}/unban`,
    { reason },
  )
  return data
}

// Security — User Reports
export async function listUserReports(params?: {
  status?: string
  tenant_id?: string
  offset?: number
  limit?: number
}) {
  const { data } = await axiosClient.get<{ items: UserReport[]; total: number }>(
    '/super-admin/security/reports',
    { params },
  )
  return data
}

export async function reviewUserReport(
  reportId: string,
  body: { status: string; notes?: string | null },
) {
  const { data } = await axiosClient.patch<UserReport>(
    `/super-admin/security/reports/${reportId}`,
    body,
  )
  return data
}

export async function banUser(userId: string, body: { reason: string; ban_scope?: string; report_id?: string | null }) {
  const { data } = await axiosClient.post<UserBan>(
    `/super-admin/security/users/${userId}/ban`,
    body,
  )
  return data
}

export async function unbanUser(userId: string, reason: string) {
  const { data } = await axiosClient.post<UserBan>(
    `/super-admin/security/users/${userId}/unban`,
    { reason },
  )
  return data
}

export async function listUserBans(params?: {
  active_only?: boolean
  tenant_id?: string
  offset?: number
  limit?: number
}) {
  const { data } = await axiosClient.get<{ items: UserBan[]; total: number }>(
    '/super-admin/security/bans',
    { params },
  )
  return data
}

// Analytics
export async function getAnalytics(params?: {
  since?: string
  until?: string
  institution_type?: string
}) {
  const { data } = await axiosClient.get<Analytics>('/super-admin/analytics', { params })
  return data
}

// Backup
export async function listBackups(params?: { offset?: number; limit?: number }) {
  const { data } = await axiosClient.get<BackupList>('/super-admin/backups', { params })
  return data
}

export async function triggerBackup() {
  const { data } = await axiosClient.post<BackupRun>('/super-admin/backups/trigger')
  return data
}

export async function restoreFromBackup(backupId: string, confirmation: string) {
  const { data } = await axiosClient.post('/super-admin/backups/restore', {
    backup_id: backupId,
    confirmation,
  })
  return data
}

// Audit logs — multi-action filter
export async function listAuditLogsV2(params?: {
  actions?: string[]
  since?: string
  until?: string
  offset?: number
  limit?: number
}) {
  const { actions, ...rest } = params ?? {}
  const searchParams = new URLSearchParams()
  if (actions?.length) {
    actions.forEach((a) => searchParams.append('actions', a))
  }
  Object.entries(rest).forEach(([k, v]) => {
    if (v !== undefined && v !== null) searchParams.set(k, String(v))
  })
  const { data } = await axiosClient.get<PlatformAuditLogList>(
    `/super-admin/audit-logs-v2?${searchParams.toString()}`,
  )
  return data
}

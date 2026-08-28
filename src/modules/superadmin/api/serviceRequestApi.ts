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

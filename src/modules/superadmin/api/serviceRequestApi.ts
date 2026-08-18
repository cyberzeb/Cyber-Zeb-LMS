import { axiosClient } from '../../../lib/axiosClient'
import type {
  AddOnModuleRequest,
  ModuleCatalogItem,
  RenewalTenant,
  ServiceRequest,
  ServiceRequestStatus,
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

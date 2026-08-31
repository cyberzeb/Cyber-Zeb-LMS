import { axiosClient } from '../../../lib/axiosClient'
import type {
  AddOnModuleRequestPayload,
  ModuleCatalogItem,
  ServiceLead,
  ServiceRequestPayload,
} from '../types'

interface ApiServiceRequest {
  id: string
  institution_name: string
  institution_type: ServiceLead['institutionType']
  contact_name: string
  email: string
  phone: string
  estimated_users: string
  preferred_slug: string | null
  requested_modules: ServiceLead['modules']
  message: string | null
  status: ServiceLead['status']
  created_at: string
  tenant?: { institution_link?: string; slug?: string } | null
}

function mapLead(row: ApiServiceRequest): ServiceLead {
  return {
    id: row.id,
    institutionName: row.institution_name,
    institutionType: row.institution_type,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    estimatedUsers: row.estimated_users,
    preferredSubdomain: row.preferred_slug ?? '',
    modules: row.requested_modules,
    message: row.message ?? '',
    createdAt: row.created_at,
    status: row.status,
    subdomainLink: row.tenant?.institution_link,
  }
}

/**
 * Public landing-page submission → POST /api/v1/service-requests
 * Client generates a UUID Idempotency-Key per form submission.
 */
export async function submitServiceRequest(
  payload: ServiceRequestPayload,
): Promise<ServiceLead> {
  const idempotencyKey = crypto.randomUUID()
  const { data } = await axiosClient.post<ApiServiceRequest>(
    '/service-requests',
    {
      institution_name: payload.institutionName,
      institution_type: payload.institutionType,
      contact_name: payload.contactName,
      email: payload.email,
      phone: payload.phone,
      estimated_users: payload.estimatedUsers,
      preferred_slug: payload.preferredSubdomain || null,
      requested_modules: payload.modules,
      message: payload.message || null,
    },
    {
      headers: { 'Idempotency-Key': idempotencyKey },
    },
  )
  return mapLead(data)
}

export async function listPublicModules(): Promise<ModuleCatalogItem[]> {
  const { data } = await axiosClient.get<ModuleCatalogItem[]>('/modules')
  return data
}

export async function submitAddOnModuleRequest(payload: AddOnModuleRequestPayload) {
  const { data } = await axiosClient.post(
    '/addon-module-requests',
    {
      tenant_lookup: payload.tenantLookup,
      contact_name: payload.contactName,
      email: payload.email,
      phone: payload.phone || null,
      requested_modules: payload.modules,
      message: payload.message || null,
    },
    {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    },
  )
  return data
}

export async function resolveTenantBySubdomain(slug: string) {
  const { data } = await axiosClient.get<{
    id: string
    name: string
    slug: string
    status: string
    enabled_modules: string[]
    renewal_date: string | null
    institution_link: string
  }>(`/tenants/by-subdomain/${slug}`)
  return data
}

export async function getPublicBranding(): Promise<import('../types').PublicBranding> {
  const { data } = await axiosClient.get('/branding')
  return data
}

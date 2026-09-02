import { axiosClient } from '../../../lib/axiosClient'
import type { ServiceRequestPayload } from '../types'

/**
 * Submit a public institution registration to the onboarding backend so it
 * shows up in the Super Admin console for review/activation.
 *
 * Institutions register by edition only — no module selection. The backend
 * automatically grants the full module suite to every activated tenant.
 */
export async function submitServiceRequest(payload: ServiceRequestPayload) {
  const body = {
    institution_name: payload.institutionName,
    institution_type: payload.institutionType,
    contact_name: payload.contactName,
    email: payload.email,
    phone: payload.phone,
    estimated_users: payload.estimatedUsers?.trim() || 'Not specified',
    preferred_slug: payload.preferredSubdomain?.trim() || null,
    message: payload.message?.trim() || null,
    // requested_modules intentionally omitted → backend enables ALL modules.
  }

  const { data } = await axiosClient.post('/service-requests', body, {
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  })
  return data
}

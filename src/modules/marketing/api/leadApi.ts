import { axiosClient } from '../../../lib/axiosClient'
import { toMasterDataPayload } from '../masterData'
import type { ServiceRequestPayload } from '../types'

/**
 * Submit a public institution registration to the onboarding backend so it
 * shows up in the Super Admin console for review/activation.
 *
 * The institution chooses its own modules and only those are activated. Sending
 * no module list at all still means the full catalog, which keeps any older
 * client working.
 */
export async function submitServiceRequest(payload: ServiceRequestPayload) {
  const body: Record<string, unknown> = {
    institution_name: payload.institutionName,
    institution_type: payload.institutionType,
    contact_name: payload.contactName,
    email: payload.email,
    phone: payload.phone,
    estimated_users: payload.estimatedUsers?.trim() || 'Not specified',
    preferred_slug: payload.preferredSubdomain?.trim() || null,
    message: payload.message?.trim() || null,
    requested_modules: payload.selectedModules,
  }
  if (payload.masterData) {
    body.master_data = toMasterDataPayload(payload.masterData)
  }

  const { data } = await axiosClient.post('/service-requests', body, {
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  })
  return data
}

/** The active module catalog, as the Super Admin currently maintains it. */
export async function listPublicModules() {
  const { data } = await axiosClient.get<{ key: string; description: string }[]>('/modules')
  return data
}

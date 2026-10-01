import { apiClient } from './client'
import type { PublicCatalog, RegistrationResult } from '../../modules/training/types'

/** Public: a training provider's programs and open cohorts (no sign-in). */
export async function fetchPublicCatalog(tenantCode: string): Promise<PublicCatalog> {
  const { data } = await apiClient.get<PublicCatalog>(`/public/training/${encodeURIComponent(tenantCode)}/catalog`)
  return data
}

/** Public: register for a cohort. Paid programs return an invoice to pay after signing in. */
export async function registerPublic(
  tenantCode: string,
  input: { cohortId: string; name: string; email: string; phone?: string; organization?: string },
): Promise<RegistrationResult> {
  const { data } = await apiClient.post<RegistrationResult>(`/public/training/${encodeURIComponent(tenantCode)}/register`, {
    cohort_id: input.cohortId,
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    organization: input.organization || null,
  })
  return data
}

/** A signed-in learner registers for a cohort. */
export async function registerForCohort(cohortId: string): Promise<RegistrationResult> {
  const { data } = await apiClient.post<RegistrationResult>(`/training/cohorts/${encodeURIComponent(cohortId)}/register`)
  return data
}

/** Admin: enroll learners in a cohort, with or without an invoice. */
export async function enrollInCohort(cohortId: string, studentIds: string[], charge: boolean): Promise<RegistrationResult[]> {
  const { data } = await apiClient.post<{ results: RegistrationResult[] }>(`/training/cohorts/${encodeURIComponent(cohortId)}/enroll`, {
    student_ids: studentIds,
    charge,
  })
  return data.results
}

/** Admin: payment received in person, or fee waived. Enrolls the learner. */
export async function confirmRegistration(registrationId: string, method: 'offline' | 'waived' = 'offline') {
  const { data } = await apiClient.post(`/training/registrations/${encodeURIComponent(registrationId)}/confirm`, { method })
  return data
}

/** Admin: any registration. Learner: their own unpaid one. */
export async function cancelRegistration(registrationId: string, options: { reason?: string; refund?: boolean } = {}) {
  const { data } = await apiClient.post(`/training/registrations/${encodeURIComponent(registrationId)}/cancel`, {
    reason: options.reason ?? '',
    refund: options.refund ?? false,
  })
  return data
}

/** Apply the certificate rules now (after attendance is taken, for example). */
export async function runCertificateCheck(): Promise<{ issued: string[]; pending: string[] }> {
  const { data } = await apiClient.post<{ issued: string[]; pending: string[] }>('/certificates/auto-issue', {})
  return data
}

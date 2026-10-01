import { activeTenantCode } from '../../../shared/api/client'

/** The public registration page for this institution, optionally opened on one cohort. */
export function registrationLink(cohortId?: string): string {
  const base = `${window.location.origin}/join/${activeTenantCode()}`
  return cohortId ? `${base}?cohort=${encodeURIComponent(cohortId)}` : base
}

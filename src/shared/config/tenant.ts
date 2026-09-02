import type { BeranaEdition } from './editions/types'
import type { InstitutionType } from '../constants/institutionTypes'

/**
 * Active-tenant resolution for the multi-tenant LMS.
 *
 * Every institution portal (admin / student / instructor) runs the same build.
 * The active tenant — and therefore the active edition — is resolved at runtime
 * from, in priority order:
 *   1. An explicitly selected tenant stored in localStorage (Super Admin "enter
 *      institution" or the dev edition switcher).
 *   2. The subdomain of the current host (e.g. `apex.berana-lms.com`).
 *   3. The `VITE_BERANA_EDITION` build-time env var.
 *   4. The default edition (college / university).
 */

export interface ActiveTenant {
  slug: string
  name: string
  institutionType: InstitutionType
}

const ACTIVE_TENANT_KEY = 'berana:active-tenant'

/** Fired whenever the active tenant/edition changes so the UI can re-render. */
export const TENANT_CHANGED_EVENT = 'berana:tenant-changed'

/** InstitutionType (Super Admin data model) → BeranaEdition (frontend UI). */
export const INSTITUTION_TYPE_TO_EDITION: Record<InstitutionType, BeranaEdition> = {
  college_university: 'university',
  training: 'training_organization',
  corporate: 'corporate',
}

/** BeranaEdition → InstitutionType. */
export const EDITION_TO_INSTITUTION_TYPE: Record<BeranaEdition, InstitutionType> = {
  university: 'college_university',
  training_organization: 'training',
  corporate: 'corporate',
}

export function editionForInstitutionType(type: InstitutionType): BeranaEdition {
  return INSTITUTION_TYPE_TO_EDITION[type] ?? 'university'
}

function readStoredTenant(): ActiveTenant | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(ACTIVE_TENANT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ActiveTenant
    if (parsed && parsed.institutionType) return parsed
    return null
  } catch {
    return null
  }
}

/** Map a URL path segment (college/training/corporate) to an InstitutionType. */
function institutionTypeFromSegment(segment: string): InstitutionType | null {
  switch (segment) {
    case 'college':
    case 'university':
      return 'college_university'
    case 'training':
      return 'training'
    case 'corporate':
      return 'corporate'
    default:
      return null
  }
}

/**
 * Best-effort resolution of the tenant from the browser host + path.
 * Supports `slug.domain/segment` and local `?edition=` / path overrides.
 */
function resolveTenantFromLocation(): ActiveTenant | null {
  if (typeof window === 'undefined') return null

  // Path-segment hint: /institution/:slug/(college|training|corporate)
  const pathParts = window.location.pathname.split('/').filter(Boolean)
  for (const part of pathParts) {
    const type = institutionTypeFromSegment(part)
    if (type) {
      return { slug: pathParts[1] ?? part, name: '', institutionType: type }
    }
  }

  return null
}

function resolveEditionFromEnv(): BeranaEdition | null {
  const env = import.meta.env.VITE_BERANA_EDITION as BeranaEdition | undefined
  if (env === 'university' || env === 'corporate' || env === 'training_organization') {
    return env
  }
  return null
}

/** The default edition when nothing else resolves. */
export const DEFAULT_EDITION: BeranaEdition = 'university'

/** Returns the active tenant, or null when running on the default deployment. */
export function getActiveTenant(): ActiveTenant | null {
  return readStoredTenant() ?? resolveTenantFromLocation()
}

/** Persist the active tenant and notify listeners. */
export function setActiveTenant(tenant: ActiveTenant | null): void {
  if (typeof window === 'undefined') return
  if (!tenant) {
    window.localStorage.removeItem(ACTIVE_TENANT_KEY)
  } else {
    window.localStorage.setItem(ACTIVE_TENANT_KEY, JSON.stringify(tenant))
  }
  window.dispatchEvent(new CustomEvent(TENANT_CHANGED_EVENT))
}

/** Convenience: switch edition directly (used by the dev edition switcher). */
export function setActiveEdition(edition: BeranaEdition, name?: string): void {
  const institutionType = EDITION_TO_INSTITUTION_TYPE[edition]
  const existing = getActiveTenant()
  setActiveTenant({
    slug: existing?.slug ?? edition,
    name: name ?? existing?.name ?? '',
    institutionType,
  })
}

/** Resolve the currently active edition at runtime. */
export function getActiveEdition(): BeranaEdition {
  const tenant = getActiveTenant()
  if (tenant) return editionForInstitutionType(tenant.institutionType)
  return resolveEditionFromEnv() ?? DEFAULT_EDITION
}

export function isUniversityEdition(): boolean {
  return getActiveEdition() === 'university'
}

export function isCorporateEdition(): boolean {
  return getActiveEdition() === 'corporate'
}

export function isTrainingEdition(): boolean {
  return getActiveEdition() === 'training_organization'
}

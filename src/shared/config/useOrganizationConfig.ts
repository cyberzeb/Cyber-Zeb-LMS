import { useSyncExternalStore } from 'react'

import { getEditionConfig } from './edition'
import { getActiveEdition, getActiveTenant, TENANT_CHANGED_EVENT } from './tenant'
import type { OrganizationConfig } from './editions/types'
import { STORAGE_KEYS } from '../storage/keys'

/**
 * Reads the tenant's saved display name from portal settings (seeded at
 * activation as `settings.general.name`), falling back to null.
 */
function readSettingsOrganizationName(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.settings)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { general?: { name?: string } }
    const name = parsed?.general?.name?.trim()
    return name || null
  } catch {
    return null
  }
}

function resolveOrganizationConfig(): OrganizationConfig {
  const edition = getActiveEdition()
  const config = getEditionConfig(edition)
  const tenant = getActiveTenant()
  const organizationName =
    tenant?.name?.trim() ||
    readSettingsOrganizationName() ||
    config.defaultOrganizationName

  return {
    edition,
    organizationName,
    terminology: config.terminology,
    modules: config.modules,
  }
}

// A cached snapshot keeps useSyncExternalStore stable between renders (it must
// return a referentially-equal value until something actually changes).
let snapshot: OrganizationConfig = resolveOrganizationConfig()

function recompute(): void {
  snapshot = resolveOrganizationConfig()
}

function subscribe(onChange: () => void): () => void {
  const handler = () => {
    recompute()
    onChange()
  }
  window.addEventListener(TENANT_CHANGED_EVENT, handler)
  // Settings can change in another tab or via a save on the current one.
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(TENANT_CHANGED_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

/**
 * Resolved, tenant-aware organization config for the active edition. Pages and
 * layouts read terminology / module toggles from here instead of hard-coding
 * "Student", "Course", etc., so the same build serves every edition.
 */
export function useOrganizationConfig(): OrganizationConfig {
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot)
}

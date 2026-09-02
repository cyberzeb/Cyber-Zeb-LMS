import { useEffect, useState } from 'react'
import { getEditionConfig } from './edition'
import { getActiveEdition, getActiveTenant, TENANT_CHANGED_EVENT } from './tenant'
import type { OrganizationConfig, TerminologyMap } from './editions/types'
import { STORAGE_KEYS } from '../storage/keys'

function resolveOrganizationConfig(): OrganizationConfig {
  const edition = getActiveEdition()
  const editionConfig = getEditionConfig(edition)
  const tenant = getActiveTenant()

  let settingsName = ''
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.settings)
    if (stored) {
      const settings = JSON.parse(stored) as { general?: { name?: string } }
      settingsName = settings.general?.name?.trim() ?? ''
    }
  } catch {
    settingsName = ''
  }

  const organizationName =
    tenant?.name?.trim() ||
    settingsName ||
    editionConfig.defaultOrganizationName ||
    'Berana LMS'

  return {
    edition,
    organizationName,
    terminology: editionConfig.terminology,
    modules: editionConfig.modules,
  }
}

/**
 * Reactive organization/edition config. Re-computes when the active tenant
 * changes (Super Admin "enter institution" or dev switcher) or when settings
 * are updated.
 */
export function useOrganizationConfig(): OrganizationConfig {
  const [config, setConfig] = useState<OrganizationConfig>(() => resolveOrganizationConfig())

  useEffect(() => {
    const refresh = () => setConfig(resolveOrganizationConfig())
    refresh()
    window.addEventListener(TENANT_CHANGED_EVENT, refresh)
    window.addEventListener('berana:platform-updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(TENANT_CHANGED_EVENT, refresh)
      window.removeEventListener('berana:platform-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return config
}

/** Convenience hook returning just the terminology map. */
export function useTerminology(): TerminologyMap {
  return useOrganizationConfig().terminology
}

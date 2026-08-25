import { useMemo } from 'react'
import { getActiveEdition } from './edition'
import { corporateEditionConfig } from './editions/corporate'
import { universityEditionConfig } from './editions/university'
import type { EditionConfig, OrganizationConfig } from './editions/types'
import { readSettings } from '../storage/readers'
import { normalizeInstitutionSettings, type InstitutionSettingsState } from '../storage/settingsUtils'

export function getEditionConfig(): EditionConfig {
  return getActiveEdition() === 'corporate' ? corporateEditionConfig : universityEditionConfig
}

export function useOrganizationConfig(): OrganizationConfig {
  return useMemo(() => {
    const editionConfig = getEditionConfig()
    const settings = normalizeInstitutionSettings(
      readSettings<Partial<InstitutionSettingsState>>(),
    )
    const organizationName =
      settings.general.name?.trim() ||
      editionConfig.defaultOrganizationName ||
      'Berana LMS'

    return {
      edition: editionConfig.edition,
      tenantType: editionConfig.tenantType,
      organizationName,
      terminology: editionConfig.terminology,
      modules: editionConfig.modules,
    }
  }, [])
}

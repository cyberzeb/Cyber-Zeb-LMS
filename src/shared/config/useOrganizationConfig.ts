import { useMemo } from 'react'
import { getActiveEdition } from './edition'
import { corporateEditionConfig } from './editions/corporate'
import { universityEditionConfig } from './editions/university'
import { trainingEditionConfig } from './editions/training'
import type { EditionConfig, OrganizationConfig } from './editions/types'
import { readSettings } from '../storage/readers'
import { normalizeInstitutionSettings, type InstitutionSettingsState } from '../storage/settingsUtils'

export function getEditionConfig(): EditionConfig {
  const edition = getActiveEdition()
  if (edition === 'corporate') return corporateEditionConfig
  if (edition === 'training_organization') return trainingEditionConfig
  return universityEditionConfig
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

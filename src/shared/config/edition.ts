import type { BeranaEdition, EditionConfig } from './editions/types'
import { universityEditionConfig } from './editions/university'
import { corporateEditionConfig } from './editions/corporate'
import { trainingEditionConfig } from './editions/training'
import { getActiveEdition } from './tenant'

export const EDITION_CONFIGS: Record<BeranaEdition, EditionConfig> = {
  university: universityEditionConfig,
  corporate: corporateEditionConfig,
  training_organization: trainingEditionConfig,
}

export function getEditionConfig(edition: BeranaEdition = getActiveEdition()): EditionConfig {
  return EDITION_CONFIGS[edition] ?? universityEditionConfig
}

export { getActiveEdition, isUniversityEdition, isCorporateEdition, isTrainingEdition } from './tenant'
export type { BeranaEdition } from './editions/types'

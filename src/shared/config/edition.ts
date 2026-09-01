import type { BeranaEdition } from './editions/types'

/** Dev edition flag — swap to `university` to test the University Edition locally. */
export const DEV_EDITION: BeranaEdition = 'corporate'

export function getActiveEdition(): BeranaEdition {
  const env = import.meta.env.VITE_BERANA_EDITION as BeranaEdition | undefined
  return env ?? DEV_EDITION
}

export function isCorporateEdition(): boolean {
  return getActiveEdition() === 'corporate'
}

export function isUniversityEdition(): boolean {
  return getActiveEdition() === 'university'
}

export function isTrainingEdition(): boolean {
  return getActiveEdition() === 'training_organization'
}

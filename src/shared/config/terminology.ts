import { getEditionConfig } from './useOrganizationConfig'
import type { TerminologyMap } from './editions/types'

export function getTerminology(): TerminologyMap {
  return getEditionConfig().terminology
}

export function tTerm(key: keyof TerminologyMap): string {
  return getTerminology()[key]
}

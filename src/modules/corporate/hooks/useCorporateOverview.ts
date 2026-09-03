import { buildCorporateOverviewData } from '../../../shared/storage/dashboardBuilders'
import type { CorporateOverviewData } from '../types'

export function useCorporateOverview(): CorporateOverviewData {
  return buildCorporateOverviewData()
}

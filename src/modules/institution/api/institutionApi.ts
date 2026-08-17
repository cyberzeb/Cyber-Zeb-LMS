import { buildInstitutionOverview } from '../../../shared/storage/dashboardBuilders'
import type { InstitutionOverviewData } from '../types'

export async function getInstitutionOverview(): Promise<InstitutionOverviewData> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return buildInstitutionOverview()
}

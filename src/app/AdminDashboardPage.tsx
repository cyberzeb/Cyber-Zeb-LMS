import { isCorporateEdition } from '../shared/config/edition'
import { InstitutionOverviewPage } from '../modules/institution/pages/InstitutionOverviewPage'
import { CorporateOverviewPage } from '../modules/corporate/dashboard/CorporateOverviewPage'

export function AdminDashboardPage() {
  if (isCorporateEdition()) return <CorporateOverviewPage />
  return <InstitutionOverviewPage />
}

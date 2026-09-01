import { getActiveEdition } from '../shared/config/edition'
import { InstitutionOverviewPage } from '../modules/institution/pages/InstitutionOverviewPage'
import { CorporateOverviewPage } from '../modules/corporate/dashboard/CorporateOverviewPage'
import { TrainingOverviewPage } from '../modules/training/dashboard/TrainingOverviewPage'

export function AdminDashboardPage() {
  const edition = getActiveEdition()
  if (edition === 'corporate') return <CorporateOverviewPage />
  if (edition === 'training_organization') return <TrainingOverviewPage />
  return <InstitutionOverviewPage />
}

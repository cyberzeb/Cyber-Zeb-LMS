import { useOrganizationConfig } from '../shared/config/useOrganizationConfig'
import { CorporateOverviewPage } from '../modules/corporate/dashboard/CorporateOverviewPage'
import { TrainingOverviewPage } from '../modules/training/dashboard/TrainingOverviewPage'
import { InstitutionOverviewPage } from '../modules/institution/pages/InstitutionOverviewPage'

/** Admin home (`/admin`) — renders the dashboard for the active edition. */
export function EditionDashboardPage() {
  const { edition } = useOrganizationConfig()

  if (edition === 'corporate') return <CorporateOverviewPage />
  if (edition === 'training_organization') return <TrainingOverviewPage />
  return <InstitutionOverviewPage />
}

import { useOrganizationConfig } from '../shared/config/useOrganizationConfig'
import { readPortalSession } from '../shared/storage/session'
import { CorporateOverviewPage } from '../modules/corporate/dashboard/CorporateOverviewPage'
import { TrainingOverviewPage } from '../modules/training/dashboard/TrainingOverviewPage'
import { InstitutionOverviewPage } from '../modules/institution/pages/InstitutionOverviewPage'
import { FinanceDashboardPage } from '../modules/institution/pages/FinanceDashboardPage'

/** Admin home (`/admin`) — renders the dashboard for the active edition and role. */
export function EditionDashboardPage() {
  const { edition } = useOrganizationConfig()

  if (edition === 'corporate') return <CorporateOverviewPage />
  if (edition === 'training_organization') return <TrainingOverviewPage />
  if (readPortalSession()?.role === 'FinanceOfficer') return <FinanceDashboardPage />
  return <InstitutionOverviewPage />
}

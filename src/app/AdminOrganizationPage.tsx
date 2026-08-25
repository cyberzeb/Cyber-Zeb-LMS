import { isCorporateEdition } from '../shared/config/edition'
import { OrgStructurePage } from '../modules/institution/pages/OrgStructurePage'
import { CorporateOrganizationPage } from '../modules/corporate/pages/CorporateOrganizationPage'

export function AdminOrganizationPage() {
  if (isCorporateEdition()) {
    return <CorporateOrganizationPage />
  }
  return <OrgStructurePage />
}

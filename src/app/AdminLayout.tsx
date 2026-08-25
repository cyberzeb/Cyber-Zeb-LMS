import { isCorporateEdition } from '../shared/config/edition'
import { CorporateAdminLayout } from './CorporateAdminLayout'
import { InstitutionAdminLayout } from './InstitutionAdminLayout'

export function AdminLayout() {
  if (isCorporateEdition()) {
    return <CorporateAdminLayout />
  }
  return <InstitutionAdminLayout />
}

import { getActiveEdition } from '../shared/config/edition'
import { CorporateAdminLayout } from './CorporateAdminLayout'
import { InstitutionAdminLayout } from './InstitutionAdminLayout'
import { TrainingAdminLayout } from './TrainingAdminLayout'

export function AdminLayout() {
  const edition = getActiveEdition()
  if (edition === 'corporate') {
    return <CorporateAdminLayout />
  }
  if (edition === 'training_organization') {
    return <TrainingAdminLayout />
  }
  return <InstitutionAdminLayout />
}

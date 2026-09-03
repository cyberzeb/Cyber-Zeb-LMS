import { useOrganizationConfig } from '../shared/config/useOrganizationConfig'
import { InstitutionAdminLayout } from './InstitutionAdminLayout'
import { CorporateAdminLayout } from './CorporateAdminLayout'
import { TrainingAdminLayout } from './TrainingAdminLayout'

/**
 * Edition-aware admin layout switcher.
 * The active edition is read at runtime from the tenant config so the
 * same build serves all three editions without code changes.
 */
export function EditionAdminLayout() {
  const { edition } = useOrganizationConfig()

  if (edition === 'corporate') return <CorporateAdminLayout />
  if (edition === 'training_organization') return <TrainingAdminLayout />
  return <InstitutionAdminLayout />
}

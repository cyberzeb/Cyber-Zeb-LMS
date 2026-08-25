import { isCorporateEdition } from '../shared/config/edition'
import { CorporateTeamsPage } from '../modules/corporate/pages/CorporateTeamsPage'
import { Navigate } from 'react-router-dom'

export function AdminTeamsPage() {
  if (isCorporateEdition()) {
    return <CorporateTeamsPage />
  }
  return <Navigate to="/admin/institution/structure" replace />
}

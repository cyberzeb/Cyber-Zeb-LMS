import { isCorporateEdition } from '../shared/config/edition'
import { Navigate } from 'react-router-dom'
import { CorporateJobRolesPage } from '../modules/corporate/pages/CorporateJobRolesPage'
import { CorporateSkillsPage } from '../modules/corporate/pages/CorporateSkillsPage'
import { CorporateCompliancePage } from '../modules/corporate/pages/CorporateCompliancePage'

export function AdminJobRolesPage() {
  if (!isCorporateEdition()) return <Navigate to="/admin" replace />
  return <CorporateJobRolesPage />
}

export function AdminSkillsPage() {
  if (!isCorporateEdition()) return <Navigate to="/admin" replace />
  return <CorporateSkillsPage />
}

export function AdminCompliancePage() {
  if (!isCorporateEdition()) return <Navigate to="/admin" replace />
  return <CorporateCompliancePage />
}

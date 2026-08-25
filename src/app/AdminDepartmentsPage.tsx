import { isCorporateEdition } from '../shared/config/edition'
import { DepartmentsPage } from '../modules/institution/pages/DepartmentsPage'
import { CorporateDepartmentsPage } from '../modules/corporate/pages/CorporateDepartmentsPage'

export function AdminDepartmentsPage() {
  if (isCorporateEdition()) return <CorporateDepartmentsPage />
  return <DepartmentsPage />
}

import { isCorporateEdition } from '../shared/config/edition'
import { StudentsPage } from '../modules/institution/pages/StudentsPage'
import { Navigate } from 'react-router-dom'

export function AdminEmployeesPage() {
  if (isCorporateEdition()) return <StudentsPage />
  return <Navigate to="/admin/students" replace />
}

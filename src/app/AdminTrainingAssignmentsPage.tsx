import { isCorporateEdition } from '../shared/config/edition'
import { EnrollmentsPage } from '../modules/institution/pages/EnrollmentsPage'
import { Navigate } from 'react-router-dom'

export function AdminTrainingAssignmentsPage() {
  if (isCorporateEdition()) return <EnrollmentsPage />
  return <Navigate to="/admin/enrollments" replace />
}

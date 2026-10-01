/**
 * Admin routes whose page differs by edition. The University Edition keeps its
 * academic pages; the Corporate Edition gets pages built on departments, teams,
 * job roles and compliance; the Training Edition gets pages built on programs,
 * cohorts and registrations.
 */
import { useOrganizationConfig } from '../shared/config/useOrganizationConfig'
import { CorporateAssignmentsPage } from '../modules/corporate/pages/CorporateAssignmentsPage'
import { CorporateEmployeesPage } from '../modules/corporate/pages/CorporateEmployeesPage'
import { AttendanceAdminPage } from '../modules/institution/pages/AttendanceAdminPage'
import { EnrollmentsPage } from '../modules/institution/pages/EnrollmentsPage'
import { StudentsPage } from '../modules/institution/pages/StudentsPage'
import { TrainingAttendancePage } from '../modules/training/pages/TrainingAttendancePage'
import { TrainingLearnersPage } from '../modules/training/pages/TrainingLearnersPage'
import { TrainingRegistrationsPage } from '../modules/training/pages/TrainingRegistrationsPage'

export function EditionLearnersPage() {
  const { edition } = useOrganizationConfig()
  if (edition === 'corporate') return <CorporateEmployeesPage />
  if (edition === 'training_organization') return <TrainingLearnersPage />
  return <StudentsPage />
}

export function EditionEnrollmentsPage() {
  const { edition } = useOrganizationConfig()
  if (edition === 'corporate') return <CorporateAssignmentsPage />
  if (edition === 'training_organization') return <TrainingRegistrationsPage />
  return <EnrollmentsPage />
}

export function EditionAttendancePage() {
  const { edition } = useOrganizationConfig()
  return edition === 'training_organization' ? <TrainingAttendancePage /> : <AttendanceAdminPage />
}

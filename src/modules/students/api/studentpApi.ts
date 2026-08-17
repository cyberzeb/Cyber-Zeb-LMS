import { buildStudentDashboard } from '../../../shared/storage/dashboardBuilders'
import { getSessionPerson, readPortalSession } from '../../../shared/storage/session'

export async function fetchStudentDashboardData() {
  await new Promise((resolve) => setTimeout(resolve, 200))

  const session = readPortalSession()
  const person = getSessionPerson()

  if (!session || session.role !== 'Student' || !person) {
    throw new Error('No student session. Select a student account to continue.')
  }

  return buildStudentDashboard(person)
}

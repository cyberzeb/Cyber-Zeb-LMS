import { buildInstructorDashboard } from '../../../shared/storage/dashboardBuilders'
import { getSessionPerson, readPortalSession } from '../../../shared/storage/session'

export async function fetchInstructorDashboardData() {
  await new Promise((resolve) => setTimeout(resolve, 200))

  const session = readPortalSession()
  const person = getSessionPerson()

  if (!session || session.role !== 'Instructor' || !person) {
    throw new Error('No instructor session. Select an instructor account to continue.')
  }

  return buildInstructorDashboard(person)
}

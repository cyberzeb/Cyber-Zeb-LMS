import { getSessionPerson, readPortalSession } from '../../../shared/storage/session'
import { DiscussionForumPanel } from '../../../shared/components/forum/DiscussionForumPanel'
import { PortalAuthRedirect } from '../../../shared/components/PortalAuthRedirect'
import { StudentPageError } from '../components/StudentPageStates'

export function StudentForumPage() {
  const session = readPortalSession()
  const person = getSessionPerson()

  if (!session || session.role !== 'Student' || !person) {
    return <PortalAuthRedirect role="Student" />
  }

  if (person.status !== 'active') {
    return <StudentPageError message="Your account is not active. Contact your administrator." />
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <DiscussionForumPanel person={person} />
    </div>
  )
}

export default StudentForumPage

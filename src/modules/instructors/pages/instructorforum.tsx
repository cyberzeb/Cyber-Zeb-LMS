import { getSessionPerson, readPortalSession } from '../../../shared/storage/session'
import { DiscussionForumPanel } from '../../../shared/components/forum/DiscussionForumPanel'
import { PortalAuthRedirect } from '../../../shared/components/PortalAuthRedirect'
import { InstructorPageError } from '../components/InstructorPageStates'

export function InstructorForumPage() {
  const session = readPortalSession()
  const person = getSessionPerson()

  if (!session || session.role !== 'Instructor' || !person) {
    return <PortalAuthRedirect role="Instructor" />
  }

  if (person.status !== 'active') {
    return <InstructorPageError message="Your account is not active. Contact your administrator." />
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <DiscussionForumPanel person={person} />
    </div>
  )
}

export default InstructorForumPage

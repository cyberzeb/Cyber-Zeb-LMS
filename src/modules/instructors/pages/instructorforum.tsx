import { getSessionPerson, readPortalSession } from '../../../shared/storage/session'
import { DiscussionForumPanel } from '../../../shared/components/forum/DiscussionForumPanel'
import { PortalUserPicker } from '../../../shared/components/PortalUserPicker'
import { InstructorPageError } from '../components/InstructorPageStates'

export function InstructorForumPage() {
  const session = readPortalSession()
  const person = getSessionPerson()

  if (!session || session.role !== 'Instructor' || !person) {
    return <PortalUserPicker role="Instructor" portalLabel="Instructor Portal" />
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

import { useMemo } from 'react'
import { DiscussionForumPanel } from '../../../shared/components/forum/DiscussionForumPanel'
import { readPeople } from '../../../shared/storage/readers'

export function AdminDiscussionForumPage() {
  const adminPerson = useMemo(
    () =>
      readPeople().find((person) => person.role === 'Admin' && person.status === 'active') ??
      readPeople().find((person) => person.status === 'active') ??
      null,
    [],
  )

  if (!adminPerson) {
    return (
      <div className="rounded-2xl border border-divider bg-white p-10 text-center">
        <p className="text-[14px] font-semibold text-navy-900">No active users found</p>
        <p className="text-[12.5px] text-secondary-text mt-1">
          Add people in the admin portal to use the discussion forum.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <DiscussionForumPanel person={adminPerson} />
    </div>
  )
}

export default AdminDiscussionForumPage

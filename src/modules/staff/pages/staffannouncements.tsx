import { useMemo } from 'react'
import { AnnouncementEmptyState } from '../../../shared/components/announcements/AnnouncementUi'
import { PageHeader } from '../../../shared/components/PageHeader'
import { AnnouncementFeedCard } from '../../../shared/components/announcements/AnnouncementFeedCard'
import { readAnnouncements } from '../../../shared/storage/readers'
import { normalizeAnnouncementRecord, toStudentAnnouncementItems } from '../../../shared/storage/announcementUtils'
import type { AnnouncementTargetRole } from '../../../shared/types/announcements'

function filterForRole(role: AnnouncementTargetRole) {
  const records = readAnnouncements()
    .map(normalizeAnnouncementRecord)
    .filter((a) => a.targetRoles.includes(role))
  return toStudentAnnouncementItems(records)
}

export function StaffAnnouncementsPage() {
  const announcements = useMemo(() => filterForRole('Staff'), [])

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Announcements"
        subtitle="Campus updates targeted to staff members."
      />
      {announcements.length === 0 ? (
        <AnnouncementEmptyState
          title="No staff announcements"
          description="When admins publish updates for staff, they will appear here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {announcements.map((item) => (
            <AnnouncementFeedCard key={item.id} variant="student" item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

import { useMemo } from 'react'

import { PageHeader } from '../../../shared/components/PageHeader'
import { AnnouncementEmptyState } from '../../../shared/components/announcements/AnnouncementUi'
import { AnnouncementFeedCard } from '../../../shared/components/announcements/AnnouncementFeedCard'
import { readAnnouncements } from '../../../shared/storage/readers'
import { normalizeAnnouncementRecord, toStudentAnnouncementItems } from '../../../shared/storage/announcementUtils'

export function ManagerAnnouncementsPage() {
  const announcements = useMemo(() => {
    const records = readAnnouncements()
      .map(normalizeAnnouncementRecord)
      .filter((a) => a.targetRoles.includes('Manager') || a.targetRoles.includes('Staff'))
    return toStudentAnnouncementItems(records)
  }, [])

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader title="Announcements" subtitle="Updates for managers and staff." />
      {announcements.length === 0 ? (
        <AnnouncementEmptyState
          title="No announcements"
          description="When your learning team publishes updates for managers, they appear here."
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

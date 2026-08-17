import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Building2, Sparkles } from 'lucide-react'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import {
  AnnouncementEmptyState,
  AnnouncementFeaturedBanner,
  AnnouncementFilterBar,
} from '../../../shared/components/announcements/AnnouncementUi'
import { AnnouncementFeedCard } from '../../../shared/components/announcements/AnnouncementFeedCard'
import { recordAnnouncementViews } from '../../../shared/storage/announcementViews'
import { getSessionPerson } from '../../../shared/storage/session'
import { StudentPageError, StudentPageLoading } from '../components/StudentPageStates'
import { useStudentDashboard } from '../hooks/useStudentDashboard'

const tabs = ['All', 'Important', 'Updates', 'Course']

export function StudentAnnouncementsPage() {
  const { data, isLoading, isError } = useStudentDashboard()
  const [activeTab, setActiveTab] = useState('All')
  const student = getSessionPerson()
  const recordedRef = useRef<Set<string>>(new Set())

  const announcementIds = useMemo(
    () => data?.announcements.map((announcement) => announcement.id).join(',') ?? '',
    [data?.announcements],
  )

  useEffect(() => {
    if (!student || !announcementIds) return

    const pendingIds = announcementIds
      .split(',')
      .filter((id) => id && !recordedRef.current.has(id))

    if (pendingIds.length === 0) return

    recordAnnouncementViews(pendingIds, student.id)
    pendingIds.forEach((id) => recordedRef.current.add(id))
  }, [student?.id, announcementIds])

  const filtered = useMemo(() => {
    if (!data) return []
    if (activeTab === 'Important') return data.announcements.filter((a) => a.priority === 'important')
    if (activeTab === 'Updates') return data.announcements.filter((a) => a.priority === 'normal')
    if (activeTab === 'Course') return data.announcements.filter((a) => a.course)
    return data.announcements
  }, [data, activeTab])

  const stats = useMemo(() => {
    if (!data) return { total: 0, important: 0, course: 0 }
    return {
      total: data.announcements.length,
      important: data.announcements.filter((a) => a.priority === 'important').length,
      course: data.announcements.filter((a) => a.course).length,
    }
  }, [data])

  if (isLoading) return <StudentPageLoading />
  if (isError || !data) return <StudentPageError message="Failed to load announcements." />

  const latestImportant = data.announcements.find((a) => a.priority === 'important')

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Announcements"
        subtitle="Stay on top of campus news, course updates, and exam notices."
      />

      {latestImportant ? (
        <AnnouncementFeaturedBanner
          title={latestImportant.title}
          body={latestImportant.body}
          postedAt={latestImportant.postedAt}
          meta={
            <>
              {latestImportant.author}
              {latestImportant.course ? ` · ${latestImportant.course}` : ' · Campus-wide'}
            </>
          }
        />
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBlock
          label="Total posts"
          value={stats.total}
          sub="This term"
          icon={<Bell size={17} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Important"
          value={stats.important}
          sub="Needs attention"
          icon={<Sparkles size={17} />}
          iconBg="bg-warning-bg text-warning"
        />
        <StatBlock
          label="Course-specific"
          value={stats.course}
          sub="From instructors"
          icon={<Building2 size={17} />}
          iconBg="bg-navy-50 text-navy-600"
        />
      </div>

      <AnnouncementFilterBar count={filtered.length}>
        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </AnnouncementFilterBar>

      <div className="flex flex-col gap-3">
        {filtered.map((item) => (
          <AnnouncementFeedCard key={item.id} variant="student" item={item} />
        ))}

        {filtered.length === 0 ? (
          <AnnouncementEmptyState
            title={data.announcements.length === 0 ? 'You’re all caught up' : 'Nothing in this filter'}
            description={
              data.announcements.length === 0
                ? 'New announcements from your instructors and campus admin will appear here.'
                : 'Try All or another tab to browse your feed.'
            }
          />
        ) : null}
      </div>
    </div>
  )
}

export default StudentAnnouncementsPage

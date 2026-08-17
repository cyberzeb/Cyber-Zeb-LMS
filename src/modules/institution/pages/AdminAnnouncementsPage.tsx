import { useMemo, useState } from 'react'
import { Bell, Megaphone, Plus, Sparkles } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { AnnouncementFormModal } from '../../../shared/components/AnnouncementFormModal'
import {
  AnnouncementCreateButton,
  AnnouncementEmptyState,
  AnnouncementFeaturedBanner,
  AnnouncementFilterBar,
} from '../../../shared/components/announcements/AnnouncementUi'
import { AnnouncementFeedCard } from '../../../shared/components/announcements/AnnouncementFeedCard'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useAnnouncements } from '../../../shared/hooks/useAnnouncements'
import { readCourses, readPeople } from '../../../shared/storage/readers'
import { toAdminAnnouncementItems, isCampusWideAnnouncement } from '../../../shared/storage/announcementUtils'
import type { AnnouncementFormInput, AnnouncementRecord } from '../../../shared/types/announcements'

const tabs = ['All', 'Important', 'Updates']

export function AdminAnnouncementsPage() {
  const { notify } = useToast()
  const { announcements: records, createAnnouncement, updateAnnouncement, deleteAnnouncement } =
    useAnnouncements()
  const [activeTab, setActiveTab] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AnnouncementRecord | null>(null)

  const announcements = useMemo(() => toAdminAnnouncementItems(records), [records])

  const courses = useMemo(
    () =>
      readCourses()
        .filter((course) => course.status !== 'archived')
        .map((course) => ({ id: course.id, code: course.code, title: course.title })),
    [],
  )

  const students = useMemo(
    () =>
      readPeople()
        .filter((person) => person.role === 'Student')
        .map((person) => ({
          id: person.id,
          name: person.name,
          email: person.email,
          department: person.department,
        })),
    [],
  )

  const filtered = useMemo(() => {
    if (activeTab === 'Important') return announcements.filter((a) => a.priority === 'important')
    if (activeTab === 'Updates') return announcements.filter((a) => a.priority === 'normal')
    return announcements
  }, [announcements, activeTab])

  const stats = useMemo(
    () => ({
      total: announcements.length,
      important: announcements.filter((a) => a.priority === 'important').length,
      campusWide: records.filter((record) => isCampusWideAnnouncement(record)).length,
    }),
    [announcements, records],
  )

  const latestImportant = announcements.find((a) => a.priority === 'important')

  const handleSubmit = (input: AnnouncementFormInput) => {
    if (editing) {
      updateAnnouncement(editing.id, input)
      notify('Announcement updated.')
    } else {
      createAnnouncement(input, {
        authorId: 'admin',
        authorName: 'Institution Admin',
        authorRole: 'admin',
      })
      notify('Announcement published.')
    }
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Announcements"
        subtitle="Publish campus-wide notices and targeted updates across your institution."
        actions={<AnnouncementCreateButton onClick={() => { setEditing(null); setModalOpen(true) }} />}
      />

      {latestImportant ? (
        <AnnouncementFeaturedBanner
          title={latestImportant.title}
          body={latestImportant.body ?? ''}
          postedAt={latestImportant.postedAt}
          meta={
            <>
              {latestImportant.audience}
              {latestImportant.author ? ` · ${latestImportant.author}` : ''}
            </>
          }
        />
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBlock
          label="Published"
          value={stats.total}
          sub="Total announcements"
          icon={<Megaphone size={17} />}
          iconBg="bg-navy-50 text-navy-600"
        />
        <StatBlock
          label="Important"
          value={stats.important}
          sub="High-priority posts"
          icon={<Bell size={17} />}
          iconBg="bg-warning-bg text-warning"
        />
        <StatBlock
          label="Campus-wide"
          value={stats.campusWide}
          sub="All role groups"
          icon={<Sparkles size={17} />}
          iconBg="bg-lemon-100 text-lemon-800"
        />
      </div>

      <AnnouncementFilterBar count={filtered.length}>
        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </AnnouncementFilterBar>

      <div className="flex flex-col gap-3">
        {filtered.map((announcement) => (
          <AnnouncementFeedCard
            key={announcement.id}
            variant="admin"
            item={{
              id: announcement.id,
              title: announcement.title,
              body: announcement.body ?? '',
              postedAt: announcement.postedAt,
              priority: announcement.priority,
              audience: announcement.audience,
              author: announcement.author,
              views: announcement.views,
            }}
            onEdit={() => {
              setEditing(records.find((r) => r.id === announcement.id) ?? null)
              setModalOpen(true)
            }}
            onDelete={() => {
              deleteAnnouncement(announcement.id)
              notify(`“${announcement.title}” deleted.`, 'info')
            }}
          />
        ))}

        {filtered.length === 0 ? (
          <AnnouncementEmptyState
            title={announcements.length === 0 ? 'No announcements yet' : 'Nothing in this filter'}
            description={
              announcements.length === 0
                ? 'Publish your first campus notice for students, instructors, and staff.'
                : 'Try switching to All or another tab to see more posts.'
            }
            action={
              announcements.length === 0 ? (
                <Button variant="primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
                  <Plus size={15} />
                  Create announcement
                </Button>
              ) : undefined
            }
          />
        ) : null}
      </div>

      <AnnouncementFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSubmit={handleSubmit}
        mode={editing ? 'edit' : 'create'}
        authorRole="admin"
        courses={courses}
        students={students}
        initial={editing}
      />
    </div>
  )
}

export default AdminAnnouncementsPage

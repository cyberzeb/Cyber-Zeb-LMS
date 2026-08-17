import { useMemo, useState } from 'react'
import { Bell, Eye, Megaphone, Plus, Sparkles } from 'lucide-react'
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
import { InstructorPageError, InstructorPageLoading } from '../components/InstructorPageStates'
import { useInstructorDashboard } from '../hooks/useInstructorDashboard'
import { readAnnouncements, readCourses } from '../../../shared/storage/readers'
import { getInstructorStudents } from '../../../shared/storage/instructorAnnouncementUtils'
import { getSessionPerson } from '../../../shared/storage/session'
import { courseTeachesInstructor } from '../../institution/utils/courseAssignmentUtils'
import type { AnnouncementFormInput, AnnouncementRecord } from '../../../shared/types/announcements'

const tabs = ['All', 'Important', 'Updates', 'Mine']

export function InstructorAnnouncementsPage() {
  const { notify } = useToast()
  const { data, isLoading, isError, reload } = useInstructorDashboard()
  const { createAnnouncement, updateAnnouncement } = useAnnouncements()
  const [activeTab, setActiveTab] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AnnouncementRecord | null>(null)

  const instructor = getSessionPerson()

  const instructorStudents = useMemo(() => {
    if (!instructor) return []
    return getInstructorStudents(instructor.id, instructor.name)
  }, [instructor, modalOpen])

  const courses = useMemo(() => {
    if (!instructor) return []
    return readCourses()
      .filter((course) => courseTeachesInstructor(course, instructor.id, instructor.name))
      .map((course) => ({ id: course.id, code: course.code, title: course.title }))
  }, [instructor, modalOpen])

  const filtered = useMemo(() => {
    if (!data) return []
    let list = data.announcements
    if (activeTab === 'Important') list = list.filter((a) => a.priority === 'important')
    if (activeTab === 'Updates') list = list.filter((a) => a.priority === 'normal')
    if (activeTab === 'Mine') list = list.filter((a) => a.isOwn !== false)
    return list
  }, [data, activeTab])

  const stats = useMemo(() => {
    if (!data) return { total: 0, important: 0, views: 0, mine: 0 }
    return {
      total: data.announcements.length,
      important: data.announcements.filter((a) => a.priority === 'important').length,
      views: data.announcements.reduce((sum, a) => sum + a.views, 0),
      mine: data.announcements.filter((a) => a.isOwn !== false).length,
    }
  }, [data])

  const handleSubmit = (input: AnnouncementFormInput) => {
    if (!instructor) return

    if (editing) {
      updateAnnouncement(editing.id, input)
      notify('Announcement updated.')
    } else {
      createAnnouncement(input, {
        authorId: instructor.id,
        authorName: instructor.name,
        authorRole: 'instructor',
      })
      notify('Announcement published to your students.')
    }

    setModalOpen(false)
    setEditing(null)
    void reload()
  }

  if (isLoading) return <InstructorPageLoading />
  if (isError || !data) return <InstructorPageError message="Failed to load announcements." />

  const latestImportant = data.announcements.find((a) => a.priority === 'important')

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Announcements"
        subtitle="Reach all your students, a specific course, or hand-picked individuals."
        actions={
          <AnnouncementCreateButton
            onClick={() => {
              if (courses.length === 0) {
                notify('Assign a course before publishing announcements.', 'error')
                return
              }
              setEditing(null)
              setModalOpen(true)
            }}
          />
        }
      />

      {latestImportant ? (
        <AnnouncementFeaturedBanner
          title={latestImportant.title}
          body={latestImportant.body}
          postedAt={latestImportant.postedAt}
          meta={
            <span className="inline-flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Eye size={13} />
                {latestImportant.views} views
              </span>
              {latestImportant.course ? <span>{latestImportant.course}</span> : null}
              {latestImportant.isOwn === false ? <span>From administration</span> : null}
            </span>
          }
        />
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock
          label="In feed"
          value={stats.total}
          sub="Posts you can see"
          icon={<Megaphone size={17} />}
          iconBg="bg-navy-50 text-navy-600"
        />
        <StatBlock
          label="Yours"
          value={stats.mine}
          sub="Published by you"
          icon={<Sparkles size={17} />}
          iconBg="bg-lemon-100 text-lemon-800"
        />
        <StatBlock
          label="Important"
          value={stats.important}
          sub="Needs attention"
          icon={<Bell size={17} />}
          iconBg="bg-warning-bg text-warning"
        />
        <StatBlock
          label="Total views"
          value={stats.views}
          sub="Student reads"
          icon={<Eye size={17} />}
          iconBg="bg-info-bg text-info"
        />
      </div>

      <AnnouncementFilterBar count={filtered.length}>
        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </AnnouncementFilterBar>

      <div className="flex flex-col gap-3">
        {filtered.map((announcement) => (
          <AnnouncementFeedCard
            key={announcement.id}
            variant="instructor"
            item={announcement}
            onEdit={
              announcement.isOwn !== false
                ? () => {
                    setEditing(readAnnouncements().find((r) => r.id === announcement.id) ?? null)
                    setModalOpen(true)
                  }
                : undefined
            }
          />
        ))}

        {filtered.length === 0 ? (
          <AnnouncementEmptyState
            title={data.announcements.length === 0 ? 'No announcements yet' : 'Nothing in this filter'}
            description={
              data.announcements.length === 0
                ? 'Publish course updates, exam notices, and reminders to your students.'
                : 'Try another tab — admin notices appear under All.'
            }
            action={
              data.announcements.length === 0 && courses.length > 0 ? (
                <Button variant="primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
                  <Plus size={15} />
                  Publish first announcement
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
        authorRole="instructor"
        courses={courses}
        students={instructorStudents}
        initial={editing}
      />
    </div>
  )
}

export default InstructorAnnouncementsPage

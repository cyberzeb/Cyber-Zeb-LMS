import { useMemo, useState } from 'react'
import { AlertTriangle, BookOpen, CheckCircle2, FileEdit, Users, Plus, LayoutTemplate } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { SearchInput } from '../../../shared/components/SearchInput'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { CourseCard } from '../components/CourseCard'
import { CourseCreateModal } from '../components/CourseCreateModal'
import { useCourses } from '../hooks/useCourses'
import { useCampusContext } from '../context/CampusContext'
import { usePeople } from '../hooks/usePeople'
import type { CourseCreateInput, CourseRecord } from '../types'

const STAT = 17

const tabs = ['All', 'Pending Approval', 'Published', 'Draft', 'Archived']

export function CoursesPage() {
  const { notify } = useToast()
  const { courses, addCourse, updateCourseFromInput, removeCourse, approveCourse, rejectCourse } = useCourses()
  const { departments } = useCampusContext()
  const { people } = usePeople()

  const instructors = useMemo(
    () => people.filter((p) => p.role === 'Instructor' && p.status === 'active'),
    [people],
  )

  const [activeTab, setActiveTab] = useState('All')
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<CourseRecord | null>(null)

  const openCreate = () => {
    setEditingCourse(null)
    setModalOpen(true)
  }

  const openEdit = (course: CourseRecord) => {
    setEditingCourse(course)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingCourse(null)
  }

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchesTab =
        activeTab === 'All' ||
        (activeTab === 'Pending Approval' && c.approvalStatus === 'pending') ||
        (activeTab !== 'Pending Approval' && c.status === activeTab.toLowerCase())
      const q = query.trim().toLowerCase()
      const matchesQuery =
        q === '' ||
        c.title.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.level.toLowerCase().includes(q) ||
        (c.submittedByName?.toLowerCase().includes(q) ?? false)
      return matchesTab && matchesQuery
    })
  }, [courses, activeTab, query])

  const totals = useMemo(() => {
    const published = courses.filter((c) => c.status === 'published').length
    const drafts = courses.filter((c) => c.status === 'draft').length
    const pendingApproval = courses.filter((c) => c.approvalStatus === 'pending').length
    const enrolled = courses.reduce((sum, c) => sum + c.enrolledCount, 0)
    return { total: courses.length, published, drafts, pendingApproval, enrolled }
  }, [courses])

  const handleCreate = (input: CourseCreateInput) => {
    const newCourse = addCourse(input)
    notify(`Course “${newCourse.title}” created as a draft (${newCourse.progressPercent}% ready).`)
  }

  const handleUpdate = (courseId: string, input: CourseCreateInput) => {
    const updated = updateCourseFromInput(courseId, input)
    notify(`Course “${input.title}” updated (${updated.progressPercent}% ready).`)
  }

  const handleDelete = (course: CourseRecord) => {
    removeCourse(course.id)
    notify(`Course “${course.title}” deleted.`, 'info')
  }

  const handleApprove = (course: CourseRecord) => {
    approveCourse(course.id)
    notify(`Course “${course.title}” approved. You can publish it when ready.`, 'success')
  }

  const handleReject = (course: CourseRecord) => {
    const note = window.prompt(
      `Reject “${course.title}”? Optionally add a note for the instructor:`,
      '',
    )
    if (note === null) return
    rejectCourse(course.id, note)
    notify(`Course “${course.title}” rejected.`, 'info')
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Course Catalog"
        subtitle="Reusable course templates (code, content, credits). Create term-bound sections under Course Offerings."
        actions={
          <>
            <Button variant="secondary" onClick={() => notify('Course templates library is coming soon.', 'info')}>
              <LayoutTemplate size={15} />
              Templates
            </Button>
            <Button variant="primary" onClick={openCreate}>
              <Plus size={16} />
              Create Course
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
        <StatBlock label="Total Courses" value={totals.total} icon={<BookOpen size={STAT} />} />
        <StatBlock
          label="Pending Approval"
          value={totals.pendingApproval}
          sub="Instructor proposals"
          icon={<AlertTriangle size={STAT} />}
        />
        <StatBlock
          label="Published"
          value={totals.published}
          sub="Live for learners"
          icon={<CheckCircle2 size={STAT} />}
        />
        <StatBlock label="In Draft" value={totals.drafts} icon={<FileEdit size={STAT} />} />
        <StatBlock
          label="Total Enrollments"
          value={totals.enrolled.toLocaleString()}
          icon={<Users size={STAT} />}
        />
      </div>

      {totals.pendingApproval > 0 ? (
        <GlassCard className="p-4 border-warning/30 bg-warning-bg/30">
          <p className="text-[13px] font-semibold text-navy-900 flex items-center gap-2">
            <AlertTriangle size={16} className="text-warning" />
            {totals.pendingApproval} instructor course proposal{totals.pendingApproval === 1 ? '' : 's'} awaiting review
          </p>
          <p className="text-[12px] text-secondary-text mt-1">
            Open the Pending Approval tab to approve or reject submissions.
          </p>
        </GlassCard>
      ) : null}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search courses, codes, levels..."
          className="md:w-80"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onOpen={openEdit}
              onDelete={handleDelete}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      ) : (
        <GlassCard className="p-10 text-center text-secondary-text text-[13.5px] font-medium">
          No courses match your filters.
        </GlassCard>
      )}

      <CourseCreateModal
        open={modalOpen}
        course={editingCourse}
        onClose={closeModal}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        departments={departments}
        instructors={instructors}
      />
    </div>
  )
}

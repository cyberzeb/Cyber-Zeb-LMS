import { useMemo, useState } from 'react'
import { AlertTriangle, BookOpen, GraduationCap, Plus, Users } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { Monogram } from '../../../shared/components/Monogram'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { CourseCreateModal } from '../../institution/components/CourseCreateModal'
import { useCourses } from '../../institution/hooks/useCourses'
import type { CourseCreateInput, CourseRecord } from '../../institution/types'
import { getSessionPerson } from '../../../shared/storage/session'

const tabs = ['All', 'Approved', 'Pending approval', 'Rejected']

const approvalTone = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
} as const

const approvalLabel = {
  approved: 'Approved',
  pending: 'Pending approval',
  rejected: 'Rejected',
} as const

function resolveApprovalStatus(course: CourseRecord) {
  return course.approvalStatus ?? 'approved'
}

export function InstructorCoursesPage() {
  const { notify } = useToast()
  const instructor = getSessionPerson()
  const { courses, submitInstructorCourse, updateCourseFromInput, updateCourse } = useCourses()
  const [activeTab, setActiveTab] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<CourseRecord | null>(null)

  const myCourses = useMemo(() => {
    if (!instructor) return []
    return courses.filter(
      (c) =>
        c.submittedByInstructorId === instructor.id ||
        c.instructor === instructor.name,
    )
  }, [courses, instructor])

  const filtered = useMemo(() => {
    if (activeTab === 'Approved') return myCourses.filter((c) => resolveApprovalStatus(c) === 'approved')
    if (activeTab === 'Pending approval') return myCourses.filter((c) => resolveApprovalStatus(c) === 'pending')
    if (activeTab === 'Rejected') return myCourses.filter((c) => resolveApprovalStatus(c) === 'rejected')
    return myCourses
  }, [myCourses, activeTab])

  const stats = useMemo(() => {
    const approved = myCourses.filter((c) => resolveApprovalStatus(c) === 'approved').length
    const pending = myCourses.filter((c) => resolveApprovalStatus(c) === 'pending').length
    const students = myCourses.reduce((sum, c) => sum + c.enrolledCount, 0)
    const avgProgress =
      myCourses.length > 0
        ? Math.round(myCourses.reduce((sum, c) => sum + c.progressPercent, 0) / myCourses.length)
        : 0
    return { total: myCourses.length, approved, pending, students, avgProgress }
  }, [myCourses])

  if (!instructor) return null

  const openCreate = () => {
    setEditingCourse(null)
    setModalOpen(true)
  }

  const openEdit = (course: CourseRecord) => {
    if (resolveApprovalStatus(course) === 'pending') {
      notify('This course is awaiting admin approval and cannot be edited yet.', 'info')
      return
    }
    setEditingCourse(course)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingCourse(null)
  }

  const handleCreate = (input: CourseCreateInput) => {
    const course = submitInstructorCourse(input, {
      id: instructor.id,
      name: instructor.name,
    })
    notify(
      `Course proposal “${course.title}” submitted for admin approval (${course.progressPercent}% ready).`,
      'success',
    )
  }

  const handleUpdate = (courseId: string, input: CourseCreateInput) => {
    const existing = myCourses.find((c) => c.id === courseId)
    updateCourseFromInput(courseId, input)
    if (existing && resolveApprovalStatus(existing) === 'rejected') {
      updateCourse(courseId, {
        approvalStatus: 'pending',
        submittedAt: new Date().toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
        reviewNote: undefined,
        reviewedAt: undefined,
      })
      notify(`Course “${input.title}” updated and resubmitted for approval.`, 'success')
      return
    }
    notify(`Course “${input.title}” updated.`, 'success')
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="My Courses"
        subtitle={`Manage and propose courses you teach (${myCourses.length} assigned). Admin approval is required before publishing.`}
        actions={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={15} />
            Propose course
          </Button>
        }
      />

      {stats.pending > 0 ? (
        <GlassCard className="p-4 border-warning/30 bg-warning-bg/30">
          <p className="text-[13px] font-semibold text-navy-900 flex items-center gap-2">
            <AlertTriangle size={16} className="text-warning" />
            {stats.pending} course proposal{stats.pending === 1 ? '' : 's'} awaiting admin approval
          </p>
        </GlassCard>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatBlock label="My courses" value={stats.total} sub="Current term" icon={<BookOpen size={17} />} iconBg="bg-navy-50 text-navy-600" />
        <StatBlock label="Approved" value={stats.approved} sub="Ready to manage" icon={<GraduationCap size={17} />} iconBg="bg-success-bg text-success" />
        <StatBlock label="Pending approval" value={stats.pending} sub="With admin" icon={<AlertTriangle size={17} />} iconBg="bg-warning-bg text-warning" />
        <StatBlock label="Enrolled students" value={stats.students} sub={`${stats.avgProgress}% avg. progress`} icon={<Users size={17} />} iconBg="bg-lemon-100 text-lemon-800" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <span className="text-[12px] text-secondary-text">{filtered.length} course{filtered.length === 1 ? '' : 's'}</span>
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <BookOpen size={32} className="mx-auto text-navy-300 mb-3" />
          <p className="text-[14px] font-semibold text-navy-900">No courses in this view</p>
          <Button variant="primary" className="mt-4" onClick={openCreate}>
            <Plus size={15} />
            Propose course
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
          {filtered.map((course) => {
            const approval = resolveApprovalStatus(course)
            return (
              <GlassCard
                key={course.id}
                className={`p-0 overflow-hidden hover:shadow-md transition-shadow border-l-4 ${
                  approval === 'pending' ? 'border-l-warning' : approval === 'rejected' ? 'border-l-danger' : 'border-l-lemon-500'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <Monogram label={course.code} size="md" />
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusPill label={approvalLabel[approval]} tone={approvalTone[approval]} />
                      <StatusPill label={course.status === 'published' ? 'Published' : 'Draft'} tone={course.status === 'published' ? 'success' : 'neutral'} />
                    </div>
                  </div>
                  <h3 className="mt-4 text-[16px] font-bold text-navy-900 leading-snug">{course.title}</h3>
                  <p className="text-[12px] text-secondary-text mt-1">{course.code} · {course.credits ?? 3} credits</p>
                  {course.reviewNote && approval === 'rejected' ? (
                    <div className="mt-3 rounded-lg border border-danger/20 bg-danger-bg/40 px-3 py-2 text-[11.5px] text-danger">{course.reviewNote}</div>
                  ) : null}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="text-secondary-text font-semibold">Content readiness</span>
                      <span className="font-bold text-navy-900">{course.progressPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-navy-50 overflow-hidden">
                      <div className="h-full rounded-full bg-lemon-500" style={{ width: `${course.progressPercent}%` }} />
                    </div>
                  </div>
                  {approval !== 'pending' ? (
                    <Button variant="secondary" size="sm" className="w-full mt-4" onClick={() => openEdit(course)}>
                      {approval === 'rejected' ? 'Revise & resubmit' : 'Manage course'}
                    </Button>
                  ) : (
                    <p className="mt-4 text-[11.5px] text-secondary-text text-center">Editing locked until admin approval</p>
                  )}
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}

      <CourseCreateModal
        open={modalOpen}
        course={editingCourse}
        onClose={closeModal}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        variant="instructor"
      />
    </div>
  )
}

export default InstructorCoursesPage

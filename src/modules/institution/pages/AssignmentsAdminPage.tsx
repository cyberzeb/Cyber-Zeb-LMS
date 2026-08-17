import { useMemo, useState } from 'react'
import { ClipboardList, Plus, Trash2 } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { FormField } from '../../../shared/components/FormField'
import { Modal } from '../../../shared/components/Modal'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { readCourses } from '../../../shared/storage/readers'
import { formatAssessmentDateTime } from '../../../shared/storage/assessmentUtils'
import { useCampusContext } from '../context/CampusContext'
import { useSyncCampusFilter } from '../hooks/useSyncCampusFilter'
import { useAssignmentRecords } from '../hooks/useAssessments'
import type { AssessmentPublishStatus } from '../types/assessments'

const tabs = ['All', 'Published', 'Draft', 'Closed']

const statusTone: Record<AssessmentPublishStatus, 'success' | 'info' | 'neutral'> = {
  published: 'success',
  draft: 'info',
  closed: 'neutral',
}

export function AssignmentsAdminPage() {
  const { notify } = useToast()
  const { activeCampuses, selectedCampusId } = useCampusContext()
  const { records, createAssignment, updateAssignment, deleteAssignment } = useAssignmentRecords()
  const [activeTab, setActiveTab] = useState('All')
  const [query, setQuery] = useState('')
  const [campusFilter, setCampusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    courseId: '',
    dueAt: '',
    brief: '',
    maxPoints: '100',
  })

  useSyncCampusFilter(selectedCampusId, setCampusFilter)

  const courses = useMemo(
    () => readCourses().filter((c) => c.status !== 'archived'),
    [],
  )

  const campusOptions = useMemo(
    () => [
      { value: 'all', label: 'All campuses' },
      ...activeCampuses.map((c) => ({ value: c.id, label: c.name })),
    ],
    [activeCampuses],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records.filter((r) => {
      if (activeTab !== 'All' && r.status !== activeTab.toLowerCase()) return false
      if (campusFilter !== 'all' && r.campusId !== campusFilter) return false
      if (!q) return true
      return (
        r.title.toLowerCase().includes(q) ||
        r.courseCode.toLowerCase().includes(q) ||
        r.instructorName.toLowerCase().includes(q)
      )
    })
  }, [records, activeTab, query, campusFilter])

  const stats = useMemo(
    () => ({
      total: records.length,
      published: records.filter((r) => r.status === 'published').length,
      draft: records.filter((r) => r.status === 'draft').length,
    }),
    [records],
  )

  const handleCreate = () => {
    const course = courses.find((c) => c.id === form.courseId)
    if (!course || !form.title.trim() || !form.dueAt) {
      notify('Fill in title, course, and due date.', 'error')
      return
    }

    createAssignment({
      title: form.title.trim(),
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      instructorId: course.instructorId ?? '',
      instructorName: course.instructor,
      campusId: 'c1',
      department: course.department,
      dueAt: new Date(form.dueAt).toISOString(),
      brief: form.brief.trim() || 'See course instructions.',
      acceptedFormats: ['.pdf', '.docx', '.zip'],
      status: 'published',
      maxPoints: Number(form.maxPoints) || 100,
    })

    notify('Assignment published.')
    setModalOpen(false)
    setForm({ title: '', courseId: '', dueAt: '', brief: '', maxPoints: '100' })
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Assignments"
        subtitle="Create and manage coursework deadlines across the institution."
        actions={
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Plus size={15} />
            Create assignment
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBlock label="Total" value={stats.total} sub="All assignments" icon={<ClipboardList size={17} />} iconBg="bg-navy-50 text-navy-600" />
        <StatBlock label="Published" value={stats.published} sub="Visible to students" icon={<ClipboardList size={17} />} iconBg="bg-success-bg text-success" />
        <StatBlock label="Drafts" value={stats.draft} sub="Not yet published" icon={<ClipboardList size={17} />} iconBg="bg-info-bg text-info" />
      </div>

      <GlassCard className="p-4 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <SearchInput value={query} onChange={setQuery} placeholder="Search assignments…" className="sm:w-56" />
            <SelectMenu value={campusFilter} onChange={setCampusFilter} options={campusOptions} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-divider text-[11px] uppercase tracking-wider text-secondary-text">
                <th className="py-2.5 pr-4 font-semibold">Assignment</th>
                <th className="py-2.5 pr-4 font-semibold">Course</th>
                <th className="py-2.5 pr-4 font-semibold">Instructor</th>
                <th className="py-2.5 pr-4 font-semibold">Due</th>
                <th className="py-2.5 pr-4 font-semibold">Points</th>
                <th className="py-2.5 pr-4 font-semibold">Status</th>
                <th className="py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-divider/60 hover:bg-navy-50/40">
                  <td className="py-3 pr-4 font-semibold text-navy-900">{item.title}</td>
                  <td className="py-3 pr-4">{item.courseCode}</td>
                  <td className="py-3 pr-4 text-secondary-text">{item.instructorName}</td>
                  <td className="py-3 pr-4 text-secondary-text">{formatAssessmentDateTime(item.dueAt)}</td>
                  <td className="py-3 pr-4">{item.maxPoints}</td>
                  <td className="py-3 pr-4">
                    <StatusPill label={item.status} tone={statusTone[item.status]} />
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {item.status === 'draft' ? (
                        <Button variant="ghost" size="sm" onClick={() => { updateAssignment(item.id, { status: 'published' }); notify('Assignment published.') }}>
                          Publish
                        </Button>
                      ) : null}
                      {item.status === 'published' ? (
                        <Button variant="ghost" size="sm" onClick={() => { updateAssignment(item.id, { status: 'closed' }); notify('Assignment closed.') }}>
                          Close
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="sm" onClick={() => { deleteAssignment(item.id); notify('Assignment removed.') }}>
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <ClipboardList size={28} className="mx-auto text-navy-300 mb-2" />
              <p className="text-[13px] font-semibold text-navy-900">No assignments match your filters</p>
            </div>
          ) : null}
        </div>
      </GlassCard>

      <Modal
        open={modalOpen}
        title="Create assignment"
        description="Published assignments appear in student and instructor portals."
        icon={<ClipboardList size={18} />}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate}>Publish</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormField label="Title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="Assignment title" />
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-navy-900">Course</span>
            <select value={form.courseId} onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))} className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px]">
              <option value="">Select course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
              ))}
            </select>
          </label>
          <FormField label="Due date" value={form.dueAt} onChange={(v) => setForm((f) => ({ ...f, dueAt: v }))} placeholder="2026-08-25T23:59" />
          <FormField label="Brief" value={form.brief} onChange={(v) => setForm((f) => ({ ...f, brief: v }))} type="textarea" placeholder="Instructions for students" />
          <FormField label="Max points" value={form.maxPoints} onChange={(v) => setForm((f) => ({ ...f, maxPoints: v }))} type="number" />
        </div>
      </Modal>
    </div>
  )
}

export default AssignmentsAdminPage

import { useMemo, useState } from 'react'
import { Clock, FileText, MessageSquareText, Plus, UploadCloud } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { Monogram } from '../../../shared/components/Monogram'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { readAssignmentRecords } from '../../../shared/storage/readers'
import { CreateAssignmentModal } from '../components/CreateAssignmentModal'
import { GradeAssignmentModal } from '../components/GradeAssignmentModal'
import { InstructorPageError, InstructorPageLoading } from '../components/InstructorPageStates'
import { useInstructorDashboard } from '../hooks/useInstructorDashboard'
import type { AssignmentSubmission } from '../types'

const tabs = ['All', 'Pending review', 'Graded', 'Late']

const statusTone: Record<AssignmentSubmission['status'], 'warning' | 'success' | 'neutral' | 'danger'> = {
  'Pending review': 'warning',
  Graded: 'success',
  Late: 'danger',
  'Not submitted': 'neutral',
}

export function InstructorAssignmentsPage() {
  const { data, isLoading, isError, reload } = useInstructorDashboard()
  const [activeTab, setActiveTab] = useState('All')
  const [createOpen, setCreateOpen] = useState(false)
  const [gradeTarget, setGradeTarget] = useState<{ id: string; title: string; maxPoints: number } | null>(null)

  const stats = useMemo(() => {
    if (!data) return { pending: 0, graded: 0, total: 0 }
    return {
      pending: data.assignments.filter((a) => a.status === 'Pending review').length,
      graded: data.assignments.filter((a) => a.status === 'Graded').length,
      total: data.assignments.reduce((sum, a) => sum + a.pendingCount, 0),
    }
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return []
    if (activeTab === 'All') return data.assignments
    return data.assignments.filter((a) => a.status === activeTab)
  }, [data, activeTab])

  const openGradeModal = (assignmentId: string) => {
    const record = readAssignmentRecords().find((a) => a.id === assignmentId)
    const view = data?.assignments.find((a) => a.id === assignmentId)
    if (!record || !view) return
    setGradeTarget({ id: assignmentId, title: view.title, maxPoints: record.maxPoints })
  }

  if (isLoading) return <InstructorPageLoading />
  if (isError || !data) return <InstructorPageError message="Failed to load assignments." />

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Assignment Submissions"
        subtitle="Review student uploads, provide feedback, and publish grades."
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={15} />
            Create assignment
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBlock label="Pending review" value={stats.pending} sub="Assignments with submissions" icon={<Clock size={17} />} iconBg="bg-lemon-100 text-lemon-800" />
        <StatBlock label="Graded" value={stats.graded} sub="Completed assignments" icon={<MessageSquareText size={17} />} iconBg="bg-success-bg text-success" />
        <StatBlock label="Ungraded items" value={stats.total} sub="Individual submissions" icon={<UploadCloud size={17} />} iconBg="bg-warning-bg text-warning" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <span className="text-[12px] text-secondary-text">
          <FileText size={13} className="inline mr-1 -mt-0.5" />
          {filtered.length} assignment{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((assignment) => (
          <GlassCard
            key={assignment.id}
            className="p-0 overflow-hidden border-l-4 border-l-lemon-500 hover:shadow-md transition-shadow"
          >
            <div className="p-5 flex gap-4">
              <Monogram label={assignment.course} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill label={assignment.status} tone={statusTone[assignment.status]} />
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text">
                    {assignment.course}
                  </span>
                </div>
                <h3 className="mt-1.5 text-[15px] font-bold text-navy-900">{assignment.title}</h3>
                <p className="mt-1 text-[12px] text-secondary-text line-clamp-2">{assignment.brief}</p>
                <p className="mt-2 text-[12px] text-navy-700 font-semibold">{assignment.dueAt}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-[12px]">
                  <span className="text-secondary-text">
                    Submitted: <strong className="text-navy-900">{assignment.submittedCount}/{assignment.enrolled}</strong>
                  </span>
                  {assignment.pendingCount > 0 ? (
                    <span className="text-warning font-semibold">{assignment.pendingCount} to grade</span>
                  ) : null}
                </div>
                <Button variant="primary" size="sm" className="mt-3" onClick={() => openGradeModal(assignment.id)}>
                  <UploadCloud size={13} />
                  Review submissions
                </Button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <FileText size={32} className="mx-auto text-navy-300 mb-3" />
          <p className="text-[14px] font-semibold text-navy-900">No assignments in this view</p>
          <Button variant="primary" className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus size={15} />
            Create assignment
          </Button>
        </GlassCard>
      ) : null}

      <CreateAssignmentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        courses={data.courses}
        instructorId={data.instructorId}
        instructorName={data.instructorName}
        onCreated={() => void reload()}
      />

      {gradeTarget ? (
        <GradeAssignmentModal
          open
          assignmentId={gradeTarget.id}
          assignmentTitle={gradeTarget.title}
          maxPoints={gradeTarget.maxPoints}
          onClose={() => setGradeTarget(null)}
          onGraded={() => void reload()}
        />
      ) : null}
    </div>
  )
}

export default InstructorAssignmentsPage

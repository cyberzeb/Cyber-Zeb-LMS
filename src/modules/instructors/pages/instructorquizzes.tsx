import { useMemo, useState } from 'react'
import { BadgeCheck, ClipboardList, Lock, Plus, Trophy, Users } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { Monogram } from '../../../shared/components/Monogram'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { readQuizRecords } from '../../../shared/storage/readers'
import { useQuizzes } from '../../institution/hooks/useAssessments'
import { CreateQuizModal } from '../components/CreateQuizModal'
import { InstructorPageError, InstructorPageLoading } from '../components/InstructorPageStates'
import { useInstructorDashboard } from '../hooks/useInstructorDashboard'
import type { InstructorQuiz } from '../types'

const tabs = ['All', 'Published', 'Draft', 'Closed']

const statusTone: Record<InstructorQuiz['status'], 'info' | 'neutral' | 'success'> = {
  Published: 'info',
  Draft: 'neutral',
  Closed: 'success',
}

export function InstructorQuizzesPage() {
  const { notify } = useToast()
  const { updateQuiz } = useQuizzes()
  const { data, isLoading, isError, reload } = useInstructorDashboard()
  const [activeTab, setActiveTab] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)

  const stats = useMemo(() => {
    if (!data) return { published: 0, draft: 0, closed: 0, avgScore: '—' }
    const published = data.quizzes.filter((q) => q.status === 'Published').length
    const draft = data.quizzes.filter((q) => q.status === 'Draft').length
    const closed = data.quizzes.filter((q) => q.status === 'Closed').length
    const scores = data.quizzes.filter((q) => q.avgScore).map((q) => parseInt(q.avgScore ?? '0', 10))
    const avgScore = scores.length > 0 ? `${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%` : '—'
    return { published, draft, closed, avgScore }
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return []
    if (activeTab === 'All') return data.quizzes
    return data.quizzes.filter((q) => q.status === activeTab)
  }, [data, activeTab])

  const handlePublish = (quizId: string) => {
    updateQuiz(quizId, { status: 'published' })
    notify('Quiz published.')
    void reload()
  }

  const handleClose = (quizId: string) => {
    updateQuiz(quizId, { status: 'closed' })
    notify('Quiz closed.')
    void reload()
  }

  if (isLoading) return <InstructorPageLoading />
  if (isError || !data) return <InstructorPageError message="Failed to load quizzes." />

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Quizzes & Assessments"
        subtitle="Create quizzes, track submissions, and review class performance."
        actions={
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Plus size={15} />
            Create quiz
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatBlock label="Published" value={stats.published} sub="Active assessments" icon={<ClipboardList size={17} />} iconBg="bg-lemon-100 text-lemon-800" />
        <StatBlock label="Drafts" value={stats.draft} sub="Not yet published" icon={<Lock size={17} />} iconBg="bg-navy-50 text-navy-600" />
        <StatBlock label="Closed" value={stats.closed} sub="Completed assessments" icon={<Trophy size={17} />} iconBg="bg-success-bg text-success" />
        <StatBlock label="Avg. score" value={stats.avgScore} sub="Class average" icon={<BadgeCheck size={17} />} iconBg="bg-info-bg text-info" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <span className="text-[12px] text-secondary-text">
          <ClipboardList size={13} className="inline mr-1 -mt-0.5" />
          {filtered.length} quiz{filtered.length === 1 ? '' : 'zes'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((quiz) => {
          const record = readQuizRecords().find((q) => q.id === quiz.id)
          return (
            <GlassCard
              key={quiz.id}
              className="p-0 overflow-hidden border-l-4 border-l-lemon-500 hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <Monogram label={quiz.title} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill label={quiz.status} tone={statusTone[quiz.status]} />
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text">
                        {quiz.course}
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-[15px] font-bold text-navy-900 leading-snug">{quiz.title}</h3>
                    <p className="mt-2 text-[12px] text-secondary-text">
                      {quiz.questions} questions · {quiz.duration} · {quiz.dueAt}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-[12px]">
                      <span className="inline-flex items-center gap-1 text-navy-700">
                        <Users size={13} />
                        {quiz.submissions}/{quiz.enrolled} submitted
                      </span>
                      {quiz.avgScore ? (
                        <span className="font-bold text-success">Avg: {quiz.avgScore}</span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {record?.status === 'draft' ? (
                        <Button variant="primary" size="sm" onClick={() => handlePublish(quiz.id)}>
                          Publish
                        </Button>
                      ) : null}
                      {record?.status === 'published' ? (
                        <Button variant="secondary" size="sm" onClick={() => handleClose(quiz.id)}>
                          Close quiz
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <ClipboardList size={32} className="mx-auto text-navy-300 mb-3" />
          <p className="text-[14px] font-semibold text-navy-900">No quizzes in this view</p>
          <Button variant="primary" className="mt-4" onClick={() => setModalOpen(true)}>
            <Plus size={15} />
            Create quiz
          </Button>
        </GlassCard>
      ) : null}

      <CreateQuizModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        courses={data.courses}
        instructorId={data.instructorId}
        instructorName={data.instructorName}
        onCreated={() => void reload()}
      />
    </div>
  )
}

export default InstructorQuizzesPage

import { useMemo, useState } from 'react'
import { BadgeCheck, ClipboardList, Lock, PlayCircle, Trophy } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { QuizAndAssessmentCard } from '../components/AssessmentCards'
import { StudentPageError, StudentPageLoading } from '../components/StudentPageStates'
import { useStudentDashboard } from '../hooks/useStudentDashboard'

const tabs = ['All', 'Open', 'Completed', 'Locked']

export function StudentQuizzesPage() {
  const { data, isLoading, isError } = useStudentDashboard()
  const [activeTab, setActiveTab] = useState('All')

  const stats = useMemo(() => {
    if (!data) return { open: 0, completed: 0, locked: 0, avgScore: '—' }
    const open = data.quizzes.filter((q) => q.status === 'Open').length
    const completed = data.quizzes.filter((q) => q.status === 'Completed').length
    const locked = data.quizzes.filter((q) => q.status === 'Locked').length
    const scores = data.quizzes.filter((q) => q.score).map((q) => parseInt(q.score ?? '0', 10))
    const avgScore = scores.length > 0 ? `${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%` : '—'
    return { open, completed, locked, avgScore }
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return []
    if (activeTab === 'All') return data.quizzes
    return data.quizzes.filter((q) => q.status === activeTab)
  }, [data, activeTab])

  if (isLoading) return <StudentPageLoading />
  if (isError || !data) return <StudentPageError message="Failed to load quizzes." />

  const openQuiz = data.quizzes.find((q) => q.status === 'Open')

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Quizzes & Assessments"
        subtitle="Practice checks, weekly assessments, and graded quizzes for your courses."
        actions={
          openQuiz ? (
            <Button variant="primary">
              <PlayCircle size={15} />
              Start: {openQuiz.title.split(' ').slice(0, 3).join(' ')}…
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatBlock
          label="Open now"
          value={stats.open}
          sub="Ready to attempt"
          icon={<PlayCircle size={17} />}
          iconBg="bg-lemon-100 text-lemon-800"
        />
        <StatBlock
          label="Completed"
          value={stats.completed}
          sub="Graded attempts"
          icon={<Trophy size={17} />}
          iconBg="bg-success-bg text-success"
        />
        <StatBlock
          label="Locked"
          value={stats.locked}
          sub="Unlocks later"
          icon={<Lock size={17} />}
          iconBg="bg-navy-50 text-navy-600"
        />
        <StatBlock
          label="Avg. score"
          value={stats.avgScore}
          sub="Across completed quizzes"
          icon={<BadgeCheck size={17} />}
          iconBg="bg-info-bg text-info"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <span className="text-[12px] text-secondary-text">
          <ClipboardList size={13} className="inline mr-1 -mt-0.5" />
          {filtered.length} quiz{filtered.length === 1 ? '' : 'zes'}
        </span>
      </div>

      <QuizAndAssessmentCard quizzes={filtered} />
    </div>
  )
}

export default StudentQuizzesPage

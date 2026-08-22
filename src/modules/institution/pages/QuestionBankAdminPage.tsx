import { useMemo, useState } from 'react'
import { BookOpenCheck, Plus, Trash2 } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { FormField } from '../../../shared/components/FormField'
import { Modal } from '../../../shared/components/Modal'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { readCourses } from '../../../shared/storage/readers'
import { useQuestionBank } from '../hooks/useAssessments'
import type { QuestionDifficulty, QuestionType } from '../types/assessments'

const tabs = ['All', 'MCQ', 'True/False', 'Short Answer']

const difficultyTone: Record<QuestionDifficulty, 'success' | 'info' | 'warning'> = {
  easy: 'success',
  medium: 'info',
  hard: 'warning',
}

export function QuestionBankAdminPage() {
  const { notify } = useToast()
  const { records, createQuestion, deleteQuestion } = useQuestionBank()
  const [activeTab, setActiveTab] = useState('All')
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    stem: '',
    type: 'mcq' as QuestionType,
    department: 'Computer Science',
    difficulty: 'medium' as QuestionDifficulty,
    points: '5',
    courseId: '',
    correctAnswer: '',
  })

  const courses = useMemo(
    () => readCourses().filter((c) => c.status !== 'archived'),
    [],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records.filter((item) => {
      if (activeTab === 'MCQ' && item.type !== 'mcq') return false
      if (activeTab === 'True/False' && item.type !== 'true-false') return false
      if (activeTab === 'Short Answer' && item.type !== 'short-answer') return false
      if (!q) return true
      return (
        item.stem.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q)) ||
        (item.courseCode?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [records, activeTab, query])

  const stats = useMemo(
    () => ({
      total: records.length,
      mcq: records.filter((r) => r.type === 'mcq').length,
      short: records.filter((r) => r.type === 'short-answer').length,
    }),
    [records],
  )

  const handleCreate = () => {
    if (!form.stem.trim()) {
      notify('Enter a question stem.', 'error')
      return
    }

    const course = courses.find((c) => c.id === form.courseId)

    createQuestion({
      stem: form.stem.trim(),
      type: form.type,
      options: form.type === 'mcq' ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined,
      correctAnswer: form.correctAnswer.trim() || undefined,
      tags: course ? [course.code.toLowerCase()] : ['general'],
      courseId: course?.id,
      courseCode: course?.code,
      department: form.department,
      difficulty: form.difficulty,
      points: Number(form.points) || 5,
    })

    notify('Question added to bank.')
    setModalOpen(false)
    setForm({
      stem: '',
      type: 'mcq',
      department: 'Computer Science',
      difficulty: 'medium',
      points: '5',
      courseId: '',
      correctAnswer: '',
    })
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Question Bank"
        subtitle="Reusable questions for quizzes and exams across courses."
        actions={
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Plus size={15} />
            Add question
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBlock label="Total questions" value={stats.total} sub="In the bank" icon={<BookOpenCheck size={17} />} iconBg="bg-navy-50 text-navy-600" />
        <StatBlock label="Multiple choice" value={stats.mcq} sub="MCQ items" icon={<BookOpenCheck size={17} />} iconBg="bg-info-bg text-info" />
        <StatBlock label="Short answer" value={stats.short} sub="Open-ended items" icon={<BookOpenCheck size={17} />} iconBg="bg-lemon-100 text-lemon-800" />
      </div>

      <GlassCard className="p-4 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
          <SearchInput value={query} onChange={setQuery} placeholder="Search questions…" className="sm:w-72" />
        </div>

        <div className="flex flex-col gap-3">
          {filtered.map((question) => (
            <div
              key={question.id}
              className="list-row-card p-4 flex flex-col sm:flex-row sm:items-start gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill label={question.type} tone="info" />
                  <StatusPill label={question.difficulty} tone={difficultyTone[question.difficulty]} />
                  {question.courseCode ? (
                    <span className="text-[11px] font-semibold text-secondary-text">{question.courseCode}</span>
                  ) : (
                    <span className="text-[11px] font-semibold text-secondary-text">General</span>
                  )}
                  <span className="text-[11px] text-secondary-text">{question.points} pts</span>
                </div>
                <p className="mt-2 text-[14px] font-semibold text-navy-900 leading-snug">{question.stem}</p>
                {question.tags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {question.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-semibold text-navy-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <Button variant="ghost" size="sm" className="shrink-0" onClick={() => { deleteQuestion(question.id); notify('Question removed.') }}>
                <Trash2 size={13} />
              </Button>
            </div>
          ))}
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpenCheck size={28} className="mx-auto text-navy-300 mb-2" />
              <p className="text-[13px] font-semibold text-navy-900">No questions match your filters</p>
            </div>
          ) : null}
        </div>
      </GlassCard>

      <Modal
        open={modalOpen}
        title="Add question"
        description="Questions can be reused across multiple quizzes."
        icon={<BookOpenCheck size={18} />}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate}>Save question</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormField label="Question stem" value={form.stem} onChange={(v) => setForm((f) => ({ ...f, stem: v }))} type="textarea" placeholder="Enter the question text" />
          <FormField
            label="Type"
            value={form.type}
            onChange={(v) => setForm((f) => ({ ...f, type: v as QuestionType }))}
            type="select"
            options={['mcq', 'true-false', 'short-answer']}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-navy-900">Course (optional)</span>
            <select value={form.courseId} onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))} className="w-full input-surface rounded-lg px-3 py-2 text-[13px] dark:[color-scheme:dark]">
              <option value="">General / cross-course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
              ))}
            </select>
          </label>
          <FormField
            label="Difficulty"
            value={form.difficulty}
            onChange={(v) => setForm((f) => ({ ...f, difficulty: v as QuestionDifficulty }))}
            type="select"
            options={['easy', 'medium', 'hard']}
          />
          <FormField label="Points" value={form.points} onChange={(v) => setForm((f) => ({ ...f, points: v }))} type="number" />
          <FormField label="Correct answer (optional)" value={form.correctAnswer} onChange={(v) => setForm((f) => ({ ...f, correctAnswer: v }))} placeholder="For auto-graded types" />
        </div>
      </Modal>
    </div>
  )
}

export default QuestionBankAdminPage

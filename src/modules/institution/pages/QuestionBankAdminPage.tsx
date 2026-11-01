import { useMemo, useState } from 'react'
import { BookOpenCheck, Copy, Eye, Pencil, Plus, Sparkles, Trash2, UserCheck } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { Modal } from '../../../shared/components/Modal'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { QuestionAnswerInput, QuestionStem } from '../../../shared/assessments/QuestionAnswerInput'
import {
  QUESTION_TYPES,
  needsManualGrading,
  questionTypeInfo,
  toStudentQuestion,
} from '../../../shared/assessments/questionTypes'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { QuestionEditorModal, type QuestionDraft } from '../components/QuestionEditorModal'
import { useCourses } from '../hooks/useCourses'
import { useQuestionBank } from '../hooks/useAssessments'
import type { QuestionDifficulty, QuestionRecord, QuizAnswer } from '../types/assessments'

const difficultyTone: Record<QuestionDifficulty, 'success' | 'info' | 'warning'> = {
  easy: 'success',
  medium: 'info',
  hard: 'warning',
}

/** One line telling the author what the answer key is. */
function answerSummary(q: QuestionRecord): string {
  switch (q.type) {
    case 'mcq':
      return q.correctAnswer ? `Answer: ${q.correctAnswer}` : 'No correct option set'
    case 'multi-select':
      return `Answers: ${(q.correctAnswers ?? []).join(', ') || '—'}`
    case 'true-false':
      return `Answer: ${q.correctAnswer ?? '—'}`
    case 'short-answer':
      return q.acceptedAnswers?.length
        ? `Accepts: ${q.acceptedAnswers.join(' / ')}`
        : q.correctAnswer
          ? `Accepts: ${q.correctAnswer}`
          : 'Marked by the instructor'
    case 'numeric':
      return `Answer: ${q.numericAnswer ?? '—'}${q.unit ? ` ${q.unit}` : ''}${q.tolerance ? ` (±${q.tolerance})` : ''}`
    case 'fill-blank':
      return `Blanks: ${(q.blanks ?? []).map((b) => b.join(' / ')).join(' · ') || '—'}`
    case 'matching':
      return `${q.pairs?.length ?? 0} pairs`
    case 'ordering':
      return `${q.orderItems?.length ?? 0} items in order`
    case 'essay':
      return q.wordLimit ? `Up to ${q.wordLimit} words · marked by the instructor` : 'Marked by the instructor'
  }
}

export function QuestionBankAdminPage() {
  const { notify } = useToast()
  const { records, setRecords, createQuestion, deleteQuestion } = useQuestionBank()
  const { courses } = useCourses()
  const [typeFilter, setTypeFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<QuestionRecord | null>(null)
  const [previewing, setPreviewing] = useState<QuestionRecord | null>(null)
  const [previewAnswer, setPreviewAnswer] = useState<QuizAnswer | undefined>(undefined)

  const activeCourses = useMemo(() => courses.filter((c) => c.status !== 'archived'), [courses])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false
      if (courseFilter === 'none' && item.courseId) return false
      if (courseFilter !== 'all' && courseFilter !== 'none' && item.courseId !== courseFilter) return false
      if (!q) return true
      return (
        item.stem.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q)) ||
        (item.courseCode?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [records, typeFilter, courseFilter, query])

  const stats = useMemo(
    () => ({
      total: records.length,
      formats: new Set(records.map((r) => r.type)).size,
      auto: records.filter((r) => !needsManualGrading(r)).length,
      manual: records.filter((r) => needsManualGrading(r)).length,
    }),
    [records],
  )

  const typeOptions = useMemo(
    () => [
      { value: 'all', label: 'All formats' },
      ...QUESTION_TYPES.map((t) => ({
        value: t.type,
        label: t.label,
        hint: String(records.filter((r) => r.type === t.type).length),
      })),
    ],
    [records],
  )

  const courseOptions = useMemo(
    () => [
      { value: 'all', label: 'All courses' },
      { value: 'none', label: 'Shared (no course)' },
      ...activeCourses.map((c) => ({ value: c.id, label: `${c.code} — ${c.title}` })),
    ],
    [activeCourses],
  )

  const openNew = () => {
    setEditing(null)
    setEditorOpen(true)
  }

  const handleSave = (draft: QuestionDraft) => {
    if (editing) {
      // Replace the whole record so fields of a previous format do not linger.
      const updated: QuestionRecord = { ...(draft as QuestionRecord), id: editing.id, createdAt: editing.createdAt }
      setRecords((prev) => prev.map((r) => (r.id === editing.id ? updated : r)))
      notify('Question updated.')
    } else {
      createQuestion(draft)
      notify(`${questionTypeInfo(draft.type).label} question added to the bank.`)
    }
    setEditorOpen(false)
  }

  const handleDuplicate = (question: QuestionRecord) => {
    const copy: QuestionRecord = {
      ...question,
      id: createId('q'),
      stem: `${question.stem} (copy)`,
      createdAt: new Date().toISOString(),
    }
    setRecords((prev) => [copy, ...prev])
    notify('Question duplicated.')
  }

  const openPreview = (question: QuestionRecord) => {
    setPreviewAnswer(undefined)
    setPreviewing(question)
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Question Bank"
        subtitle="Reusable questions for quizzes and exams. Pick a format for each question — multiple choice, matching, fill in the blanks, essays and more."
        actions={
          <Button variant="primary" onClick={openNew}>
            <Plus size={15} />
            New question
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock label="Questions" value={stats.total} sub="In the bank" icon={<BookOpenCheck size={17} />} />
        <StatBlock label="Formats used" value={`${stats.formats} / ${QUESTION_TYPES.length}`} icon={<Sparkles size={17} />} />
        <StatBlock label="Auto-graded" value={stats.auto} sub="Scored on submit" icon={<BookOpenCheck size={17} />} />
        <StatBlock label="Marked by hand" value={stats.manual} sub="Essays and open answers" icon={<UserCheck size={17} />} />
      </div>

      <GlassCard className="p-4 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <SelectMenu value={typeFilter} options={typeOptions} onChange={setTypeFilter} aria-label="Filter by format" />
            <SelectMenu
              value={courseFilter}
              options={courseOptions}
              onChange={setCourseFilter}
              aria-label="Filter by course"
              className="min-w-[200px]"
            />
          </div>
          <SearchInput value={query} onChange={setQuery} placeholder="Search questions or tags…" className="sm:w-72" />
        </div>

        <div className="flex flex-col gap-3">
          {filtered.map((question) => {
            const info = questionTypeInfo(question.type)
            return (
              <div key={question.id} className="list-row-card p-4 flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill label={info.label} tone="info" />
                    <StatusPill label={question.difficulty} tone={difficultyTone[question.difficulty]} />
                    {needsManualGrading(question) ? <StatusPill label="Marked by hand" tone="neutral" /> : null}
                    <span className="text-[11px] font-semibold text-secondary-text">
                      {question.courseCode ?? 'Shared'} · {question.points} pt{question.points === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="mt-2 text-[14px] font-semibold text-navy-900">{question.stem}</p>
                  <p className="mt-1 text-[12px] text-secondary-text truncate">{answerSummary(question)}</p>
                  {question.tags.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {question.tags.map((tag) => (
                        <span key={tag} className="rounded-md bg-navy-50 px-2 py-0.5 text-[10.5px] font-semibold text-navy-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openPreview(question)} aria-label="Preview as a student">
                    <Eye size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(question)
                      setEditorOpen(true)
                    }}
                    aria-label="Edit question"
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDuplicate(question)} aria-label="Duplicate question">
                    <Copy size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:bg-danger-bg"
                    onClick={() => {
                      deleteQuestion(question.id)
                      notify('Question removed.', 'info')
                    }}
                    aria-label="Delete question"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[13px] font-semibold text-navy-900">
                {records.length === 0 ? 'The bank is empty' : 'No questions match your filters'}
              </p>
              {records.length === 0 ? (
                <Button variant="primary" className="mt-4" onClick={openNew}>
                  <Plus size={15} />
                  Add the first question
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </GlassCard>

      <QuestionEditorModal
        open={editorOpen}
        question={editing}
        courses={activeCourses}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
      />

      <Modal
        open={previewing !== null}
        onClose={() => setPreviewing(null)}
        size="lg"
        icon={<Eye size={18} />}
        title="Student preview"
        description={previewing ? `${questionTypeInfo(previewing.type).label} · ${previewing.points} points` : undefined}
        footer={
          <Button variant="secondary" onClick={() => setPreviewing(null)}>
            Close
          </Button>
        }
      >
        {previewing ? (
          <div className="flex flex-col gap-3">
            <QuestionStem question={toStudentQuestion(previewing)} />
            <QuestionAnswerInput question={toStudentQuestion(previewing)} value={previewAnswer} onChange={setPreviewAnswer} />
            <p className="mt-2 text-[12px] text-secondary-text border-t border-divider pt-3">{answerSummary(previewing)}</p>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

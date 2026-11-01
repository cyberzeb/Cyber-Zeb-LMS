import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlignLeft,
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Check,
  CircleDot,
  Hash,
  ListChecks,
  ListOrdered,
  Plus,
  TextCursorInput,
  ToggleLeft,
  Type,
  X,
} from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { Modal } from '../../../shared/components/Modal'
import { QuestionAnswerInput, QuestionStem } from '../../../shared/assessments/QuestionAnswerInput'
import {
  BLANK_MARKER,
  QUESTION_TYPES,
  blankCount,
  cleanQuestion,
  emptyQuestionFields,
  needsManualGrading,
  toStudentQuestion,
  validateQuestion,
} from '../../../shared/assessments/questionTypes'
import type { CourseRecord } from '../types'
import type { QuestionDifficulty, QuestionRecord, QuestionType, QuizAnswer } from '../types/assessments'

export type QuestionDraft = Omit<QuestionRecord, 'id' | 'createdAt'> & { id?: string }

interface QuestionEditorModalProps {
  open: boolean
  /** null creates a new question. */
  question: QuestionRecord | null
  courses: CourseRecord[]
  onClose: () => void
  onSave: (draft: QuestionDraft) => void
}

const TYPE_ICONS: Record<QuestionType, ReactNode> = {
  mcq: <CircleDot size={16} />,
  'multi-select': <ListChecks size={16} />,
  'true-false': <ToggleLeft size={16} />,
  'short-answer': <Type size={16} />,
  numeric: <Hash size={16} />,
  'fill-blank': <TextCursorInput size={16} />,
  matching: <ArrowLeftRight size={16} />,
  ordering: <ListOrdered size={16} />,
  essay: <AlignLeft size={16} />,
}

const inputClass =
  'w-full bg-white dark:bg-navy-50 border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 placeholder:text-secondary-text focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25'
const iconButton =
  'w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-secondary-text hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed'

function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <span className="text-[12px] font-semibold text-navy-900">{children}</span>
      {hint ? <span className="ml-2 text-[11px] text-secondary-text">{hint}</span> : null}
    </div>
  )
}

function newDraft(type: QuestionType = 'mcq'): QuestionDraft {
  return {
    stem: '',
    type,
    tags: [],
    department: '',
    difficulty: 'medium',
    points: 5,
    ...emptyQuestionFields(type),
  }
}

/**
 * Create or edit a question. The author picks a format first; the fields below
 * change to fit it (options for multiple choice, pairs for matching, …), and a
 * live preview shows exactly what students will see.
 */
export function QuestionEditorModal({ open, question, courses, onClose, onSave }: QuestionEditorModalProps) {
  const [draft, setDraft] = useState<QuestionDraft>(newDraft())
  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState('')
  const [previewAnswer, setPreviewAnswer] = useState<QuizAnswer | undefined>(undefined)

  useEffect(() => {
    if (!open) return
    setError('')
    setTagInput('')
    setPreviewAnswer(undefined)
    if (question) {
      // Older questions may lack the fields their type needs.
      setDraft({ ...emptyQuestionFields(question.type), ...question })
    } else {
      setDraft(newDraft())
    }
  }, [open, question])

  const update = (patch: Partial<QuestionDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }))
    setError('')
  }

  const changeType = (type: QuestionType) => {
    if (type === draft.type) return
    setDraft((prev) => ({ ...prev, type, ...emptyQuestionFields(type) }))
    setPreviewAnswer(undefined)
    setError('')
  }

  const blanks = blankCount(draft.stem)
  const preview = useMemo(
    () => toStudentQuestion({ ...(cleanQuestion(draft) as QuestionRecord), id: draft.id ?? 'preview', createdAt: '' }),
    [draft],
  )

  const handleSave = () => {
    const problem = validateQuestion(draft)
    if (problem) {
      setError(problem)
      return
    }
    const course = courses.find((c) => c.id === draft.courseId)
    const tags = draft.tags.length ? draft.tags : course ? [course.code.toLowerCase()] : ['general']
    onSave(
      cleanQuestion({
        ...draft,
        stem: draft.stem.trim(),
        tags,
        courseCode: course?.code,
        department: course?.department ?? draft.department ?? '',
        points: Math.max(0.5, Number(draft.points) || 1),
      }),
    )
  }

  /* ── per-type helpers ─────────────────────────────────── */
  const options = draft.options ?? []
  const setOption = (index: number, text: string) => {
    const previous = options[index]
    const next = options.map((o, i) => (i === index ? text : o))
    // Keep the correct-answer marks pointing at the edited option.
    const patch: Partial<QuestionDraft> = { options: next }
    if (draft.type === 'mcq' && draft.correctAnswer === previous) patch.correctAnswer = text
    if (draft.type === 'multi-select') {
      patch.correctAnswers = (draft.correctAnswers ?? []).map((a) => (a === previous ? text : a))
    }
    update(patch)
  }
  const removeOption = (index: number) => {
    const removed = options[index]
    update({
      options: options.filter((_, i) => i !== index),
      correctAnswer: draft.correctAnswer === removed ? '' : draft.correctAnswer,
      correctAnswers: draft.correctAnswers?.filter((a) => a !== removed),
    })
  }

  const listEditor = (
    field: 'acceptedAnswers' | 'orderItems',
    placeholder: (i: number) => string,
    ordered = false,
  ) => {
    const list = draft[field] ?? []
    const move = (from: number, to: number) => {
      const next = [...list]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      update({ [field]: next })
    }
    return (
      <div className="flex flex-col gap-2">
        {list.map((value, i) => (
          <div key={i} className="flex items-center gap-2">
            {ordered ? (
              <span className="w-6 h-6 shrink-0 rounded-full bg-navy-50 text-navy-700 text-[11px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
            ) : null}
            <input
              value={value}
              onChange={(e) => update({ [field]: list.map((v, j) => (j === i ? e.target.value : v)) })}
              placeholder={placeholder(i)}
              className={inputClass}
            />
            {ordered ? (
              <>
                <button type="button" className={iconButton} disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move up">
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  className={iconButton}
                  disabled={i === list.length - 1}
                  onClick={() => move(i, i + 1)}
                  aria-label="Move down"
                >
                  <ArrowDown size={14} />
                </button>
              </>
            ) : null}
            <button
              type="button"
              className={iconButton}
              disabled={list.length <= 1}
              onClick={() => update({ [field]: list.filter((_, j) => j !== i) })}
              aria-label="Remove"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => update({ [field]: [...list, ''] })}
          className="self-start inline-flex items-center gap-1 text-[12px] font-bold text-lemon-700 hover:text-lemon-900 cursor-pointer"
        >
          <Plus size={13} />
          {field === 'orderItems' ? 'Add item' : 'Add another accepted answer'}
        </button>
      </div>
    )
  }

  const partialCreditToggle = (
    <label className="flex items-center gap-2 text-[12.5px] text-navy-900 cursor-pointer">
      <input
        type="checkbox"
        checked={Boolean(draft.partialCredit)}
        onChange={(e) => update({ partialCredit: e.target.checked })}
        className="accent-lemon-600"
      />
      Give partial credit for each correct part
    </label>
  )

  const answerFields = (() => {
    switch (draft.type) {
      case 'mcq':
      case 'multi-select': {
        const multi = draft.type === 'multi-select'
        const correct = new Set(multi ? draft.correctAnswers ?? [] : draft.correctAnswer ? [draft.correctAnswer] : [])
        return (
          <div className="flex flex-col gap-2">
            <Label hint={multi ? 'Tick every correct option' : 'Click the circle next to the correct option'}>Options</Label>
            {options.map((option, i) => {
              const isCorrect = option.trim() !== '' && correct.has(option)
              return (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!option.trim()}
                    onClick={() => {
                      if (multi) {
                        const list = draft.correctAnswers ?? []
                        update({ correctAnswers: isCorrect ? list.filter((a) => a !== option) : [...list, option] })
                      } else {
                        update({ correctAnswer: option })
                      }
                    }}
                    aria-label={isCorrect ? 'Correct option' : 'Mark as correct'}
                    title={isCorrect ? 'Correct' : 'Mark as correct'}
                    className={`w-8 h-8 shrink-0 ${multi ? 'rounded-lg' : 'rounded-full'} border flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isCorrect ? 'bg-success border-success text-white' : 'border-divider text-transparent hover:border-success/60'
                    }`}
                  >
                    <Check size={14} strokeWidth={3} />
                  </button>
                  <input
                    value={option}
                    onChange={(e) => setOption(i, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className={`${inputClass} ${isCorrect ? 'border-success/60' : ''}`}
                  />
                  <button
                    type="button"
                    className={iconButton}
                    disabled={options.length <= 2}
                    onClick={() => removeOption(i)}
                    aria-label="Remove option"
                  >
                    <X size={14} />
                  </button>
                </div>
              )
            })}
            {options.length < 10 ? (
              <button
                type="button"
                onClick={() => update({ options: [...options, ''] })}
                className="self-start inline-flex items-center gap-1 text-[12px] font-bold text-lemon-700 hover:text-lemon-900 cursor-pointer"
              >
                <Plus size={13} />
                Add option
              </button>
            ) : null}
            {multi ? partialCreditToggle : null}
          </div>
        )
      }

      case 'true-false':
        return (
          <div>
            <Label>Correct answer</Label>
            <div className="grid grid-cols-2 gap-3 max-w-xs">
              {(['True', 'False'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => update({ correctAnswer: v })}
                  className={`rounded-xl border py-2.5 text-[13px] font-bold cursor-pointer transition-colors ${
                    draft.correctAnswer === v ? 'bg-success border-success text-white' : 'border-divider text-navy-700 hover:bg-navy-50'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )

      case 'short-answer':
        return (
          <div className="flex flex-col gap-2">
            <Label hint="Leave empty to mark answers yourself">Accepted answers</Label>
            {listEditor('acceptedAnswers', (i) => (i === 0 ? 'e.g. Addis Ababa' : 'Another accepted spelling'))}
            <label className="flex items-center gap-2 text-[12.5px] text-navy-900 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(draft.caseSensitive)}
                onChange={(e) => update({ caseSensitive: e.target.checked })}
                className="accent-lemon-600"
              />
              Capital letters must match
            </label>
          </div>
        )

      case 'numeric':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label>Correct number</Label>
              <input
                type="number"
                step="any"
                value={draft.numericAnswer ?? ''}
                onChange={(e) => update({ numericAnswer: e.target.value === '' ? undefined : Number(e.target.value) })}
                placeholder="e.g. 9.81"
                className={inputClass}
              />
            </div>
            <div>
              <Label hint="±">Tolerance</Label>
              <input
                type="number"
                step="any"
                min="0"
                value={draft.tolerance ?? 0}
                onChange={(e) => update({ tolerance: Number(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
            <div>
              <Label hint="optional">Unit</Label>
              <input
                value={draft.unit ?? ''}
                onChange={(e) => update({ unit: e.target.value })}
                placeholder="e.g. m/s²"
                className={inputClass}
              />
            </div>
          </div>
        )

      case 'fill-blank': {
        const keys = draft.blanks ?? []
        return (
          <div className="flex flex-col gap-2">
            <Label hint="Separate alternatives with commas">Answers for each blank</Label>
            {blanks === 0 ? (
              <p className="text-[12px] text-warning font-medium">
                Type {BLANK_MARKER} in the question wherever a word is missing.
              </p>
            ) : (
              Array.from({ length: blanks }, (_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-secondary-text w-16 shrink-0">Blank {i + 1}</span>
                  <input
                    value={(keys[i] ?? []).join(', ')}
                    onChange={(e) => {
                      const next = Array.from({ length: blanks }, (_, j) => keys[j] ?? [])
                      next[i] = e.target.value.split(',').map((v) => v.trimStart())
                      update({ blanks: next })
                    }}
                    placeholder="e.g. Paris"
                    className={inputClass}
                  />
                </div>
              ))
            )}
            {partialCreditToggle}
          </div>
        )
      }

      case 'matching': {
        const pairs = draft.pairs ?? []
        return (
          <div className="flex flex-col gap-2">
            <Label hint="Students see the right column shuffled">Pairs</Label>
            {pairs.map((pair, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={pair.left}
                  onChange={(e) => update({ pairs: pairs.map((p, j) => (j === i ? { ...p, left: e.target.value } : p)) })}
                  placeholder={`Item ${i + 1}`}
                  className={inputClass}
                />
                <ArrowLeftRight size={14} className="text-secondary-text shrink-0" />
                <input
                  value={pair.right}
                  onChange={(e) => update({ pairs: pairs.map((p, j) => (j === i ? { ...p, right: e.target.value } : p)) })}
                  placeholder="Its match"
                  className={inputClass}
                />
                <button
                  type="button"
                  className={iconButton}
                  disabled={pairs.length <= 2}
                  onClick={() => update({ pairs: pairs.filter((_, j) => j !== i) })}
                  aria-label="Remove pair"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => update({ pairs: [...pairs, { left: '', right: '' }] })}
              className="self-start inline-flex items-center gap-1 text-[12px] font-bold text-lemon-700 hover:text-lemon-900 cursor-pointer"
            >
              <Plus size={13} />
              Add pair
            </button>
            {partialCreditToggle}
          </div>
        )
      }

      case 'ordering':
        return (
          <div className="flex flex-col gap-2">
            <Label hint="Enter them in the correct order; students get them shuffled">Items</Label>
            {listEditor('orderItems', (i) => `Step ${i + 1}`, true)}
            {partialCreditToggle}
          </div>
        )

      case 'essay':
        return (
          <div className="max-w-xs">
            <Label hint="optional">Word limit</Label>
            <input
              type="number"
              min="1"
              value={draft.wordLimit ?? ''}
              onChange={(e) => update({ wordLimit: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="e.g. 300"
              className={inputClass}
            />
          </div>
        )
    }
  })()

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      icon={TYPE_ICONS[draft.type]}
      title={question ? 'Edit question' : 'New question'}
      description="Choose a format; the fields and the student preview change to match it."
      footer={
        <>
          {error ? <span className="mr-auto text-[12px] text-danger font-semibold">{error}</span> : null}
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {question ? 'Save question' : 'Add to bank'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <Label>Format</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {QUESTION_TYPES.map((t) => {
              const active = draft.type === t.type
              return (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => changeType(t.type)}
                  className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors cursor-pointer ${
                    active
                      ? 'border-lemon-500 bg-lemon-50 dark:bg-lemon-500/10'
                      : 'border-divider hover:border-lemon-500/40 hover:bg-navy-50/50'
                  }`}
                >
                  <span className={`mt-0.5 shrink-0 ${active ? 'text-lemon-700' : 'text-secondary-text'}`}>{TYPE_ICONS[t.type]}</span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-bold text-navy-900">{t.label}</span>
                    <span className="block text-[11px] text-secondary-text">{t.description}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-5">
          <div className="flex flex-col gap-4">
            <div>
              <Label hint={draft.type === 'fill-blank' ? `Use ${BLANK_MARKER} for each blank` : undefined}>Question</Label>
              <textarea
                value={draft.stem}
                onChange={(e) => update({ stem: e.target.value })}
                rows={draft.type === 'essay' ? 4 : 3}
                placeholder={
                  draft.type === 'fill-blank'
                    ? `e.g. The capital of France is ${BLANK_MARKER}.`
                    : draft.type === 'true-false'
                      ? 'e.g. A stack follows the LIFO principle.'
                      : 'Write the question…'
                }
                className={`${inputClass} resize-y`}
              />
              {draft.type === 'fill-blank' ? (
                <button
                  type="button"
                  onClick={() => update({ stem: `${draft.stem}${draft.stem && !draft.stem.endsWith(' ') ? ' ' : ''}${BLANK_MARKER}` })}
                  className="mt-1 inline-flex items-center gap-1 text-[12px] font-bold text-lemon-700 hover:text-lemon-900 cursor-pointer"
                >
                  <Plus size={13} />
                  Insert blank
                </button>
              ) : null}
            </div>

            {answerFields}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <Label>Course</Label>
                <select
                  value={draft.courseId ?? ''}
                  onChange={(e) => update({ courseId: e.target.value || undefined })}
                  className={`${inputClass} dark:[color-scheme:dark]`}
                >
                  <option value="">Any course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Difficulty</Label>
                <select
                  value={draft.difficulty}
                  onChange={(e) => update({ difficulty: e.target.value as QuestionDifficulty })}
                  className={`${inputClass} dark:[color-scheme:dark]`}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <Label>Points</Label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={draft.points}
                  onChange={(e) => update({ points: Number(e.target.value) })}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <Label hint="Press Enter to add">Tags</Label>
              <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-divider px-2 py-1.5 bg-white dark:bg-navy-50">
                {draft.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-navy-50 px-2 py-0.5 text-[11.5px] font-semibold text-navy-700">
                    {tag}
                    <button type="button" onClick={() => update({ tags: draft.tags.filter((t) => t !== tag) })} aria-label={`Remove ${tag}`} className="cursor-pointer">
                      <X size={11} />
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      e.preventDefault()
                      const tag = tagInput.trim().toLowerCase()
                      if (!draft.tags.includes(tag)) update({ tags: [...draft.tags, tag] })
                      setTagInput('')
                    }
                  }}
                  placeholder={draft.tags.length ? '' : 'e.g. algorithms'}
                  className="flex-1 min-w-[100px] bg-transparent text-[12.5px] text-navy-900 focus:outline-none py-0.5"
                />
              </div>
            </div>

            <div>
              <Label hint="Instructors only">Explanation</Label>
              <textarea
                value={draft.explanation ?? ''}
                onChange={(e) => update({ explanation: e.target.value || undefined })}
                rows={2}
                placeholder="Why the answer is correct (shown to instructors when reviewing)"
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>

          <div className="lg:sticky lg:top-0 self-start">
            <div className="rounded-2xl border border-divider bg-canvas p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-secondary-text">Student preview</span>
                <span className="text-[11px] text-secondary-text">
                  {draft.points || 0} pt{Number(draft.points) === 1 ? '' : 's'} ·{' '}
                  {needsManualGrading(draft) ? 'marked by instructor' : 'auto-graded'}
                </span>
              </div>
              {draft.stem.trim() ? (
                <div className="flex flex-col gap-3">
                  <QuestionStem question={preview} />
                  <QuestionAnswerInput question={preview} value={previewAnswer} onChange={setPreviewAnswer} />
                </div>
              ) : (
                <p className="text-[12.5px] text-secondary-text py-6 text-center">Start typing the question to see it here.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

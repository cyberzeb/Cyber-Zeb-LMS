import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ClipboardCheck, SendHorizontal, XCircle } from 'lucide-react'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import type { CourseLessonQuestion } from '../../institution/types'
import {
  confirmQuestionResponse,
  getLessonResponses,
  type LessonQuestionResponse,
} from '../utils/studentLessonResponses'

interface LessonQuestionsProps {
  studentId: string
  courseId: string
  lessonId: string
  questions: CourseLessonQuestion[]
}

function buildDraftsFromResponses(
  questions: CourseLessonQuestion[],
  responses: LessonQuestionResponse[],
): Record<string, string> {
  const drafts: Record<string, string> = {}
  for (const q of questions) {
    const saved = responses.find((r) => r.questionId === q.id)
    if (saved) drafts[q.id] = saved.answer
  }
  return drafts
}

export function LessonQuestions({ studentId, courseId, lessonId, questions }: LessonQuestionsProps) {
  const { notify } = useToast()
  const [responses, setResponses] = useState<LessonQuestionResponse[]>(() =>
    getLessonResponses(studentId, courseId, lessonId),
  )
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const reload = useCallback(() => {
    const saved = getLessonResponses(studentId, courseId, lessonId)
    setResponses(saved)
    setDrafts(buildDraftsFromResponses(questions, saved))
  }, [studentId, courseId, lessonId, questions])

  useEffect(() => {
    reload()
  }, [lessonId, reload])

  const allSubmitted = useMemo(
    () => questions.every((q) => responses.some((r) => r.questionId === q.id)),
    [questions, responses],
  )

  const filledCount = useMemo(
    () => questions.filter((q) => (drafts[q.id] ?? '').trim().length > 0).length,
    [questions, drafts],
  )

  const allDraftsFilled = filledCount === questions.length

  const confirmed = (questionId: string) => responses.find((r) => r.questionId === questionId)

  const handleSubmitAll = () => {
    const missing = questions.filter((q) => !(drafts[q.id] ?? '').trim())
    if (missing.length > 0) {
      notify(`Please answer all ${questions.length} questions before submitting.`, 'error')
      return
    }

    const nextResponses: LessonQuestionResponse[] = []
    let mcCorrect = 0
    let mcTotal = 0

    for (const question of questions) {
      const draft = drafts[question.id].trim()
      let isCorrect: boolean | undefined
      if (question.type === 'multiple-choice') {
        mcTotal += 1
        isCorrect = Number(draft) === question.correctIndex
        if (isCorrect) mcCorrect += 1
      }
      nextResponses.push(
        confirmQuestionResponse(studentId, courseId, lessonId, {
          questionId: question.id,
          answer: draft,
          isCorrect,
        }),
      )
    }

    setResponses(nextResponses)

    if (mcTotal > 0) {
      notify(
        mcCorrect === mcTotal
          ? `All ${mcTotal} quiz answers correct!`
          : `Submitted — ${mcCorrect} of ${mcTotal} quiz answers correct.`,
        mcCorrect === mcTotal ? 'success' : 'info',
      )
    } else {
      notify('All answers submitted.', 'success')
    }
  }

  if (questions.length === 0) return null

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-secondary-text">
          Check your understanding
        </p>
        <span className="text-[11px] font-semibold text-navy-600 bg-navy-50 px-2.5 py-1 rounded-full">
          {allSubmitted ? `${questions.length} / ${questions.length} submitted` : `${filledCount} / ${questions.length} ready`}
        </span>
      </div>

      {questions.map((question, index) => {
        const saved = confirmed(question.id)
        const showResults = allSubmitted && Boolean(saved)
        const draft = drafts[question.id] ?? ''

        return (
          <div
            key={question.id}
            className={`rounded-xl border p-4 md:p-5 flex flex-col gap-3 transition-colors ${
              showResults
                ? saved?.isCorrect === false
                  ? 'border-danger/25 bg-danger-bg/10'
                  : 'border-success/30 bg-success-bg/15'
                : 'border-divider soft-surface shadow-sm'
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-extrabold ${
                  showResults ? 'bg-success text-white' : 'bg-navy-100 text-navy-700'
                }`}
              >
                {showResults ? <CheckCircle2 size={14} /> : index + 1}
              </span>
              <p className="text-[14px] font-semibold text-navy-900 leading-snug pt-0.5">
                {question.prompt}
              </p>
            </div>

            {question.type === 'multiple-choice' && question.options ? (
              <div className="flex flex-col gap-2 pl-10">
                {question.options.map((option, optionIndex) => {
                  const selected = draft === String(optionIndex)
                  const isCorrectOption = optionIndex === question.correctIndex
                  let ringClass = 'border-divider hover:border-navy-300 hover:bg-navy-50/50'
                  if (selected && !showResults) ringClass = 'border-lemon-500 bg-lemon-50 ring-1 ring-lemon-500/30'
                  if (showResults && selected && saved?.isCorrect) {
                    ringClass = 'border-success bg-success-bg ring-1 ring-success/30'
                  }
                  if (showResults && selected && !saved?.isCorrect) {
                    ringClass = 'border-danger/50 bg-danger-bg ring-1 ring-danger/20'
                  }
                  if (showResults && !selected && isCorrectOption && !saved?.isCorrect) {
                    ringClass = 'border-success/50 bg-success-bg/50'
                  }

                  return (
                    <label
                      key={option}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all ${
                        allSubmitted ? 'cursor-default' : 'cursor-pointer'
                      } ${ringClass}`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={optionIndex}
                        checked={selected}
                        disabled={allSubmitted}
                        onChange={() =>
                          setDrafts((prev) => ({ ...prev, [question.id]: String(optionIndex) }))
                        }
                        className="accent-lemon-600 h-4 w-4"
                      />
                      <span className="text-[13px] text-navy-800 font-medium">{option}</span>
                    </label>
                  )
                })}
              </div>
            ) : (
              <div className="pl-10">
                <textarea
                  value={draft}
                  disabled={allSubmitted}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [question.id]: e.target.value }))
                  }
                  rows={4}
                  placeholder="Share your thoughts here — be specific and clear."
                  className="w-full rounded-xl border border-divider px-4 py-3 text-[13px] text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-lemon-500/40 focus:border-lemon-500/50 disabled:bg-navy-50/80 resize-y min-h-[96px]"
                />
              </div>
            )}

            {showResults && saved ? (
              <div className="pl-10 flex flex-col gap-2">
                <div
                  className={`flex items-start gap-3 rounded-xl px-4 py-3.5 text-[12.5px] border ${
                    question.type === 'multiple-choice'
                      ? saved.isCorrect
                        ? 'bg-success-bg text-navy-900 border-success/25'
                        : 'bg-danger-bg text-navy-900 border-danger/20'
                      : 'bg-navy-50 text-navy-900 border-divider'
                  }`}
                >
                  {question.type === 'multiple-choice' ? (
                    saved.isCorrect ? (
                      <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />
                    ) : (
                      <XCircle size={18} className="text-danger shrink-0 mt-0.5" />
                    )
                  ) : (
                    <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold text-[13px]">
                      {question.type === 'multiple-choice'
                        ? saved.isCorrect
                          ? 'Correct — nice work!'
                          : 'Not quite — review the explanation.'
                        : 'Answer submitted'}
                    </p>
                    {question.type === 'short-answer' && question.sampleAnswer ? (
                      <p className="mt-2 text-secondary-text leading-relaxed">
                        <span className="font-semibold text-navy-800">Sample answer: </span>
                        {question.sampleAnswer}
                      </p>
                    ) : null}
                    {question.explanation ? (
                      <p className="mt-2 text-secondary-text leading-relaxed">{question.explanation}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )
      })}

      {!allSubmitted ? (
        <div className="sticky bottom-0 z-10 rounded-2xl border-2 border-divider bg-white/95 backdrop-blur-sm p-4 md:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                allDraftsFilled ? 'bg-lemon-100 text-lemon-700' : 'bg-navy-50 text-navy-400'
              }`}
            >
              <ClipboardCheck size={20} />
            </span>
            <div>
              <p className="text-[14px] font-bold text-navy-900">
                {allDraftsFilled ? 'All questions answered' : 'Complete every question'}
              </p>
              <p className="text-[12px] text-secondary-text mt-0.5">
                {allDraftsFilled
                  ? 'Submit once to save all answers and see your results.'
                  : `${questions.length - filledCount} question${questions.length - filledCount === 1 ? '' : 's'} still need an answer.`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmitAll}
            disabled={!allDraftsFilled}
            className={`group inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-3 text-[14px] font-bold transition-all shrink-0 w-full sm:w-auto ${
              allDraftsFilled
                ? 'bg-lemon-500 text-navy-900 border-2 border-lemon-500 shadow-md shadow-lemon-500/25 hover:bg-lemon-200 hover:shadow-lg active:scale-[0.98]'
                : 'bg-navy-50 text-navy-300 border-2 border-divider cursor-not-allowed'
            }`}
          >
            <SendHorizontal
              size={18}
              className={`transition-transform ${allDraftsFilled ? 'group-hover:translate-x-0.5' : ''}`}
            />
            Submit answers
          </button>
        </div>
      ) : null}
    </div>
  )
}

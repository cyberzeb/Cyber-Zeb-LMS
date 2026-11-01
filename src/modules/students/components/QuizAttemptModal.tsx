import { useMemo, useState } from 'react'
import { BrainCircuit } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { Modal } from '../../../shared/components/Modal'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useQueryClient } from '@tanstack/react-query'
import { apiErrorMessage } from '../../../shared/api/client'
import { submitQuizAttempt } from '../../../shared/api/assessmentsApi'
import { refreshCollection } from '../../../shared/hooks/useApiCollection'
import { STORAGE_EVENTS, STORAGE_KEYS } from '../../../shared/storage/keys'
import { readQuestionBank, readQuizRecords } from '../../../shared/storage/readers'
import { QuestionAnswerInput, QuestionStem } from '../../../shared/assessments/QuestionAnswerInput'
import { isAnswered, toStudentQuestion } from '../../../shared/assessments/questionTypes'
import type { QuizAnswer } from '../../institution/types/assessments'

interface QuizAttemptModalProps {
  open: boolean
  onClose: () => void
  quizId: string
  onSubmitted?: () => void
}

export function QuizAttemptModal({
  open,
  onClose,
  quizId,
  onSubmitted,
}: QuizAttemptModalProps) {
  const { notify } = useToast()
  const queryClient = useQueryClient()
  const [answers, setAnswers] = useState<Record<string, QuizAnswer>>({})
  const [submitting, setSubmitting] = useState(false)

  const quiz = useMemo(() => readQuizRecords().find((q) => q.id === quizId), [quizId, open])

  const questions = useMemo(() => {
    if (!quiz) return []
    const bank = readQuestionBank()
    // The server sends questions without answers; matching and ordering come shuffled.
    return quiz.questionIds
      .map((id) => bank.find((q) => q.id === id))
      .filter((q): q is NonNullable<typeof q> => Boolean(q))
      .map(toStudentQuestion)
  }, [quiz])

  // Ordering questions start in their shuffled order, which already counts as an answer.
  const effectiveAnswers = useMemo(() => {
    const out: Record<string, QuizAnswer> = { ...answers }
    for (const q of questions) {
      if (q.type === 'ordering' && out[q.id] === undefined && q.orderShuffled?.length) out[q.id] = q.orderShuffled
    }
    return out
  }, [answers, questions])
  const answeredCount = questions.filter((q) => isAnswered(q, effectiveAnswers[q.id])).length
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0)

  const handleClose = () => {
    setAnswers({})
    onClose()
  }

  const handleSubmit = async () => {
    if (!quiz || submitting) return

    const unanswered = questions.filter((q) => !isAnswered(q, effectiveAnswers[q.id]))
    if (unanswered.length > 0) {
      notify(
        `Answer all ${questions.length} questions before submitting (${unanswered.length} left, starting with question ${questions.indexOf(unanswered[0]) + 1}).`,
        'error',
      )
      return
    }

    // Graded on the server against the answer key (never sent to students).
    setSubmitting(true)
    try {
      const result = await submitQuizAttempt(quiz.id, effectiveAnswers)
      await refreshCollection(queryClient, STORAGE_KEYS.studentSubmissions)
      window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.assessmentsUpdated))
      notify(
        result.pending_review
          ? `Quiz submitted — ${result.score}/${result.max_score} so far. ${result.pending_review} answer${result.pending_review === 1 ? '' : 's'} will be marked by your instructor.`
          : `Quiz submitted — score ${result.score}/${result.max_score}.`,
      )
      setAnswers({})
      onClose()
      onSubmitted?.()
    } catch (err) {
      notify(apiErrorMessage(err) ?? 'Your quiz could not be submitted. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!quiz) return null

  return (
    <Modal
      open={open}
      title={quiz.title}
      description={`${questions.length} questions · ${quiz.courseCode}${quiz.durationMinutes ? ` · ${quiz.durationMinutes} min` : ''}`}
      icon={<BrainCircuit size={18} />}
      size="lg"
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit quiz'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 max-h-[65vh] overflow-y-auto app-scroll pr-1">
        <div className="flex items-center justify-between text-[12px] text-secondary-text">
          <span>
            {answeredCount} of {questions.length} answered
          </span>
          <span>{totalPoints} points</span>
        </div>
        <div className="h-1.5 rounded-full bg-navy-50 overflow-hidden -mt-2">
          <div
            className="h-full bg-lemon-500 rounded-full transition-all"
            style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }}
          />
        </div>
        {questions.map((question, index) => (
          <div key={question.id} className="rounded-xl border border-divider p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <QuestionStem question={question} index={index} />
              <span className="shrink-0 text-[11px] font-semibold text-secondary-text">
                {question.points} pt{question.points === 1 ? '' : 's'}
              </span>
            </div>
            <QuestionAnswerInput
              question={question}
              value={answers[question.id]}
              onChange={(value) => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
              disabled={submitting}
            />
          </div>
        ))}
      </div>
    </Modal>
  )
}

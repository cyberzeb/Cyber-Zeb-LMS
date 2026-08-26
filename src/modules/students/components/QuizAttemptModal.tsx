import { useMemo, useState } from 'react'
import { BrainCircuit } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { Modal } from '../../../shared/components/Modal'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { readQuestionBank, readQuizRecords } from '../../../shared/storage/readers'
import { scoreQuizAnswers } from '../../../shared/utils/quizScoringUtils'
import { useStudentSubmissions } from '../../institution/hooks/useAssessments'

interface QuizAttemptModalProps {
  open: boolean
  onClose: () => void
  quizId: string
  studentId: string
  onSubmitted?: () => void
}

export function QuizAttemptModal({
  open,
  onClose,
  quizId,
  studentId,
  onSubmitted,
}: QuizAttemptModalProps) {
  const { notify } = useToast()
  const { submitQuizAttempt } = useStudentSubmissions()
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const quiz = useMemo(() => readQuizRecords().find((q) => q.id === quizId), [quizId, open])

  const questions = useMemo(() => {
    if (!quiz) return []
    const bank = readQuestionBank()
    return quiz.questionIds
      .map((id) => bank.find((q) => q.id === id))
      .filter((q): q is NonNullable<typeof q> => Boolean(q))
  }, [quiz])

  const handleClose = () => {
    setAnswers({})
    onClose()
  }

  const handleSubmit = () => {
    if (!quiz) return

    const unanswered = questions.filter((q) => !answers[q.id]?.trim())
    if (unanswered.length > 0) {
      notify(`Answer all ${questions.length} questions before submitting.`, 'error')
      return
    }

    const { score, maxScore } = scoreQuizAnswers(questions, answers)
    submitQuizAttempt(studentId, quiz.id, score, maxScore || quiz.maxPoints)
    notify(`Quiz submitted — score ${score}/${maxScore || quiz.maxPoints}.`)
    setAnswers({})
    onClose()
    onSubmitted?.()
  }

  if (!quiz) return null

  return (
    <Modal
      open={open}
      title={quiz.title}
      description={`${questions.length} questions · ${quiz.courseCode}`}
      icon={<BrainCircuit size={18} />}
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Submit quiz</Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto">
        {questions.map((question, index) => (
          <div key={question.id} className="rounded-xl border border-divider p-4">
            <p className="text-[13px] font-bold text-navy-900">
              {index + 1}. {question.stem}
            </p>

            {question.type === 'mcq' && question.options ? (
              <div className="mt-3 flex flex-col gap-2">
                {question.options.map((option) => (
                  <label key={option} className="flex items-center gap-2 text-[13px] cursor-pointer">
                    <input
                      type="radio"
                      name={question.id}
                      checked={answers[question.id] === option}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
                    />
                    {option}
                  </label>
                ))}
              </div>
            ) : question.type === 'true-false' ? (
              <div className="mt-3 flex gap-4">
                {['True', 'False'].map((option) => (
                  <label key={option} className="flex items-center gap-2 text-[13px] cursor-pointer">
                    <input
                      type="radio"
                      name={question.id}
                      checked={answers[question.id] === option}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
                    />
                    {option}
                  </label>
                ))}
              </div>
            ) : (
              <input
                className="mt-3 w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px]"
                value={answers[question.id] ?? ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                placeholder="Your answer"
              />
            )}
          </div>
        ))}
      </div>
    </Modal>
  )
}

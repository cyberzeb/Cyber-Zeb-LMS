import { useMemo, useState } from 'react'
import { UserCheck } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { Modal } from '../../../shared/components/Modal'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { readPeople, readQuestionBank, readQuizRecords } from '../../../shared/storage/readers'
import { getSessionPerson } from '../../../shared/storage/session'
import { wordCount } from '../../../shared/assessments/questionTypes'
import { useStudentSubmissions } from '../../institution/hooks/useAssessments'
import type { StudentSubmissionRecord } from '../../institution/types/assessments'

interface QuizReviewModalProps {
  open: boolean
  quizId: string | null
  onClose: () => void
  onSaved?: () => void
}

/**
 * Mark the answers a quiz could not grade itself (essays, open short answers).
 * Once every pending answer has points the attempt becomes graded.
 */
export function QuizReviewModal({ open, quizId, onClose, onSaved }: QuizReviewModalProps) {
  const { notify } = useToast()
  const { records, setRecords } = useStudentSubmissions()
  const [marks, setMarks] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<Record<string, string>>({})

  const quiz = useMemo(() => (quizId ? readQuizRecords().find((q) => q.id === quizId) : undefined), [quizId])
  const bank = useMemo(() => new Map(readQuestionBank().map((q) => [q.id, q])), [open])
  const people = useMemo(() => new Map(readPeople().map((p) => [p.id, p.name])), [open])

  const pending = useMemo(
    () =>
      records.filter(
        (s) => s.assessmentType === 'quiz' && s.assessmentId === quizId && (s.pendingReview?.length ?? 0) > 0,
      ),
    [records, quizId],
  )

  const key = (submissionId: string, questionId: string) => `${submissionId}:${questionId}`

  const save = (submission: StudentSubmissionRecord) => {
    const scores = { ...(submission.questionScores ?? {}) }
    for (const qid of submission.pendingReview ?? []) {
      const raw = marks[key(submission.id, qid)]
      if (raw === undefined || raw === '') {
        notify('Give points for every answer before saving.', 'error')
        return
      }
      const max = bank.get(qid)?.points ?? 0
      const points = Number(raw)
      if (Number.isNaN(points) || points < 0 || points > max) {
        notify(`Points must be between 0 and ${max}.`, 'error')
        return
      }
      scores[qid] = points
    }
    const score = Math.round(Object.values(scores).reduce<number>((sum, v) => sum + (v ?? 0), 0) * 100) / 100
    const updated: StudentSubmissionRecord = {
      ...submission,
      questionScores: scores,
      pendingReview: [],
      score,
      status: 'graded',
      gradedBy: getSessionPerson()?.id ?? 'instructor',
      feedback: feedback[submission.id]?.trim() || submission.feedback,
    }
    setRecords((prev) => prev.map((s) => (s.id === submission.id ? updated : s)))
    notify(`${people.get(submission.studentId) ?? 'Student'} marked: ${score}/${submission.maxScore ?? quiz?.maxPoints ?? '—'}.`)
    onSaved?.()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      icon={<UserCheck size={18} />}
      title={quiz ? `Mark answers · ${quiz.title}` : 'Mark answers'}
      description="Essays and open answers that the quiz could not grade automatically."
      footer={
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      {pending.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-secondary-text">Nothing left to mark for this quiz.</p>
      ) : (
        <div className="flex flex-col gap-5 max-h-[65vh] overflow-y-auto app-scroll pr-1">
          {pending.map((submission) => (
            <div key={submission.id} className="rounded-xl border border-divider p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[14px] font-bold text-navy-900">{people.get(submission.studentId) ?? submission.studentId}</span>
                <span className="text-[12px] text-secondary-text">
                  Auto-graded so far: {submission.score ?? 0}/{submission.maxScore ?? quiz?.maxPoints}
                </span>
              </div>
              {(submission.pendingReview ?? []).map((qid) => {
                const question = bank.get(qid)
                const answer = submission.answers?.[qid]
                const text = typeof answer === 'string' ? answer : JSON.stringify(answer ?? '')
                return (
                  <div key={qid} className="nested-panel rounded-xl p-3.5 flex flex-col gap-2">
                    <p className="text-[13px] font-semibold text-navy-900">{question?.stem ?? 'Question removed from the bank'}</p>
                    <div className="rounded-lg bg-white dark:bg-navy-50 border border-divider px-3 py-2 text-[13px] text-navy-900 whitespace-pre-wrap leading-relaxed">
                      {text || <span className="text-secondary-text italic">No answer</span>}
                    </div>
                    <div className="text-[11px] text-secondary-text">
                      {wordCount(text)} words{question?.wordLimit ? ` (limit ${question.wordLimit})` : ''}
                      {question?.explanation ? ` · Guidance: ${question.explanation}` : ''}
                    </div>
                    <label className="flex items-center gap-2 text-[12.5px] font-semibold text-navy-900">
                      Points
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        max={question?.points}
                        value={marks[key(submission.id, qid)] ?? ''}
                        onChange={(e) => setMarks((prev) => ({ ...prev, [key(submission.id, qid)]: e.target.value }))}
                        className="w-20 bg-white dark:bg-navy-50 border border-divider rounded-lg px-2 py-1 text-[13px]"
                      />
                      <span className="text-secondary-text font-normal">of {question?.points ?? 0}</span>
                    </label>
                  </div>
                )
              })}
              <textarea
                value={feedback[submission.id] ?? ''}
                onChange={(e) => setFeedback((prev) => ({ ...prev, [submission.id]: e.target.value }))}
                rows={2}
                placeholder="Feedback for the student (optional)"
                className="w-full bg-white dark:bg-navy-50 border border-divider rounded-lg px-3 py-2 text-[13px] resize-y"
              />
              <Button variant="primary" size="sm" className="self-end" onClick={() => save(submission)}>
                Save marks
              </Button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

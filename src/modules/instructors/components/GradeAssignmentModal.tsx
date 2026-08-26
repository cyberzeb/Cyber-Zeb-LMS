import { useMemo, useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FormField } from '../../../shared/components/FormField'
import { Modal } from '../../../shared/components/Modal'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { formatAssessmentDateTime } from '../../../shared/storage/assessmentUtils'
import { readPeople } from '../../../shared/storage/readers'
import { useStudentSubmissions } from '../../institution/hooks/useAssessments'

interface GradeAssignmentModalProps {
  open: boolean
  onClose: () => void
  assignmentId: string
  assignmentTitle: string
  maxPoints: number
  onGraded?: () => void
}

export function GradeAssignmentModal({
  open,
  onClose,
  assignmentId,
  assignmentTitle,
  maxPoints,
  onGraded,
}: GradeAssignmentModalProps) {
  const { notify } = useToast()
  const { records, gradeSubmission } = useStudentSubmissions()
  const [drafts, setDrafts] = useState<Record<string, { score: string; feedback: string }>>({})

  const submissions = useMemo(
    () =>
      records.filter(
        (s) =>
          s.assessmentType === 'assignment' &&
          s.assessmentId === assignmentId &&
          s.status !== 'not-submitted',
      ),
    [records, assignmentId],
  )

  const people = useMemo(() => readPeople(), [records])

  const handleClose = () => {
    setDrafts({})
    onClose()
  }

  const handleGrade = (submissionId: string) => {
    const draft = drafts[submissionId]
    const score = Number(draft?.score)
    if (!draft?.score.trim() || Number.isNaN(score) || score < 0 || score > maxPoints) {
      notify(`Enter a score between 0 and ${maxPoints}.`, 'error')
      return
    }

    gradeSubmission(submissionId, score, draft.feedback.trim(), maxPoints)
    notify('Grade saved.')
    onGraded?.()
  }

  return (
    <Modal
      open={open}
      title="Review submissions"
      description={assignmentTitle}
      icon={<MessageSquareText size={18} />}
      onClose={handleClose}
      footer={<Button variant="secondary" onClick={handleClose}>Close</Button>}
    >
      <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
        {submissions.length === 0 ? (
          <p className="text-[13px] text-secondary-text py-6 text-center">No submissions yet.</p>
        ) : (
          submissions.map((submission) => {
            const student = people.find((p) => p.id === submission.studentId)
            const draft = drafts[submission.id] ?? {
              score: submission.score !== undefined ? String(submission.score) : '',
              feedback: submission.feedback ?? '',
            }

            return (
              <div key={submission.id} className="rounded-xl border border-divider p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[14px] font-bold text-navy-900">{student?.name ?? submission.studentId}</p>
                    <p className="text-[12px] text-secondary-text">
                      {submission.submittedAt ? formatAssessmentDateTime(submission.submittedAt) : '—'}
                      {submission.attachmentName ? ` · ${submission.attachmentName}` : ''}
                    </p>
                  </div>
                  <StatusPill
                    label={submission.status === 'graded' ? 'Graded' : 'Pending'}
                    tone={submission.status === 'graded' ? 'success' : 'warning'}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    label={`Score ( / ${maxPoints})`}
                    value={draft.score}
                    onChange={(v) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [submission.id]: { ...draft, score: v },
                      }))
                    }
                    type="number"
                  />
                  <FormField
                    label="Feedback"
                    value={draft.feedback}
                    onChange={(v) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [submission.id]: { ...draft, feedback: v },
                      }))
                    }
                    placeholder="Optional comments for the student"
                  />
                </div>

                <Button variant="primary" size="sm" className="self-start" onClick={() => handleGrade(submission.id)}>
                  Save grade
                </Button>
              </div>
            )
          })
        )}
      </div>
    </Modal>
  )
}

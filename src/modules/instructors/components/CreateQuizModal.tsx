import { useMemo, useState } from 'react'
import { BrainCircuit } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FormField } from '../../../shared/components/FormField'
import { Modal } from '../../../shared/components/Modal'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { readQuestionBank } from '../../../shared/storage/readers'
import { minDateTimeLocalValue, parseDateTimeLocalValue } from '../../../shared/utils/assessmentFormUtils'
import { useQuizzes } from '../../institution/hooks/useAssessments'
import type { TeachingCourse } from '../types'

const emptyForm = {
  title: '',
  courseId: '',
  dueAt: '',
  durationMinutes: '30',
  maxPoints: '10',
}

interface CreateQuizModalProps {
  open: boolean
  onClose: () => void
  courses: TeachingCourse[]
  instructorId: string
  instructorName: string
  onCreated?: () => void
}

export function CreateQuizModal({
  open,
  onClose,
  courses,
  instructorId,
  instructorName,
  onCreated,
}: CreateQuizModalProps) {
  const { notify } = useToast()
  const { createQuiz } = useQuizzes()
  const [form, setForm] = useState(emptyForm)

  const questionPreview = useMemo(() => {
    if (!form.courseId) return 0
    return readQuestionBank().filter((q) => !q.courseId || q.courseId === form.courseId).length
  }, [form.courseId])

  const handleClose = () => {
    setForm(emptyForm)
    onClose()
  }

  const handleCreate = () => {
    const course = courses.find((c) => c.id === form.courseId)
    const due = parseDateTimeLocalValue(form.dueAt)

    if (!course || !form.title.trim() || !due) {
      notify('Fill in title, course, and due date.', 'error')
      return
    }

    const questionIds = readQuestionBank()
      .filter((q) => !q.courseId || q.courseId === course.id)
      .slice(0, 5)
      .map((q) => q.id)

    if (questionIds.length === 0) {
      notify('No questions in the bank for this course yet.', 'error')
      return
    }

    createQuiz({
      title: form.title.trim(),
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      instructorId,
      instructorName,
      campusId: 'c1',
      department: course.department,
      dueAt: due.toISOString(),
      durationMinutes: Number(form.durationMinutes) || 30,
      questionIds,
      status: 'published',
      maxPoints: Number(form.maxPoints) || 10,
    })

    notify('Quiz published to your students.')
    setForm(emptyForm)
    onClose()
    onCreated?.()
  }

  return (
    <Modal
      open={open}
      title="Create quiz"
      description="Questions are pulled automatically from the question bank for the selected course."
      icon={<BrainCircuit size={18} />}
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate}>Publish</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="Quiz title" />
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Course</span>
          <select
            value={form.courseId}
            onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
            className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px]"
          >
            <option value="">Select your course…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
            ))}
          </select>
          {form.courseId ? (
            <span className="text-[11px] text-secondary-text">
              {questionPreview} question{questionPreview === 1 ? '' : 's'} available in the bank
            </span>
          ) : null}
        </label>
        <FormField
          label="Due date & time"
          value={form.dueAt}
          onChange={(v) => setForm((f) => ({ ...f, dueAt: v }))}
          type="datetime-local"
          min={minDateTimeLocalValue()}
        />
        <FormField label="Duration (minutes)" value={form.durationMinutes} onChange={(v) => setForm((f) => ({ ...f, durationMinutes: v }))} type="number" />
        <FormField label="Max points" value={form.maxPoints} onChange={(v) => setForm((f) => ({ ...f, maxPoints: v }))} type="number" />
      </div>
    </Modal>
  )
}

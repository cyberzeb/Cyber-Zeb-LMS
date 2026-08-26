import { useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FormField } from '../../../shared/components/FormField'
import { Modal } from '../../../shared/components/Modal'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { minDateTimeLocalValue, parseDateTimeLocalValue } from '../../../shared/utils/assessmentFormUtils'
import { useAssignmentRecords } from '../../institution/hooks/useAssessments'
import type { TeachingCourse } from '../types'

const emptyForm = {
  title: '',
  courseId: '',
  dueAt: '',
  brief: '',
  maxPoints: '100',
}

interface CreateAssignmentModalProps {
  open: boolean
  onClose: () => void
  courses: TeachingCourse[]
  instructorId: string
  instructorName: string
  onCreated?: () => void
}

export function CreateAssignmentModal({
  open,
  onClose,
  courses,
  instructorId,
  instructorName,
  onCreated,
}: CreateAssignmentModalProps) {
  const { notify } = useToast()
  const { createAssignment } = useAssignmentRecords()
  const [form, setForm] = useState(emptyForm)

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

    createAssignment({
      title: form.title.trim(),
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      instructorId,
      instructorName,
      campusId: 'c1',
      department: course.department,
      dueAt: due.toISOString(),
      brief: form.brief.trim() || 'See course instructions.',
      acceptedFormats: ['.pdf', '.docx', '.zip', '.py'],
      status: 'published',
      maxPoints: Number(form.maxPoints) || 100,
    })

    notify('Assignment published to your students.')
    setForm(emptyForm)
    onClose()
    onCreated?.()
  }

  return (
    <Modal
      open={open}
      title="Create assignment"
      description="Students enrolled in the course can upload submissions before the due date."
      icon={<ClipboardList size={18} />}
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate}>Publish</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="Assignment title" />
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
        </label>
        <FormField
          label="Due date & time"
          value={form.dueAt}
          onChange={(v) => setForm((f) => ({ ...f, dueAt: v }))}
          type="datetime-local"
          min={minDateTimeLocalValue()}
        />
        <FormField label="Instructions" value={form.brief} onChange={(v) => setForm((f) => ({ ...f, brief: v }))} type="textarea" placeholder="What should students submit?" />
        <FormField label="Max points" value={form.maxPoints} onChange={(v) => setForm((f) => ({ ...f, maxPoints: v }))} type="number" />
      </div>
    </Modal>
  )
}

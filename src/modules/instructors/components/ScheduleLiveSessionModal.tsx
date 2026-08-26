import { useState } from 'react'
import { MonitorPlay } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FormField } from '../../../shared/components/FormField'
import { Modal } from '../../../shared/components/Modal'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { isValidMeetingUrl, normalizeMeetingUrl } from '../../../shared/utils/liveSessionUtils'
import { useLiveSessions } from '../../institution/hooks/useAssessments'
import type { TeachingCourse } from '../types'

const emptyForm = {
  title: '',
  courseId: '',
  startAt: '',
  durationMinutes: '60',
  platform: 'Zoom',
  meetingUrl: '',
}

function minDateTimeLocalValue(): string {
  const now = new Date()
  now.setSeconds(0, 0)
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

interface ScheduleLiveSessionModalProps {
  open: boolean
  onClose: () => void
  courses: TeachingCourse[]
  instructorId: string
  instructorName: string
  onScheduled?: () => void
}

export function ScheduleLiveSessionModal({
  open,
  onClose,
  courses,
  instructorId,
  instructorName,
  onScheduled,
}: ScheduleLiveSessionModalProps) {
  const { notify } = useToast()
  const { createSession } = useLiveSessions()
  const [form, setForm] = useState(emptyForm)

  const handleClose = () => {
    setForm(emptyForm)
    onClose()
  }

  const handleCreate = () => {
    const teachingCourse = courses.find((c) => c.id === form.courseId)

    if (!teachingCourse || !form.title.trim() || !form.startAt) {
      notify('Fill in title, course, and start time.', 'error')
      return
    }

    const start = new Date(form.startAt)
    if (Number.isNaN(start.getTime())) {
      notify('Pick a valid start date and time.', 'error')
      return
    }

    if (!isValidMeetingUrl(form.meetingUrl)) {
      notify('Paste a valid Zoom meeting link (e.g. https://zoom.us/j/123456789).', 'error')
      return
    }

    createSession({
      title: form.title.trim(),
      courseId: teachingCourse.id,
      courseCode: teachingCourse.code,
      courseTitle: teachingCourse.title,
      instructorId,
      instructorName,
      campusId: 'c1',
      department: teachingCourse.department,
      startAt: start.toISOString(),
      durationMinutes: Number(form.durationMinutes) || 60,
      platform: form.platform,
      meetingUrl: normalizeMeetingUrl(form.meetingUrl) ?? undefined,
      status: 'upcoming',
    })

    notify('Live session scheduled for your students.')
    setForm(emptyForm)
    onClose()
    onScheduled?.()
  }

  return (
    <Modal
      open={open}
      title="Schedule live session"
      description="Create a Zoom meeting, paste the join link, and your enrolled students will see it."
      icon={<MonitorPlay size={18} />}
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate}>Schedule</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField
          label="Session title"
          value={form.title}
          onChange={(v) => setForm((f) => ({ ...f, title: v }))}
          placeholder="e.g. Week 4 — Live Lab"
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Course</span>
          <select
            value={form.courseId}
            onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
            className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px]"
          >
            <option value="">Select your course…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.title}
              </option>
            ))}
          </select>
        </label>
        <FormField
          label="Start date & time"
          value={form.startAt}
          onChange={(v) => setForm((f) => ({ ...f, startAt: v }))}
          type="datetime-local"
          min={minDateTimeLocalValue()}
          hint="Local date and time when your class starts."
        />
        <FormField
          label="Duration (minutes)"
          value={form.durationMinutes}
          onChange={(v) => setForm((f) => ({ ...f, durationMinutes: v }))}
          type="number"
        />
        <FormField
          label="Platform"
          value={form.platform}
          onChange={(v) => setForm((f) => ({ ...f, platform: v }))}
          type="select"
          options={['Zoom', 'Google Meet', 'Microsoft Teams']}
        />
        <FormField
          label="Meeting link"
          value={form.meetingUrl}
          onChange={(v) => setForm((f) => ({ ...f, meetingUrl: v }))}
          placeholder="https://zoom.us/j/123456789"
          hint="In Zoom: Schedule or start a meeting, then copy the invite link."
        />
      </div>
    </Modal>
  )
}

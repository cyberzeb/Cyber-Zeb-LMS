import { useMemo, useState } from 'react'
import { ClipboardList } from 'lucide-react'

import { Button } from '../../../shared/components/Button'
import { Modal } from '../../../shared/components/Modal'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { StudentMultiPicker } from '../../institution/components/StudentMultiPicker'
import type { CourseEnrollment, CourseRecord, PersonRow } from '../../institution/types'
import { DEFAULT_TRAINING_DUE_DAYS } from '../utils/complianceUtils'

interface Props {
  open: boolean
  employees: PersonRow[]
  courses: CourseRecord[]
  existing: CourseEnrollment[]
  /** Pre-selected employees, e.g. from a row action. */
  initialEmployeeIds?: string[]
  assignedBy: string
  onClose: () => void
  onAssign: (rows: CourseEnrollment[]) => void
}

function inDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Assign one training module to one or more employees, with a due date. */
export function AssignTrainingModal({
  open,
  employees,
  courses,
  existing,
  initialEmployeeIds = [],
  assignedBy,
  onClose,
  onAssign,
}: Props) {
  const [employeeIds, setEmployeeIds] = useState<string[]>(initialEmployeeIds)
  const [courseId, setCourseId] = useState('')
  const [dueDate, setDueDate] = useState(inDays(DEFAULT_TRAINING_DUE_DAYS))
  const [mandatory, setMandatory] = useState(true)
  const [error, setError] = useState('')

  const available = useMemo(() => courses.filter((c) => c.status !== 'archived'), [courses])
  // Someone already working on this module is not assigned it twice.
  const alreadyAssigned = useMemo(
    () =>
      new Set(
        existing
          .filter((e) => e.courseId === courseId && e.status !== 'withdrawn' && (e.progress ?? 0) < 100)
          .map((e) => e.studentId),
      ),
    [existing, courseId],
  )
  const skipped = employeeIds.filter((id) => alreadyAssigned.has(id)).length
  const willAssign = Math.max(0, employeeIds.length - skipped)

  function submit() {
    setError('')
    const course = available.find((c) => c.id === courseId)
    if (!course) return setError('Choose a training module.')
    if (!employeeIds.length) return setError('Choose at least one employee.')
    const today = new Date().toISOString().slice(0, 10)
    if (!dueDate || dueDate < today) return setError('Pick a due date from today on.')
    const rows: CourseEnrollment[] = employees
      .filter((p) => employeeIds.includes(p.id) && !alreadyAssigned.has(p.id))
      .map((p) => ({
        id: createId('enr'),
        studentId: p.id,
        studentName: p.name,
        courseId: course.id,
        courseCode: course.code,
        courseTitle: course.title,
        enrolledOn: today,
        status: 'active',
        progress: 0,
        isMandatory: mandatory,
        dueDate,
        assignedBy,
      }))
    if (!rows.length) return setError('Everyone selected is already working on this module.')
    onAssign(rows)
    setEmployeeIds([])
    setCourseId('')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={<ClipboardList size={18} />}
      title="Assign training"
      description="Employees get an email and see it in their portal with the due date."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={willAssign === 0 || !courseId}>
            Assign to {willAssign} employee{willAssign === 1 ? '' : 's'}
          </Button>
        </>
      }
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-semibold text-navy-900">Training module</span>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:ring-2 focus:ring-lemon-500/25"
        >
          <option value="">Choose a module…</option>
          {available.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.title}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Due date</span>
          <input
            type="date"
            value={dueDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:ring-2 focus:ring-lemon-500/25"
          />
        </label>
        <label className="flex items-center gap-2.5 self-end pb-2 text-[13px] font-semibold text-navy-900 cursor-pointer">
          <input
            type="checkbox"
            checked={mandatory}
            onChange={(e) => setMandatory(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-lemon-500)]"
          />
          Mandatory (counts towards compliance)
        </label>
      </div>
      <StudentMultiPicker students={employees} value={employeeIds} onChange={setEmployeeIds} label="Employees" />
      {skipped ? (
        <p className="text-[12px] text-secondary-text">
          {skipped} already working on this module {skipped === 1 ? 'is' : 'are'} skipped.
        </p>
      ) : null}
      {error ? <p className="text-[12.5px] font-semibold text-danger">{error}</p> : null}
    </Modal>
  )
}

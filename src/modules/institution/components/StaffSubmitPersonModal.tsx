import { useEffect, useMemo, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { FormField } from '../../../shared/components/FormField'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { DEFAULT_CAMPUS_ID } from '../data/orgSeedData'
import { withStaffVerification } from '../utils/peopleVerification'
import type { Campus, Department, PersonRow, PersonRole } from '../types'

interface StaffSubmitPersonModalProps {
  open: boolean
  campuses: Campus[]
  departments: Department[]
  students: PersonRow[]
  submittedByName?: string
  onClose: () => void
  onSubmit: (person: PersonRow) => void
}

const roleOptions: PersonRole[] = ['Student', 'Instructor', 'Guardian']

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function StaffSubmitPersonModal({
  open,
  campuses,
  departments,
  students,
  submittedByName = 'Kidist Yohannes',
  onClose,
  onSubmit,
}: StaffSubmitPersonModalProps) {
  const [form, setForm] = useState({
    role: 'Student' as PersonRole,
    name: '',
    email: '',
    campusId: DEFAULT_CAMPUS_ID,
    departmentId: '',
    linkedStudentId: '',
  })

  const departmentOptions = useMemo(
    () => departments.filter((d) => d.campusId === form.campusId),
    [departments, form.campusId],
  )

  useEffect(() => {
    if (!open) return
    setForm({
      role: 'Student',
      name: '',
      email: '',
      campusId: DEFAULT_CAMPUS_ID,
      departmentId: departmentOptions[0]?.id ?? '',
      linkedStudentId: students[0]?.id ?? '',
    })
  }, [open, departmentOptions, students])

  useEffect(() => {
    if (!departmentOptions.some((d) => d.id === form.departmentId)) {
      setForm((prev) => ({ ...prev, departmentId: departmentOptions[0]?.id ?? '' }))
    }
  }, [departmentOptions, form.departmentId])

  const handleSubmit = () => {
    if (!form.name.trim() || !form.email.trim()) return

    let person: PersonRow

    if (form.role === 'Guardian') {
      const student = students.find((s) => s.id === form.linkedStudentId)
      if (!student) return
      person = {
        id: createId('user'),
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: 'Guardian',
        department: student.name,
        campusId: student.campusId,
        status: 'invited',
        lastActive: 'Never',
        initials: initialsFromName(form.name),
      }
    } else {
      const dept = departments.find((d) => d.id === form.departmentId)
      if (!dept) return
      person = {
        id: createId('user'),
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        department: dept.name,
        campusId: form.campusId,
        status: 'invited',
        lastActive: 'Never',
        initials: initialsFromName(form.name),
      }
    }

    onSubmit(withStaffVerification(person, submittedByName))
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<UserPlus size={18} />}
      title="Submit Person for Verification"
      description="Staff submissions require administrator approval before invitations are sent."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={
              !form.name.trim() ||
              !form.email.trim() ||
              (form.role === 'Guardian' ? !form.linkedStudentId : !form.departmentId)
            }
          >
            Submit for Review
          </Button>
        </>
      }
    >
      <FormField
        label="Person Type"
        type="select"
        value={form.role}
        options={roleOptions}
        onChange={(v) => setForm({ ...form, role: v as PersonRole })}
      />
      <FormField
        label="Full Name"
        value={form.name}
        onChange={(v) => setForm({ ...form, name: v })}
        placeholder="e.g. Liya Haile"
      />
      <FormField
        label="Email Address"
        value={form.email}
        onChange={(v) => setForm({ ...form, email: v })}
        placeholder="e.g. liya.haile@email.com"
      />

      {form.role === 'Guardian' ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Linked Student</span>
          <select
            value={form.linkedStudentId}
            onChange={(e) => setForm({ ...form, linkedStudentId: e.target.value })}
            className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.department}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-navy-900">Campus</span>
            <select
              value={form.campusId}
              onChange={(e) => setForm({ ...form, campusId: e.target.value, departmentId: '' })}
              className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900"
            >
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-navy-900">Department</span>
            <select
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900"
            >
              {departmentOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </Modal>
  )
}

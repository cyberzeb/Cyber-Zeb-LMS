import { useEffect, useMemo, useState } from 'react'
import { UserRoundPen } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { FormField } from '../../../shared/components/FormField'
import { updateGuardian, type UpdateGuardianInput } from '../api/peopleApi'
import type { PersonRow } from '../types'

interface GuardianEditModalProps {
  open: boolean
  guardian: PersonRow | null
  students: PersonRow[]
  onClose: () => void
  onSaved: (guardian: PersonRow) => void
}

const statusOptions = ['active', 'invited', 'suspended']

export function GuardianEditModal({
  open,
  guardian,
  students,
  onClose,
  onSaved,
}: GuardianEditModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<UpdateGuardianInput>({
    name: '',
    email: '',
    linkedStudentId: '',
    status: 'active',
  })

  const studentOptions = useMemo(
    () => students.filter((s) => s.status !== 'suspended'),
    [students],
  )

  useEffect(() => {
    if (!guardian || !open) return
    const linked = studentOptions.find((s) => s.name === guardian.department)
    setForm({
      name: guardian.name,
      email: guardian.email,
      linkedStudentId: linked?.id ?? studentOptions[0]?.id ?? '',
      status: guardian.status,
    })
    setError('')
  }, [guardian, open, studentOptions])

  const handleSave = async () => {
    if (!guardian) return
    setSaving(true)
    setError('')
    try {
      const updated = await updateGuardian(guardian.id, form, students)
      onSaved(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update guardian.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<UserRoundPen size={18} />}
      title="Edit Guardian"
      description="Update guardian profile, linked student and portal access status."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !form.linkedStudentId}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <FormField
        label="Full Name"
        value={form.name}
        onChange={(v) => setForm({ ...form, name: v })}
        placeholder="e.g. Yonas Tadesse"
      />
      <FormField
        label="Email Address"
        value={form.email}
        onChange={(v) => setForm({ ...form, email: v })}
        placeholder="e.g. yonas.t@gmail.com"
      />
      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-semibold text-navy-900">Linked Student</span>
        <select
          value={form.linkedStudentId}
          onChange={(e) => setForm({ ...form, linkedStudentId: e.target.value })}
          className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25"
        >
          {studentOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.department}
            </option>
          ))}
        </select>
        <span className="text-[11px] text-secondary-text">
          Campus is inherited from the linked student&apos;s enrollment.
        </span>
      </label>
      <FormField
        label="Status"
        type="select"
        value={form.status}
        options={statusOptions}
        onChange={(v) => setForm({ ...form, status: v as PersonRow['status'] })}
      />
      {error ? <p className="text-[12px] text-danger font-medium">{error}</p> : null}
    </Modal>
  )
}

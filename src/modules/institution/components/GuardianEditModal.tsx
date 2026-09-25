import { useEffect, useMemo, useState } from 'react'
import { UserRoundPen } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { FormField } from '../../../shared/components/FormField'
import { updateGuardian, type UpdateGuardianInput } from '../api/peopleApi'
import { linkedStudentIdsOf } from '../../../shared/people/guardianLinks'
import { StudentMultiPicker } from './StudentMultiPicker'
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
    linkedStudentIds: [],
    status: 'active',
  })

  const studentOptions = useMemo(
    () => students.filter((s) => s.status !== 'suspended'),
    [students],
  )

  useEffect(() => {
    if (!guardian || !open) return
    setForm({
      name: guardian.name,
      email: guardian.email,
      linkedStudentIds: linkedStudentIdsOf(guardian, students),
      status: guardian.status,
    })
    setError('')
  }, [guardian, open, students])

  const handleSave = async () => {
    if (!guardian) return
    setSaving(true)
    setError('')
    try {
      const updated = await updateGuardian(guardian, form, students)
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
      description="Update the guardian, the students they follow, and portal access."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || form.linkedStudentIds.length === 0}>
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
      <StudentMultiPicker
        students={studentOptions}
        value={form.linkedStudentIds}
        onChange={(ids) => setForm({ ...form, linkedStudentIds: ids })}
      />
      <span className="-mt-2 text-[11px] text-secondary-text">
        A parent with several children at the institution can follow all of them from one account.
      </span>
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

import { useEffect, useState } from 'react'
import { UserRoundPen } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { FormField } from '../../../shared/components/FormField'
import { updateStaff, type UpdateStaffInput } from '../api/peopleApi'
import { STAFF_OFFICES } from '../data/staffOffices'
import type { Campus, PersonRow } from '../types'

interface StaffEditModalProps {
  open: boolean
  staff: PersonRow | null
  campuses: Campus[]
  onClose: () => void
  onSaved: (staff: PersonRow) => void
}

const statusOptions = ['active', 'invited', 'suspended']

export function StaffEditModal({ open, staff, campuses, onClose, onSaved }: StaffEditModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<UpdateStaffInput>({
    name: '',
    email: '',
    campusId: campuses[0]?.id ?? '',
    office: STAFF_OFFICES[0],
    isDepartmentHead: false,
    status: 'active',
  })

  useEffect(() => {
    if (!staff || !open) return
    setForm({
      name: staff.name,
      email: staff.email,
      campusId: staff.campusId ?? campuses[0]?.id ?? '',
      office: STAFF_OFFICES.includes(staff.department) ? staff.department : STAFF_OFFICES[0],
      isDepartmentHead: Boolean(staff.isDepartmentHead),
      status: staff.status,
    })
    setError('')
  }, [staff, open, campuses])

  const handleSave = async () => {
    if (!staff) return
    setSaving(true)
    setError('')
    try {
      const updated = await updateStaff(staff.id, form, campuses)
      onSaved(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update staff member.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<UserRoundPen size={18} />}
      title="Edit Staff Member"
      description="Update profile details, campus assignment, office and account status."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <FormField
        label="Full Name"
        value={form.name}
        onChange={(v) => setForm({ ...form, name: v })}
        placeholder="e.g. Kidist Yohannes"
      />
      <FormField
        label="Email Address"
        value={form.email}
        onChange={(v) => setForm({ ...form, email: v })}
        placeholder="e.g. k.yohannes@berana.edu"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Campus</span>
          <select
            value={form.campusId}
            onChange={(e) => setForm({ ...form, campusId: e.target.value })}
            className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25"
          >
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </label>
        <FormField
          label="Office"
          type="select"
          value={form.office}
          options={STAFF_OFFICES}
          onChange={(v) => setForm({ ...form, office: v })}
        />
      </div>
      <FormField
        label="Status"
        type="select"
        value={form.status}
        options={statusOptions}
        onChange={(v) => setForm({ ...form, status: v as PersonRow['status'] })}
      />
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.isDepartmentHead}
          onChange={(e) => setForm({ ...form, isDepartmentHead: e.target.checked })}
          className="w-4 h-4 rounded border-divider text-lemon-500 focus:ring-lemon-500/25"
        />
        <span className="text-[13px] font-semibold text-navy-900">Department head</span>
        <span className="text-[11px] text-secondary-text">Leads this office on the assigned campus</span>
      </label>
      {error ? <p className="text-[12px] text-danger font-medium">{error}</p> : null}
    </Modal>
  )
}

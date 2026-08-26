import { useEffect, useMemo, useState } from 'react'
import { UserRoundPen } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { FormField } from '../../../shared/components/FormField'
import { updateAdmin, type UpdateAdminInput } from '../api/peopleApi'
import type { Campus, Department, PersonRow } from '../types'

interface AdminEditModalProps {
  open: boolean
  admin: PersonRow | null
  campuses: Campus[]
  departments: Department[]
  onClose: () => void
  onSaved: (admin: PersonRow) => void
}

const statusOptions = ['active', 'invited', 'suspended']

export function AdminEditModal({
  open,
  admin,
  campuses,
  departments,
  onClose,
  onSaved,
}: AdminEditModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<UpdateAdminInput>({
    name: '',
    email: '',
    campusId: campuses[0]?.id ?? '',
    departmentId: '',
    status: 'active',
  })

  useEffect(() => {
    if (!admin || !open) return
    const dept = departments.find(
      (d) => d.name === admin.department && d.campusId === admin.campusId,
    )
    setForm({
      name: admin.name,
      email: admin.email,
      campusId: admin.campusId ?? campuses[0]?.id ?? '',
      departmentId: dept?.id ?? '',
      status: admin.status,
    })
    setError('')
  }, [admin, open, campuses, departments])

  const departmentOptions = useMemo(
    () => departments.filter((d) => d.campusId === form.campusId),
    [departments, form.campusId],
  )

  useEffect(() => {
    if (!departmentOptions.some((d) => d.id === form.departmentId)) {
      setForm((prev) => ({ ...prev, departmentId: departmentOptions[0]?.id ?? '' }))
    }
  }, [departmentOptions, form.departmentId])

  const handleSave = async () => {
    if (!admin) return
    setSaving(true)
    setError('')
    try {
      const updated = await updateAdmin(admin.id, form, campuses, departments)
      onSaved(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update administrator.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<UserRoundPen size={18} />}
      title="Edit Administrator"
      description="Update admin profile, campus scope, department and account status."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !form.departmentId}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <FormField
        label="Full Name"
        value={form.name}
        onChange={(v) => setForm({ ...form, name: v })}
        placeholder="e.g. Martha Bekele"
      />
      <FormField
        label="Email Address"
        value={form.email}
        onChange={(v) => setForm({ ...form, email: v })}
        placeholder="e.g. m.bekele@berana.edu"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Campus</span>
          <select
            value={form.campusId}
            onChange={(e) => setForm({ ...form, campusId: e.target.value, departmentId: '' })}
            className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25"
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
            className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25"
          >
            {departmentOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      </div>
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

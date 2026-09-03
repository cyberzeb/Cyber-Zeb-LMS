import { useEffect, useState } from 'react'
import { Building2 } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { FormField } from '../../../shared/components/FormField'
import { Button } from '../../../shared/components/Button'
import type { Department, DepartmentStatus } from '../../institution/types'

export interface DepartmentFormValues {
  name: string
  description: string
  headName: string
  status: DepartmentStatus
}

interface CorporateDepartmentFormModalProps {
  open: boolean
  mode: 'create' | 'edit'
  department: Department | null
  onClose: () => void
  onSave: (values: DepartmentFormValues) => void
}

const emptyValues: DepartmentFormValues = {
  name: '',
  description: '',
  headName: '',
  status: 'active',
}

export function CorporateDepartmentFormModal({
  open,
  mode,
  department,
  onClose,
  onSave,
}: CorporateDepartmentFormModalProps) {
  const [form, setForm] = useState<DepartmentFormValues>(emptyValues)

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && department) {
      setForm({
        name: department.name,
        description: department.description ?? '',
        headName: department.headName ?? '',
        status: department.status ?? 'active',
      })
    } else {
      setForm(emptyValues)
    }
  }, [open, mode, department])

  const handleSubmit = () => {
    if (!form.name.trim()) return
    onSave(form)
  }

  return (
    <Modal
      open={open}
      title={mode === 'create' ? 'Create department' : 'Edit department'}
      description="Departments group teams and employees within your organization."
      icon={<Building2 size={18} className="text-lemon-600" />}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!form.name.trim()}>
            {mode === 'create' ? 'Create department' : 'Save changes'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField
          label="Department name"
          value={form.name}
          onChange={(name) => setForm((prev) => ({ ...prev, name }))}
          placeholder="e.g. Information Technology"
        />
        <FormField
          label="Description"
          type="textarea"
          value={form.description}
          onChange={(description) => setForm((prev) => ({ ...prev, description }))}
          placeholder="Brief description of this department"
        />
        <FormField
          label="Department head"
          value={form.headName}
          onChange={(headName) => setForm((prev) => ({ ...prev, headName }))}
          placeholder="Optional — assigned later in Phase 2B"
          hint="Optional for now. Employee assignment comes in a later phase."
        />
        <FormField
          label="Status"
          type="select"
          value={form.status}
          onChange={(status) =>
            setForm((prev) => ({ ...prev, status: status as DepartmentStatus }))
          }
          options={['active', 'inactive']}
        />
      </div>
    </Modal>
  )
}

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { FormField } from '../../../shared/components/FormField'
import { Button } from '../../../shared/components/Button'
import type { Skill, SkillCategory, SkillStatus } from '../types'

export interface SkillFormValues {
  name: string
  category: SkillCategory
  description: string
  status: SkillStatus
}

interface CorporateSkillFormModalProps {
  open: boolean
  mode: 'create' | 'edit'
  skill: Skill | null
  onClose: () => void
  onSave: (values: SkillFormValues) => void
}

export function CorporateSkillFormModal({
  open,
  mode,
  skill,
  onClose,
  onSave,
}: CorporateSkillFormModalProps) {
  const [form, setForm] = useState<SkillFormValues>({
    name: '',
    category: 'technical',
    description: '',
    status: 'active',
  })

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && skill) {
      setForm({
        name: skill.name,
        category: skill.category,
        description: skill.description,
        status: skill.status,
      })
    } else {
      setForm({ name: '', category: 'technical', description: '', status: 'active' })
    }
  }, [open, mode, skill])

  return (
    <Modal
      open={open}
      title={mode === 'create' ? 'Create skill' : 'Edit skill'}
      icon={<Sparkles size={18} className="text-lemon-600" />}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={!form.name.trim()}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Skill name" value={form.name} onChange={(name) => setForm((p) => ({ ...p, name }))} />
        <FormField
          label="Category"
          type="select"
          value={form.category}
          onChange={(category) => setForm((p) => ({ ...p, category: category as SkillCategory }))}
          options={['technical', 'leadership', 'compliance', 'soft-skills', 'safety', 'other']}
        />
        <FormField label="Description" type="textarea" value={form.description} onChange={(description) => setForm((p) => ({ ...p, description }))} />
        <FormField label="Status" type="select" value={form.status} onChange={(status) => setForm((p) => ({ ...p, status: status as SkillStatus }))} options={['active', 'inactive']} />
      </div>
    </Modal>
  )
}

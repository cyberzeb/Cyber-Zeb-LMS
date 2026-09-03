import { useEffect, useMemo, useState } from 'react'
import { UsersRound } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { FormField } from '../../../shared/components/FormField'
import { Button } from '../../../shared/components/Button'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import type { Department } from '../../institution/types'
import type { PersonRow } from '../../institution/types'
import type { Team, TeamStatus } from '../types'

export interface TeamFormValues {
  name: string
  description: string
  departmentId: string
  managerId: string
  status: TeamStatus
}

interface CorporateTeamFormModalProps {
  open: boolean
  mode: 'create' | 'edit'
  team: Team | null
  departments: Department[]
  people: PersonRow[]
  defaultDepartmentId?: string
  onClose: () => void
  onSave: (values: TeamFormValues) => void
}

const emptyValues: TeamFormValues = {
  name: '',
  description: '',
  departmentId: '',
  managerId: '',
  status: 'active',
}

export function CorporateTeamFormModal({
  open,
  mode,
  team,
  departments,
  people,
  defaultDepartmentId,
  onClose,
  onSave,
}: CorporateTeamFormModalProps) {
  const [form, setForm] = useState<TeamFormValues>(emptyValues)

  const departmentOptions = useMemo(
    () =>
      departments
        .filter((dept) => (dept.status ?? 'active') === 'active')
        .map((dept) => ({ value: dept.id, label: dept.name })),
    [departments],
  )

  const managerOptions = useMemo(
    () => [
      { value: '', label: 'No manager assigned' },
      ...people
        .filter((person) => person.status === 'active')
        .map((person) => ({ value: person.id, label: person.name, hint: person.role })),
    ],
    [people],
  )

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && team) {
      setForm({
        name: team.name,
        description: team.description,
        departmentId: team.departmentId,
        managerId: team.managerId ?? '',
        status: team.status,
      })
    } else {
      setForm({
        ...emptyValues,
        departmentId: defaultDepartmentId ?? departmentOptions[0]?.value ?? '',
      })
    }
  }, [open, mode, team, defaultDepartmentId, departmentOptions])

  const handleSubmit = () => {
    if (!form.name.trim() || !form.departmentId) return
    onSave(form)
  }

  return (
    <Modal
      open={open}
      title={mode === 'create' ? 'Create team' : 'Edit team'}
      description="Teams belong to a department and will hold employees in a later phase."
      icon={<UsersRound size={18} className="text-lemon-600" />}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!form.name.trim() || !form.departmentId}>
            {mode === 'create' ? 'Create team' : 'Save changes'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField
          label="Team name"
          value={form.name}
          onChange={(name) => setForm((prev) => ({ ...prev, name }))}
          placeholder="e.g. Cybersecurity"
        />
        <FormField
          label="Description"
          type="textarea"
          value={form.description}
          onChange={(description) => setForm((prev) => ({ ...prev, description }))}
          placeholder="What this team is responsible for"
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Department</span>
          <SelectMenu
            value={form.departmentId}
            options={departmentOptions}
            onChange={(departmentId) => setForm((prev) => ({ ...prev, departmentId }))}
            placeholder="Select department"
            aria-label="Department"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Team manager</span>
          <SelectMenu
            value={form.managerId}
            options={managerOptions}
            onChange={(managerId) => setForm((prev) => ({ ...prev, managerId }))}
            placeholder="Select manager"
            aria-label="Team manager"
          />
        </label>
        <FormField
          label="Status"
          type="select"
          value={form.status}
          onChange={(status) =>
            setForm((prev) => ({ ...prev, status: status as TeamStatus }))
          }
          options={['active', 'inactive']}
        />
      </div>
    </Modal>
  )
}

import { useMemo, useState } from 'react'
import { UserRoundPen } from 'lucide-react'

import { Button } from '../../../shared/components/Button'
import { Modal } from '../../../shared/components/Modal'
import type { Department, PersonRow } from '../../institution/types'
import type { JobRole, Team } from '../types'

export interface EmployeeForm {
  name: string
  email: string
  departmentId: string
  teamId: string
  jobRoleId: string
  locationId: string
  status: PersonRow['status']
  assignRequired: boolean
}

interface Props {
  open: boolean
  employee: PersonRow | null
  departments: Department[]
  teams: Team[]
  jobRoles: JobRole[]
  locations: { id: string; name: string }[]
  existingEmails: string[]
  onClose: () => void
  onSave: (form: EmployeeForm) => void
}

const selectClass =
  'w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:ring-2 focus:ring-lemon-500/25'

export function CorporateEmployeeModal({
  open,
  employee,
  departments,
  teams,
  jobRoles,
  locations,
  existingEmails,
  onClose,
  onSave,
}: Props) {
  // Mounted fresh for each open (see the page), so the initial values are enough.
  const [form, setForm] = useState<EmployeeForm>(() =>
    employee
      ? {
          name: employee.name,
          email: employee.email,
          departmentId: employee.departmentId ?? departments.find((d) => d.name === employee.department)?.id ?? '',
          teamId: employee.teamId ?? '',
          jobRoleId: employee.jobRoleId ?? '',
          locationId: employee.campusId ?? '',
          status: employee.status,
          assignRequired: true,
        }
      : {
          name: '',
          email: '',
          departmentId: '',
          teamId: '',
          jobRoleId: '',
          locationId: '',
          status: 'invited',
          assignRequired: true,
        },
  )
  const [error, setError] = useState('')

  const teamOptions = useMemo(
    () => teams.filter((t) => t.status === 'active' && (!form.departmentId || t.departmentId === form.departmentId)),
    [teams, form.departmentId],
  )
  const roleOptions = useMemo(
    () => jobRoles.filter((r) => r.status === 'active' && (!form.departmentId || !r.departmentId || r.departmentId === form.departmentId)),
    [jobRoles, form.departmentId],
  )
  const role = jobRoles.find((r) => r.id === form.jobRoleId)
  const roleChanged = form.jobRoleId && form.jobRoleId !== employee?.jobRoleId

  function save() {
    const email = form.email.trim().toLowerCase()
    if (!form.name.trim()) return setError('Enter the employee’s name.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid work email.')
    if (existingEmails.includes(email) && email !== employee?.email.toLowerCase()) {
      return setError('Someone already uses this email.')
    }
    if (!form.departmentId) return setError('Choose a department.')
    onSave({ ...form, name: form.name.trim(), email })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={<UserRoundPen size={18} />}
      title={employee ? 'Edit employee' : 'Add employee'}
      description="Department, team and job role decide which training an employee must complete."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            {employee ? 'Save changes' : 'Add employee'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Full name</span>
          <input className={selectClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Hana Tesfaye" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Work email</span>
          <input className={selectClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Department</span>
          <select className={selectClass} value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value, teamId: '', jobRoleId: '' })}>
            <option value="">Choose…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Team</span>
          <select className={selectClass} value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })}>
            <option value="">No team</option>
            {teamOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Job role</span>
          <select className={selectClass} value={form.jobRoleId} onChange={(e) => setForm({ ...form, jobRoleId: e.target.value })}>
            <option value="">No job role</option>
            {roleOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </label>
        {locations.length ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-navy-900">Branch / office</span>
            <select className={selectClass} value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })}>
              <option value="">Not set</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Status</span>
          <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PersonRow['status'] })}>
            <option value="invited">Invited</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
      </div>
      {role && roleChanged ? (
        <label className="flex items-start gap-2.5 rounded-lg border border-divider p-3 text-[12.5px] text-navy-900 cursor-pointer">
          <input
            type="checkbox"
            checked={form.assignRequired}
            onChange={(e) => setForm({ ...form, assignRequired: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-[var(--color-lemon-500)]"
          />
          <span>
            Assign the {role.requiredCourseIds.length} training module{role.requiredCourseIds.length === 1 ? '' : 's'} “{role.title}” requires now
            {role.trainingDueDays ? `, due in ${role.trainingDueDays} days` : ''}.
          </span>
        </label>
      ) : null}
      {error ? <p className="text-[12.5px] font-semibold text-danger">{error}</p> : null}
    </Modal>
  )
}

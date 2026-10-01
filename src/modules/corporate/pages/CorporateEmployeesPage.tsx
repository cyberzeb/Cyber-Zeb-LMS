/**
 * Corporate Edition employees: who works where (department, team, job role,
 * manager) and whether their required training is up to date.
 */
import { useMemo, useState } from 'react'
import { BellRing, Download, Loader2, Pencil, Plus, ShieldCheck, TriangleAlert, UserX, Users } from 'lucide-react'

import { Button } from '../../../shared/components/Button'
import { Monogram } from '../../../shared/components/Monogram'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { useCampusContext } from '../../institution/context/CampusContext'
import { usePeople } from '../../institution/hooks/usePeople'
import type { PersonRow } from '../../institution/types'
import { withAdminVerification } from '../../institution/utils/peopleVerification'
import { useRemind } from '../../manager/components/useRemind'
import { CorporateEmployeeModal, type EmployeeForm } from '../components/CorporateEmployeeModal'
import { useJobRoles } from '../hooks/useJobRoles'
import { useRequiredTraining } from '../hooks/useRequiredTraining'
import { useTeams } from '../hooks/useTeams'
import { COMPLIANCE_STATUS_LABEL, COMPLIANCE_STATUS_TONE, downloadCsv } from '../utils/complianceLabels'
import { computeOrganizationComplianceRate } from '../utils/complianceUtils'

const STAT = 17

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function CorporateEmployeesPage() {
  const { notify } = useToast()
  const { people, setPeople } = usePeople()
  const { departments, campuses } = useCampusContext()
  const { teams } = useTeams()
  const { jobRoles } = useJobRoles()
  const { complianceRows, previewFor, assignForEmployee } = useRequiredTraining()
  const { remind, sendingId } = useRemind()

  const [query, setQuery] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [teamFilter, setTeamFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editing, setEditing] = useState<PersonRow | null | 'new'>(null)

  const employees = useMemo(() => people.filter((p) => p.role === 'Student'), [people])
  const rowById = useMemo(() => new Map(complianceRows.map((r) => [r.employeeId, r])), [complianceRows])
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])
  const roleById = useMemo(() => new Map(jobRoles.map((r) => [r.id, r])), [jobRoles])
  const personById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return employees.filter((p) => {
      const deptName = departments.find((d) => d.id === deptFilter)?.name
      if (deptFilter !== 'all' && p.departmentId !== deptFilter && p.department !== deptName) return false
      if (teamFilter !== 'all' && p.teamId !== teamFilter) return false
      if (roleFilter !== 'all' && p.jobRoleId !== roleFilter) return false
      if (statusFilter !== 'all') {
        const row = rowById.get(p.id)
        if (statusFilter === 'suspended' ? p.status !== 'suspended' : row?.status !== statusFilter) return false
      }
      return (
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (roleById.get(p.jobRoleId ?? '')?.title ?? '').toLowerCase().includes(q)
      )
    })
  }, [employees, query, deptFilter, teamFilter, roleFilter, statusFilter, rowById, roleById, departments])

  const active = employees.filter((p) => p.status === 'active')
  const overdue = complianceRows.filter((r) => r.status === 'overdue').length

  function save(form: EmployeeForm) {
    const dept = departments.find((d) => d.id === form.departmentId)
    const base = {
      name: form.name,
      email: form.email,
      role: 'Student' as const,
      department: dept?.name ?? '',
      departmentId: form.departmentId,
      teamId: form.teamId || undefined,
      jobRoleId: form.jobRoleId || undefined,
      campusId: form.locationId || undefined,
      status: form.status,
      initials: initials(form.name),
    }
    let saved: PersonRow
    if (editing && editing !== 'new') {
      saved = { ...editing, ...base }
      setPeople((prev) => prev.map((p) => (p.id === saved.id ? saved : p)))
      notify(`${saved.name} updated.`)
    } else {
      saved = withAdminVerification({ ...base, id: createId('user'), lastActive: 'Never' })
      setPeople((prev) => [saved, ...prev])
      notify(`${saved.name} added. They can sign in with their work email.`)
    }
    const roleChanged = form.jobRoleId && form.jobRoleId !== (editing !== 'new' ? editing?.jobRoleId : undefined)
    if (roleChanged && form.assignRequired && saved.status !== 'suspended') {
      const result = assignForEmployee(saved)
      if (result.created) notify(`Assigned ${result.created} required module${result.created === 1 ? '' : 's'}.`)
    }
    setEditing(null)
  }

  function exportCsv() {
    downloadCsv(
      `employees-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((p) => {
        const row = rowById.get(p.id)
        const team = teamById.get(p.teamId ?? '')
        return {
          Name: p.name,
          Email: p.email,
          Department: p.department,
          Team: team?.name ?? '',
          'Job role': roleById.get(p.jobRoleId ?? '')?.title ?? '',
          Manager: personById.get(team?.managerId ?? '')?.name ?? '',
          'Compliance %': row?.compliancePercent ?? '',
          'Compliance status': row ? COMPLIANCE_STATUS_LABEL[row.status] : '',
          Status: p.status,
        }
      }),
    )
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Employees"
        subtitle="Where everyone works, what their job role requires, and whether their training is up to date."
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv} disabled={!filtered.length}>
              <Download size={16} />
              Export CSV
            </Button>
            <Button variant="primary" onClick={() => setEditing('new')}>
              <Plus size={16} />
              Add employee
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBlock label="Employees" value={employees.length} sub={`${active.length} active`} icon={<Users size={STAT} />} />
        <StatBlock
          label="Compliance"
          value={`${computeOrganizationComplianceRate(complianceRows)}%`}
          sub="Fully up to date"
          icon={<ShieldCheck size={STAT} />}
          iconBg="bg-success-bg text-success"
        />
        <StatBlock label="Overdue" value={overdue} sub="Employees with late training" icon={<TriangleAlert size={STAT} />} iconBg="bg-danger-bg text-danger" />
        <StatBlock
          label="No job role"
          value={employees.filter((p) => !p.jobRoleId && p.status !== 'suspended').length}
          sub="Nothing required yet"
          icon={<UserX size={STAT} />}
          iconBg="bg-warning-bg text-[#8A6D00]"
        />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <SelectMenu value={deptFilter} onChange={(v) => { setDeptFilter(v); setTeamFilter('all') }} options={[{ value: 'all', label: 'All departments' }, ...departments.map((d) => ({ value: d.id, label: d.name }))]} aria-label="Department" />
          <SelectMenu value={teamFilter} onChange={setTeamFilter} options={[{ value: 'all', label: 'All teams' }, ...teams.filter((t) => deptFilter === 'all' || t.departmentId === deptFilter).map((t) => ({ value: t.id, label: t.name }))]} aria-label="Team" />
          <SelectMenu value={roleFilter} onChange={setRoleFilter} options={[{ value: 'all', label: 'All job roles' }, ...jobRoles.map((r) => ({ value: r.id, label: r.title }))]} aria-label="Job role" />
          <SelectMenu
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'Any compliance' },
              { value: 'compliant', label: 'Compliant' },
              { value: 'at-risk', label: 'At risk' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'expiring', label: 'Recertification due' },
              { value: 'not-assigned', label: 'Nothing assigned' },
              { value: 'suspended', label: 'Suspended accounts' },
            ]}
            aria-label="Compliance"
          />
          <span className="self-center text-[13px] font-semibold text-navy-700">{filtered.length} employees</span>
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder="Search name, email or job role…" className="lg:w-80" />
      </div>

      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-navy-50/60 text-left text-[11px] uppercase tracking-wide text-secondary-text dark:bg-white/5">
              <tr>
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Department / team</th>
                <th className="px-5 py-3 font-medium">Job role</th>
                <th className="px-5 py-3 font-medium">Manager</th>
                <th className="px-5 py-3 font-medium">Compliance</th>
                <th className="px-5 py-3 font-medium">Account</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const row = rowById.get(p.id)
                const team = teamById.get(p.teamId ?? '')
                const manager = personById.get(team?.managerId ?? '')
                const outstanding = p.jobRoleId && p.status === 'active' ? previewFor([p]).length : 0
                return (
                  <tr key={p.id} className="border-b border-divider last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Monogram label={p.name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-navy-900">{p.name}</p>
                          <p className="truncate text-[12px] text-secondary-text">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-navy-900">{p.department || '—'}</p>
                      <p className="text-[12px] text-secondary-text">{team?.name ?? 'No team'}</p>
                    </td>
                    <td className="px-5 py-3 text-navy-900">{roleById.get(p.jobRoleId ?? '')?.title ?? <span className="text-secondary-text">Not set</span>}</td>
                    <td className="px-5 py-3 text-navy-900">{manager?.name ?? <span className="text-secondary-text">—</span>}</td>
                    <td className="px-5 py-3">
                      {row && p.status !== 'suspended' ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-navy-900">{row.compliancePercent}%</span>
                          <StatusPill label={COMPLIANCE_STATUS_LABEL[row.status]} tone={COMPLIANCE_STATUS_TONE[row.status]} />
                        </div>
                      ) : (
                        <span className="text-secondary-text">—</span>
                      )}
                      {outstanding ? (
                        <p className="mt-1 text-[11.5px] font-semibold text-[#8A6D00] dark:text-warning">
                          {outstanding} required module{outstanding === 1 ? '' : 's'} not assigned
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill label={p.status} tone={p.status === 'active' ? 'success' : p.status === 'invited' ? 'warning' : 'danger'} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        {outstanding ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const r = assignForEmployee(p)
                              notify(`Assigned ${r.created} required module${r.created === 1 ? '' : 's'} to ${p.name}.`)
                            }}
                          >
                            Assign required
                          </Button>
                        ) : null}
                        {row && (row.overdueTraining || row.dueSoonTraining) ? (
                          <Button variant="ghost" size="sm" onClick={() => void remind(p.id)} disabled={sendingId === p.id} title="Email a reminder">
                            {sendingId === p.id ? <Loader2 size={13} className="animate-spin" /> : <BellRing size={13} />}
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="sm" onClick={() => setEditing(p)} title="Edit">
                          <Pencil size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-secondary-text">
                    {employees.length ? 'No employees match your filters.' : 'No employees yet. Add your first one.'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {editing !== null ? (
      <CorporateEmployeeModal
        key={editing === 'new' ? 'new' : editing.id}
        open
        employee={editing === 'new' ? null : editing}
        departments={departments}
        teams={teams}
        jobRoles={jobRoles}
        locations={campuses.map((c) => ({ id: c.id, name: c.name }))}
        existingEmails={people.map((p) => p.email.toLowerCase())}
        onClose={() => setEditing(null)}
        onSave={save}
      />
      ) : null}
    </div>
  )
}

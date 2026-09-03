import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, UsersRound } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { PageHeader } from '../../../shared/components/PageHeader'
import { Button } from '../../../shared/components/Button'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useCampusContext } from '../../institution/context/CampusContext'
import { usePeople } from '../../institution/hooks/usePeople'
import { CorporateTeamFormModal } from '../components/CorporateTeamFormModal'
import { useTeams } from '../hooks/useTeams'
import type { Team } from '../types'
import {
  canDeleteTeam,
  canDeactivateTeam,
  countEmployeesInTeam,
  getManagerName,
} from '../utils/orgUtils'

const STAT = 17

export function CorporateTeamsPage() {
  const { notify } = useToast()
  const { departments } = useCampusContext()
  const { teams, createTeam, updateTeam, deactivateTeam, deleteTeam } = useTeams()
  const { people } = usePeople()

  const [query, setQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [teamModal, setTeamModal] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    team: Team | null
  }>({ open: false, mode: 'create', team: null })

  const departmentNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const dept of departments) map.set(dept.id, dept.name)
    return map
  }, [departments])

  const departmentOptions = useMemo(
    () => [
      { value: 'all', label: 'All departments' },
      ...departments.map((dept) => ({ value: dept.id, label: dept.name })),
    ],
    [departments],
  )

  const filteredTeams = useMemo(() => {
    const q = query.trim().toLowerCase()
    return teams.filter((team) => {
      const deptName = departmentNameById.get(team.departmentId) ?? ''
      const managerName = getManagerName(team.managerId, people)
      const matchesDept = departmentFilter === 'all' || team.departmentId === departmentFilter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && team.status === 'active') ||
        (statusFilter === 'inactive' && team.status === 'inactive')
      const matchesQuery =
        q === '' ||
        team.name.toLowerCase().includes(q) ||
        deptName.toLowerCase().includes(q) ||
        managerName.toLowerCase().includes(q)
      return matchesDept && matchesStatus && matchesQuery
    })
  }, [teams, query, departmentFilter, statusFilter, departmentNameById, people])

  const stats = useMemo(() => {
    const active = teams.filter((team) => team.status === 'active').length
    return { total: teams.length, active }
  }, [teams])

  const handleSaveTeam = (values: {
    name: string
    description: string
    departmentId: string
    managerId: string
    status: 'active' | 'inactive'
  }) => {
    if (teamModal.mode === 'create') {
      createTeam({
        name: values.name,
        description: values.description,
        departmentId: values.departmentId,
        managerId: values.managerId || null,
        status: values.status,
      })
      notify('Team created.', 'success')
    } else if (teamModal.team) {
      updateTeam(teamModal.team.id, {
        name: values.name.trim(),
        description: values.description.trim(),
        departmentId: values.departmentId,
        managerId: values.managerId || null,
        status: values.status,
      })
      notify('Team updated.', 'success')
    }
    setTeamModal({ open: false, mode: 'create', team: null })
  }

  const handleRemoveTeam = (team: Team) => {
    const check = canDeleteTeam(team.id, people)
    if (!check.allowed) {
      notify(check.reason ?? 'Cannot remove this team.', 'error')
      return
    }
    deleteTeam(team.id)
    notify('Team removed.', 'success')
  }

  const handleDeactivateTeam = (team: Team) => {
    const check = canDeactivateTeam(team.id, people)
    if (!check.allowed) {
      notify(check.reason ?? 'Cannot deactivate this team.', 'error')
      return
    }
    deactivateTeam(team.id)
    notify('Team deactivated.', 'success')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        subtitle="Working groups inside a department. Assign employees to teams for finer reporting and manager oversight."
        actions={
          <Button onClick={() => setTeamModal({ open: true, mode: 'create', team: null })}>
            <Plus size={15} />
            Add team
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatBlock icon={<UsersRound size={STAT} />} label="Total teams" value={stats.total} />
        <StatBlock icon={<UsersRound size={STAT} />} label="Active teams" value={stats.active} />
      </div>

      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search teams, departments, or managers…"
            className="flex-1 min-w-[220px]"
          />
          <SelectMenu
            value={departmentFilter}
            options={departmentOptions}
            onChange={setDepartmentFilter}
            aria-label="Filter by department"
          />
          <SelectMenu
            value={statusFilter}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'active', label: 'Active only' },
              { value: 'inactive', label: 'Inactive only' },
            ]}
            onChange={(value) => setStatusFilter(value as typeof statusFilter)}
            aria-label="Filter by status"
          />
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-divider bg-navy-50/40 text-[11px] uppercase tracking-wide text-secondary-text">
                <th className="px-4 py-3 font-semibold">Team</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Manager</th>
                <th className="px-4 py-3 font-semibold">Employees</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[13px] text-secondary-text">
                    No teams match your filters.
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team) => {
                  const employeeCount = countEmployeesInTeam(team.id, people)
                  return (
                    <tr key={team.id} className="border-b border-divider/60 last:border-0 hover:bg-navy-50/20">
                      <td className="px-4 py-3">
                        <div className="text-[13px] font-semibold text-navy-900">{team.name}</div>
                        {team.description ? (
                          <div className="text-[12px] text-secondary-text mt-0.5 max-w-xs truncate">
                            {team.description}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-navy-800">
                        {departmentNameById.get(team.departmentId) ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-navy-800">
                        {getManagerName(team.managerId, people)}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-navy-800">{employeeCount}</td>
                      <td className="px-4 py-3">
                        <StatusPill
                          label={team.status}
                          tone={team.status === 'active' ? 'success' : 'neutral'}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTeamModal({ open: true, mode: 'edit', team })}
                          >
                            <Pencil size={14} />
                          </Button>
                          {team.status === 'active' ? (
                            <Button variant="ghost" size="sm" onClick={() => handleDeactivateTeam(team)}>
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateTeam(team.id, { status: 'active' })}
                            >
                              Reactivate
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveTeam(team)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <CorporateTeamFormModal
        open={teamModal.open}
        mode={teamModal.mode}
        team={teamModal.team}
        departments={departments}
        people={people}
        onClose={() => setTeamModal({ open: false, mode: 'create', team: null })}
        onSave={handleSaveTeam}
      />
    </div>
  )
}

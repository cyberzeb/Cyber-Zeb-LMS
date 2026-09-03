import { useMemo, useState } from 'react'
import { Building2, Network, Pencil, Plus, Trash2, UsersRound } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { PageHeader } from '../../../shared/components/PageHeader'
import { Button } from '../../../shared/components/Button'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { useOrganizationConfig } from '../../../shared/config/useOrganizationConfig'
import { useCampusContext } from '../../institution/context/CampusContext'
import { usePeople } from '../../institution/hooks/usePeople'
import { DEFAULT_CAMPUS_ID, DEFAULT_COLLEGE_ID } from '../../institution/data/orgSeedData'
import type { Department } from '../../institution/types'
import { CorporateDepartmentFormModal } from '../components/CorporateDepartmentFormModal'
import { CorporateTeamFormModal } from '../components/CorporateTeamFormModal'
import { useTeams } from '../hooks/useTeams'
import type { Team } from '../types'
import {
  canDeleteDepartment,
  canDeleteTeam,
  canDeactivateTeam,
  getDepartmentStatus,
  getTeamsForDepartment,
} from '../utils/orgUtils'

const STAT = 17

export function CorporateOrganizationPage() {
  const { notify } = useToast()
  const { organizationName, terminology } = useOrganizationConfig()
  const { departments, setDepartments } = useCampusContext()
  const { teams, createTeam, updateTeam, deactivateTeam, deleteTeam } = useTeams()
  const { people } = usePeople()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [deptModal, setDeptModal] = useState<{ open: boolean; mode: 'create' | 'edit'; dept: Department | null }>({
    open: false,
    mode: 'create',
    dept: null,
  })
  const [teamModal, setTeamModal] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    team: Team | null
    departmentId?: string
  }>({ open: false, mode: 'create', team: null })

  const activeDepartments = useMemo(
    () => departments.filter((dept) => getDepartmentStatus(dept) === 'active'),
    [departments],
  )

  const filteredDepartments = useMemo(() => {
    const q = query.trim().toLowerCase()
    return departments.filter((dept) => {
      const status = getDepartmentStatus(dept)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && status === 'active') ||
        (statusFilter === 'inactive' && status === 'inactive')
      const deptTeams = getTeamsForDepartment(teams, dept.id)
      const matchesQuery =
        q === '' ||
        dept.name.toLowerCase().includes(q) ||
        (dept.description ?? '').toLowerCase().includes(q) ||
        deptTeams.some((team) => team.name.toLowerCase().includes(q))
      return matchesStatus && matchesQuery
    })
  }, [departments, query, statusFilter, teams])

  const stats = useMemo(() => {
    const activeTeams = teams.filter((team) => team.status === 'active').length
    return {
      departments: activeDepartments.length,
      teams: activeTeams,
      totalTeams: teams.length,
    }
  }, [activeDepartments.length, teams])

  const handleSaveDepartment = (values: {
    name: string
    description: string
    headName: string
    status: 'active' | 'inactive'
  }) => {
    if (deptModal.mode === 'create') {
      const dept: Department = {
        id: createId('dept'),
        name: values.name.trim(),
        description: values.description.trim(),
        headName: values.headName.trim() || '—',
        studentsCount: 0,
        facultyCount: 0,
        icon: '',
        campusId: DEFAULT_CAMPUS_ID,
        collegeId: DEFAULT_COLLEGE_ID,
        status: values.status,
      }
      setDepartments((prev) => [...prev, dept])
      notify('Department created.', 'success')
    } else if (deptModal.dept) {
      setDepartments((prev) =>
        prev.map((dept) =>
          dept.id === deptModal.dept!.id
            ? {
                ...dept,
                name: values.name.trim(),
                description: values.description.trim(),
                headName: values.headName.trim() || dept.headName,
                status: values.status,
              }
            : dept,
        ),
      )
      notify('Department updated.', 'success')
    }
    setDeptModal({ open: false, mode: 'create', dept: null })
  }

  const handleDeleteDepartment = (dept: Department) => {
    const check = canDeleteDepartment(dept.id, teams, people)
    if (!check.allowed) {
      notify(check.reason ?? 'Cannot remove this department.', 'error')
      return
    }
    setDepartments((prev) => prev.filter((item) => item.id !== dept.id))
    notify('Department removed.', 'success')
  }

  const handleDeactivateDepartment = (dept: Department) => {
    const activeTeams = getTeamsForDepartment(teams, dept.id).filter((team) => team.status === 'active')
    if (activeTeams.length > 0) {
      notify('Deactivate all teams in this department first.', 'error')
      return
    }
    setDepartments((prev) =>
      prev.map((item) => (item.id === dept.id ? { ...item, status: 'inactive' } : item)),
    )
    notify('Department deactivated.', 'success')
  }

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
        title="Organization Structure"
        subtitle={`Manage ${terminology.organization.toLowerCase()} departments and teams for ${organizationName}.`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setDeptModal({ open: true, mode: 'create', dept: null })}>
              <Plus size={15} />
              Add department
            </Button>
            <Button onClick={() => setTeamModal({ open: true, mode: 'create', team: null })}>
              <Plus size={15} />
              Add team
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBlock icon={<Network size={STAT} />} label="Organization" value={organizationName} />
        <StatBlock icon={<Building2 size={STAT} />} label="Departments" value={stats.departments} />
        <StatBlock icon={<UsersRound size={STAT} />} label="Active teams" value={stats.teams} />
      </div>

      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search departments or teams…"
            className="flex-1 min-w-[220px]"
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

      <div className="space-y-4">
        {filteredDepartments.length === 0 ? (
          <GlassCard className="p-8 text-center text-secondary-text text-[13px]">
            No departments match your filters. Create a department to get started.
          </GlassCard>
        ) : (
          filteredDepartments.map((dept) => {
            const deptTeams = getTeamsForDepartment(teams, dept.id)
            const status = getDepartmentStatus(dept)
            return (
              <GlassCard key={dept.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[16px] font-bold text-navy-900">{dept.name}</h2>
                      <StatusPill
                        label={status}
                        tone={status === 'active' ? 'success' : 'neutral'}
                      />
                    </div>
                    {dept.description ? (
                      <p className="text-[13px] text-secondary-text mt-1 max-w-2xl">{dept.description}</p>
                    ) : null}
                    <p className="text-[12px] text-secondary-text mt-2">
                      {deptTeams.length} team{deptTeams.length === 1 ? '' : 's'}
                      {dept.headName && dept.headName !== '—' ? ` · Head: ${dept.headName}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTeamModal({ open: true, mode: 'create', team: null, departmentId: dept.id })}
                    >
                      <Plus size={14} />
                      Add team
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeptModal({ open: true, mode: 'edit', dept })}
                    >
                      <Pencil size={14} />
                      Edit
                    </Button>
                    {status === 'active' ? (
                      <Button variant="ghost" size="sm" onClick={() => handleDeactivateDepartment(dept)}>
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDepartments((prev) =>
                            prev.map((item) =>
                              item.id === dept.id ? { ...item, status: 'active' } : item,
                            ),
                          )
                          notify('Department reactivated.', 'success')
                        }}
                      >
                        Reactivate
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteDepartment(dept)}>
                      <Trash2 size={14} />
                      Remove
                    </Button>
                  </div>
                </div>

                {deptTeams.length > 0 ? (
                  <div className="mt-4 border-t border-divider pt-4 space-y-2">
                    {deptTeams.map((team) => (
                      <div
                        key={team.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-divider/70 bg-white/50 dark:bg-navy-50/30 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <UsersRound size={14} className="text-navy-400 shrink-0" />
                            <span className="text-[13px] font-semibold text-navy-900">{team.name}</span>
                            <StatusPill
                              label={team.status}
                              tone={team.status === 'active' ? 'success' : 'neutral'}
                            />
                          </div>
                          {team.description ? (
                            <p className="text-[12px] text-secondary-text mt-1 ps-6">{team.description}</p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-[12px] text-secondary-text border-t border-divider pt-4">
                    No teams yet. Add a team under this department.
                  </p>
                )}
              </GlassCard>
            )
          })
        )}
      </div>

      <CorporateDepartmentFormModal
        open={deptModal.open}
        mode={deptModal.mode}
        department={deptModal.dept}
        onClose={() => setDeptModal({ open: false, mode: 'create', dept: null })}
        onSave={handleSaveDepartment}
      />

      <CorporateTeamFormModal
        open={teamModal.open}
        mode={teamModal.mode}
        team={teamModal.team}
        departments={departments}
        people={people}
        defaultDepartmentId={teamModal.departmentId}
        onClose={() => setTeamModal({ open: false, mode: 'create', team: null })}
        onSave={handleSaveTeam}
      />
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { PageHeader } from '../../../shared/components/PageHeader'
import { Button } from '../../../shared/components/Button'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { getEditionPageCopy } from '../../../shared/config/editionUi'
import { useCampusContext } from '../../institution/context/CampusContext'
import { usePeople } from '../../institution/hooks/usePeople'
import { useTeams } from '../hooks/useTeams'
import { DEFAULT_CAMPUS_ID, DEFAULT_COLLEGE_ID } from '../../institution/data/orgSeedData'
import type { Department } from '../../institution/types'
import { CorporateDepartmentFormModal } from '../components/CorporateDepartmentFormModal'
import {
  canDeleteDepartment,
  getDepartmentStatus,
  getTeamsForDepartment,
} from '../utils/orgUtils'

const STAT = 17

export function CorporateDepartmentsPage() {
  const { notify } = useToast()
  const copy = getEditionPageCopy('departments')
  const { departments, setDepartments } = useCampusContext()
  const { teams } = useTeams()
  const { people } = usePeople()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; dept: Department | null }>({
    open: false,
    mode: 'create',
    dept: null,
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return departments.filter((dept) => {
      const status = getDepartmentStatus(dept)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && status === 'active') ||
        (statusFilter === 'inactive' && status === 'inactive')
      const matchesQuery =
        q === '' ||
        dept.name.toLowerCase().includes(q) ||
        (dept.description ?? '').toLowerCase().includes(q)
      return matchesStatus && matchesQuery
    })
  }, [departments, query, statusFilter])

  const activeCount = departments.filter((d) => getDepartmentStatus(d) === 'active').length

  const handleSave = (values: {
    name: string
    description: string
    headName: string
    status: 'active' | 'inactive'
  }) => {
    if (modal.mode === 'create') {
      setDepartments((prev) => [
        ...prev,
        {
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
        },
      ])
      notify('Department created.', 'success')
    } else if (modal.dept) {
      setDepartments((prev) =>
        prev.map((dept) =>
          dept.id === modal.dept!.id
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
    setModal({ open: false, mode: 'create', dept: null })
  }

  const handleRemove = (dept: Department) => {
    const check = canDeleteDepartment(dept.id, teams, people)
    if (!check.allowed) {
      notify(check.reason ?? 'Cannot remove this department.', 'error')
      return
    }
    setDepartments((prev) => prev.filter((d) => d.id !== dept.id))
    notify('Department removed.', 'success')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={copy.title}
        subtitle={copy.subtitle}
        actions={
          <Button onClick={() => setModal({ open: true, mode: 'create', dept: null })}>
            <Plus size={15} />
            Add department
          </Button>
        }
      />

      <StatBlock icon={<Building2 size={STAT} />} label="Active departments" value={activeCount} />

      <GlassCard className="p-4 flex flex-wrap gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search departments…"
          className="flex-1 min-w-[220px]"
        />
        <SelectMenu
          value={statusFilter}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'active', label: 'Active only' },
            { value: 'inactive', label: 'Inactive only' },
          ]}
          onChange={(v) => setStatusFilter(v as typeof statusFilter)}
          aria-label="Filter by status"
        />
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((dept) => {
          const status = getDepartmentStatus(dept)
          const teamCount = getTeamsForDepartment(teams, dept.id).length
          return (
            <GlassCard key={dept.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-bold text-navy-900">{dept.name}</h3>
                    <StatusPill label={status} tone={status === 'active' ? 'success' : 'neutral'} />
                  </div>
                  {dept.description ? (
                    <p className="text-[12px] text-secondary-text mt-1">{dept.description}</p>
                  ) : null}
                  <p className="text-[12px] text-secondary-text mt-2">
                    {teamCount} team{teamCount === 1 ? '' : 's'}
                    {dept.headName && dept.headName !== '—' ? ` · Head: ${dept.headName}` : ''}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setModal({ open: true, mode: 'edit', dept })}>
                    <Pencil size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleRemove(dept)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </GlassCard>
          )
        })}
      </div>

      <CorporateDepartmentFormModal
        open={modal.open}
        mode={modal.mode}
        department={modal.dept}
        onClose={() => setModal({ open: false, mode: 'create', dept: null })}
        onSave={handleSave}
      />
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Briefcase, Pencil, Plus, Trash2 } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { PageHeader } from '../../../shared/components/PageHeader'
import { Button } from '../../../shared/components/Button'
import { SearchInput } from '../../../shared/components/SearchInput'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useCampusContext } from '../../institution/context/CampusContext'
import { useSkills } from '../hooks/useSkills'
import { useJobRoles } from '../hooks/useJobRoles'
import { CorporateJobRoleFormModal } from '../components/CorporateJobRoleFormModal'
import type { JobRole } from '../types'

const STAT = 17

export function CorporateJobRolesPage() {
  const { notify } = useToast()
  const { departments } = useCampusContext()
  const { jobRoles, createJobRole, updateJobRole, deleteJobRole } = useJobRoles()
  const { skills } = useSkills()
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; role: JobRole | null }>({
    open: false,
    mode: 'create',
    role: null,
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return jobRoles.filter(
      (role) =>
        q === '' ||
        role.title.toLowerCase().includes(q) ||
        role.description.toLowerCase().includes(q),
    )
  }, [jobRoles, query])

  const deptName = (id?: string) =>
    id ? (departments.find((d) => d.id === id)?.name ?? '—') : 'All departments'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Roles"
        subtitle="Define roles and link required skills and mandatory training for your workforce."
        actions={
          <Button onClick={() => setModal({ open: true, mode: 'create', role: null })}>
            <Plus size={15} />
            Add job role
          </Button>
        }
      />

      <StatBlock icon={<Briefcase size={STAT} />} label="Active job roles" value={jobRoles.filter((r) => r.status === 'active').length} />

      <GlassCard className="p-4">
        <SearchInput value={query} onChange={setQuery} placeholder="Search job roles…" />
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-divider bg-navy-50/40 text-[11px] uppercase tracking-wide text-secondary-text">
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Required skills</th>
              <th className="px-4 py-3">Required training</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((role) => (
              <tr key={role.id} className="border-b border-divider/60 last:border-0">
                <td className="px-4 py-3">
                  <div className="text-[13px] font-semibold text-navy-900">{role.title}</div>
                  <div className="text-[12px] text-secondary-text">{role.description}</div>
                </td>
                <td className="px-4 py-3 text-[13px]">{deptName(role.departmentId)}</td>
                <td className="px-4 py-3 text-[13px]">{role.requiredSkillIds.length}</td>
                <td className="px-4 py-3 text-[13px]">{role.requiredCourseIds.length}</td>
                <td className="px-4 py-3">
                  <StatusPill label={role.status} tone={role.status === 'active' ? 'success' : 'neutral'} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setModal({ open: true, mode: 'edit', role })}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { deleteJobRole(role.id); notify('Job role removed.', 'success') }}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <CorporateJobRoleFormModal
        open={modal.open}
        mode={modal.mode}
        role={modal.role}
        departments={departments}
        skills={skills}
        onClose={() => setModal({ open: false, mode: 'create', role: null })}
        onSave={(values) => {
          if (modal.mode === 'create') {
            createJobRole(values)
            notify('Job role created.', 'success')
          } else if (modal.role) {
            updateJobRole(modal.role.id, values)
            notify('Job role updated.', 'success')
          }
          setModal({ open: false, mode: 'create', role: null })
        }}
      />
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { MailPlus, Plus } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { Modal } from '../../../shared/components/Modal'
import { FormField } from '../../../shared/components/FormField'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { DepartmentSelectMenu } from '../../../shared/components/DepartmentSelectMenu'
import { useSyncCampusFilter } from '../hooks/useSyncCampusFilter'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { usePeople } from '../hooks/usePeople'
import { withAdminVerification } from '../utils/peopleVerification'
import { useCampusContext } from '../context/CampusContext'
import { peoplePageConfigs } from '../data/peoplePageConfig'
import { DEFAULT_CAMPUS_ID } from '../data/orgSeedData'
import { migrateAdminRecord } from '../api/peopleApi'
import { CampusRoleTable } from '../components/CampusRoleTable'
import { AdminEditModal } from '../components/AdminEditModal'
import type { PersonRow } from '../types'

const config = peoplePageConfigs.Admin

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function AdministratorsPage() {
  const { notify } = useToast()
  const { campuses, departments, activeCampuses, selectedCampusId } = useCampusContext()
  const { people, setPeople } = usePeople()
  const [query, setQuery] = useState('')
  const [campusFilter, setCampusFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editAdmin, setEditAdmin] = useState<PersonRow | null>(null)
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    campusId: DEFAULT_CAMPUS_ID,
    departmentId: '',
  })

  useEffect(() => {
    setPeople((prev) => prev.map((p) => migrateAdminRecord(p, departments)))
  }, [departments, setPeople])

  useSyncCampusFilter(selectedCampusId, setCampusFilter)

  useEffect(() => {
    setDepartmentFilter('all')
  }, [selectedCampusId])

  const admins = useMemo(() => people.filter((p) => p.role === 'Admin'), [people])

  const filtered = useMemo(() => {
    return admins.filter((admin) => {
      const matchesCampus = campusFilter === 'all' || admin.campusId === campusFilter
      const matchesDepartment =
        departmentFilter === 'all' ||
        admin.department === departments.find((d) => d.id === departmentFilter)?.name
      const q = query.trim().toLowerCase()
      const matchesQuery =
        q === '' ||
        admin.name.toLowerCase().includes(q) ||
        admin.email.toLowerCase().includes(q) ||
        admin.department.toLowerCase().includes(q)
      return matchesCampus && matchesDepartment && matchesQuery
    })
  }, [admins, campusFilter, departmentFilter, query, departments])

  const stats = useMemo(() => config.getStats(people), [people])

  const campusMenuOptions = useMemo(
    () => [
      { value: 'all', label: 'All campuses' },
      ...activeCampuses.map((c) => ({ value: c.id, label: c.name, hint: c.code })),
    ],
    [activeCampuses],
  )

  const inviteDepartments = useMemo(
    () => departments.filter((d) => d.campusId === inviteForm.campusId),
    [departments, inviteForm.campusId],
  )

  useEffect(() => {
    if (!inviteDepartments.some((d) => d.id === inviteForm.departmentId)) {
      setInviteForm((prev) => ({ ...prev, departmentId: inviteDepartments[0]?.id ?? '' }))
    }
  }, [inviteDepartments, inviteForm.departmentId])

  const openInvite = () => {
    setInviteForm({
      name: '',
      email: '',
      campusId: campusFilter !== 'all' ? campusFilter : DEFAULT_CAMPUS_ID,
      departmentId: '',
    })
    setInviteOpen(true)
  }

  const handleInvite = () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim() || !inviteForm.departmentId) {
      notify('Please complete all required fields.', 'error')
      return
    }
    const dept = departments.find((d) => d.id === inviteForm.departmentId)
    if (!dept) return

    const newAdmin = withAdminVerification({
      id: createId('user'),
      name: inviteForm.name.trim(),
      email: inviteForm.email.trim().toLowerCase(),
      role: 'Admin',
      department: dept.name,
      campusId: inviteForm.campusId,
      status: 'invited',
      lastActive: 'Never',
      initials: initialsFromName(inviteForm.name),
    })
    setPeople((prev) => [newAdmin, ...prev])
    setInviteOpen(false)
    notify(`Admin invitation sent to ${newAdmin.name}.`)
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        actions={
          <Button variant="primary" onClick={openInvite}>
            <Plus size={16} />
            {config.inviteLabel}
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {stats.map((stat) => (
          <StatBlock
            key={stat.label}
            label={stat.label}
            value={typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
            sub={stat.sub}
            icon={stat.icon}
          />
        ))}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <SelectMenu value={campusFilter} options={campusMenuOptions} onChange={(v) => { setCampusFilter(v); setDepartmentFilter('all') }} aria-label="Filter by campus" className="w-full sm:w-auto" />
          <DepartmentSelectMenu
            value={departmentFilter}
            departments={departments}
            campuses={campuses}
            campusFilter={campusFilter}
            onChange={setDepartmentFilter}
            className="w-full sm:w-auto"
          />
          <span className="text-[13px] font-semibold text-navy-700 whitespace-nowrap">
            {filtered.length} administrator{filtered.length === 1 ? '' : 's'}
          </span>
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder={config.searchPlaceholder} className="lg:w-80" />
      </div>

      {filtered.length > 0 ? (
        <CampusRoleTable
          people={filtered}
          campuses={campuses}
          detailColumnLabel="Department"
          onEdit={setEditAdmin}
          onDelete={(admin) => {
            setPeople((prev) => prev.filter((p) => p.id !== admin.id))
            notify(`${admin.name} removed.`, 'info')
          }}
        />
      ) : (
        <GlassCard className="p-10 text-center text-secondary-text text-[13.5px] font-medium">
          {config.emptyMessage}
        </GlassCard>
      )}

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        icon={<MailPlus size={18} />}
        title={config.inviteTitle}
        description={config.inviteDescription}
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleInvite} disabled={!inviteForm.departmentId}>Send Invite</Button>
          </>
        }
      >
        <FormField label="Full Name" value={inviteForm.name} onChange={(v) => setInviteForm({ ...inviteForm, name: v })} placeholder="e.g. Martha Bekele" />
        <FormField label="Email Address" value={inviteForm.email} onChange={(v) => setInviteForm({ ...inviteForm, email: v })} placeholder="e.g. m.bekele@berana.edu" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-navy-900">Campus</span>
            <select value={inviteForm.campusId} onChange={(e) => setInviteForm({ ...inviteForm, campusId: e.target.value, departmentId: '' })} className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25">
              {activeCampuses.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-navy-900">Department</span>
            <select value={inviteForm.departmentId} onChange={(e) => setInviteForm({ ...inviteForm, departmentId: e.target.value })} className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25">
              {inviteDepartments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>
        </div>
      </Modal>

      <AdminEditModal
        open={editAdmin !== null}
        admin={editAdmin}
        campuses={activeCampuses}
        departments={departments}
        onClose={() => setEditAdmin(null)}
        onSaved={(updated) => {
          setPeople((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
          notify(`${updated.name} updated successfully.`)
        }}
      />
    </div>
  )
}

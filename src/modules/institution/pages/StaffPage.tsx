import { useEffect, useMemo, useState } from 'react'
import { MailPlus, Plus, UserPlus } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { Modal } from '../../../shared/components/Modal'
import { FormField } from '../../../shared/components/FormField'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { usePeople } from '../hooks/usePeople'
import { withAdminVerification } from '../utils/peopleVerification'
import { useCampusContext } from '../context/CampusContext'
import { peoplePageConfigs } from '../data/peoplePageConfig'
import { DEFAULT_CAMPUS_ID } from '../data/orgSeedData'
import { STAFF_OFFICES } from '../data/staffOffices'
import { migrateStaffRecord } from '../api/peopleApi'
import { useSyncCampusFilter } from '../hooks/useSyncCampusFilter'
import { applyStaffHeadRules } from '../utils/staffHeadUtils'
import { StaffTable } from '../components/StaffTable'
import { StaffEditModal } from '../components/StaffEditModal'
import { StaffSubmitPersonModal } from '../components/StaffSubmitPersonModal'
import { OfficeLeadershipPanel } from '../components/OfficeLeadershipPanel'
import type { PersonRow } from '../types'

const config = peoplePageConfigs.Staff

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function StaffPage() {
  const { notify } = useToast()
  const { campuses, departments, activeCampuses, selectedCampusId } = useCampusContext()
  const { people, setPeople } = usePeople()
  const [query, setQuery] = useState('')
  const [campusFilter, setCampusFilter] = useState<string>('all')
  const [officeFilter, setOfficeFilter] = useState<string>('all')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [editStaff, setEditStaff] = useState<PersonRow | null>(null)
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    campusId: DEFAULT_CAMPUS_ID,
    office: STAFF_OFFICES[0],
    isDepartmentHead: false,
  })

  useEffect(() => {
    setPeople((prev) => prev.map((p) => migrateStaffRecord(p)))
  }, [setPeople])

  useSyncCampusFilter(selectedCampusId, setCampusFilter)

  const staff = useMemo(() => people.filter((p) => p.role === 'Staff'), [people])
  const students = useMemo(
    () => people.filter((p) => p.role === 'Student' && p.status !== 'suspended'),
    [people],
  )

  const filtered = useMemo(() => {
    return staff.filter((member) => {
      const matchesCampus = campusFilter === 'all' || member.campusId === campusFilter
      const matchesOffice = officeFilter === 'all' || member.department === officeFilter
      const q = query.trim().toLowerCase()
      const matchesQuery =
        q === '' ||
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        member.department.toLowerCase().includes(q)
      return matchesCampus && matchesOffice && matchesQuery
    })
  }, [staff, campusFilter, officeFilter, query])

  const stats = useMemo(() => config.getStats(people), [people])

  const campusMenuOptions = useMemo(
    () => [
      { value: 'all', label: 'All campuses' },
      ...activeCampuses.map((c) => ({ value: c.id, label: c.name, hint: c.code })),
    ],
    [activeCampuses],
  )

  const officeMenuOptions = useMemo(
    () => [{ value: 'all', label: 'All offices' }, ...STAFF_OFFICES.map((o) => ({ value: o, label: o }))],
    [],
  )

  const openInvite = () => {
    setInviteForm({
      name: '',
      email: '',
      campusId: campusFilter !== 'all' ? campusFilter : DEFAULT_CAMPUS_ID,
      office: STAFF_OFFICES[0],
      isDepartmentHead: false,
    })
    setInviteOpen(true)
  }

  const handleInvite = () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      notify('Please complete all required fields.', 'error')
      return
    }
    const newStaff = withAdminVerification({
      id: createId('user'),
      name: inviteForm.name.trim(),
      email: inviteForm.email.trim().toLowerCase(),
      role: 'Staff',
      department: inviteForm.office,
      campusId: inviteForm.campusId,
      isDepartmentHead: inviteForm.isDepartmentHead,
      status: 'invited',
      lastActive: 'Never',
      initials: initialsFromName(inviteForm.name),
    })
    setPeople((prev) => applyStaffHeadRules([newStaff, ...prev], newStaff))
    setInviteOpen(false)
    notify(`Staff invitation sent to ${newStaff.name}.`)
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        actions={
          <>
            <Button variant="secondary" onClick={() => setSubmitOpen(true)} disabled={students.length === 0}>
              <UserPlus size={15} />
              Submit for Verification
            </Button>
            <Button variant="primary" onClick={openInvite}>
              <Plus size={16} />
              {config.inviteLabel}
            </Button>
          </>
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

      <OfficeLeadershipPanel staff={staff} campuses={campuses} campusFilter={campusFilter} />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <SelectMenu
            value={campusFilter}
            options={campusMenuOptions}
            onChange={setCampusFilter}
            aria-label="Filter by campus"
            className="w-full sm:w-auto"
          />
          <SelectMenu
            value={officeFilter}
            options={officeMenuOptions}
            onChange={setOfficeFilter}
            aria-label="Filter by office"
            className="w-full sm:w-auto"
          />
          <span className="text-[13px] font-semibold text-navy-700 whitespace-nowrap">
            {filtered.length} staff member{filtered.length === 1 ? '' : 's'}
          </span>
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder={config.searchPlaceholder} className="lg:w-80" />
      </div>

      {filtered.length > 0 ? (
        <StaffTable
          staff={filtered}
          campuses={campuses}
          onEdit={setEditStaff}
          onDelete={(member) => {
            setPeople((prev) => prev.filter((p) => p.id !== member.id))
            notify(`${member.name} removed.`, 'info')
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
            <Button variant="primary" onClick={handleInvite}>Send Invite</Button>
          </>
        }
      >
        <FormField label="Full Name" value={inviteForm.name} onChange={(v) => setInviteForm({ ...inviteForm, name: v })} placeholder="e.g. Kidist Yohannes" />
        <FormField label="Email Address" value={inviteForm.email} onChange={(v) => setInviteForm({ ...inviteForm, email: v })} placeholder="e.g. k.yohannes@berana.edu" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-navy-900">Campus</span>
            <select value={inviteForm.campusId} onChange={(e) => setInviteForm({ ...inviteForm, campusId: e.target.value })} className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25">
              {activeCampuses.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </label>
          <FormField label="Office" type="select" value={inviteForm.office} options={STAFF_OFFICES} onChange={(v) => setInviteForm({ ...inviteForm, office: v })} />
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={inviteForm.isDepartmentHead}
            onChange={(e) => setInviteForm({ ...inviteForm, isDepartmentHead: e.target.checked })}
            className="w-4 h-4 rounded border-divider text-lemon-500 focus:ring-lemon-500/25"
          />
          <span className="text-[13px] font-semibold text-navy-900">Department head</span>
        </label>
      </Modal>

      <StaffEditModal
        open={editStaff !== null}
        staff={editStaff}
        campuses={activeCampuses}
        onClose={() => setEditStaff(null)}
        onSaved={(updated) => {
          setPeople((prev) => applyStaffHeadRules(prev.map((p) => (p.id === updated.id ? updated : p)), updated))
          notify(`${updated.name} updated successfully.`)
        }}
      />

      <StaffSubmitPersonModal
        open={submitOpen}
        campuses={activeCampuses}
        departments={departments}
        students={students}
        submittedByName="Kidist Yohannes"
        onClose={() => setSubmitOpen(false)}
        onSubmit={(person) => {
          setPeople((prev) => [person, ...prev])
          notify(`${person.name} submitted for admin verification.`)
        }}
      />
    </div>
  )
}

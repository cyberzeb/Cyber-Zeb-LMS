import { useMemo, useState } from 'react'
import { Landmark, MailPlus, Pencil, Plus, Shield, Users, Wallet } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { Modal } from '../../../shared/components/Modal'
import { FormField } from '../../../shared/components/FormField'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { useSyncCampusFilter } from '../hooks/useSyncCampusFilter'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useOrganizationConfig } from '../../../shared/config/useOrganizationConfig'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { ROLE_LABELS } from '../../../shared/auth/portalRoutes'
import { usePeople } from '../hooks/usePeople'
import { withAdminVerification } from '../utils/peopleVerification'
import { useCampusContext } from '../context/CampusContext'
import { DEFAULT_CAMPUS_ID } from '../data/orgSeedData'
import { CampusRoleTable } from '../components/CampusRoleTable'
import type { PersonRole, PersonRow } from '../types'

type OfficeRole = Extract<PersonRole, 'Admin' | 'Registrar' | 'FinanceOfficer'>

/** What each office role is for, shown in the form so the choice is clear. */
const OFFICE_ROLES: { role: OfficeRole; office: string; summary: string }[] = [
  {
    role: 'Admin',
    office: 'Institution Administration',
    summary: 'Full control: settings, structure, every user and every module.',
  },
  {
    role: 'Registrar',
    office: 'Registrar Office',
    summary:
      'Academic calendar, departments, programs, courses, offerings, enrolment, student records and transcripts.',
  },
  {
    role: 'FinanceOfficer',
    office: 'Finance Office',
    summary: 'Tuition and fee invoices, payments and the finance dashboard.',
  },
]

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

interface OfficeForm {
  id?: string
  name: string
  email: string
  campusId: string
  role: OfficeRole
  office: string
  status: PersonRow['status']
}

export function AdministratorsPage() {
  const { notify } = useToast()
  const { edition } = useOrganizationConfig()
  // University institutions have three office roles; other editions have admins only.
  const isUniversity = edition === 'university'
  const roles = useMemo(() => (isUniversity ? OFFICE_ROLES : OFFICE_ROLES.slice(0, 1)), [isUniversity])
  const roleSet = useMemo(() => new Set<string>(roles.map((r) => r.role)), [roles])

  const { campuses, activeCampuses, selectedCampusId } = useCampusContext()
  const { people, setPeople } = usePeople()
  const [query, setQuery] = useState('')
  const [campusFilter, setCampusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<OfficeForm | null>(null)

  useSyncCampusFilter(selectedCampusId, setCampusFilter)

  const officeStaff = useMemo(() => people.filter((p) => roleSet.has(p.role)), [people, roleSet])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return officeStaff.filter((p) => {
      if (campusFilter !== 'all' && p.campusId !== campusFilter) return false
      if (roleFilter !== 'all' && p.role !== roleFilter) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q)
      )
    })
  }, [officeStaff, campusFilter, roleFilter, query])

  const count = (role: OfficeRole) => officeStaff.filter((p) => p.role === role).length

  const campusMenuOptions = useMemo(
    () => [
      { value: 'all', label: 'All campuses' },
      ...activeCampuses.map((c) => ({ value: c.id, label: c.name, hint: c.code })),
    ],
    [activeCampuses],
  )

  const roleMenuOptions = useMemo(
    () => [
      { value: 'all', label: 'All roles' },
      ...roles.map((r) => ({ value: r.role, label: ROLE_LABELS[r.role] })),
    ],
    [roles],
  )

  const openCreate = (role: OfficeRole = 'Admin') => {
    setForm({
      name: '',
      email: '',
      campusId: campusFilter !== 'all' ? campusFilter : activeCampuses[0]?.id ?? DEFAULT_CAMPUS_ID,
      role,
      office: OFFICE_ROLES.find((r) => r.role === role)?.office ?? '',
      status: 'invited',
    })
    setModalOpen(true)
  }

  const openEdit = (person: PersonRow) => {
    setForm({
      id: person.id,
      name: person.name,
      email: person.email,
      campusId: person.campusId ?? DEFAULT_CAMPUS_ID,
      role: person.role as OfficeRole,
      office: person.department,
      status: person.status,
    })
    setModalOpen(true)
  }

  const changeRole = (role: OfficeRole) => {
    if (!form) return
    const previousDefault = OFFICE_ROLES.find((r) => r.role === form.role)?.office
    const nextDefault = OFFICE_ROLES.find((r) => r.role === role)?.office ?? ''
    // Keep a custom office name; swap the default one.
    const office = !form.office || form.office === previousDefault ? nextDefault : form.office
    setForm({ ...form, role, office })
  }

  const handleSave = () => {
    if (!form) return
    const name = form.name.trim()
    const email = form.email.trim().toLowerCase()
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      notify('Please enter a name and a valid email address.', 'error')
      return
    }
    if (people.some((p) => p.email.toLowerCase() === email && p.id !== form.id)) {
      notify('Another account already uses this email.', 'error')
      return
    }
    const office = form.office.trim() || OFFICE_ROLES.find((r) => r.role === form.role)?.office || '—'
    if (form.id) {
      const id = form.id
      setPeople((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                name,
                email,
                role: form.role,
                department: office,
                campusId: form.campusId,
                status: form.status,
                initials: initialsFromName(name),
              }
            : p,
        ),
      )
      notify(`${name} updated.`)
    } else {
      const created = withAdminVerification({
        id: createId('user'),
        name,
        email,
        role: form.role,
        department: office,
        campusId: form.campusId,
        status: 'invited',
        lastActive: 'Never',
        initials: initialsFromName(name),
      })
      setPeople((prev) => [created, ...prev])
      notify(`${ROLE_LABELS[form.role]} invitation sent to ${name}.`)
    }
    setModalOpen(false)
  }

  const handleDelete = (person: PersonRow) => {
    if (person.role === 'Admin' && count('Admin') <= 1) {
      notify('Keep at least one institution admin.', 'error')
      return
    }
    setPeople((prev) => prev.filter((p) => p.id !== person.id))
    notify(`${person.name} removed.`, 'info')
  }

  const selectedRole = form ? OFFICE_ROLES.find((r) => r.role === form.role) : undefined

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Administrators"
        subtitle={
          isUniversity
            ? 'Office accounts that use the admin portal. Each role sees only the pages of its own office.'
            : 'Institution admin accounts with full access to settings, users and reports.'
        }
        actions={
          <Button variant="primary" onClick={() => openCreate()}>
            <Plus size={16} />
            Add Account
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatBlock label="Institution Admins" value={count('Admin')} icon={<Shield size={17} />} />
        {isUniversity ? (
          <>
            <StatBlock label="Registrars" value={count('Registrar')} icon={<Landmark size={17} />} />
            <StatBlock label="Finance Officers" value={count('FinanceOfficer')} icon={<Wallet size={17} />} />
          </>
        ) : null}
        <StatBlock
          label="Pending Invites"
          value={officeStaff.filter((p) => p.status === 'invited').length}
          sub="Awaiting activation"
          icon={<MailPlus size={17} />}
        />
        {!isUniversity ? (
          <StatBlock
            label="Active"
            value={officeStaff.filter((p) => p.status === 'active').length}
            icon={<Users size={17} />}
          />
        ) : null}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <SelectMenu
            value={campusFilter}
            options={campusMenuOptions}
            onChange={setCampusFilter}
            aria-label="Filter by campus"
            className="w-full sm:w-auto"
          />
          {isUniversity ? (
            <SelectMenu
              value={roleFilter}
              options={roleMenuOptions}
              onChange={setRoleFilter}
              aria-label="Filter by role"
              className="w-full sm:w-auto"
            />
          ) : null}
          <span className="text-[13px] font-semibold text-navy-700 whitespace-nowrap">
            {filtered.length} account{filtered.length === 1 ? '' : 's'}
          </span>
        </div>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search by name, email or office..."
          className="lg:w-80"
        />
      </div>

      {filtered.length > 0 ? (
        <CampusRoleTable
          people={filtered}
          campuses={campuses}
          detailColumnLabel={isUniversity ? 'Role · Office' : 'Department'}
          detail={
            isUniversity
              ? (p) => (
                  <span>
                    <span className="font-semibold text-navy-900">{ROLE_LABELS[p.role]}</span>
                    <span className="text-secondary-text"> · {p.department}</span>
                  </span>
                )
              : undefined
          }
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      ) : (
        <GlassCard className="p-10 text-center text-secondary-text text-[13.5px] font-medium">
          No accounts match your filters.
        </GlassCard>
      )}

      <Modal
        open={modalOpen && form !== null}
        onClose={() => setModalOpen(false)}
        icon={form?.id ? <Pencil size={18} /> : <MailPlus size={18} />}
        title={form?.id ? 'Edit Account' : 'Add Account'}
        description={selectedRole?.summary}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {form?.id ? 'Save Changes' : 'Send Invite'}
            </Button>
          </>
        }
      >
        {form ? (
          <>
            {isUniversity ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-navy-900">Role</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {OFFICE_ROLES.map((r) => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => changeRole(r.role)}
                      className={`rounded-lg border px-3 py-2 text-[12.5px] font-semibold text-left transition-colors cursor-pointer ${
                        form.role === r.role
                          ? 'border-lemon-500 bg-lemon-50 text-navy-900'
                          : 'border-divider text-secondary-text hover:bg-navy-50/60'
                      }`}
                    >
                      {ROLE_LABELS[r.role]}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <FormField
              label="Full Name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="e.g. Getachew Nega"
            />
            <FormField
              label="Email Address"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder="e.g. g.nega@berana.edu"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-navy-900">Campus</span>
                <select
                  value={form.campusId}
                  onChange={(e) => setForm({ ...form, campusId: e.target.value })}
                  className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25"
                >
                  {activeCampuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </label>
              <FormField
                label="Office"
                value={form.office}
                onChange={(v) => setForm({ ...form, office: v })}
                placeholder="e.g. Registrar Office"
              />
            </div>
            {form.id ? (
              <FormField
                label="Status"
                type="select"
                value={form.status}
                options={['active', 'invited', 'suspended']}
                onChange={(v) => setForm({ ...form, status: v as PersonRow['status'] })}
              />
            ) : null}
          </>
        ) : null}
      </Modal>
    </div>
  )
}

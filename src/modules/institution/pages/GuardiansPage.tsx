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
import { useSyncCampusFilter } from '../hooks/useSyncCampusFilter'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { usePeople } from '../hooks/usePeople'
import { withAdminVerification } from '../utils/peopleVerification'
import { useCampusContext } from '../context/CampusContext'
import { peoplePageConfigs } from '../data/peoplePageConfig'
import { migrateGuardianRecord } from '../api/peopleApi'
import { CampusRoleTable } from '../components/CampusRoleTable'
import { GuardianEditModal } from '../components/GuardianEditModal'
import type { PersonRow } from '../types'

const config = peoplePageConfigs.Guardian

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function GuardiansPage() {
  const { notify } = useToast()
  const { campuses, activeCampuses, selectedCampusId } = useCampusContext()
  const { people, setPeople } = usePeople()
  const [query, setQuery] = useState('')
  const [campusFilter, setCampusFilter] = useState<string>('all')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editGuardian, setEditGuardian] = useState<PersonRow | null>(null)
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    linkedStudentId: '',
  })

  useEffect(() => {
    setPeople((prev) => prev.map((p) => migrateGuardianRecord(p, prev)))
  }, [setPeople])

  useSyncCampusFilter(selectedCampusId, setCampusFilter)

  const students = useMemo(
    () => people.filter((p) => p.role === 'Student' && p.status !== 'suspended'),
    [people],
  )

  const guardians = useMemo(() => people.filter((p) => p.role === 'Guardian'), [people])

  const filtered = useMemo(() => {
    return guardians.filter((guardian) => {
      const matchesCampus = campusFilter === 'all' || guardian.campusId === campusFilter
      const q = query.trim().toLowerCase()
      const matchesQuery =
        q === '' ||
        guardian.name.toLowerCase().includes(q) ||
        guardian.email.toLowerCase().includes(q) ||
        guardian.department.toLowerCase().includes(q)
      return matchesCampus && matchesQuery
    })
  }, [guardians, campusFilter, query])

  const stats = useMemo(() => config.getStats(people), [people])

  const campusMenuOptions = useMemo(
    () => [
      { value: 'all', label: 'All campuses' },
      ...activeCampuses.map((c) => ({ value: c.id, label: c.name, hint: c.code })),
    ],
    [activeCampuses],
  )

  useEffect(() => {
    if (!students.some((s) => s.id === inviteForm.linkedStudentId)) {
      setInviteForm((prev) => ({ ...prev, linkedStudentId: students[0]?.id ?? '' }))
    }
  }, [students, inviteForm.linkedStudentId])

  const openInvite = () => {
    setInviteForm({ name: '', email: '', linkedStudentId: students[0]?.id ?? '' })
    setInviteOpen(true)
  }

  const handleInvite = () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim() || !inviteForm.linkedStudentId) {
      notify('Please complete all required fields.', 'error')
      return
    }
    const student = students.find((s) => s.id === inviteForm.linkedStudentId)
    if (!student) return

    const newGuardian = withAdminVerification({
      id: createId('user'),
      name: inviteForm.name.trim(),
      email: inviteForm.email.trim().toLowerCase(),
      role: 'Guardian',
      department: student.name,
      campusId: student.campusId,
      status: 'invited',
      lastActive: 'Never',
      initials: initialsFromName(inviteForm.name),
    })
    setPeople((prev) => [newGuardian, ...prev])
    setInviteOpen(false)
    notify(`Guardian invitation sent to ${newGuardian.name}.`)
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        actions={
          <Button variant="primary" onClick={openInvite} disabled={students.length === 0}>
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
          <SelectMenu
            value={campusFilter}
            options={campusMenuOptions}
            onChange={setCampusFilter}
            aria-label="Filter by campus"
            className="w-full sm:w-auto"
          />
          <span className="text-[13px] font-semibold text-navy-700 whitespace-nowrap">
            {filtered.length} guardian{filtered.length === 1 ? '' : 's'}
          </span>
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder={config.searchPlaceholder} className="lg:w-80" />
      </div>

      {filtered.length > 0 ? (
        <CampusRoleTable
          people={filtered}
          campuses={campuses}
          detailColumnLabel="Linked Student"
          onEdit={setEditGuardian}
          onDelete={(guardian) => {
            setPeople((prev) => prev.filter((p) => p.id !== guardian.id))
            notify(`${guardian.name} removed.`, 'info')
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
            <Button variant="primary" onClick={handleInvite} disabled={!inviteForm.linkedStudentId}>Send Invite</Button>
          </>
        }
      >
        <FormField label="Full Name" value={inviteForm.name} onChange={(v) => setInviteForm({ ...inviteForm, name: v })} placeholder="e.g. Yonas Tadesse" />
        <FormField label="Email Address" value={inviteForm.email} onChange={(v) => setInviteForm({ ...inviteForm, email: v })} placeholder="e.g. yonas.t@gmail.com" />
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Linked Student</span>
          <select
            value={inviteForm.linkedStudentId}
            onChange={(e) => setInviteForm({ ...inviteForm, linkedStudentId: e.target.value })}
            className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name} · {s.department}</option>
            ))}
          </select>
        </label>
      </Modal>

      <GuardianEditModal
        open={editGuardian !== null}
        guardian={editGuardian}
        students={students}
        onClose={() => setEditGuardian(null)}
        onSaved={(updated) => {
          setPeople((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
          notify(`${updated.name} updated successfully.`)
        }}
      />
    </div>
  )
}

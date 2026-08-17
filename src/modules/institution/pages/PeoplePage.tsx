import { useMemo, useState } from 'react'
import { MailPlus, Plus, Upload } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { SearchInput } from '../../../shared/components/SearchInput'
import { Modal } from '../../../shared/components/Modal'
import { FormField } from '../../../shared/components/FormField'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { usePeople } from '../hooks/usePeople'
import { withAdminVerification } from '../utils/peopleVerification'
import { PeopleTable } from '../components/PeopleTable'
import {
  allPeopleTabs,
  departmentOptions,
  peoplePageConfigs,
  roleOptions,
  tabToRole,
  type PeoplePageFocus,
} from '../data/peoplePageConfig'
import type { PersonRole, PersonRow } from '../types'

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

interface PeoplePageProps {
  focus?: PeoplePageFocus
}

export function PeoplePage({ focus = 'all' }: PeoplePageProps) {
  const config = peoplePageConfigs[focus]
  const { notify } = useToast()
  const { people, setPeople } = usePeople()
  const [activeTab, setActiveTab] = useState('All')
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: config.defaultRole,
    department: departmentOptions[0],
  })

  const filtered = useMemo(() => {
    return people.filter((p) => {
      const matchesFocus = focus === 'all' || p.role === focus
      const matchesTab =
        !config.showRoleTabs || activeTab === 'All' || p.role === tabToRole[activeTab]
      const q = query.trim().toLowerCase()
      const matchesQuery =
        q === '' ||
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q)
      return matchesFocus && matchesTab && matchesQuery
    })
  }, [people, focus, config.showRoleTabs, activeTab, query])

  const stats = useMemo(() => config.getStats(people), [config, people])

  const openModal = () => {
    setForm({
      name: '',
      email: '',
      role: config.defaultRole,
      department: focus === 'Guardian' ? '—' : departmentOptions[0],
    })
    setModalOpen(true)
  }

  const handleInvite = () => {
    if (!form.name.trim() || !form.email.trim()) {
      notify('Please provide a name and email.', 'error')
      return
    }
    const newPerson = withAdminVerification({
      id: createId('user'),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      department: form.department,
      status: 'invited',
      lastActive: 'Never',
      initials: initialsFromName(form.name),
    })
    setPeople((prev) => [newPerson, ...prev])
    setModalOpen(false)
    notify(`Invitation sent to ${newPerson.name}.`)
  }

  const handleDelete = (person: PersonRow) => {
    setPeople((prev) => prev.filter((p) => p.id !== person.id))
    notify(`${person.name} removed.`, 'info')
  }

  const departmentLabel =
    focus === 'Staff' ? 'Office / Department' : focus === 'Guardian' ? 'Linked Student' : 'Department'

  const departmentFieldOptions =
    focus === 'Guardian'
      ? ['—', 'Selam Girma', 'Hanna Wolde', 'Bruk Alemu', 'Dawit Mekonnen']
      : focus === 'Staff'
        ? departmentOptions.filter((d) => d !== '—')
        : departmentOptions.filter((d) => d !== '—')

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        actions={
          <>
            <Button variant="secondary" onClick={() => notify('Bulk CSV import unlocks with the backend.', 'info')}>
              <Upload size={15} />
              Import CSV
            </Button>
            <Button variant="primary" onClick={openModal}>
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {config.showRoleTabs ? (
          <FilterTabs tabs={allPeopleTabs} active={activeTab} onChange={setActiveTab} />
        ) : (
          <div className="text-[13px] font-semibold text-navy-700">
            Showing {filtered.length} {config.title.toLowerCase()}
          </div>
        )}
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={config.searchPlaceholder}
          className="md:w-80"
        />
      </div>

      {filtered.length > 0 ? (
        <PeopleTable
          people={filtered}
          hideRoleColumn={config.hideRoleColumn}
          departmentLabel={departmentLabel}
          onSelect={(p) => notify(`${p.name}'s profile view is coming soon.`, 'info')}
          onDelete={handleDelete}
        />
      ) : (
        <GlassCard className="p-10 text-center text-secondary-text text-[13.5px] font-medium">
          {config.emptyMessage}
        </GlassCard>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        icon={<MailPlus size={18} />}
        title={config.inviteTitle}
        description={config.inviteDescription}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleInvite}>
              Send Invite
            </Button>
          </>
        }
      >
        <FormField
          label="Full Name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          placeholder="e.g. Selam Girma"
        />
        <FormField
          label="Email Address"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          placeholder="e.g. selam.girma@berana.edu"
        />
        <div className={`grid gap-4 ${config.lockRole ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {!config.lockRole && (
            <FormField
              label="Role"
              type="select"
              value={form.role}
              options={roleOptions}
              onChange={(v) => setForm({ ...form, role: v as PersonRole })}
            />
          )}
          <FormField
            label={departmentLabel}
            type="select"
            value={form.department}
            options={departmentFieldOptions}
            onChange={(v) => setForm({ ...form, department: v })}
          />
        </div>
      </Modal>
    </div>
  )
}

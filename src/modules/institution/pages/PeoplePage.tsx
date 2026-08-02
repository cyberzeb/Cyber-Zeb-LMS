import { useMemo, useState } from 'react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { SearchInput } from '../../../shared/components/SearchInput'
import { Modal } from '../../../shared/components/Modal'
import { FormField } from '../../../shared/components/FormField'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useLocalStorageState, createId } from '../../../shared/hooks/useLocalStorageState'
import { PeopleTable } from '../components/PeopleTable'
import type { PersonRole, PersonRow } from '../types'

const seedPeople: PersonRow[] = [
  {
    id: 'u1',
    name: 'Selam Girma',
    email: 'selam.girma@berana.edu',
    role: 'Student',
    department: 'Computer Science & IT',
    status: 'active',
    lastActive: '2 hours ago',
    initials: 'SG',
  },
  {
    id: 'u2',
    name: 'Dr. Aaron Selassie',
    email: 'a.selassie@berana.edu',
    role: 'Instructor',
    department: 'Computer Science & IT',
    status: 'active',
    lastActive: '10 min ago',
    initials: 'AS',
  },
  {
    id: 'u3',
    name: 'Martha Bekele',
    email: 'm.bekele@berana.edu',
    role: 'Admin',
    department: 'Business Administration',
    status: 'active',
    lastActive: '1 day ago',
    initials: 'MB',
  },
  {
    id: 'u4',
    name: 'Yonas Tadesse',
    email: 'yonas.t@gmail.com',
    role: 'Parent',
    department: '—',
    status: 'active',
    lastActive: '3 days ago',
    initials: 'YT',
  },
  {
    id: 'u5',
    name: 'Hanna Wolde',
    email: 'hanna.wolde@berana.edu',
    role: 'Student',
    department: 'Engineering & Technology',
    status: 'invited',
    lastActive: 'Never',
    initials: 'HW',
  },
  {
    id: 'u6',
    name: 'Prof. Elias Hailu',
    email: 'e.hailu@berana.edu',
    role: 'Instructor',
    department: 'Engineering & Technology',
    status: 'active',
    lastActive: '5 hours ago',
    initials: 'EH',
  },
  {
    id: 'u7',
    name: 'Kidist Yohannes',
    email: 'k.yohannes@berana.edu',
    role: 'Staff',
    department: 'Registrar Office',
    status: 'active',
    lastActive: 'Yesterday',
    initials: 'KY',
  },
  {
    id: 'u8',
    name: 'Dawit Mekonnen',
    email: 'dawit.m@berana.edu',
    role: 'Student',
    department: 'Business Administration',
    status: 'suspended',
    lastActive: '2 weeks ago',
    initials: 'DM',
  },
  {
    id: 'u9',
    name: 'Tigist Assefa',
    email: 't.assefa@berana.edu',
    role: 'Instructor',
    department: 'Social Sciences',
    status: 'invited',
    lastActive: 'Never',
    initials: 'TA',
  },
  {
    id: 'u10',
    name: 'Bruk Alemu',
    email: 'bruk.alemu@berana.edu',
    role: 'Student',
    department: 'Computer Science & IT',
    status: 'active',
    lastActive: '30 min ago',
    initials: 'BA',
  },
]

const tabs = ['All', 'Students', 'Instructors', 'Admins', 'Parents', 'Staff']

const tabToRole: Record<string, PersonRow['role']> = {
  Students: 'Student',
  Instructors: 'Instructor',
  Admins: 'Admin',
  Parents: 'Parent',
  Staff: 'Staff',
}

const roleOptions: PersonRole[] = ['Student', 'Instructor', 'Admin', 'Parent', 'Staff']
const departmentOptions = [
  'Computer Science & IT',
  'Business Administration',
  'Engineering & Technology',
  'Social Sciences',
  'Registrar Office',
  '—',
]

const emptyForm = {
  name: '',
  email: '',
  role: 'Student' as PersonRole,
  department: departmentOptions[0],
}

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function PeoplePage() {
  const { notify } = useToast()
  const [people, setPeople] = useLocalStorageState<PersonRow[]>('berana:people', seedPeople)
  const [activeTab, setActiveTab] = useState('All')
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(() => {
    return people.filter((p) => {
      const matchesTab = activeTab === 'All' || p.role === tabToRole[activeTab]
      const q = query.trim().toLowerCase()
      const matchesQuery =
        q === '' ||
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q)
      return matchesTab && matchesQuery
    })
  }, [people, activeTab, query])

  const totals = useMemo(() => {
    const students = people.filter((p) => p.role === 'Student').length
    const instructors = people.filter((p) => p.role === 'Instructor').length
    const pending = people.filter((p) => p.status === 'invited').length
    return { total: people.length, students, instructors, pending }
  }, [people])

  const openModal = () => {
    setForm(emptyForm)
    setModalOpen(true)
  }

  const handleInvite = () => {
    if (!form.name.trim() || !form.email.trim()) {
      notify('Please provide a name and email.', 'error')
      return
    }
    const newPerson: PersonRow = {
      id: createId('user'),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      department: form.department,
      status: 'invited',
      lastActive: 'Never',
      initials: initialsFromName(form.name),
    }
    setPeople((prev) => [newPerson, ...prev])
    setModalOpen(false)
    notify(`Invitation sent to ${newPerson.name}.`)
  }

  const handleDelete = (person: PersonRow) => {
    setPeople((prev) => prev.filter((p) => p.id !== person.id))
    notify(`${person.name} removed.`, 'info')
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="People & Users"
        subtitle="Invite, import and manage every user account, role and access status in your institution."
        actions={
          <>
            <Button variant="secondary" onClick={() => notify('Bulk CSV import unlocks with the backend.', 'info')}>
              Import CSV
            </Button>
            <Button variant="primary" onClick={openModal}>
              + Invite User
            </Button>
          </>
        }
      />

      <GlassCard className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-divider/40">
        <StatBlock label="Total Users" value={totals.total.toLocaleString()} icon="👥" />
        <StatBlock label="Students" value={totals.students} icon="🎓" iconBg="bg-info-bg" />
        <StatBlock label="Instructors" value={totals.instructors} icon="🧑‍🏫" />
        <StatBlock
          label="Pending Invites"
          value={totals.pending}
          sub="Awaiting activation"
          icon="✉️"
          iconBg="bg-warning-bg"
        />
      </GlassCard>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search by name, email, department..."
          className="md:w-80"
        />
      </div>

      {filtered.length > 0 ? (
        <PeopleTable
          people={filtered}
          onSelect={(p) => notify(`${p.name}'s profile view is coming soon.`, 'info')}
          onDelete={handleDelete}
        />
      ) : (
        <GlassCard className="p-10 text-center text-secondary-text text-[13.5px] font-medium">
          No people match your filters.
        </GlassCard>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        icon="✉️"
        title="Invite User"
        description="Send an invitation. The user stays pending until they activate."
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Role"
            type="select"
            value={form.role}
            options={roleOptions}
            onChange={(v) => setForm({ ...form, role: v as PersonRole })}
          />
          <FormField
            label="Department"
            type="select"
            value={form.department}
            options={departmentOptions}
            onChange={(v) => setForm({ ...form, department: v })}
          />
        </div>
      </Modal>
    </div>
  )
}

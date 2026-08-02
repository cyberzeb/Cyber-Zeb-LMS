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
import { ProgramsTable } from '../components/ProgramsTable'
import type { ProgramLevel, ProgramRow } from '../types'

const seedPrograms: ProgramRow[] = [
  {
    id: 'p1',
    code: 'BSC-SE',
    name: 'Software Engineering',
    level: 'Undergraduate',
    department: 'Computer Science & IT',
    duration: '4 Years',
    enrolledCount: 350,
    courseCount: 42,
    status: 'active',
  },
  {
    id: 'p2',
    code: 'MSC-DS',
    name: 'Data Science & AI',
    level: 'Postgraduate',
    department: 'Computer Science & IT',
    duration: '2 Years',
    enrolledCount: 85,
    courseCount: 18,
    status: 'active',
  },
  {
    id: 'p3',
    code: 'BA-IB',
    name: 'International Business',
    level: 'Undergraduate',
    department: 'Business Administration',
    duration: '3 Years',
    enrolledCount: 240,
    courseCount: 30,
    status: 'active',
  },
  {
    id: 'p4',
    code: 'PHD-CS',
    name: 'Computer Science',
    level: 'Doctoral',
    department: 'Computer Science & IT',
    duration: '3–5 Years',
    enrolledCount: 15,
    courseCount: 8,
    status: 'active',
  },
  {
    id: 'p5',
    code: 'BSC-CE',
    name: 'Civil Engineering',
    level: 'Undergraduate',
    department: 'Engineering & Technology',
    duration: '5 Years',
    enrolledCount: 180,
    courseCount: 46,
    status: 'active',
  },
  {
    id: 'p6',
    code: 'CERT-CYB',
    name: 'Cybersecurity Essentials',
    level: 'Certificate',
    department: 'Computer Science & IT',
    duration: '6 Months',
    enrolledCount: 128,
    courseCount: 6,
    status: 'active',
  },
  {
    id: 'p7',
    code: 'MBA',
    name: 'Master of Business Administration',
    level: 'Postgraduate',
    department: 'Business Administration',
    duration: '2 Years',
    enrolledCount: 62,
    courseCount: 16,
    status: 'draft',
  },
  {
    id: 'p8',
    code: 'CERT-DM',
    name: 'Digital Marketing',
    level: 'Certificate',
    department: 'Business Administration',
    duration: '4 Months',
    enrolledCount: 0,
    courseCount: 5,
    status: 'draft',
  },
  {
    id: 'p9',
    code: 'BA-SOC',
    name: 'Sociology',
    level: 'Undergraduate',
    department: 'Social Sciences',
    duration: '3 Years',
    enrolledCount: 96,
    courseCount: 24,
    status: 'archived',
  },
]

const tabs = ['All', 'Undergraduate', 'Postgraduate', 'Doctoral', 'Certificate']
const levelOptions: ProgramLevel[] = [
  'Undergraduate',
  'Postgraduate',
  'Doctoral',
  'Certificate',
]
const departmentOptions = [
  'Computer Science & IT',
  'Business Administration',
  'Engineering & Technology',
  'Social Sciences',
  'Health & Life Sciences',
  'Arts & Humanities',
]

const emptyForm = {
  name: '',
  code: '',
  level: 'Undergraduate' as ProgramLevel,
  department: departmentOptions[0],
  duration: '4 Years',
}

export function ProgramsPage() {
  const { notify } = useToast()
  const [programs, setPrograms] = useLocalStorageState<ProgramRow[]>(
    'berana:programs',
    seedPrograms,
  )
  const [activeTab, setActiveTab] = useState('All')
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(() => {
    return programs.filter((p) => {
      const matchesTab = activeTab === 'All' || p.level === activeTab
      const matchesQuery =
        query.trim() === '' ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.code.toLowerCase().includes(query.toLowerCase()) ||
        p.department.toLowerCase().includes(query.toLowerCase())
      return matchesTab && matchesQuery
    })
  }, [programs, activeTab, query])

  const totals = useMemo(() => {
    const active = programs.filter((p) => p.status === 'active').length
    const enrolled = programs.reduce((sum, p) => sum + p.enrolledCount, 0)
    const courses = programs.reduce((sum, p) => sum + p.courseCount, 0)
    return { total: programs.length, active, enrolled, courses }
  }, [programs])

  const openModal = () => {
    setForm(emptyForm)
    setModalOpen(true)
  }

  const handleCreate = () => {
    if (!form.name.trim() || !form.code.trim()) {
      notify('Please provide a program name and code.', 'error')
      return
    }
    const newProgram: ProgramRow = {
      id: createId('prog'),
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      level: form.level,
      department: form.department,
      duration: form.duration.trim() || '—',
      enrolledCount: 0,
      courseCount: 0,
      status: 'draft',
    }
    setPrograms((prev) => [newProgram, ...prev])
    setModalOpen(false)
    notify(`Program “${newProgram.name}” created.`)
  }

  const handleDelete = (program: ProgramRow) => {
    setPrograms((prev) => prev.filter((p) => p.id !== program.id))
    notify(`Program “${program.name}” deleted.`, 'info')
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Academic Programs"
        subtitle="Manage degree programs, certificates and their curricula across all departments."
        actions={
          <>
            <Button variant="secondary" onClick={() => notify('CSV import runs once the backend is connected.', 'info')}>
              Import Programs
            </Button>
            <Button variant="primary" onClick={openModal}>
              + Add Program
            </Button>
          </>
        }
      />

      <GlassCard className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-divider/40">
        <StatBlock label="Total Programs" value={totals.total} icon="🎓" />
        <StatBlock label="Active" value={totals.active} sub="Currently enrolling" icon="✅" />
        <StatBlock
          label="Students Enrolled"
          value={totals.enrolled.toLocaleString()}
          icon="👥"
          iconBg="bg-info-bg"
        />
        <StatBlock label="Linked Courses" value={totals.courses} icon="📚" iconBg="bg-warning-bg" />
      </GlassCard>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search programs, codes, departments..."
          className="md:w-80"
        />
      </div>

      {filtered.length > 0 ? (
        <ProgramsTable
          programs={filtered}
          onManage={(p) => notify(`Opening “${p.name}” — detail view is next on the roadmap.`, 'info')}
          onDelete={handleDelete}
        />
      ) : (
        <GlassCard className="p-10 text-center text-secondary-text text-[13.5px] font-medium">
          No programs match your filters.
        </GlassCard>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        icon="🎓"
        title="Add Program"
        description="Create a new academic program. It starts as a draft."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Create Program
            </Button>
          </>
        }
      >
        <FormField
          label="Program Name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          placeholder="e.g. Software Engineering"
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Program Code"
            value={form.code}
            onChange={(v) => setForm({ ...form, code: v })}
            placeholder="e.g. BSC-SE"
          />
          <FormField
            label="Duration"
            value={form.duration}
            onChange={(v) => setForm({ ...form, duration: v })}
            placeholder="e.g. 4 Years"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Level"
            type="select"
            value={form.level}
            options={levelOptions}
            onChange={(v) => setForm({ ...form, level: v as ProgramLevel })}
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

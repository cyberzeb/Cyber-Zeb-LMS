import { useMemo, useState } from 'react'
import { Building2, Users, Briefcase, Plus, UserCog } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { Modal } from '../../../shared/components/Modal'
import { FormField } from '../../../shared/components/FormField'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useLocalStorageState, createId } from '../../../shared/hooks/useLocalStorageState'
import { DepartmentCard } from '../components/DepartmentCard'
import type { Department } from '../types'

const STAT = 17

const seedDepartments: Department[] = [
  {
    id: 'd1',
    name: 'Computer Science & IT',
    headName: 'Dr. Aaron Selassie',
    studentsCount: 840,
    facultyCount: 42,
    icon: '💻',
  },
  {
    id: 'd2',
    name: 'Business Administration',
    headName: 'Dr. Martha Bekele',
    studentsCount: 620,
    facultyCount: 35,
    icon: '📊',
  },
  {
    id: 'd3',
    name: 'Engineering & Technology',
    headName: 'Prof. Elias Hailu',
    studentsCount: 410,
    facultyCount: 38,
    icon: '⚙️',
  },
  {
    id: 'd4',
    name: 'Social Sciences',
    headName: 'Dr. Tigist Assefa',
    studentsCount: 196,
    facultyCount: 27,
    icon: '🌍',
  },
  {
    id: 'd5',
    name: 'Health & Life Sciences',
    headName: 'Dr. Meron Tesfaye',
    studentsCount: 312,
    facultyCount: 29,
    icon: '🧬',
  },
  {
    id: 'd6',
    name: 'Arts & Humanities',
    headName: 'Wzro. Sara Girma',
    studentsCount: 148,
    facultyCount: 21,
    icon: '🎨',
  },
]

const emptyForm = {
  name: '',
  headName: '',
}

export function DepartmentsPage() {
  const { notify } = useToast()
  const [departments, setDepartments] = useLocalStorageState<Department[]>(
    'berana:departments',
    seedDepartments,
  )
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q === '') return departments
    return departments.filter(
      (d) => d.name.toLowerCase().includes(q) || d.headName.toLowerCase().includes(q),
    )
  }, [departments, query])

  const totals = useMemo(() => {
    const students = departments.reduce((sum, d) => sum + d.studentsCount, 0)
    const faculty = departments.reduce((sum, d) => sum + d.facultyCount, 0)
    return { total: departments.length, students, faculty }
  }, [departments])

  const openModal = () => {
    setForm(emptyForm)
    setModalOpen(true)
  }

  const handleCreate = () => {
    if (!form.name.trim()) {
      notify('Please provide a department name.', 'error')
      return
    }
    const newDept: Department = {
      id: createId('dept'),
      name: form.name.trim(),
      headName: form.headName.trim() || 'To be assigned',
      studentsCount: 0,
      facultyCount: 0,
      icon: '',
    }
    setDepartments((prev) => [...prev, newDept])
    setModalOpen(false)
    notify(`Department “${newDept.name}” added.`)
  }

  const handleDelete = (dept: Department) => {
    setDepartments((prev) => prev.filter((d) => d.id !== dept.id))
    notify(`Department “${dept.name}” deleted.`, 'info')
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Departments"
        subtitle="Organize faculties, schools and departments and assign their academic leadership."
        actions={
          <>
            <Button variant="secondary" onClick={() => notify('Leadership management view is coming soon.', 'info')}>
              <UserCog size={15} />
              Manage Heads
            </Button>
            <Button variant="primary" onClick={openModal}>
              <Plus size={16} />
              Add Department
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-4 md:gap-5">
        <StatBlock label="Departments" value={totals.total} icon={<Building2 size={STAT} />} />
        <StatBlock
          label="Total Students"
          value={totals.students.toLocaleString()}
          icon={<Users size={STAT} />}
        />
        <StatBlock label="Faculty & Staff" value={totals.faculty} icon={<Briefcase size={STAT} />} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h2 className="text-[15px] font-extrabold text-navy-900">All Departments</h2>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search departments or heads..."
          className="md:w-80"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
          {filtered.map((dept) => (
            <DepartmentCard
              key={dept.id}
              name={dept.name}
              headName={dept.headName}
              studentsCount={dept.studentsCount}
              facultyCount={dept.facultyCount}
              icon={dept.icon}
              onDelete={() => handleDelete(dept)}
            />
          ))}
        </div>
      ) : (
        <GlassCard className="p-10 text-center text-secondary-text text-[13.5px] font-medium">
          No departments match your search.
        </GlassCard>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        icon={<Building2 size={18} />}
        title="Add Department"
        description="Create a new department and assign its head."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Add Department
            </Button>
          </>
        }
      >
        <FormField
          label="Department Name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          placeholder="e.g. Computer Science & IT"
        />
        <FormField
          label="Head of Department"
          value={form.headName}
          onChange={(v) => setForm({ ...form, headName: v })}
          placeholder="e.g. Dr. Aaron Selassie"
        />
      </Modal>
    </div>
  )
}

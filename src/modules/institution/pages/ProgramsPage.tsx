import { useMemo, useState } from 'react'
import { GraduationCap, CheckCircle2, Users, BookOpen, Plus, Upload } from 'lucide-react'
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
import { useCampusContext } from '../context/CampusContext'
import { DEFAULT_CAMPUS_ID } from '../data/orgSeedData'
import type { ProgramLevel, ProgramRow } from '../types'

const STAT = 17

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
  campusId: DEFAULT_CAMPUS_ID,
  duration: '4 Years',
}

type LegacyProgramRow = ProgramRow & { campusId?: string }

function migratePrograms(raw: LegacyProgramRow[]): ProgramRow[] {
  return raw.map((program) => ({
    ...program,
    campusId: program.campusId ?? DEFAULT_CAMPUS_ID,
  }))
}

export function ProgramsPage() {
  const { notify } = useToast()
  const { selectedCampusId, activeCampuses, getCampusById, departments } = useCampusContext()
  const [programsRaw, setProgramsRaw] = useLocalStorageState<LegacyProgramRow[]>(
    'berana:programs',
    [],
  )
  const programs = useMemo(() => migratePrograms(programsRaw), [programsRaw])
  const setPrograms = (updater: ProgramRow[] | ((prev: ProgramRow[]) => ProgramRow[])) => {
    setProgramsRaw((prev) => {
      const current = migratePrograms(prev)
      const next = typeof updater === 'function' ? updater(current) : updater
      return next
    })
  }
  const [activeTab, setActiveTab] = useState('All')
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(() => {
    return programs.filter((p) => {
      const matchesCampus =
        selectedCampusId === 'all' || p.campusId === selectedCampusId
      const matchesTab = activeTab === 'All' || p.level === activeTab
      const matchesQuery =
        query.trim() === '' ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.code.toLowerCase().includes(query.toLowerCase()) ||
        p.department.toLowerCase().includes(query.toLowerCase())
      return matchesCampus && matchesTab && matchesQuery
    })
  }, [programs, activeTab, query, selectedCampusId])

  const scopedPrograms = useMemo(() => {
    if (selectedCampusId === 'all') return programs
    return programs.filter((p) => p.campusId === selectedCampusId)
  }, [programs, selectedCampusId])

  const totals = useMemo(() => {
    const active = scopedPrograms.filter((p) => p.status === 'active').length
    const enrolled = scopedPrograms.reduce((sum, p) => sum + p.enrolledCount, 0)
    const courses = scopedPrograms.reduce((sum, p) => sum + p.courseCount, 0)
    return { total: scopedPrograms.length, active, enrolled, courses }
  }, [scopedPrograms])

  const openModal = () => {
    const defaultCampus =
      selectedCampusId !== 'all' ? selectedCampusId : activeCampuses[0]?.id ?? DEFAULT_CAMPUS_ID
    setForm({ ...emptyForm, campusId: defaultCampus })
    setModalOpen(true)
  }

  const campusDepartmentOptions = useMemo(() => {
    const scoped =
      form.campusId === 'all'
        ? departments
        : departments.filter((d) => d.campusId === form.campusId)
    return scoped.length > 0 ? scoped.map((d) => d.name) : departmentOptions
  }, [departments, form.campusId])

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
      campusId: form.campusId,
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
        subtitle="Manage degree programs, certificates and their curricula across campuses and departments."
        actions={
          <>
            <Button variant="secondary" onClick={() => notify('CSV import runs once the backend is connected.', 'info')}>
              <Upload size={15} />
              Import
            </Button>
            <Button variant="primary" onClick={openModal}>
              <Plus size={16} />
              Add Program
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatBlock label="Total Programs" value={totals.total} icon={<GraduationCap size={STAT} />} />
        <StatBlock
          label="Active"
          value={totals.active}
          sub="Currently enrolling"
          icon={<CheckCircle2 size={STAT} />}
        />
        <StatBlock
          label="Students Enrolled"
          value={totals.enrolled.toLocaleString()}
          icon={<Users size={STAT} />}
        />
        <StatBlock label="Linked Courses" value={totals.courses} icon={<BookOpen size={STAT} />} />
      </div>

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
        icon={<GraduationCap size={18} />}
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
        <FormField
          label="Campus"
          type="select"
          value={getCampusById(form.campusId)?.name ?? activeCampuses[0]?.name ?? ''}
          options={activeCampuses.map((c) => c.name)}
          onChange={(label) => {
            const campus = activeCampuses.find((c) => c.name === label)
            if (campus) {
              const firstDept = departments.find((d) => d.campusId === campus.id)
              setForm({
                ...form,
                campusId: campus.id,
                department: firstDept?.name ?? departmentOptions[0],
              })
            }
          }}
        />
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
            options={campusDepartmentOptions}
            onChange={(v) => setForm({ ...form, department: v })}
          />
        </div>
      </Modal>
    </div>
  )
}

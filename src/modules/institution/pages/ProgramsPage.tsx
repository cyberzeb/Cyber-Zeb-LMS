import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BookOpen, CheckCircle2, GraduationCap, Plus, Users } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { ProgramsTable } from '../components/ProgramsTable'
import { ProgramFormModal } from '../components/ProgramFormModal'
import { useCampusContext } from '../context/CampusContext'
import { usePeople } from '../hooks/usePeople'
import { usePrograms } from '../hooks/usePrograms'
import { useAcademicCalendar } from '../hooks/useAcademicCalendar'
import { studentsInProgram } from '../utils/programUtils'
import type { ProgramRow } from '../types'

const STAT = 17
const tabs = ['All', 'Undergraduate', 'Postgraduate', 'Doctoral', 'Certificate']

/**
 * Degree programs. A department can offer several (e.g. BSc and MSc in
 * Computer Science); each program has its own duration and curriculum.
 */
export function ProgramsPage() {
  const { notify } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { selectedCampusId, departments } = useCampusContext()
  const { people } = usePeople()
  const { programs, saveProgram, removeProgram } = usePrograms()
  const { ensureCalendarForProgram } = useAcademicCalendar()
  const [activeTab, setActiveTab] = useState('All')
  const [departmentFilter, setDepartmentFilter] = useState(searchParams.get('department') ?? 'all')
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  // Enrolled counts come from the students actually assigned to each program.
  const withCounts = useMemo(
    () => programs.map((p) => ({ ...p, enrolledCount: studentsInProgram(people, p, programs, departments).length })),
    [programs, people, departments],
  )

  const scoped = useMemo(
    () =>
      withCounts.filter(
        (p) =>
          (selectedCampusId === 'all' || p.campusId === selectedCampusId) &&
          (departmentFilter === 'all' || p.departmentId === departmentFilter),
      ),
    [withCounts, selectedCampusId, departmentFilter],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return scoped.filter(
      (p) =>
        (activeTab === 'All' || p.level === activeTab) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q)),
    )
  }, [scoped, activeTab, query])

  const totals = useMemo(
    () => ({
      total: scoped.length,
      active: scoped.filter((p) => p.status === 'active').length,
      enrolled: scoped.reduce((sum, p) => sum + p.enrolledCount, 0),
      courses: scoped.reduce((sum, p) => sum + p.courseCount, 0),
    }),
    [scoped],
  )

  const departmentOptions = useMemo(
    () => [
      { value: 'all', label: 'All departments' },
      ...departments.map((d) => ({
        value: d.id,
        label: d.name,
        hint: `${programs.filter((p) => p.departmentId === d.id).length} programs`,
      })),
    ],
    [departments, programs],
  )

  const handleCreate = (program: ProgramRow) => {
    const saved = saveProgram(program)
    const termsAdded = ensureCalendarForProgram(saved.durationYears, saved.campusId, saved.semestersPerYear)
    notify(
      termsAdded > 0
        ? `Program “${saved.name}” created. ${termsAdded} semester${termsAdded === 1 ? '' : 's'} added to the calendar. Now build its curriculum.`
        : `Program “${saved.name}” created. Now build its curriculum.`,
    )
    navigate(`/admin/institution/programs/${saved.id}`)
  }

  const handleDelete = (program: ProgramRow) => {
    const enrolled = withCounts.find((p) => p.id === program.id)?.enrolledCount ?? 0
    if (enrolled > 0) {
      notify(`${enrolled} student${enrolled === 1 ? ' is' : 's are'} in this program. Move them first, or archive it.`, 'error')
      return
    }
    removeProgram(program.id)
    notify(`Program “${program.name}” deleted.`, 'info')
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Academic Programs"
        subtitle="The degrees each department offers. A department can run several programs — open one to build its curriculum year by year."
        actions={
          <Button variant="primary" onClick={() => setModalOpen(true)} disabled={departments.length === 0}>
            <Plus size={16} />
            Add Program
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatBlock label="Programs" value={totals.total} icon={<GraduationCap size={STAT} />} />
        <StatBlock label="Active" value={totals.active} sub="Accepting students" icon={<CheckCircle2 size={STAT} />} />
        <StatBlock label="Students" value={totals.enrolled.toLocaleString()} icon={<Users size={STAT} />} />
        <StatBlock label="Curriculum Courses" value={totals.courses} sub="Across all programs" icon={<BookOpen size={STAT} />} />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <SelectMenu
            value={departmentFilter}
            options={departmentOptions}
            onChange={setDepartmentFilter}
            aria-label="Filter by department"
          />
          <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        </div>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search programs, codes, departments..."
          className="lg:w-80"
        />
      </div>

      {filtered.length > 0 ? (
        <ProgramsTable
          programs={filtered}
          onManage={(p) => navigate(`/admin/institution/programs/${p.id}`)}
          onDelete={handleDelete}
        />
      ) : (
        <GlassCard className="p-10 text-center text-secondary-text text-[13.5px] font-medium">
          {programs.length === 0
            ? 'No programs yet. Add the first degree a department offers.'
            : 'No programs match your filters.'}
        </GlassCard>
      )}

      <ProgramFormModal
        open={modalOpen}
        program={null}
        departments={departments}
        existingCodes={programs.map((p) => p.code)}
        defaultDepartmentId={departmentFilter !== 'all' ? departmentFilter : undefined}
        onClose={() => setModalOpen(false)}
        onSave={(p) => {
          setModalOpen(false)
          handleCreate(p)
        }}
      />
    </div>
  )
}

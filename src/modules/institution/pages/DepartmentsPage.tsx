import { useEffect, useMemo, useState } from 'react'
import { Building2, Users, Briefcase, Plus, UserCog } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { useOrganizationConfig } from '../../../shared/config/useOrganizationConfig'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { Modal } from '../../../shared/components/Modal'
import { FormField } from '../../../shared/components/FormField'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { DepartmentCard } from '../components/DepartmentCard'
import { DepartmentEditModal } from '../components/DepartmentEditModal'
import { ManageDepartmentHeadsModal } from '../components/ManageDepartmentHeadsModal'
import { useCampusContext } from '../context/CampusContext'
import { usePeople } from '../hooks/usePeople'
import { DEFAULT_CAMPUS_ID } from '../data/orgSeedData'
import { usePrograms } from '../hooks/usePrograms'
import { programsForDepartment, studentsInProgram } from '../utils/programUtils'
import type { Department } from '../types'

const STAT = 17

const emptyForm = {
  name: '',
  headName: '',
  campusId: DEFAULT_CAMPUS_ID,
}

export function DepartmentsPage() {
  const { notify } = useToast()
  const { terminology: t } = useOrganizationConfig()
  const { programs } = usePrograms()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    departments,
    setDepartments,
    campuses,
    activeCampuses,
    selectedCampusId,
    setSelectedCampusId,
    getCampusById,
  } = useCampusContext()

  const campusFromQuery = searchParams.get('campus')
  const [campusFilter, setCampusFilter] = useState<string>(
    campusFromQuery ?? (selectedCampusId === 'all' ? 'all' : selectedCampusId),
  )
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [headsModalOpen, setHeadsModalOpen] = useState(false)
  const [editDept, setEditDept] = useState<Department | null>(null)
  const [form, setForm] = useState(emptyForm)

  const { people } = usePeople()
  const navigate = useNavigate()

  useEffect(() => {
    if (campusFromQuery) {
      setCampusFilter(campusFromQuery)
      setSelectedCampusId(campusFromQuery)
    } else {
      setCampusFilter(selectedCampusId === 'all' ? 'all' : selectedCampusId)
    }
  }, [campusFromQuery, selectedCampusId, setSelectedCampusId])

  const campusOptions = useMemo(
    () => campuses.map((c) => ({ id: c.id, label: c.name, status: c.status, code: c.code })),
    [campuses],
  )



  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return departments.filter((d) => {
      const matchesCampus = campusFilter === 'all' || d.campusId === campusFilter
      const matchesQuery =
        q === '' ||
        d.name.toLowerCase().includes(q) ||
        d.headName.toLowerCase().includes(q)
      return matchesCampus && matchesQuery
    })
  }, [departments, query, campusFilter])

  // With every campus shown, departments are grouped under their campus (Campus → Department).
  const groupedByCampus = useMemo(() => {
    if (campusFilter !== 'all') return null
    const groups = new Map<string, Department[]>()
    for (const dept of filtered) {
      const list = groups.get(dept.campusId) ?? []
      list.push(dept)
      groups.set(dept.campusId, list)
    }
    return campuses
      .filter((campus) => groups.has(campus.id))
      .map((campus) => ({ campus, departments: groups.get(campus.id) ?? [] }))
  }, [campusFilter, filtered, campuses])

  const scopedDepartments = useMemo(() => {
    return departments.filter((d) => {
      const matchesCampus = campusFilter === 'all' || d.campusId === campusFilter
      return matchesCampus
    })
  }, [departments, campusFilter])

  const totals = useMemo(() => {
    const students = scopedDepartments.reduce((sum, d) => sum + d.studentsCount, 0)
    const faculty = scopedDepartments.reduce((sum, d) => sum + d.facultyCount, 0)
    return { total: scopedDepartments.length, students, faculty }
  }, [scopedDepartments])

  const openModal = () => {
    const defaultCampus =
      campusFilter !== 'all' ? campusFilter : activeCampuses[0]?.id ?? DEFAULT_CAMPUS_ID
    setForm({ ...emptyForm, campusId: defaultCampus })
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
      campusId: form.campusId,
    }
    setDepartments((prev) => [...prev, newDept])
    setModalOpen(false)
    notify(`Department “${newDept.name}” added. Next, add the programs it offers.`)
  }

  const handleDelete = (dept: Department) => {
    const offered = programsForDepartment(programs, dept.id).length
    if (offered > 0) {
      notify(`“${dept.name}” still offers ${offered} program${offered === 1 ? '' : 's'}. Move or delete ${offered === 1 ? 'it' : 'them'} first.`, 'error')
      return
    }
    setDepartments((prev) => prev.filter((d) => d.id !== dept.id))
    setEditDept((current) => (current?.id === dept.id ? null : current))
    notify(`Department “${dept.name}” deleted.`, 'info')
  }

  const handleSaveDepartment = (updated: Department, _prevName: string) => {
    setDepartments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
    notify(`Department “${updated.name}” updated.`)
  }

  const handleSaveHeads = (updatedScope: Department[]) => {
    const byId = new Map(updatedScope.map((d) => [d.id, d]))
    setDepartments((prev) => prev.map((d) => byId.get(d.id) ?? d))
    notify('Department heads updated.')
  }

  const handleCampusFilterChange = (value: string) => {
    setCampusFilter(value)
    if (value === 'all') {
      searchParams.delete('campus')
      setSelectedCampusId('all')
    } else {
      searchParams.set('campus', value)
      setSelectedCampusId(value)
    }
    setSearchParams(searchParams, { replace: true })
  }

  const campusSelectOptions = useMemo(
    () => [
      { value: 'all', label: 'All Campuses' },
      ...campusOptions.map((campus) => ({
        value: campus.id,
        label: campus.label,
        hint: campus.status === 'pending' ? 'Pending activation' : campus.code,
      })),
    ],
    [campusOptions],
  )

  const renderDepartmentCard = (dept: Department) => {
    return (
      <DepartmentCard
        key={dept.id}
        name={dept.name}
        headName={dept.headName}
        studentsCount={programsForDepartment(programs, dept.id).reduce((sum, p) => sum + studentsInProgram(people, p, programs, departments).length, 0) || dept.studentsCount}
        facultyCount={dept.facultyCount}
        programs={programsForDepartment(programs, dept.id).map((p) => ({ id: p.id, code: p.code, name: p.name }))}
        onOpenProgram={(id) => navigate(`/admin/institution/programs/${id}`)}
        onAddProgram={() => navigate(`/admin/institution/programs?department=${dept.id}`)}
        onClick={() => setEditDept(dept)}
        onDelete={() => handleDelete(dept)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title={t.departments}
        subtitle="Academic departments on each campus. A department offers one or more programs (e.g. BSc and MSc); students and curricula belong to the programs."
        actions={
          <>
            <Button variant="secondary" onClick={() => setHeadsModalOpen(true)}>
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
          <SelectMenu
            value={campusFilter}
            options={campusSelectOptions}
            onChange={handleCampusFilterChange}
            aria-label="Filter by campus"
          />
          <span className="text-[13px] font-semibold text-navy-700">
            {filtered.length} department{filtered.length === 1 ? '' : 's'}
          </span>
        </div>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search departments or heads..."
          className="md:w-80"
        />
      </div>

      {filtered.length > 0 ? (
        groupedByCampus ? (
          <div className="flex flex-col gap-6">
            {groupedByCampus.map(({ campus, departments: campusDepts }) => (
              <GlassCard key={campus.id} className="p-5 md:p-6">
                <div className="flex items-baseline justify-between gap-3 mb-5 pb-3 border-b border-divider/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 size={16} className="text-lemon-700 shrink-0" />
                    <h3 className="text-[14px] font-extrabold text-navy-900 truncate">
                      {campus.name}
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-secondary-text whitespace-nowrap">
                    {campusDepts.length} department{campusDepts.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {campusDepts.map((dept) => renderDepartmentCard(dept))}
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((dept) => renderDepartmentCard(dept))}
          </div>
        )
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
        description="Create an academic department on a campus — e.g. Computer Science or Software Engineering."
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
          label="Campus"
          type="select"
          value={getCampusById(form.campusId)?.name ?? campusOptions[0]?.label ?? ''}
          options={
            campusOptions.length > 0
              ? campusOptions.map((c) => c.label)
              : ['No campuses available']
          }
          onChange={(label) => {
            const campus = campusOptions.find((c) => c.label === label)
            if (campus) {
              setForm({ ...form, campusId: campus.id })
            }
          }}
        />
        <FormField
          label="Department Name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          placeholder="e.g. Computer Science"
        />
        <FormField
          label="Head of Department"
          value={form.headName}
          onChange={(v) => setForm({ ...form, headName: v })}
          placeholder="e.g. Dr. Aaron Selassie"
        />
      </Modal>

      <DepartmentEditModal
        open={editDept !== null}
        department={editDept}
        campuses={campuses}
        people={people}
        onClose={() => setEditDept(null)}
        onSaved={handleSaveDepartment}
        onDelete={handleDelete}
      />

      <ManageDepartmentHeadsModal
        open={headsModalOpen}
        departments={scopedDepartments}
        people={people}
        campuses={campuses}
        onClose={() => setHeadsModalOpen(false)}
        onSave={handleSaveHeads}
      />
    </div>
  )
}

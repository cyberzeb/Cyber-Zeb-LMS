import { useEffect, useMemo, useState } from 'react'

import { Building2, Users, Briefcase, Plus, UserCog, GraduationCap } from 'lucide-react'

import { useSearchParams } from 'react-router-dom'

import { GlassCard } from '../../../shared/layout/GlassCard'

import { StatBlock } from '../../../shared/components/StatBlock'

import { Button } from '../../../shared/components/Button'

import { PageHeader } from '../../../shared/components/PageHeader'

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

import { DEFAULT_CAMPUS_ID, DEFAULT_COLLEGE_ID } from '../data/orgSeedData'

import { useAcademicCalendar } from '../hooks/useAcademicCalendar'
import { DEFAULT_SEMESTERS_PER_YEAR } from '../utils/academicTermUtils'

import type { Department, ProgramLevel } from '../types'



const STAT = 17



const emptyForm = {
  name: '',
  headName: '',
  campusId: DEFAULT_CAMPUS_ID,
  collegeId: DEFAULT_COLLEGE_ID,
  programCode: '',
  programLevel: 'Undergraduate' as ProgramLevel,
  maxYears: '4',
}



export function DepartmentsPage() {

  const { notify } = useToast()
  const { ensureCalendarForProgram } = useAcademicCalendar()

  const [searchParams, setSearchParams] = useSearchParams()

  const {

    departments,

    setDepartments,

    colleges,

    campuses,

    activeCampuses,

    selectedCampusId,

    setSelectedCampusId,

    getCampusById,

    getCollegeById,

    getCollegesForCampus,

  } = useCampusContext()



  const campusFromQuery = searchParams.get('campus')

  const collegeFromQuery = searchParams.get('college')

  const [campusFilter, setCampusFilter] = useState<string>(

    campusFromQuery ?? (selectedCampusId === 'all' ? 'all' : selectedCampusId),

  )

  const [collegeFilter, setCollegeFilter] = useState<string>(collegeFromQuery ?? 'all')

  const [query, setQuery] = useState('')

  const [modalOpen, setModalOpen] = useState(false)

  const [headsModalOpen, setHeadsModalOpen] = useState(false)

  const [editDept, setEditDept] = useState<Department | null>(null)

  const [form, setForm] = useState(emptyForm)



  const { people } = usePeople()



  useEffect(() => {

    if (campusFromQuery) {

      setCampusFilter(campusFromQuery)

      setSelectedCampusId(campusFromQuery)

    } else {

      setCampusFilter(selectedCampusId === 'all' ? 'all' : selectedCampusId)

    }

    if (collegeFromQuery) setCollegeFilter(collegeFromQuery)

  }, [campusFromQuery, collegeFromQuery, selectedCampusId, setSelectedCampusId])



  const campusOptions = useMemo(

    () => campuses.map((c) => ({ id: c.id, label: c.name, status: c.status, code: c.code })),

    [campuses],

  )



  const collegeOptionsForFilter = useMemo(() => {

    if (campusFilter === 'all') return colleges

    return getCollegesForCampus(campusFilter)

  }, [campusFilter, colleges, getCollegesForCampus])



  const collegeOptionsForForm = useMemo(() => {

    return getCollegesForCampus(form.campusId)

  }, [form.campusId, getCollegesForCampus])



  const filtered = useMemo(() => {

    const q = query.trim().toLowerCase()

    return departments.filter((d) => {

      const matchesCampus = campusFilter === 'all' || d.campusId === campusFilter

      const matchesCollege = collegeFilter === 'all' || d.collegeId === collegeFilter

      const matchesQuery =

        q === '' ||

        d.name.toLowerCase().includes(q) ||

        d.headName.toLowerCase().includes(q) ||

        getCollegeById(d.collegeId)?.name.toLowerCase().includes(q)

      return matchesCampus && matchesCollege && matchesQuery

    })

  }, [departments, query, campusFilter, collegeFilter, getCollegeById])



  const groupedByCollege = useMemo(() => {

    if (collegeFilter !== 'all') return null

    const groups = new Map<string, Department[]>()

    for (const dept of filtered) {

      const list = groups.get(dept.collegeId) ?? []

      list.push(dept)

      groups.set(dept.collegeId, list)

    }

    return collegeOptionsForFilter

      .filter((college) => groups.has(college.id))

      .map((college) => ({

        college,

        departments: groups.get(college.id) ?? [],

      }))

  }, [collegeFilter, filtered, collegeOptionsForFilter])



  const scopedDepartments = useMemo(() => {

    return departments.filter((d) => {

      const matchesCampus = campusFilter === 'all' || d.campusId === campusFilter

      const matchesCollege = collegeFilter === 'all' || d.collegeId === collegeFilter

      return matchesCampus && matchesCollege

    })

  }, [departments, campusFilter, collegeFilter])



  const totals = useMemo(() => {

    const students = scopedDepartments.reduce((sum, d) => sum + d.studentsCount, 0)

    const faculty = scopedDepartments.reduce((sum, d) => sum + d.facultyCount, 0)

    return { total: scopedDepartments.length, students, faculty }

  }, [scopedDepartments])



  const openModal = () => {

    const defaultCampus =

      campusFilter !== 'all' ? campusFilter : activeCampuses[0]?.id ?? DEFAULT_CAMPUS_ID

    const defaultCollege =

      collegeFilter !== 'all'

        ? collegeFilter

        : getCollegesForCampus(defaultCampus)[0]?.id ?? DEFAULT_COLLEGE_ID

    setForm({ ...emptyForm, campusId: defaultCampus, collegeId: defaultCollege })

    setModalOpen(true)

  }



  const handleCreate = () => {

    if (!form.name.trim()) {

      notify('Please provide a department name.', 'error')

      return

    }

    if (!form.collegeId) {

      notify('Please select a college for this department.', 'error')

      return

    }

    const maxYears = Math.max(1, Number(form.maxYears) || 4)
    const semestersPerYear = DEFAULT_SEMESTERS_PER_YEAR

    const newDept: Department = {

      id: createId('dept'),

      name: form.name.trim(),

      headName: form.headName.trim() || 'To be assigned',

      studentsCount: 0,

      facultyCount: 0,

      icon: '',

      campusId: form.campusId,

      collegeId: form.collegeId,

      programCode: form.programCode.trim() || undefined,

      programLevel: form.programLevel,

      maxYears,

      semestersPerYear,

    }

    setDepartments((prev) => [...prev, newDept])

    const termsAdded = ensureCalendarForProgram(maxYears, form.campusId, semestersPerYear)

    setModalOpen(false)

    notify(
      termsAdded > 0
        ? `Department “${newDept.name}” added. ${termsAdded} semester${termsAdded === 1 ? '' : 's'} provisioned on the academic calendar.`
        : `Department “${newDept.name}” added.`,
    )
  }



  const handleDelete = (dept: Department) => {

    setDepartments((prev) => prev.filter((d) => d.id !== dept.id))

    setEditDept((current) => (current?.id === dept.id ? null : current))

    notify(`Department “${dept.name}” deleted.`, 'info')

  }



  const handleSaveDepartment = (updated: Department, _prevName: string) => {

    setDepartments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))

    const termsAdded = ensureCalendarForProgram(
      updated.maxYears ?? 4,
      updated.campusId,
      updated.semestersPerYear ?? DEFAULT_SEMESTERS_PER_YEAR,
    )

    notify(
      termsAdded > 0
        ? `Department “${updated.name}” updated. ${termsAdded} semester${termsAdded === 1 ? '' : 's'} added to the calendar.`
        : `Department “${updated.name}” updated.`,
    )

  }



  const handleSaveHeads = (updatedScope: Department[]) => {

    const byId = new Map(updatedScope.map((d) => [d.id, d]))

    setDepartments((prev) => prev.map((d) => byId.get(d.id) ?? d))

    notify('Department heads updated.')

  }



  const handleCampusFilterChange = (value: string) => {

    setCampusFilter(value)

    setCollegeFilter('all')

    if (value === 'all') {

      searchParams.delete('campus')

      searchParams.delete('college')

      setSelectedCampusId('all')

    } else {

      searchParams.set('campus', value)

      searchParams.delete('college')

      setSelectedCampusId(value)

    }

    setSearchParams(searchParams, { replace: true })

  }



  const handleCollegeFilterChange = (value: string) => {

    setCollegeFilter(value)

    if (value === 'all') {

      searchParams.delete('college')

    } else {

      searchParams.set('college', value)

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



  const collegeSelectOptions = useMemo(

    () => [

      { value: 'all', label: 'All Colleges' },

      ...collegeOptionsForFilter.map((college) => ({

        value: college.id,

        label: college.name,

      })),

    ],

    [collegeOptionsForFilter],

  )



  const renderDepartmentCard = (dept: Department) => {

    const college = getCollegeById(dept.collegeId)

    const campus = getCampusById(dept.campusId)

    return (

      <DepartmentCard

        key={dept.id}

        name={dept.name}

        headName={dept.headName}

        studentsCount={dept.studentsCount}

        facultyCount={dept.facultyCount}

        programCode={dept.programCode}

        maxYears={dept.maxYears}

        programLevel={dept.programLevel}

        collegeName={college?.name}

        campusName={campusFilter === 'all' ? campus?.name : undefined}

        campusCode={campusFilter === 'all' ? campus?.code : undefined}

        onClick={() => setEditDept(dept)}

        onDelete={() => handleDelete(dept)}

      />

    )

  }



  return (

    <div className="flex flex-col gap-6 md:gap-8">

      <PageHeader

        title="Departments & Programs"

        subtitle="Each department is a degree program with a fixed duration (Year 1 … Year N). Students and course offerings are scoped by department and study year."

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

          <SelectMenu

            value={collegeFilter}

            options={collegeSelectOptions}

            onChange={handleCollegeFilterChange}

            aria-label="Filter by college"

          />

          <span className="text-[13px] font-semibold text-navy-700">

            {filtered.length} department{filtered.length === 1 ? '' : 's'}

          </span>

        </div>

        <SearchInput

          value={query}

          onChange={setQuery}

          placeholder="Search departments, colleges or heads..."

          className="md:w-80"

        />

      </div>



      {filtered.length > 0 ? (

        groupedByCollege ? (

          <div className="flex flex-col gap-6">

            {groupedByCollege.map(({ college, departments: collegeDepts }) => (

              <GlassCard key={college.id} className="p-5 md:p-6">

                <div className="flex items-baseline justify-between gap-3 mb-5 pb-3 border-b border-divider/60">

                  <div className="flex items-center gap-2 min-w-0">

                    <GraduationCap size={16} className="text-lemon-700 shrink-0" />

                    <h3 className="text-[14px] font-extrabold text-navy-900 truncate">

                      {college.name}

                    </h3>

                  </div>

                  <span className="text-[11px] font-semibold text-secondary-text whitespace-nowrap">

                    {collegeDepts.length} dept{collegeDepts.length === 1 ? '' : 's'}

                  </span>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                  {collegeDepts.map((dept) => renderDepartmentCard(dept))}

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

        description="Create a final academic department under a college — e.g. Computer Science or Software Engineering."

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

              const firstCollege = getCollegesForCampus(campus.id)[0]?.id ?? ''

              setForm({ ...form, campusId: campus.id, collegeId: firstCollege })

            }

          }}

        />

        <FormField

          label="College"

          type="select"

          value={getCollegeById(form.collegeId)?.name ?? ''}

          options={

            collegeOptionsForForm.length > 0

              ? collegeOptionsForForm.map((c) => c.name)

              : ['No colleges — add one in Organization first']

          }

          onChange={(label) => {

            const college = collegeOptionsForForm.find((c) => c.name === label)

            if (college) setForm({ ...form, collegeId: college.id })

          }}

        />

        <FormField

          label="Program Code"

          value={form.programCode}

          onChange={(v) => setForm({ ...form, programCode: v })}

          placeholder="e.g. BSC-CS"

        />

        <div className="grid grid-cols-2 gap-4">

          <FormField

            label="Program Level"

            type="select"

            value={form.programLevel}

            options={['Undergraduate', 'Postgraduate', 'Doctoral', 'Certificate']}

            onChange={(v) => setForm({ ...form, programLevel: v as ProgramLevel })}

          />

          <FormField

            label="Program Duration (years)"

            value={form.maxYears}

            onChange={(v) => setForm({ ...form, maxYears: v })}

            placeholder="4"
            hint={`${DEFAULT_SEMESTERS_PER_YEAR} semesters per year are added to the academic calendar automatically.`}

          />

        </div>

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

        colleges={colleges}

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

        colleges={colleges}

        onClose={() => setHeadsModalOpen(false)}

        onSave={handleSaveHeads}

      />

    </div>

  )

}


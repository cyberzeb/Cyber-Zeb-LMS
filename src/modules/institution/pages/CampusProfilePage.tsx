import { useMemo, useState } from 'react'
import { Building2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../../shared/components/Button'
import { FormField } from '../../../shared/components/FormField'
import { Modal } from '../../../shared/components/Modal'
import { PageHeader } from '../../../shared/components/PageHeader'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { AcademicCalendarWidget } from '../components/AcademicCalendarWidget'
import { CollegeList } from '../components/CollegeList'
import { DepartmentGrid } from '../components/DepartmentGrid'
import { InstitutionHero } from '../components/InstitutionHero'
import { LeadershipList } from '../components/LeadershipList'
import { useCampusContext } from '../context/CampusContext'
import { DEFAULT_CAMPUS_ID } from '../data/orgSeedData'
import type { CalendarEvent, InstitutionEntity, Leader } from '../types'

const mockLeaders: Leader[] = [
  {
    id: 'l1',
    name: 'Dr. Aaron Selassie',
    role: 'Dean of Computing & IT',
    initials: 'AS',
  },
  {
    id: 'l2',
    name: 'Prof. Elias Hailu',
    role: 'Vice President of Academic Affairs',
    initials: 'EH',
  },
  {
    id: 'l3',
    name: 'Wzro. Kidist Yohannes',
    role: 'Registrar Director',
    initials: 'KY',
  },
]

const mockEvents: CalendarEvent[] = [
  {
    id: 'e1',
    day: '12',
    month: 'AUG',
    title: 'Fall Semester Registration',
    subtitle: 'Undergraduate & Postgraduate cohorts',
  },
  {
    id: 'e2',
    day: '05',
    month: 'SEP',
    title: 'Orientation & Induction Day',
    subtitle: 'Freshman and transfer student meetups',
  },
  {
    id: 'e3',
    day: '18',
    month: 'OCT',
    title: 'Mid-term Assessment Week',
    subtitle: 'Continuous assessment tests (CAT)',
  },
]

export function CampusProfilePage() {
  const navigate = useNavigate()
  const { campusId: routeCampusId } = useParams()
  const { notify } = useToast()
  const {
    campuses,
    getCampusById,
    getCollegesForCampus,
    getDepartmentsForCampus,
    updateCampus,
    setSelectedCampusId,
  } = useCampusContext()

  const campusId = routeCampusId ?? DEFAULT_CAMPUS_ID
  const campus = getCampusById(campusId) ?? getCampusById(DEFAULT_CAMPUS_ID)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: campus?.name ?? '',
    code: campus?.code ?? '',
    address: campus?.address ?? '',
    subtitle: campus?.subtitle ?? '',
  })

  const campusColleges = useMemo(
    () => (campus ? getCollegesForCampus(campus.id) : []),
    [campus, getCollegesForCampus],
  )

  const campusDepartments = useMemo(
    () => (campus ? getDepartmentsForCampus(campus.id) : []),
    [campus, getDepartmentsForCampus],
  )

  const entity: InstitutionEntity | null = useMemo(() => {
    if (!campus) return null
    const students = campusDepartments.reduce((sum, d) => sum + d.studentsCount, 0)
    const faculty = campusDepartments.reduce((sum, d) => sum + d.facultyCount, 0)
    return {
      id: campus.id,
      name: campus.name,
      subtitle: campus.subtitle,
      status: campus.status === 'active' ? 'active' : 'pending',
      departmentsCount: campusDepartments.length,
      collegesCount: campusColleges.length,
      studentsCount: students,
      facultyCount: faculty,
      completionRate: 94,
    }
  }, [campus, campusDepartments, campusColleges.length])

  if (!campus || !entity) {
    return (
      <div className="text-secondary-text text-[14px]">
        Campus not found.{' '}
        <button
          type="button"
          className="text-lemon-700 font-semibold"
          onClick={() => navigate('/admin/institution/structure')}
        >
          Go to Organization Structure
        </button>
      </div>
    )
  }

  const openEdit = () => {
    setEditForm({
      name: campus.name,
      code: campus.code,
      address: campus.address,
      subtitle: campus.subtitle,
    })
    setEditOpen(true)
  }

  const handleSave = () => {
    updateCampus(campus.id, editForm)
    setEditOpen(false)
    notify(`Campus “${editForm.name.trim()}” updated.`)
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Campus Profile"
        subtitle="View and manage a campus, its colleges and academic departments."
        actions={
          <>
            <select
              value={campus.id}
              onChange={(e) => {
                setSelectedCampusId(e.target.value)
                navigate(`/admin/institution/profile/${e.target.value}`)
              }}
              className="h-9 rounded-lg border border-divider bg-white px-3 text-[12.5px] text-navy-900 min-w-[200px]"
            >
              {campuses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <Button variant="secondary" onClick={() => navigate('/admin/institution/structure')}>
              Organization
            </Button>
          </>
        }
      />

      <InstitutionHero
        entity={entity}
        onEdit={openEdit}
        onAddDepartment={() => navigate(`/admin/institution/departments?campus=${campus.id}`)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6 md:gap-8">
          <CollegeList
            colleges={campusColleges}
            departments={campusDepartments}
            onViewAll={() => navigate('/admin/institution/structure')}
          />
          <DepartmentGrid
            departments={campusDepartments}
            onAddDepartment={() =>
              navigate(`/admin/institution/departments?campus=${campus.id}`)
            }
          />
        </div>

        <div className="flex flex-col gap-6 md:gap-8">
          <LeadershipList leaders={mockLeaders} />
          <AcademicCalendarWidget
            events={mockEvents}
            onViewFullCalendar={() => navigate('/admin/calendar')}
          />
        </div>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        icon={<Building2 size={18} />}
        title="Edit Campus"
        description="Update campus profile details shown across the admin portal."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save Changes
            </Button>
          </>
        }
      >
        <FormField
          label="Campus Name"
          value={editForm.name}
          onChange={(v) => setEditForm({ ...editForm, name: v })}
        />
        <FormField
          label="Campus Code"
          value={editForm.code}
          onChange={(v) => setEditForm({ ...editForm, code: v })}
        />
        <FormField
          label="Address"
          value={editForm.address}
          onChange={(v) => setEditForm({ ...editForm, address: v })}
        />
        <FormField
          label="Subtitle"
          value={editForm.subtitle}
          onChange={(v) => setEditForm({ ...editForm, subtitle: v })}
        />
      </Modal>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { BookOpen, MailPlus, Pencil, Plus, UserRoundPen, Users } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { Modal } from '../../../shared/components/Modal'
import { FormField } from '../../../shared/components/FormField'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { usePeople } from '../hooks/usePeople'
import { useCourses } from '../hooks/useCourses'
import { useCampusContext } from '../context/CampusContext'
import { useSyncCampusFilter } from '../hooks/useSyncCampusFilter'
import { withAdminVerification } from '../utils/peopleVerification'
import { DEFAULT_CAMPUS_ID } from '../data/orgSeedData'
import { getCoursesForAssistant, syncAssistantCourseAssignments } from '../utils/courseAssignmentUtils'
import { CampusRoleTable } from '../components/CampusRoleTable'
import type { CourseRecord, PersonRow } from '../types'

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

interface AssistantForm {
  id?: string
  name: string
  email: string
  campusId: string
  status: PersonRow['status']
  courseIds: string[]
}

const emptyForm = (campusId: string): AssistantForm => ({
  name: '',
  email: '',
  campusId,
  status: 'invited',
  courseIds: [],
})

/**
 * University Edition: teaching assistants support instructors on specific
 * courses. They grade and take attendance in the instructor portal but cannot
 * create course content, quizzes, assignments or certificates.
 */
export function TeachingAssistantsPage() {
  const { notify } = useToast()
  const { campuses, activeCampuses, selectedCampusId } = useCampusContext()
  const { people, setPeople } = usePeople()
  const { courses, setCourses } = useCourses()
  const [query, setQuery] = useState('')
  const [campusFilter, setCampusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<AssistantForm>(emptyForm(DEFAULT_CAMPUS_ID))

  useSyncCampusFilter(selectedCampusId, setCampusFilter)

  const assistants = useMemo(() => people.filter((p) => p.role === 'TeachingAssistant'), [people])

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => `${a.code} ${a.title}`.localeCompare(`${b.code} ${b.title}`)),
    [courses],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return assistants.filter((ta) => {
      if (campusFilter !== 'all' && ta.campusId !== campusFilter) return false
      if (!q) return true
      const assigned = getCoursesForAssistant(courses, ta.id)
      return (
        ta.name.toLowerCase().includes(q) ||
        ta.email.toLowerCase().includes(q) ||
        assigned.some((c) => c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q))
      )
    })
  }, [assistants, campusFilter, query, courses])

  const coursesSupported = courses.filter((c) => (c.teachingAssistantIds?.length ?? 0) > 0).length

  const campusMenuOptions = useMemo(
    () => [
      { value: 'all', label: 'All campuses' },
      ...activeCampuses.map((c) => ({ value: c.id, label: c.name, hint: c.code })),
    ],
    [activeCampuses],
  )

  const openCreate = () => {
    setForm(emptyForm(campusFilter !== 'all' ? campusFilter : activeCampuses[0]?.id ?? DEFAULT_CAMPUS_ID))
    setModalOpen(true)
  }

  const openEdit = (ta: PersonRow) => {
    setForm({
      id: ta.id,
      name: ta.name,
      email: ta.email,
      campusId: ta.campusId ?? DEFAULT_CAMPUS_ID,
      status: ta.status,
      courseIds: getCoursesForAssistant(courses, ta.id).map((c) => c.id),
    })
    setModalOpen(true)
  }

  const toggleCourse = (courseId: string) => {
    setForm((prev) => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter((id) => id !== courseId)
        : [...prev.courseIds, courseId],
    }))
  }

  const handleSave = () => {
    const name = form.name.trim()
    const email = form.email.trim().toLowerCase()
    if (!name || !email) {
      notify('Please provide name and email.', 'error')
      return
    }
    if (people.some((p) => p.email.toLowerCase() === email && p.id !== form.id)) {
      notify('Another account already uses this email.', 'error')
      return
    }

    let id = form.id
    if (id) {
      setPeople((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, name, email, campusId: form.campusId, status: form.status, initials: initialsFromName(name) }
            : p,
        ),
      )
    } else {
      const created = withAdminVerification({
        id: createId('user'),
        name,
        email,
        role: 'TeachingAssistant',
        department: 'Teaching Assistant',
        campusId: form.campusId,
        status: 'invited',
        lastActive: 'Never',
        initials: initialsFromName(name),
      })
      id = created.id
      setPeople((prev) => [created, ...prev])
    }
    const assistantId = id
    setCourses((prev) => syncAssistantCourseAssignments(prev, assistantId, form.courseIds))
    setModalOpen(false)
    notify(form.id ? `${name} updated.` : `Teaching assistant ${name} added.`)
  }

  const handleDelete = (ta: PersonRow) => {
    setPeople((prev) => prev.filter((p) => p.id !== ta.id))
    setCourses((prev) => syncAssistantCourseAssignments(prev, ta.id, []))
    notify(`${ta.name} removed.`, 'info')
  }

  const courseLabel = (assigned: CourseRecord[]) => {
    if (assigned.length === 0) return <span className="text-secondary-text italic">No courses assigned</span>
    if (assigned.length === 1) return `${assigned[0].code} — ${assigned[0].title}`
    return `${assigned.length} courses: ${assigned.map((c) => c.code).join(', ')}`
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Teaching Assistants"
        subtitle="Teaching assistants help instructors on specific courses: they grade submissions and take attendance, but cannot create course content, quizzes or certificates."
        actions={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={16} />
            Add Teaching Assistant
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatBlock label="Teaching Assistants" value={assistants.length} icon={<UserRoundPen size={17} />} />
        <StatBlock
          label="Active"
          value={assistants.filter((p) => p.status === 'active').length}
          icon={<Users size={17} />}
        />
        <StatBlock
          label="Pending Invites"
          value={assistants.filter((p) => p.status === 'invited').length}
          sub="Not yet activated"
          icon={<MailPlus size={17} />}
        />
        <StatBlock
          label="Courses Supported"
          value={coursesSupported}
          sub="With at least one TA"
          icon={<BookOpen size={17} />}
        />
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
            {filtered.length} teaching assistant{filtered.length === 1 ? '' : 's'}
          </span>
        </div>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search by name, email or course..."
          className="lg:w-80"
        />
      </div>

      {filtered.length > 0 ? (
        <CampusRoleTable
          people={filtered}
          campuses={campuses}
          detailColumnLabel="Assigned Courses"
          detail={(ta) => courseLabel(getCoursesForAssistant(courses, ta.id))}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      ) : (
        <GlassCard className="p-10 text-center text-secondary-text text-[13.5px] font-medium">
          {assistants.length === 0
            ? 'No teaching assistants yet. Add one and assign the courses they support.'
            : 'No teaching assistants match your search.'}
        </GlassCard>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        icon={form.id ? <Pencil size={18} /> : <MailPlus size={18} />}
        title={form.id ? 'Edit Teaching Assistant' : 'Add Teaching Assistant'}
        description="They sign in to the instructor portal and only see the courses selected below."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {form.id ? 'Save Changes' : 'Add Teaching Assistant'}
            </Button>
          </>
        }
      >
        <FormField
          label="Full Name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          placeholder="e.g. Liya Mengistu"
        />
        <FormField
          label="Email Address"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          placeholder="e.g. l.mengistu@berana.edu"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-navy-900">Campus</span>
            <select
              value={form.campusId}
              onChange={(e) => setForm({ ...form, campusId: e.target.value })}
              className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25"
            >
              {activeCampuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </label>
          {form.id ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-navy-900">Status</span>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as PersonRow['status'] })}
                className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25"
              >
                <option value="active">Active</option>
                <option value="invited">Invited</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
          ) : null}
        </div>

        <div>
          <div className="text-[12px] font-semibold text-navy-900 mb-1">Assigned Courses</div>
          <p className="text-[11.5px] text-secondary-text mb-2">
            The assistant sees the students, submissions and attendance of these courses only.
          </p>
          {sortedCourses.length > 0 ? (
            <div className="max-h-48 overflow-y-auto app-scroll space-y-1.5 rounded-xl border border-divider/70 p-2">
              {sortedCourses.map((course) => (
                <label
                  key={course.id}
                  className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer border transition-colors ${
                    form.courseIds.includes(course.id)
                      ? 'border-lemon-500/40 bg-lemon-50/50'
                      : 'border-transparent hover:bg-navy-50/60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.courseIds.includes(course.id)}
                    onChange={() => toggleCourse(course.id)}
                    className="mt-0.5 accent-lemon-600"
                  />
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold text-navy-900 truncate">
                      {course.code} — {course.title}
                    </div>
                    <div className="text-[11px] text-secondary-text truncate">
                      {course.instructor && course.instructor !== 'Unassigned'
                        ? `Instructor: ${course.instructor}`
                        : course.department}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-secondary-text italic">No courses yet — create courses first.</p>
          )}
        </div>
      </Modal>
    </div>
  )
}

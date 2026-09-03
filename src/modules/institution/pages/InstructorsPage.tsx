import { useEffect, useMemo, useState } from 'react'
import { MailPlus, Plus } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { useOrganizationConfig } from '../../../shared/config/useOrganizationConfig'
import { SearchInput } from '../../../shared/components/SearchInput'
import { Modal } from '../../../shared/components/Modal'
import { FormField } from '../../../shared/components/FormField'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { useSyncCampusFilter } from '../hooks/useSyncCampusFilter'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { usePeople } from '../hooks/usePeople'
import { useCourses } from '../hooks/useCourses'
import { withAdminVerification } from '../utils/peopleVerification'
import { useCampusContext } from '../context/CampusContext'
import { peoplePageConfigs } from '../data/peoplePageConfig'
import { DEFAULT_CAMPUS_ID } from '../data/orgSeedData'
import {
  getCoursesForInstructor,
  INSTRUCTOR_FACULTY_LABEL,
  syncInstructorCourseAssignments,
  unassignInstructorFromCourses,
} from '../utils/courseAssignmentUtils'
import { InstructorsTable } from '../components/InstructorsTable'
import { InstructorEditModal } from '../components/InstructorEditModal'
import type { PersonRow } from '../types'

const config = peoplePageConfigs.Instructor

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function InstructorsPage() {
  const { notify } = useToast()
  const { terminology: t } = useOrganizationConfig()
  const { campuses, activeCampuses, selectedCampusId } = useCampusContext()
  const { people, setPeople } = usePeople()
  const { courses, setCourses } = useCourses()
  const [query, setQuery] = useState('')
  const [campusFilter, setCampusFilter] = useState<string>('all')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editInstructor, setEditInstructor] = useState<PersonRow | null>(null)
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    campusId: DEFAULT_CAMPUS_ID,
    courseIds: [] as string[],
  })

  useSyncCampusFilter(selectedCampusId, setCampusFilter)

  useEffect(() => {
    setCourseFilter('all')
  }, [selectedCampusId])

  const instructors = useMemo(
    () => people.filter((p) => p.role === 'Instructor'),
    [people],
  )

  const courseFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All courses' },
      ...courses.map((c) => ({
        value: c.id,
        label: `${c.code} — ${c.title}`,
      })),
    ],
    [courses],
  )

  const filtered = useMemo(() => {
    return instructors.filter((instructor) => {
      const matchesCampus = campusFilter === 'all' || instructor.campusId === campusFilter
      const assignedCourses = getCoursesForInstructor(courses, instructor.id, instructor.name)
      const matchesCourse =
        courseFilter === 'all' || assignedCourses.some((c) => c.id === courseFilter)
      const q = query.trim().toLowerCase()
      const matchesQuery =
        q === '' ||
        instructor.name.toLowerCase().includes(q) ||
        instructor.email.toLowerCase().includes(q) ||
        assignedCourses.some(
          (c) =>
            c.code.toLowerCase().includes(q) ||
            c.title.toLowerCase().includes(q) ||
            c.department.toLowerCase().includes(q),
        )
      return matchesCampus && matchesCourse && matchesQuery
    })
  }, [instructors, campusFilter, courseFilter, query, courses])

  const stats = useMemo(() => config.getStats(people, courses), [people, courses])

  const campusMenuOptions = useMemo(
    () => [
      { value: 'all', label: 'All campuses' },
      ...activeCampuses.map((c) => ({ value: c.id, label: c.name, hint: c.code })),
    ],
    [activeCampuses],
  )

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => `${a.code} ${a.title}`.localeCompare(`${b.code} ${b.title}`)),
    [courses],
  )

  const openInvite = () => {
    setInviteForm({
      name: '',
      email: '',
      campusId: campusFilter !== 'all' ? campusFilter : activeCampuses[0]?.id ?? DEFAULT_CAMPUS_ID,
      courseIds: courseFilter !== 'all' ? [courseFilter] : [],
    })
    setInviteOpen(true)
  }

  const toggleInviteCourse = (courseId: string) => {
    setInviteForm((prev) => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter((id) => id !== courseId)
        : [...prev.courseIds, courseId],
    }))
  }

  const handleInvite = () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      notify('Please provide name and email.', 'error')
      return
    }

    const newInstructor = withAdminVerification({
      id: createId('user'),
      name: inviteForm.name.trim(),
      email: inviteForm.email.trim().toLowerCase(),
      role: 'Instructor',
      department: INSTRUCTOR_FACULTY_LABEL,
      campusId: inviteForm.campusId,
      status: 'invited',
      lastActive: 'Never',
      initials: initialsFromName(inviteForm.name),
    })

    setPeople((prev) => [newInstructor, ...prev])
    if (inviteForm.courseIds.length > 0) {
      setCourses((prev) =>
        syncInstructorCourseAssignments(
          prev,
          newInstructor.id,
          newInstructor.name,
          inviteForm.courseIds,
        ),
      )
    }
    setInviteOpen(false)
    notify(
      inviteForm.courseIds.length > 0
        ? `Instructor ${newInstructor.name} added with ${inviteForm.courseIds.length} course assignment${inviteForm.courseIds.length === 1 ? '' : 's'}.`
        : `Instructor ${newInstructor.name} added. Assign courses from their profile or the Course Catalog.`,
    )
  }

  const handleDelete = (instructor: PersonRow) => {
    setPeople((prev) => prev.filter((p) => p.id !== instructor.id))
    setCourses((prev) => unassignInstructorFromCourses(prev, instructor.id))
    notify(`${instructor.name} removed.`, 'info')
  }

  const handleSaved = (updated: PersonRow, courseIds: string[]) => {
    setPeople((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    setCourses((prev) =>
      syncInstructorCourseAssignments(prev, updated.id, updated.name, courseIds),
    )
    notify(`${updated.name} updated successfully.`)
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title={`${t.trainer}s`}
        subtitle={config.subtitle}
        actions={
          <Button variant="primary" onClick={openInvite}>
            <Plus size={16} />
            {config.inviteLabel}
          </Button>
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

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <SelectMenu
            value={campusFilter}
            options={campusMenuOptions}
            onChange={(v) => {
              setCampusFilter(v)
              setCourseFilter('all')
            }}
            aria-label="Filter by campus"
            className="w-full sm:w-auto"
          />
          <SelectMenu
            value={courseFilter}
            options={courseFilterOptions}
            onChange={setCourseFilter}
            aria-label="Filter by course"
            className="w-full sm:w-auto min-w-[200px]"
          />
          <span className="text-[13px] font-semibold text-navy-700 whitespace-nowrap">
            {filtered.length} instructor{filtered.length === 1 ? '' : 's'}
          </span>
        </div>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={config.searchPlaceholder}
          className="lg:w-80"
        />
      </div>

      {filtered.length > 0 ? (
        <InstructorsTable
          instructors={filtered}
          campuses={campuses}
          courses={courses}
          onEdit={setEditInstructor}
          onDelete={handleDelete}
        />
      ) : (
        <GlassCard className="p-10 text-center text-secondary-text text-[13.5px] font-medium">
          {config.emptyMessage}
        </GlassCard>
      )}

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        icon={<MailPlus size={18} />}
        title={config.inviteTitle}
        description={config.inviteDescription}
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleInvite}>
              Add Instructor
            </Button>
          </>
        }
      >
        <FormField
          label="Full Name"
          value={inviteForm.name}
          onChange={(v) => setInviteForm({ ...inviteForm, name: v })}
          placeholder="e.g. Dr. Aaron Selassie"
        />
        <FormField
          label="Email Address"
          value={inviteForm.email}
          onChange={(v) => setInviteForm({ ...inviteForm, email: v })}
          placeholder="e.g. a.selassie@berana.edu"
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Campus</span>
          <select
            value={inviteForm.campusId}
            onChange={(e) => setInviteForm({ ...inviteForm, campusId: e.target.value })}
            className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25"
          >
            {activeCampuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </label>

        <div>
          <div className="text-[12px] font-semibold text-navy-900 mb-1">
            Assign Courses (optional)
          </div>
          <p className="text-[11.5px] text-secondary-text mb-2">
            Instructors are linked to courses they teach — not to a department. Select one or more
            courses now, or assign later.
          </p>
          {sortedCourses.length > 0 ? (
            <div className="max-h-40 overflow-y-auto app-scroll space-y-1.5 rounded-xl border border-divider/70 p-2">
              {sortedCourses.map((course) => (
                <label
                  key={course.id}
                  className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer border transition-colors ${
                    inviteForm.courseIds.includes(course.id)
                      ? 'border-lemon-500/40 bg-lemon-50/50'
                      : 'border-transparent hover:bg-navy-50/60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={inviteForm.courseIds.includes(course.id)}
                    onChange={() => toggleInviteCourse(course.id)}
                    className="mt-0.5 accent-lemon-600"
                  />
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold text-navy-900 truncate">
                      {course.code} — {course.title}
                    </div>
                    <div className="text-[11px] text-secondary-text truncate">
                      {course.department}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-secondary-text italic">
              No courses yet — create courses first, then assign this instructor.
            </p>
          )}
        </div>
      </Modal>

      <InstructorEditModal
        open={editInstructor !== null}
        instructor={editInstructor}
        campuses={activeCampuses}
        courses={courses}
        onClose={() => setEditInstructor(null)}
        onSaved={handleSaved}
      />
    </div>
  )
}

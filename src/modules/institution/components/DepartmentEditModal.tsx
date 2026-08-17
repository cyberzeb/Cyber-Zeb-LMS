import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Plus, Settings2, User, X } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { FormField } from '../../../shared/components/FormField'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { StatusPill, type StatusTone } from '../../../shared/components/StatusPill'
import { useCourses } from '../hooks/useCourses'
import { UNASSIGNED_DEPARTMENT } from '../data/courseSeedData'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { getEligibleDepartmentHeads, resolveDepartmentHeadId } from '../utils/departmentHeadUtils'
import type { Campus, College, Department, PersonRow } from '../types'

interface DepartmentEditModalProps {
  open: boolean
  department: Department | null
  campuses: Campus[]
  colleges: College[]
  people?: PersonRow[]
  onClose: () => void
  onSaved: (department: Department, prevName: string) => void
  onDelete?: (department: Department) => void
}

const tabs = ['General', 'Courses']

const courseStatusMap: Record<
  'published' | 'draft' | 'archived',
  { label: string; tone: StatusTone }
> = {
  published: { label: 'Published', tone: 'success' },
  draft: { label: 'Draft', tone: 'warning' },
  archived: { label: 'Archived', tone: 'neutral' },
}

export function DepartmentEditModal({
  open,
  department,
  campuses,
  colleges,
  onClose,
  onSaved,
  onDelete,
  people = [],
}: DepartmentEditModalProps) {
  const { courses, getCoursesForDepartment, updateCourse, renameDepartmentInCourses } = useCourses()

  const [activeTab, setActiveTab] = useState('General')
  const [form, setForm] = useState({
    name: '',
    headName: '',
    headId: '',
    campusId: '',
    collegeId: '',
    description: '',
  })
  const [assignCourseId, setAssignCourseId] = useState('')
  const [error, setError] = useState('')

  const departmentName = form.name.trim() || department?.name || ''

  useEffect(() => {
    if (!department || !open) return
    setForm({
      name: department.name,
      headName: department.headName,
      headId: resolveDepartmentHeadId(department, people),
      campusId: department.campusId,
      collegeId: department.collegeId,
      description: department.description ?? '',
    })
    setAssignCourseId('')
    setActiveTab('General')
    setError('')
  }, [department, open, people])

  const headCandidates = useMemo(() => {
    if (!department) return []
    const scopedDept: Department = {
      ...department,
      name: form.name.trim() || department.name,
      campusId: form.campusId || department.campusId,
    }
    return getEligibleDepartmentHeads(people, scopedDept)
  }, [department, people, form.name, form.campusId])

  const departmentCourses = useMemo(() => {
    if (!department) return []
    return getCoursesForDepartment(department.name)
  }, [department, getCoursesForDepartment, courses])

  const availableCourses = useMemo(() => {
    if (!department) return []
    return courses.filter((c) => c.department !== department.name)
  }, [courses, department])

  const campusOptions = useMemo(
    () => campuses.map((c) => ({ id: c.id, label: c.name })),
    [campuses],
  )

  const collegeOptions = useMemo(
    () => colleges.filter((c) => c.campusId === form.campusId),
    [colleges, form.campusId],
  )

  useEffect(() => {
    if (!collegeOptions.some((c) => c.id === form.collegeId)) {
      setForm((prev) => ({ ...prev, collegeId: collegeOptions[0]?.id ?? '' }))
    }
  }, [collegeOptions, form.collegeId])

  const handleSave = () => {
    if (!department) return
    if (!form.name.trim()) {
      setError('Department name is required.')
      return
    }
    if (!form.collegeId) {
      setError('Please select a college.')
      return
    }

    const prevName = department.name
    const nextName = form.name.trim()
    const headPerson = people.find((p) => p.id === form.headId)
    const updated: Department = {
      ...department,
      name: nextName,
      headId: form.headId || undefined,
      headName: headPerson?.name ?? (form.headName.trim() || 'To be assigned'),
      campusId: form.campusId,
      collegeId: form.collegeId,
      description: form.description.trim(),
    }

    renameDepartmentInCourses(prevName, nextName)
    onSaved(updated, prevName)
    onClose()
  }

  const handleAssignCourse = () => {
    if (!department || !assignCourseId) {
      setError('Select a course from the catalog to assign.')
      return
    }
    updateCourse(assignCourseId, { department: departmentName })
    setAssignCourseId('')
    setError('')
  }

  const handleUnassignCourse = (courseId: string) => {
    updateCourse(courseId, { department: UNASSIGNED_DEPARTMENT })
  }

  if (!department) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      icon={<Settings2 size={18} />}
      title={department.name}
      description="Configure this academic department and assign courses from the catalog."
      footer={
        <>
          {onDelete ? (
            <Button variant="danger" className="mr-auto" onClick={() => onDelete(department)}>
              Delete Department
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </>
      }
    >
      <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {error ? (
        <p className="text-[12.5px] font-semibold text-danger bg-danger-bg px-3 py-2 rounded-lg">
          {error}
        </p>
      ) : null}

      {activeTab === 'General' ? (
        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Campus"
              type="select"
              value={campusOptions.find((c) => c.id === form.campusId)?.label ?? ''}
              options={
                campusOptions.length > 0
                  ? campusOptions.map((c) => c.label)
                  : ['No campuses available']
              }
              onChange={(label) => {
                const campus = campusOptions.find((c) => c.label === label)
                if (campus) {
                  const firstCollege = colleges.find((c) => c.campusId === campus.id)?.id ?? ''
                  setForm({ ...form, campusId: campus.id, collegeId: firstCollege })
                }
              }}
            />
            <FormField
              label="College"
              type="select"
              value={collegeOptions.find((c) => c.id === form.collegeId)?.name ?? ''}
              options={
                collegeOptions.length > 0
                  ? collegeOptions.map((c) => c.name)
                  : ['No colleges on this campus']
              }
              onChange={(label) => {
                const college = collegeOptions.find((c) => c.name === label)
                if (college) setForm({ ...form, collegeId: college.id })
              }}
            />
          </div>
          <FormField
            label="Department Name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            placeholder="e.g. Computer Science"
            hint="Final academic unit — e.g. Computer Science, Software Engineering"
          />
          {headCandidates.length > 0 ? (
            <div>
              <label className="block text-[12px] font-bold text-navy-800 mb-1.5">
                Head of Department
              </label>
              <SelectMenu
                value={form.headId}
                onChange={(headId) => {
                  const person = people.find((p) => p.id === headId)
                  setForm({
                    ...form,
                    headId,
                    headName: person?.name ?? 'To be assigned',
                  })
                }}
                placeholder="Select head…"
                options={[
                  { value: '', label: 'No head assigned' },
                  ...headCandidates.map((person) => ({
                    value: person.id,
                    label: person.name,
                    hint: `${person.role} · ${person.department || 'No department'}`,
                  })),
                ]}
              />
            </div>
          ) : (
            <FormField
              label="Head of Department"
              value={form.headName}
              onChange={(v) => setForm({ ...form, headName: v, headId: '' })}
              placeholder="e.g. Dr. Aaron Selassie"
              hint="Add instructors under People to pick from a list."
            />
          )}
          <FormField
            label="Description"
            type="textarea"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            placeholder="Brief overview of the department's focus..."
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="rounded-xl bg-navy-50/80 px-3 py-2.5 ring-1 ring-navy-900/5">
              <div className="text-[18px] font-extrabold text-navy-900">
                {department.studentsCount.toLocaleString()}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-secondary-text font-semibold">
                Students
              </div>
            </div>
            <div className="rounded-xl bg-navy-50/80 px-3 py-2.5 ring-1 ring-navy-900/5">
              <div className="text-[18px] font-extrabold text-navy-900">
                {department.facultyCount.toLocaleString()}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-secondary-text font-semibold">
                Faculty
              </div>
            </div>
            <div className="rounded-xl bg-navy-50/80 px-3 py-2.5 ring-1 ring-navy-900/5">
              <div className="text-[18px] font-extrabold text-navy-900">
                {departmentCourses.length}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-secondary-text font-semibold">
                Courses
              </div>
            </div>
            <div className="rounded-xl bg-navy-50/80 px-3 py-2.5 ring-1 ring-navy-900/5">
              <div className="text-[18px] font-extrabold text-navy-900 truncate">
                {collegeOptions.find((c) => c.id === form.collegeId)?.name.split(' ').slice(-1)[0] ??
                  '—'}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-secondary-text font-semibold">
                College
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'Courses' ? (
        <div className="flex flex-col gap-4">
          <p className="text-[12.5px] text-secondary-text leading-relaxed">
            Assign courses from the institution catalog. Create new courses on the Course Catalog
            page first.
          </p>

          <div className="rounded-xl border border-divider/70 bg-navy-50/30 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[13px] font-extrabold text-navy-900">
              <Plus size={15} className="text-lemon-700" />
              Add from Available Courses
            </div>
            {availableCourses.length > 0 ? (
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <FormField
                  label="Available Course"
                  type="select"
                  value={
                    availableCourses.find((c) => c.id === assignCourseId)
                      ? `${availableCourses.find((c) => c.id === assignCourseId)!.code} — ${availableCourses.find((c) => c.id === assignCourseId)!.title}`
                      : 'Select a course...'
                  }
                  options={[
                    'Select a course...',
                    ...availableCourses.map((c) => {
                      const from =
                        c.department === UNASSIGNED_DEPARTMENT ? 'Unassigned' : c.department
                      return `${c.code} — ${c.title} (${from})`
                    }),
                  ]}
                  onChange={(label) => {
                    if (label === 'Select a course...') {
                      setAssignCourseId('')
                      return
                    }
                    const course = availableCourses.find(
                      (c) =>
                        label ===
                        `${c.code} — ${c.title} (${
                          c.department === UNASSIGNED_DEPARTMENT ? 'Unassigned' : c.department
                        })`,
                    )
                    setAssignCourseId(course?.id ?? '')
                  }}
                  hint={`${availableCourses.length} course${availableCourses.length === 1 ? '' : 's'} available to assign.`}
                />
                <Button
                  variant="primary"
                  onClick={handleAssignCourse}
                  disabled={!assignCourseId}
                  className="shrink-0"
                >
                  <BookOpen size={14} />
                  Assign Course
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-divider bg-white px-4 py-3 text-[13px] text-secondary-text font-medium">
                No other courses are available in the catalog.
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-[12px] font-bold uppercase tracking-wider text-secondary-text">
              Assigned Courses ({departmentCourses.length})
            </div>
            {departmentCourses.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto app-scroll pr-1">
                {departmentCourses.map((course) => {
                  const status = courseStatusMap[course.status]
                  return (
                    <div
                      key={course.id}
                      className="flex items-center gap-3 rounded-xl border border-divider/60 bg-white px-3.5 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text">
                            {course.code}
                          </span>
                          <StatusPill label={status.label} tone={status.tone} />
                        </div>
                        <div className="font-extrabold text-[13.5px] text-navy-900 truncate">
                          {course.title}
                        </div>
                        <div className="flex items-center gap-3 text-[11.5px] text-secondary-text mt-0.5">
                          <span className="inline-flex items-center gap-1">
                            <User size={11} />
                            {course.instructor}
                          </span>
                          <span>{course.level}</span>
                          <span>{course.enrolledCount} enrolled</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnassignCourse(course.id)}
                        aria-label={`Unassign ${course.title}`}
                        title="Unassign from department"
                        className="text-secondary-text hover:text-danger hover:bg-danger-bg w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-divider px-4 py-8 text-center text-[13px] text-secondary-text font-medium">
                No courses assigned yet. Pick one from the available catalog above.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

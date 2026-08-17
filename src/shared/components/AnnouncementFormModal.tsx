import { useEffect, useMemo, useState } from 'react'
import { Megaphone } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'
import { FormField } from './FormField'
import { SearchInput } from './SearchInput'
import { recordToFormInput, recordToInstructorFormInput } from '../storage/announcementUtils'
import { getCourseStudentCount } from '../storage/instructorAnnouncementUtils'
import type {
  AnnouncementFormInput,
  AnnouncementPersonOption,
  AnnouncementPriority,
  AnnouncementRecord,
  AnnouncementTargetRole,
  InstructorAnnouncementAudience,
} from '../types/announcements'
import {
  ALL_ANNOUNCEMENT_TARGET_ROLES,
  ANNOUNCEMENT_TARGET_ROLE_LABELS,
} from '../types/announcements'

interface CourseOption {
  id: string
  code: string
  title: string
}

interface AnnouncementFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (input: AnnouncementFormInput) => void
  mode: 'create' | 'edit'
  authorRole: 'admin' | 'instructor'
  courses?: CourseOption[]
  students?: AnnouncementPersonOption[]
  initial?: AnnouncementRecord | null
}

const emptyAdminForm: AnnouncementFormInput = {
  title: '',
  body: '',
  priority: 'normal',
  targetRoles: ['Student'],
  courseEnabled: false,
  courseId: undefined,
  specificStudentsEnabled: false,
  targetPersonIds: [],
}

const emptyInstructorForm: AnnouncementFormInput = {
  title: '',
  body: '',
  priority: 'normal',
  targetRoles: [],
  instructorAudience: 'all_my_students',
  courseEnabled: false,
  courseId: undefined,
  specificStudentsEnabled: false,
  targetPersonIds: [],
}
const selectClassName =
  'w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 cursor-pointer [color-scheme:light] focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25 transition-all'

function choiceCardClass(selected: boolean) {
  return `flex items-start gap-3 rounded-xl border px-3.5 py-3.5 cursor-pointer transition-all ${
    selected
      ? 'border-lemon-500/50 bg-lemon-50/40 ring-1 ring-lemon-500/20 shadow-sm'
      : 'border-divider hover:border-navy-200 hover:bg-navy-50/40'
  }`
}

function PriorityToggle({
  value,
  onChange,
}: {
  value: AnnouncementPriority
  onChange: (value: AnnouncementPriority) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange('normal')}
        className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
          value === 'normal'
            ? 'border-navy-300 bg-navy-50 ring-1 ring-navy-200'
            : 'border-divider hover:bg-navy-50/50'
        }`}
      >
        <span className="block text-[13px] font-semibold text-navy-900">Update</span>
        <span className="block text-[11px] text-secondary-text mt-0.5">General information</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('important')}
        className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
          value === 'important'
            ? 'border-warning/50 bg-warning-bg/60 ring-1 ring-warning/30'
            : 'border-divider hover:bg-warning-bg/20'
        }`}
      >
        <span className="block text-[13px] font-semibold text-navy-900">Important</span>
        <span className="block text-[11px] text-secondary-text mt-0.5">High-priority notice</span>
      </button>
    </div>
  )
}

function StudentAudiencePicker({
  students,
  selectedIds,
  onChange,
}: {
  students: AnnouncementPersonOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return students
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term) ||
        student.department?.toLowerCase().includes(term),
    )
  }, [students, query])

  const toggleStudent = (studentId: string) => {
    if (selectedIds.includes(studentId)) {
      onChange(selectedIds.filter((id) => id !== studentId))
      return
    }
    onChange([...selectedIds, studentId])
  }

  return (
    <div className="flex flex-col gap-2">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search students by name or email..."
      />

      <div className="rounded-xl border border-divider max-h-48 overflow-y-auto app-scroll divide-y divide-divider">
        {filtered.length > 0 ? (
          filtered.map((student) => {
            const checked = selectedIds.includes(student.id)
            return (
              <label
                key={student.id}
                className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-navy-50/70"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleStudent(student.id)}
                  className="mt-0.5 accent-lemon-600"
                />
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-navy-900">{student.name}</span>
                  <span className="block text-[11.5px] text-secondary-text truncate">
                    {student.email}
                    {student.department ? ` · ${student.department}` : ''}
                  </span>
                </span>
              </label>
            )
          })
        ) : (
          <p className="px-3 py-4 text-[12px] text-secondary-text text-center">
            {students.length === 0 ? 'No students found. Add students first.' : 'No students match your search.'}
          </p>
        )}
      </div>

      {selectedIds.length > 0 ? (
        <p className="text-[11.5px] text-navy-700 font-medium">
          {selectedIds.length} student{selectedIds.length === 1 ? '' : 's'} selected
        </p>
      ) : null}
    </div>
  )
}

function RoleCheckboxGroup({
  selectedRoles,
  onChange,
}: {
  selectedRoles: AnnouncementTargetRole[]
  onChange: (roles: AnnouncementTargetRole[]) => void
}) {
  const toggleRole = (role: AnnouncementTargetRole) => {
    if (selectedRoles.includes(role)) {
      onChange(selectedRoles.filter((item) => item !== role))
      return
    }
    onChange([...selectedRoles, role])
  }

  return (
    <div className="rounded-xl border border-divider divide-y divide-divider bg-white">
      {ALL_ANNOUNCEMENT_TARGET_ROLES.map((role) => (
        <label
          key={role}
          className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-navy-50/70 ${
            selectedRoles.includes(role) ? 'bg-lemon-50/30' : ''
          }`}
        >
          <input
            type="checkbox"
            checked={selectedRoles.includes(role)}
            onChange={() => toggleRole(role)}
            className="accent-lemon-600"
          />
          <span className="text-[13px] font-medium text-navy-900">
            {ANNOUNCEMENT_TARGET_ROLE_LABELS[role]}
          </span>
        </label>
      ))}
    </div>
  )
}

export function AnnouncementFormModal({
  open,
  onClose,
  onSubmit,
  mode,
  authorRole,
  courses = [],
  students = [],
  initial = null,
}: AnnouncementFormModalProps) {
  const [form, setForm] = useState<AnnouncementFormInput>(emptyAdminForm)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')

    if (initial) {
      if (authorRole === 'admin') {
        setForm(recordToFormInput(initial))
      } else {
        setForm(recordToInstructorFormInput(initial))
      }
      return
    }

    if (authorRole === 'instructor') {
      setForm(emptyInstructorForm)
      return
    }

    setForm(emptyAdminForm)
  }, [open, initial, authorRole])

  const handleSubmit = () => {
    if (!form.title.trim() || !form.body.trim()) {
      setError('Title and message are required.')
      return
    }

    if (authorRole === 'instructor') {
      if (form.instructorAudience === 'selected_students' && form.targetPersonIds.length === 0) {
        setError('Select at least one student.')
        return
      }
      if (form.instructorAudience === 'course' && !form.courseId) {
        setError('Choose a course for this announcement.')
        return
      }
      if (form.instructorAudience === 'all_my_students' && students.length === 0) {
        setError('No students are enrolled in your courses yet.')
        return
      }
      if (form.instructorAudience === 'course' && courses.length === 0) {
        setError('No courses assigned to you yet.')
        return
      }

      setError('')
      onSubmit({
        ...form,
        instructorAudience: form.instructorAudience ?? 'all_my_students',
        specificStudentsEnabled: form.instructorAudience === 'selected_students',
        targetPersonIds:
          form.instructorAudience === 'selected_students' ? form.targetPersonIds : [],
        courseEnabled: form.instructorAudience === 'course',
        courseId: form.instructorAudience === 'course' ? form.courseId : undefined,
        targetRoles: [],
      })
      return
    }

    const hasRoleAudience = form.targetRoles.length > 0
    const hasCourseAudience = form.courseEnabled && Boolean(form.courseId)
    const hasSpecificStudents =
      form.specificStudentsEnabled && (form.targetPersonIds?.length ?? 0) > 0

    if (!hasRoleAudience && !hasCourseAudience && !hasSpecificStudents) {
      setError('Select at least one audience: a role group, a course, or specific students.')
      return
    }
    if (form.courseEnabled && !form.courseId) {
      setError('Choose a course or uncheck “Specific course”.')
      return
    }
    if (form.specificStudentsEnabled && (form.targetPersonIds?.length ?? 0) === 0) {
      setError('Select at least one student or uncheck “Specific students”.')
      return
    }

    setError('')
    onSubmit(form)
  }

  const selectAllRoles = () => {
    setForm((prev) => ({ ...prev, targetRoles: [...ALL_ANNOUNCEMENT_TARGET_ROLES] }))
  }

  const clearAllRoles = () => {
    setForm((prev) => ({ ...prev, targetRoles: [] }))
  }

  return (
    <Modal
      open={open}
      title={mode === 'create' ? 'New announcement' : 'Edit announcement'}
      description={
        authorRole === 'admin'
          ? 'Check every group that should receive this notice. You can combine roles, courses, and individual students.'
          : 'Send to all your students, a specific course, or selected individuals.'
      }
      icon={<Megaphone size={18} />}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {mode === 'create' ? 'Publish' : 'Save changes'}
          </Button>
        </>
      }
    >
      <FormField
        label="Title"
        value={form.title}
        onChange={(title) => setForm((prev) => ({ ...prev, title }))}
        placeholder="e.g. Midterm exam schedule update"
      />

      <FormField
        label="Message"
        type="textarea"
        value={form.body}
        onChange={(body) => setForm((prev) => ({ ...prev, body }))}
        placeholder="Write the announcement details..."
      />

      <label className="flex flex-col gap-2">
        <span className="text-[12px] font-semibold text-navy-900">Priority</span>
        <PriorityToggle
          value={form.priority}
          onChange={(priority) => setForm((prev) => ({ ...prev, priority }))}
        />
      </label>

      {authorRole === 'admin' ? (
        <div className="flex flex-col gap-4 rounded-xl border border-divider bg-navy-50/25 p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] font-semibold text-navy-900">Role groups</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllRoles}
                  className="text-[11px] font-semibold text-navy-700 hover:text-navy-900"
                >
                  Select all
                </button>
                <span className="text-secondary-text">·</span>
                <button
                  type="button"
                  onClick={clearAllRoles}
                  className="text-[11px] font-semibold text-secondary-text hover:text-navy-900"
                >
                  Clear
                </button>
              </div>
            </div>
            <RoleCheckboxGroup
              selectedRoles={form.targetRoles}
              onChange={(targetRoles) => setForm((prev) => ({ ...prev, targetRoles }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-semibold text-navy-900">Additional targeting</span>

            <label className={choiceCardClass(form.courseEnabled)}>
              <input
                type="checkbox"
                checked={form.courseEnabled}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    courseEnabled: event.target.checked,
                    courseId: event.target.checked ? prev.courseId ?? courses[0]?.id : undefined,
                  }))
                }
                className="mt-0.5 accent-lemon-600"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-navy-900">Specific course</span>
                <span className="block text-[11.5px] text-secondary-text mt-0.5">
                  Also send to students enrolled in a course
                </span>
                {form.courseEnabled ? (
                  courses.length > 0 ? (
                    <select
                      value={form.courseId ?? courses[0]?.id ?? ''}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, courseId: event.target.value }))
                      }
                      className={`${selectClassName} mt-2`}
                      aria-label="Target course"
                    >
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.code} — {course.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-[12px] text-secondary-text mt-2">
                      No courses available. Create a course first.
                    </p>
                  )
                ) : null}
              </span>
            </label>

            <label className={choiceCardClass(form.specificStudentsEnabled)}>
              <input
                type="checkbox"
                checked={form.specificStudentsEnabled}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    specificStudentsEnabled: event.target.checked,
                    targetPersonIds: event.target.checked ? prev.targetPersonIds : [],
                  }))
                }
                className="mt-0.5 accent-lemon-600"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-navy-900">Specific students</span>
                <span className="block text-[11.5px] text-secondary-text mt-0.5">
                  Pick individual students by name
                </span>
                {form.specificStudentsEnabled ? (
                  <div className="mt-2">
                    <StudentAudiencePicker
                      students={students}
                      selectedIds={form.targetPersonIds}
                      onChange={(targetPersonIds) =>
                        setForm((prev) => ({ ...prev, targetPersonIds }))
                      }
                    />
                  </div>
                ) : null}
              </span>
            </label>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border border-divider bg-navy-50/25 p-4">
          <span className="text-[12px] font-semibold text-navy-900">Who should receive this?</span>

          <label className={choiceCardClass(form.instructorAudience === 'all_my_students')}>
            <input
              type="radio"
              name="instructor-audience"
              checked={form.instructorAudience === 'all_my_students'}
              onChange={() =>
                setForm((prev) => ({
                  ...prev,
                  instructorAudience: 'all_my_students' as InstructorAnnouncementAudience,
                  specificStudentsEnabled: false,
                  targetPersonIds: [],
                }))
              }
              className="mt-0.5 accent-lemon-600"
            />
            <span>
              <span className="block text-[13px] font-semibold text-navy-900">All my students</span>
              <span className="block text-[11.5px] text-secondary-text mt-0.5">
                Everyone enrolled in any of your courses ({students.length} student
                {students.length === 1 ? '' : 's'})
              </span>
            </span>
          </label>

          <label className={choiceCardClass(form.instructorAudience === 'course')}>
            <input
              type="radio"
              name="instructor-audience"
              checked={form.instructorAudience === 'course'}
              onChange={() =>
                setForm((prev) => ({
                  ...prev,
                  instructorAudience: 'course' as InstructorAnnouncementAudience,
                  courseEnabled: true,
                  courseId: prev.courseId ?? courses[0]?.id,
                  specificStudentsEnabled: false,
                  targetPersonIds: [],
                }))
              }
              className="mt-0.5 accent-lemon-600"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-navy-900">Specific course</span>
              <span className="block text-[11.5px] text-secondary-text mt-0.5">
                All students enrolled in one of your courses
              </span>
              {form.instructorAudience === 'course' ? (
                courses.length > 0 ? (
                  <select
                    value={form.courseId ?? courses[0]?.id ?? ''}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, courseId: event.target.value }))
                    }
                    className={`${selectClassName} mt-2`}
                    aria-label="Target course"
                  >
                    {courses.map((course) => {
                      const enrolled = getCourseStudentCount(course.id)
                      return (
                        <option key={course.id} value={course.id}>
                          {course.code} — {course.title} ({enrolled} student{enrolled === 1 ? '' : 's'})
                        </option>
                      )
                    })}
                  </select>
                ) : (
                  <p className="text-[12px] text-secondary-text mt-2">
                    No courses assigned to you yet.
                  </p>
                )
              ) : null}
            </span>
          </label>

          <label className={choiceCardClass(form.instructorAudience === 'selected_students')}>
            <input
              type="radio"
              name="instructor-audience"
              checked={form.instructorAudience === 'selected_students'}
              onChange={() =>
                setForm((prev) => ({
                  ...prev,
                  instructorAudience: 'selected_students' as InstructorAnnouncementAudience,
                  specificStudentsEnabled: true,
                }))
              }
              className="mt-0.5 accent-lemon-600"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-navy-900">Selected students</span>
              <span className="block text-[11.5px] text-secondary-text mt-0.5">
                Choose individual students from your roster
              </span>
              {form.instructorAudience === 'selected_students' ? (
                <div className="mt-2">
                  <StudentAudiencePicker
                    students={students}
                    selectedIds={form.targetPersonIds}
                    onChange={(targetPersonIds) =>
                      setForm((prev) => ({ ...prev, targetPersonIds }))
                    }
                  />
                </div>
              ) : null}
            </span>
          </label>
        </div>
      )}

      {error ? (
        <p className="text-[12px] text-danger font-medium rounded-lg bg-danger-bg/40 border border-danger/20 px-3 py-2">
          {error}
        </p>
      ) : null}
    </Modal>
  )
}

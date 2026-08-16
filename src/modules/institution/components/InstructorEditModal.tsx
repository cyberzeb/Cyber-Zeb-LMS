import { useEffect, useMemo, useState } from 'react'
import { UserRoundPen } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { FormField } from '../../../shared/components/FormField'
import { updateInstructor, type UpdateInstructorInput } from '../api/peopleApi'
import { getCoursesForInstructor } from '../utils/courseAssignmentUtils'
import type { Campus, CourseRecord, PersonRow } from '../types'

interface InstructorEditModalProps {
  open: boolean
  instructor: PersonRow | null
  campuses: Campus[]
  courses: CourseRecord[]
  onClose: () => void
  onSaved: (instructor: PersonRow, courseIds: string[]) => void
}

const statusOptions = ['active', 'invited', 'suspended']

export function InstructorEditModal({
  open,
  instructor,
  campuses,
  courses,
  onClose,
  onSaved,
}: InstructorEditModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<UpdateInstructorInput>({
    name: '',
    email: '',
    campusId: campuses[0]?.id ?? '',
    status: 'active',
  })
  const [courseIds, setCourseIds] = useState<string[]>([])

  useEffect(() => {
    if (!instructor || !open) return
    const assigned = getCoursesForInstructor(courses, instructor.id, instructor.name)
    setProfile({
      name: instructor.name,
      email: instructor.email,
      campusId: instructor.campusId ?? campuses[0]?.id ?? '',
      status: instructor.status,
    })
    setCourseIds(assigned.map((c) => c.id))
    setError('')
  }, [instructor, open, campuses, courses])

  const courseOptions = useMemo(
    () =>
      [...courses].sort((a, b) =>
        `${a.code} ${a.title}`.localeCompare(`${b.code} ${b.title}`),
      ),
    [courses],
  )

  const toggleCourse = (courseId: string) => {
    setCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId],
    )
  }

  const handleSave = async () => {
    if (!instructor) return
    setSaving(true)
    setError('')
    try {
      const updated = await updateInstructor(instructor.id, profile, campuses)
      onSaved(updated, courseIds)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update instructor.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={<UserRoundPen size={18} />}
      title="Edit Instructor"
      description="Instructors teach courses — not departments. Select every course they should follow and manage."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <FormField
        label="Full Name"
        value={profile.name}
        onChange={(v) => setProfile({ ...profile, name: v })}
        placeholder="e.g. Dr. Aaron Selassie"
      />
      <FormField
        label="Email Address"
        value={profile.email}
        onChange={(v) => setProfile({ ...profile, email: v })}
        placeholder="e.g. a.selassie@berana.edu"
      />
      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-semibold text-navy-900">Campus</span>
        <select
          value={profile.campusId}
          onChange={(e) => setProfile({ ...profile, campusId: e.target.value })}
          className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25"
        >
          {campuses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
      </label>

      <div>
        <div className="text-[12px] font-semibold text-navy-900 mb-2">
          Assigned Courses ({courseIds.length})
        </div>
        {courseOptions.length > 0 ? (
          <div className="max-h-48 overflow-y-auto app-scroll space-y-1.5 rounded-xl border border-divider/70 p-2">
            {courseOptions.map((course) => {
              const checked = courseIds.includes(course.id)
              const taughtByOther =
                course.instructorId &&
                course.instructorId !== instructor?.id &&
                course.instructor !== 'Unassigned'
              return (
                <label
                  key={course.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer border transition-colors ${
                    checked
                      ? 'border-lemon-500/40 bg-lemon-50/50'
                      : 'border-transparent hover:bg-navy-50/60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCourse(course.id)}
                    className="mt-0.5 accent-lemon-600"
                  />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-navy-900 truncate">
                      {course.code} — {course.title}
                    </div>
                    <div className="text-[11px] text-secondary-text truncate">
                      {course.department}
                      {taughtByOther ? ` · currently ${course.instructor}` : ''}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        ) : (
          <p className="text-[12px] text-secondary-text">
            Create courses in the Course Catalog first, then assign them here.
          </p>
        )}
      </div>

      <FormField
        label="Status"
        type="select"
        value={profile.status}
        options={statusOptions}
        onChange={(v) => setProfile({ ...profile, status: v as PersonRow['status'] })}
      />
      {error ? <p className="text-[12px] text-danger font-medium">{error}</p> : null}
    </Modal>
  )
}

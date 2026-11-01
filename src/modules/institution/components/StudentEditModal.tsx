import { useEffect, useMemo, useState } from 'react'
import { UserRoundPen } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { FormField } from '../../../shared/components/FormField'
import { updateStudent, type UpdateStudentInput } from '../api/peopleApi'
import { usePrograms } from '../hooks/usePrograms'
import { programSemesters, programYears, resolveStudentProgram } from '../utils/programUtils'
import {
  formatProgramSemester,
  formatStudyYear,
  programSemesterOptions,
  studyYearOptions,
} from '../utils/studyYearUtils'
import type { Campus, Department, PersonRow } from '../types'

interface StudentEditModalProps {
  open: boolean
  student: PersonRow | null
  campuses: Campus[]
  departments: Department[]
  onClose: () => void
  onSaved: (student: PersonRow) => void
}

const statusOptions = ['active', 'invited', 'suspended']

export function StudentEditModal({
  open,
  student,
  campuses,
  departments,
  onClose,
  onSaved,
}: StudentEditModalProps) {
  const { programs } = usePrograms()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<UpdateStudentInput>({
    name: '',
    email: '',
    campusId: campuses[0]?.id ?? '',
    programId: '',
    studyYear: 1,
    programSemester: 1,
    status: 'active',
  })

  useEffect(() => {
    if (!student || !open) return
    const program = resolveStudentProgram(student, programs, departments)
    setForm({
      name: student.name,
      email: student.email,
      campusId: student.campusId ?? campuses[0]?.id ?? '',
      programId: program?.id ?? '',
      studyYear: student.studyYear ?? 1,
      programSemester: student.programSemester ?? 1,
      status: student.status,
    })
    setError('')
  }, [student, open, campuses, departments, programs])

  // Programs taught on the chosen campus, grouped by department in the select.
  const programOptions = useMemo(
    () => programs.filter((p) => p.campusId === form.campusId && p.status !== 'archived'),
    [programs, form.campusId],
  )

  const selectedProgram = programOptions.find((p) => p.id === form.programId)
  const maxYears = programYears(selectedProgram)
  const semestersPerYear = programSemesters(selectedProgram)

  useEffect(() => {
    if (!programOptions.some((p) => p.id === form.programId)) {
      setForm((prev) => ({ ...prev, programId: programOptions[0]?.id ?? '', studyYear: 1 }))
    }
  }, [programOptions, form.programId])

  useEffect(() => {
    if (form.programSemester > semestersPerYear) {
      setForm((prev) => ({ ...prev, programSemester: semestersPerYear }))
    }
  }, [semestersPerYear, form.programSemester])

  useEffect(() => {
    if (form.studyYear > maxYears) {
      setForm((prev) => ({ ...prev, studyYear: maxYears }))
    }
  }, [maxYears, form.studyYear])

  const handleSave = async () => {
    if (!student) return
    setSaving(true)
    setError('')
    try {
      const updated = await updateStudent(student.id, form, campuses, departments, programs)
      onSaved(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update student.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<UserRoundPen size={18} />}
      title="Edit Student"
      description="Profile, program, study year and current semester."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !form.programId}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <FormField
        label="Full Name"
        value={form.name}
        onChange={(v) => setForm({ ...form, name: v })}
        placeholder="e.g. Selam Girma"
      />
      <FormField
        label="Email Address"
        value={form.email}
        onChange={(v) => setForm({ ...form, email: v })}
        placeholder="e.g. selam.girma@berana.edu"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Campus</span>
          <select
            value={form.campusId}
            onChange={(e) => setForm({ ...form, campusId: e.target.value, programId: '', studyYear: 1 })}
            className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25"
          >
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Program</span>
          <select
            value={form.programId}
            onChange={(e) => setForm({ ...form, programId: e.target.value, studyYear: 1 })}
            className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25"
          >
            {departments
              .filter((d) => programOptions.some((p) => p.departmentId === d.id))
              .map((d) => (
                <optgroup key={d.id} label={d.name}>
                  {programOptions
                    .filter((p) => p.departmentId === d.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.durationYears} yrs)
                      </option>
                    ))}
                </optgroup>
              ))}
          </select>
        </label>
      </div>
      <FormField
        label="Study Year"
        type="select"
        value={formatStudyYear(form.studyYear)}
        options={studyYearOptions(maxYears).map(formatStudyYear)}
        onChange={(label) => {
          const year = studyYearOptions(maxYears).find((y) => formatStudyYear(y) === label)
          if (year) setForm({ ...form, studyYear: year })
        }}
        hint={selectedProgram ? `${selectedProgram.code} · ${selectedProgram.department} · ${maxYears} years` : undefined}
      />
      <FormField
        label="Program Semester"
        type="select"
        value={formatProgramSemester(form.programSemester)}
        options={programSemesterOptions(semestersPerYear).map(formatProgramSemester)}
        onChange={(label) => {
          const sem = programSemesterOptions(semestersPerYear).find(
            (s) => formatProgramSemester(s) === label,
          )
          if (sem) setForm({ ...form, programSemester: sem })
        }}
        hint="Semester within the current study year (not a calendar year)."
      />
      <FormField
        label="Status"
        type="select"
        value={form.status}
        options={statusOptions}
        onChange={(v) => setForm({ ...form, status: v as PersonRow['status'] })}
      />
      {error ? <p className="text-[12px] text-danger font-medium">{error}</p> : null}
    </Modal>
  )
}

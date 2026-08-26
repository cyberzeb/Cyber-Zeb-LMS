import { useEffect, useMemo, useState } from 'react'
import { Settings2 } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { FormField } from '../../../shared/components/FormField'
import { useCourses } from '../hooks/useCourses'
import { DEFAULT_SEMESTERS_PER_YEAR } from '../utils/academicTermUtils'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { getEligibleDepartmentHeads, resolveDepartmentHeadId } from '../utils/departmentHeadUtils'
import type { Campus, College, Department, PersonRow, ProgramLevel } from '../types'

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
  const { renameDepartmentInCourses } = useCourses()

  const [form, setForm] = useState({
    name: '',
    headName: '',
    headId: '',
    campusId: '',
    collegeId: '',
    description: '',
    programCode: '',
    programLevel: 'Undergraduate' as ProgramLevel,
    maxYears: '4',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!department || !open) return
    setForm({
      name: department.name,
      headName: department.headName,
      headId: resolveDepartmentHeadId(department, people),
      campusId: department.campusId,
      collegeId: department.collegeId,
      description: department.description ?? '',
      programCode: department.programCode ?? '',
      programLevel: department.programLevel ?? 'Undergraduate',
      maxYears: String(department.maxYears ?? 4),
    })
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
    const maxYears = Math.max(1, Number(form.maxYears) || 4)
    const updated: Department = {
      ...department,
      name: nextName,
      headId: form.headId || undefined,
      headName: headPerson?.name ?? (form.headName.trim() || 'To be assigned'),
      campusId: form.campusId,
      collegeId: form.collegeId,
      description: form.description.trim(),
      programCode: form.programCode.trim() || undefined,
      programLevel: form.programLevel,
      maxYears,
      semestersPerYear: department.semestersPerYear ?? DEFAULT_SEMESTERS_PER_YEAR,
    }

    renameDepartmentInCourses(prevName, nextName)
    onSaved(updated, prevName)
    onClose()
  }

  if (!department) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      icon={<Settings2 size={18} />}
      title={department.name}
      description="Configure this academic department's program details and leadership."
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
      {error ? (
        <p className="text-[12.5px] font-semibold text-danger bg-danger-bg px-3 py-2 rounded-lg">
          {error}
        </p>
      ) : null}

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
        <FormField
          label="Program Code"
          value={form.programCode}
          onChange={(v) => setForm({ ...form, programCode: v })}
          placeholder="e.g. BSC-CS"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            hint={`${DEFAULT_SEMESTERS_PER_YEAR} semesters per year are provisioned on the academic calendar.`}
          />
        </div>
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

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
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
    </Modal>
  )
}

import { useEffect, useState } from 'react'
import { GraduationCap } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FormField } from '../../../shared/components/FormField'
import { Modal } from '../../../shared/components/Modal'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import type { Department, ProgramLevel, ProgramRow } from '../types'
import { formatDuration, LEVEL_DEGREE, PROGRAM_LEVELS } from '../utils/programUtils'

interface ProgramFormModalProps {
  open: boolean
  /** null creates a new program. */
  program: ProgramRow | null
  departments: Department[]
  existingCodes: string[]
  defaultDepartmentId?: string
  onClose: () => void
  onSave: (program: ProgramRow) => void
}

const STATUS_OPTIONS: ProgramRow['status'][] = ['active', 'draft', 'archived']

/** Create or edit a program: which department offers it, its level, length and credits. */
export function ProgramFormModal({
  open,
  program,
  departments,
  existingCodes,
  defaultDepartmentId,
  onClose,
  onSave,
}: ProgramFormModalProps) {
  const [form, setForm] = useState({
    departmentId: '',
    level: 'Undergraduate' as ProgramLevel,
    name: '',
    code: '',
    durationYears: '4',
    semestersPerYear: '2',
    totalCredits: '',
    description: '',
    status: 'active' as ProgramRow['status'],
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    if (program) {
      setForm({
        departmentId: program.departmentId,
        level: program.level,
        name: program.name,
        code: program.code,
        durationYears: String(program.durationYears),
        semestersPerYear: String(program.semestersPerYear),
        totalCredits: program.totalCredits ? String(program.totalCredits) : '',
        description: program.description ?? '',
        status: program.status,
      })
    } else {
      const departmentId = defaultDepartmentId ?? departments[0]?.id ?? ''
      setForm({
        departmentId,
        level: 'Undergraduate',
        name: '',
        code: '',
        durationYears: '4',
        semestersPerYear: '2',
        totalCredits: '',
        description: '',
        status: 'active',
      })
    }
  }, [open, program, departments, defaultDepartmentId])

  const department = departments.find((d) => d.id === form.departmentId)
  const suggestedName = department ? `${LEVEL_DEGREE[form.level]} in ${department.name}` : ''

  const handleSave = () => {
    const name = form.name.trim() || suggestedName
    const code = form.code.trim().toUpperCase()
    const years = Number(form.durationYears)
    const semesters = Number(form.semestersPerYear)
    if (!department) return setError('Choose the department that offers this program.')
    if (!name || !code) return setError('Program name and code are required.')
    if (existingCodes.some((c) => c.toUpperCase() === code && c.toUpperCase() !== program?.code.toUpperCase())) {
      return setError(`Another program already uses the code ${code}.`)
    }
    if (!Number.isInteger(years) || years < 1 || years > 8) return setError('Duration must be 1–8 years.')
    if (!Number.isInteger(semesters) || semesters < 1 || semesters > 4) {
      return setError('Semesters per year must be 1–4.')
    }
    // Shrinking the program drops curriculum entries that no longer fit.
    const curriculum = (program?.curriculum ?? []).filter((e) => e.studyYear <= years && e.semester <= semesters)
    onSave({
      id: program?.id ?? createId('prog'),
      name,
      code,
      level: form.level,
      departmentId: department.id,
      department: department.name,
      campusId: department.campusId,
      durationYears: years,
      semestersPerYear: semesters,
      duration: formatDuration(years),
      totalCredits: Number(form.totalCredits) || undefined,
      description: form.description.trim() || undefined,
      curriculum,
      enrolledCount: program?.enrolledCount ?? 0,
      courseCount: new Set(curriculum.map((e) => e.courseId)).size,
      status: form.status,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<GraduationCap size={18} />}
      title={program ? 'Edit Program' : 'Add Program'}
      description="A program is a degree, diploma or certificate offered by one department."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {program ? 'Save Changes' : 'Create Program'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Department"
          type="select"
          value={form.departmentId}
          options={departments.map((d) => d.id)}
          optionLabels={Object.fromEntries(departments.map((d) => [d.id, d.name]))}
          onChange={(v) => setForm({ ...form, departmentId: v })}
        />
        <FormField
          label="Level"
          type="select"
          value={form.level}
          options={PROGRAM_LEVELS}
          onChange={(v) => setForm({ ...form, level: v as ProgramLevel })}
        />
      </div>
      <FormField
        label="Program Name"
        value={form.name}
        onChange={(v) => setForm({ ...form, name: v })}
        placeholder={suggestedName || 'e.g. MSc in Computer Science'}
        hint={!form.name && suggestedName ? `Leave empty to use “${suggestedName}”.` : undefined}
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <FormField
          label="Code"
          value={form.code}
          onChange={(v) => setForm({ ...form, code: v })}
          placeholder="e.g. MSC-CS"
        />
        <FormField
          label="Years"
          type="number"
          value={form.durationYears}
          onChange={(v) => setForm({ ...form, durationYears: v })}
          min="1"
          max="8"
        />
        <FormField
          label="Semesters / year"
          type="number"
          value={form.semestersPerYear}
          onChange={(v) => setForm({ ...form, semestersPerYear: v })}
          min="1"
          max="4"
        />
        <FormField
          label="Total credits"
          type="number"
          value={form.totalCredits}
          onChange={(v) => setForm({ ...form, totalCredits: v })}
          placeholder="e.g. 140"
        />
      </div>
      <FormField
        label="Description"
        type="textarea"
        value={form.description}
        onChange={(v) => setForm({ ...form, description: v })}
        placeholder="What graduates of this program learn"
      />
      {program ? (
        <FormField
          label="Status"
          type="select"
          value={form.status}
          options={STATUS_OPTIONS}
          onChange={(v) => setForm({ ...form, status: v as ProgramRow['status'] })}
        />
      ) : null}
      {error ? <p className="text-[12px] text-danger font-medium">{error}</p> : null}
    </Modal>
  )
}

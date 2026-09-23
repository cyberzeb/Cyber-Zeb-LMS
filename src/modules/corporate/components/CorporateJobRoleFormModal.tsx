import { useEffect, useState } from 'react'
import { Briefcase } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { FormField } from '../../../shared/components/FormField'
import { Button } from '../../../shared/components/Button'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import type { Department } from '../../institution/types'
import type { JobRole, JobRoleStatus, Skill } from '../types'
import { useCourses } from '../../institution/hooks/useCourses'

export interface JobRoleFormValues {
  title: string
  description: string
  departmentId: string
  requiredSkillIds: string[]
  requiredCourseIds: string[]
  /** Days to complete required training once assigned. */
  trainingDueDays: string
  /** Months a completed course stays valid; empty means it never expires. */
  recertificationMonths: string
  status: JobRoleStatus
}

interface CorporateJobRoleFormModalProps {
  open: boolean
  mode: 'create' | 'edit'
  role: JobRole | null
  departments: Department[]
  skills: Skill[]
  onClose: () => void
  onSave: (values: JobRoleFormValues) => void
}

export function CorporateJobRoleFormModal({
  open,
  mode,
  role,
  departments,
  skills,
  onClose,
  onSave,
}: CorporateJobRoleFormModalProps) {
  const { courses } = useCourses()
  const [form, setForm] = useState<JobRoleFormValues>({
    title: '',
    description: '',
    departmentId: '',
    requiredSkillIds: [],
    requiredCourseIds: [],
    trainingDueDays: '30',
    recertificationMonths: '',
    status: 'active',
  })

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && role) {
      setForm({
        title: role.title,
        description: role.description,
        departmentId: role.departmentId ?? '',
        requiredSkillIds: role.requiredSkillIds,
        requiredCourseIds: role.requiredCourseIds,
        trainingDueDays: String(role.trainingDueDays ?? 30),
        recertificationMonths: role.recertificationMonths
          ? String(role.recertificationMonths)
          : '',
        status: role.status,
      })
    } else {
      setForm({
        title: '',
        description: '',
        departmentId: departments[0]?.id ?? '',
        requiredSkillIds: [],
        requiredCourseIds: [],
        trainingDueDays: '30',
        recertificationMonths: '',
        status: 'active',
      })
    }
  }, [open, mode, role, departments])

  const toggleSkill = (skillId: string) => {
    setForm((prev) => ({
      ...prev,
      requiredSkillIds: prev.requiredSkillIds.includes(skillId)
        ? prev.requiredSkillIds.filter((id) => id !== skillId)
        : [...prev.requiredSkillIds, skillId],
    }))
  }

  const toggleCourse = (courseId: string) => {
    setForm((prev) => ({
      ...prev,
      requiredCourseIds: prev.requiredCourseIds.includes(courseId)
        ? prev.requiredCourseIds.filter((id) => id !== courseId)
        : [...prev.requiredCourseIds, courseId],
    }))
  }

  return (
    <Modal
      open={open}
      title={mode === 'create' ? 'Create job role' : 'Edit job role'}
      description="Link required skills and training modules to this role."
      icon={<Briefcase size={18} className="text-lemon-600" />}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={!form.title.trim()}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Role title" value={form.title} onChange={(title) => setForm((p) => ({ ...p, title }))} />
        <FormField label="Description" type="textarea" value={form.description} onChange={(description) => setForm((p) => ({ ...p, description }))} />
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Department</span>
          <SelectMenu
            value={form.departmentId}
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
            onChange={(departmentId) => setForm((p) => ({ ...p, departmentId }))}
          />
        </label>
        <div>
          <p className="text-[12px] font-semibold text-navy-900 mb-2">Required skills</p>
          <div className="flex flex-wrap gap-2">
            {skills.filter((s) => s.status === 'active').map((skill) => (
              <button
                key={skill.id}
                type="button"
                onClick={() => toggleSkill(skill.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] border ${
                  form.requiredSkillIds.includes(skill.id)
                    ? 'bg-lemon-50 border-lemon-500 text-navy-900'
                    : 'border-divider text-secondary-text'
                }`}
              >
                {skill.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[12px] font-semibold text-navy-900 mb-2">Required training</p>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {courses.filter((c) => c.status === 'published').map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => toggleCourse(course.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] border ${
                  form.requiredCourseIds.includes(course.id)
                    ? 'bg-lemon-50 border-lemon-500 text-navy-900'
                    : 'border-divider text-secondary-text'
                }`}
              >
                {course.code}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            label="Days to complete"
            type="number"
            value={form.trainingDueDays}
            onChange={(value) => setForm((p) => ({ ...p, trainingDueDays: value }))}
          />
          <FormField
            label="Recertify after (months)"
            type="number"
            value={form.recertificationMonths}
            onChange={(value) => setForm((p) => ({ ...p, recertificationMonths: value }))}
          />
        </div>
        <p className="-mt-1 text-[11.5px] text-secondary-text">
          Required training is assigned with a due date this many days ahead. Leave
          recertification empty if the training never expires.
        </p>
        <FormField label="Status" type="select" value={form.status} onChange={(status) => setForm((p) => ({ ...p, status: status as JobRoleStatus }))} options={['active', 'inactive']} />
      </div>
    </Modal>
  )
}

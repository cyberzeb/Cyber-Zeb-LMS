import { useMemo, useState } from 'react'
import { GraduationCap } from 'lucide-react'

import { Button } from '../../../shared/components/Button'
import { FormField } from '../../../shared/components/FormField'
import { Modal } from '../../../shared/components/Modal'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import type { CourseRecord } from '../../institution/types'
import type { DeliveryMode, TrainingProgram, TrainingProgramLevel, TrainingProgramStatus } from '../types'
import { DEFAULT_MIN_ATTENDANCE, DELIVERY_LABEL } from '../utils/trainingUtils'

type ProgramInput = Omit<TrainingProgram, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }

interface Props {
  program: TrainingProgram | null
  courses: CourseRecord[]
  divisions: { id: string; name: string }[]
  templates: { id: string; name: string }[]
  onClose: () => void
  onSave: (input: ProgramInput) => void
}

const LEVELS: TrainingProgramLevel[] = ['Foundational', 'Intermediate', 'Advanced', 'Executive']

function initial(program: TrainingProgram | null) {
  return {
    code: program?.code ?? '',
    name: program?.name ?? '',
    description: program?.description ?? '',
    divisionId: program?.divisionId ?? '',
    level: program?.level ?? 'Foundational',
    deliveryMode: program?.deliveryMode ?? 'in-person',
    durationWeeks: String(program?.durationWeeks ?? 4),
    totalHours: String(program?.totalHours ?? 24),
    courseIds: program?.courseIds ?? [],
    price: String(program?.price ?? 0),
    currency: program?.currency ?? 'ETB',
    minAttendance: String(program?.minAttendance ?? DEFAULT_MIN_ATTENDANCE),
    credentialType: program?.credentialType ?? 'Certificate of Completion',
    certificateTemplateId: program?.certificateTemplateId ?? '',
    skills: (program?.skills ?? []).join(', '),
    status: program?.status ?? 'draft',
  }
}

/** Create or edit a training program: what it teaches, what it costs and how it is certified. */
export function ProgramFormModal({ program, courses, divisions, templates, onClose, onSave }: Props) {
  const [form, setForm] = useState(() => initial(program))
  const [courseQuery, setCourseQuery] = useState('')
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }))

  const visibleCourses = useMemo(() => {
    const q = courseQuery.trim().toLowerCase()
    return courses.filter((c) => c.status !== 'archived' && (!q || `${c.code} ${c.title}`.toLowerCase().includes(q)))
  }, [courses, courseQuery])

  const errors: string[] = []
  if (!form.code.trim()) errors.push('Add a program code.')
  if (!form.name.trim()) errors.push('Add a program name.')
  if (!form.courseIds.length) errors.push('Pick at least one course.')
  if (Number(form.price) < 0 || Number.isNaN(Number(form.price))) errors.push('The price must be 0 or more.')

  function toggleCourse(id: string) {
    set('courseIds', form.courseIds.includes(id) ? form.courseIds.filter((c) => c !== id) : [...form.courseIds, id])
  }

  function submit() {
    if (errors.length) return
    const division = divisions.find((d) => d.id === form.divisionId)
    onSave({
      id: program?.id,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim(),
      divisionId: form.divisionId || undefined,
      divisionName: division?.name,
      level: form.level as TrainingProgramLevel,
      deliveryMode: form.deliveryMode as DeliveryMode,
      durationWeeks: Math.max(1, Number(form.durationWeeks) || 1),
      totalHours: Math.max(0, Number(form.totalHours) || 0),
      courseIds: form.courseIds,
      price: Math.max(0, Number(form.price) || 0),
      currency: form.currency.trim().toUpperCase() || 'ETB',
      minAttendance: Math.max(0, Math.min(100, Number(form.minAttendance) || 0)),
      credentialType: form.credentialType.trim() || 'Certificate of Completion',
      certificateTemplateId: form.certificateTemplateId || undefined,
      certificateEnabled: true,
      skills: form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      status: form.status as TrainingProgramStatus,
    })
  }

  return (
    <Modal
      open
      size="lg"
      icon={<GraduationCap size={18} />}
      title={program ? 'Edit training program' : 'New training program'}
      description="A program bundles catalog courses. It runs as cohorts, and learners who finish it earn one certificate."
      onClose={onClose}
      footer={
        <>
          <span className="mr-auto text-[12px] text-danger">{errors[0] ?? ''}</span>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={errors.length > 0}>
            {program ? 'Save changes' : 'Create program'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="Code" value={form.code} onChange={(v) => set('code', v)} placeholder="PMP-101" />
        <div className="sm:col-span-2">
          <FormField label="Program name" value={form.name} onChange={(v) => set('name', v)} placeholder="Project Management Professional" />
        </div>
        <div className="sm:col-span-3">
          <FormField label="Description" type="textarea" value={form.description} onChange={(v) => set('description', v)} placeholder="Who it is for and what they will be able to do." />
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Training division</span>
          <SelectMenu
            value={form.divisionId}
            onChange={(v) => set('divisionId', v)}
            options={[{ value: '', label: 'No division' }, ...divisions.map((d) => ({ value: d.id, label: d.name }))]}
            aria-label="Training division"
          />
        </label>
        <FormField label="Level" type="select" value={form.level} onChange={(v) => set('level', v as TrainingProgramLevel)} options={LEVELS} />
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Delivery</span>
          <SelectMenu
            value={form.deliveryMode}
            onChange={(v) => set('deliveryMode', v as DeliveryMode)}
            options={Object.entries(DELIVERY_LABEL).map(([value, label]) => ({ value, label }))}
            aria-label="Delivery"
          />
        </label>
        <FormField label="Duration (weeks)" type="number" min="1" value={form.durationWeeks} onChange={(v) => set('durationWeeks', v)} />
        <FormField label="Total hours" type="number" min="0" value={form.totalHours} onChange={(v) => set('totalHours', v)} />
        <FormField label="Status" type="select" value={form.status} onChange={(v) => set('status', v as TrainingProgramStatus)} options={['draft', 'active', 'archived']} hint="Only active programs take registrations." />
        <FormField label="Price (0 = free)" type="number" min="0" value={form.price} onChange={(v) => set('price', v)} />
        <FormField label="Currency" value={form.currency} onChange={(v) => set('currency', v)} />
        <FormField label="Minimum attendance (%)" type="number" min="0" max="100" value={form.minAttendance} onChange={(v) => set('minAttendance', v)} hint="Needed for the certificate." />
        <FormField label="Credential" value={form.credentialType} onChange={(v) => set('credentialType', v)} />
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Certificate design</span>
          <SelectMenu
            value={form.certificateTemplateId}
            onChange={(v) => set('certificateTemplateId', v)}
            options={[{ value: '', label: 'Default design' }, ...templates.map((t) => ({ value: t.id, label: t.name }))]}
            aria-label="Certificate design"
          />
        </label>
        <FormField label="Skills (comma separated)" value={form.skills} onChange={(v) => set('skills', v)} placeholder="Planning, Risk, Agile" />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-[12px] font-semibold text-navy-900">
            Courses in this program <span className="font-normal text-secondary-text">({form.courseIds.length} selected, in this order)</span>
          </p>
          <input
            value={courseQuery}
            onChange={(e) => setCourseQuery(e.target.value)}
            placeholder="Filter courses…"
            className="w-48 rounded-lg border border-divider bg-white px-3 py-1.5 text-[12px] text-navy-900 dark:bg-navy-50"
          />
        </div>
        <div className="max-h-56 overflow-y-auto rounded-xl border border-divider">
          {visibleCourses.map((c) => {
            const index = form.courseIds.indexOf(c.id)
            return (
              <label key={c.id} className="flex cursor-pointer items-center gap-3 border-b border-divider px-3 py-2 last:border-0 hover:bg-navy-50 dark:hover:bg-white/5">
                <input type="checkbox" checked={index >= 0} onChange={() => toggleCourse(c.id)} className="accent-lemon-500" />
                <span className="flex-1 text-[13px] text-navy-900">
                  <span className="font-semibold">{c.code}</span> — {c.title}
                </span>
                {index >= 0 ? <span className="text-[11px] font-semibold text-secondary-text">#{index + 1}</span> : null}
              </label>
            )
          })}
          {visibleCourses.length === 0 ? <p className="px-3 py-6 text-center text-[12px] text-secondary-text">No courses in the catalog yet. Add them under Course Catalog.</p> : null}
        </div>
      </div>
    </Modal>
  )
}

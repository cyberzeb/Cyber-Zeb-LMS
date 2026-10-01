/**
 * Training divisions: how the institute groups its programs (for example
 * "Data & Technology"), each with a lead trainer.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Network, Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '../../../shared/components/Button'
import { FormField } from '../../../shared/components/FormField'
import { Modal } from '../../../shared/components/Modal'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { useOrgStructure } from '../../institution/hooks/useOrgStructure'
import { usePeople } from '../../institution/hooks/usePeople'
import type { Department } from '../../institution/types'
import { useCohortRegistrations, useCohorts, useTrainingPrograms } from '../hooks/useTrainingData'
import { cohortState } from '../utils/trainingUtils'

interface DivisionForm {
  id?: string
  name: string
  description: string
  headId: string
}

export function TrainingDivisionsPage() {
  const { notify } = useToast()
  const { departments, setDepartments, colleges } = useOrgStructure()
  const { people } = usePeople()
  const { programs } = useTrainingPrograms()
  const { cohorts } = useCohorts()
  const { registrations } = useCohortRegistrations()
  const [form, setForm] = useState<DivisionForm | null>(null)
  const [deleting, setDeleting] = useState<Department | null>(null)

  const trainers = useMemo(() => people.filter((p) => p.role === 'Instructor' && p.status === 'active'), [people])
  const rows = useMemo(
    () =>
      departments.map((d) => {
        const own = programs.filter((p) => p.divisionId === d.id)
        const ids = new Set(own.map((p) => p.id))
        return {
          d,
          programs: own,
          running: cohorts.filter((c) => ids.has(c.programId) && cohortState(c) === 'active').length,
          learners: new Set(registrations.filter((r) => ids.has(r.programId) && r.status === 'enrolled').map((r) => r.studentId)).size,
          trainers: trainers.filter((t) => t.departmentId === d.id).length,
        }
      }),
    [departments, programs, cohorts, registrations, trainers],
  )

  function save() {
    if (!form || form.name.trim().length < 2) return
    const head = trainers.find((t) => t.id === form.headId)
    if (form.id) {
      setDepartments((prev) =>
        prev.map((d) => (d.id === form.id ? { ...d, name: form.name.trim(), description: form.description.trim(), headId: head?.id, headName: head?.name ?? '' } : d)),
      )
      notify(`${form.name.trim()} saved.`)
    } else {
      const division: Department = {
        id: createId('div'),
        name: form.name.trim(),
        description: form.description.trim(),
        headId: head?.id,
        headName: head?.name ?? '',
        studentsCount: 0,
        facultyCount: 0,
        icon: '📚',
        campusId: 'c1',
        collegeId: colleges[0]?.id ?? '',
        status: 'active',
      }
      setDepartments((prev) => [...prev, division])
      notify(`${division.name} added.`)
    }
    setForm(null)
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Training Divisions"
        subtitle="How your programs are grouped, and who leads each area."
        actions={
          <Button variant="primary" onClick={() => setForm({ name: '', description: '', headId: '' })}>
            <Plus size={16} /> New division
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {rows.map(({ d, programs: own, running, learners, trainers: trainerCount }) => (
          <GlassCard key={d.id} className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lemon-50 text-lemon-700 dark:bg-lemon-500/10">
                  <Network size={18} />
                </span>
                <div>
                  <h3 className="text-[16px] font-bold text-navy-900">{d.name}</h3>
                  <p className="text-[12.5px] text-secondary-text">Lead: {d.headName || 'not set'}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" aria-label="Edit division" onClick={() => setForm({ id: d.id, name: d.name, description: d.description ?? '', headId: d.headId ?? trainers.find((t) => t.name === d.headName)?.id ?? '' })}>
                  <Pencil size={14} />
                </Button>
                <Button variant="ghost" size="sm" aria-label="Delete division" onClick={() => setDeleting(d)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
            {d.description ? <p className="text-[13px] text-secondary-text">{d.description}</p> : null}
            <div className="grid grid-cols-4 gap-2 rounded-xl bg-navy-50/60 p-3 text-center dark:bg-white/5">
              {[
                ['Programs', own.length],
                ['Running', running],
                ['Learners', learners],
                ['Trainers', trainerCount],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-[16px] font-bold text-navy-900">{value}</p>
                  <p className="text-[11px] text-secondary-text">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {own.map((p) => (
                <Link key={p.id} to={`/admin/training/cohorts?program=${p.id}`} className="rounded-md bg-navy-50 px-2 py-0.5 text-[11.5px] font-medium text-navy-700 hover:underline dark:bg-white/5">
                  {p.name}
                </Link>
              ))}
              {own.length === 0 ? <span className="text-[12px] text-secondary-text">No programs yet.</span> : null}
            </div>
          </GlassCard>
        ))}
      </div>
      {rows.length === 0 ? <GlassCard className="p-10 text-center text-[13px] text-secondary-text">No divisions yet. Add one to group your programs.</GlassCard> : null}

      <Modal
        open={form !== null}
        onClose={() => setForm(null)}
        title={form?.id ? 'Edit division' : 'New division'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={!form || form.name.trim().length < 2} onClick={save}>
              Save
            </Button>
          </>
        }
      >
        {form ? (
          <div className="flex flex-col gap-4">
            <FormField label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Data & Technology" />
            <FormField label="Description" type="textarea" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-navy-900">Lead trainer</span>
              <SelectMenu
                value={form.headId}
                onChange={(v) => setForm({ ...form, headId: v })}
                options={[{ value: '', label: 'Not set' }, ...trainers.map((t) => ({ value: t.id, label: t.name }))]}
                aria-label="Lead trainer"
              />
            </label>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete division?"
        description={deleting?.name}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            {deleting && !programs.some((p) => p.divisionId === deleting.id) ? (
              <Button
                variant="danger"
                onClick={() => {
                  setDepartments((prev) => prev.filter((d) => d.id !== deleting.id))
                  notify(`${deleting.name} deleted.`, 'info')
                  setDeleting(null)
                }}
              >
                Delete
              </Button>
            ) : null}
          </>
        }
      >
        <p className="text-[13px] text-secondary-text">
          {deleting && programs.some((p) => p.divisionId === deleting.id)
            ? 'This division still has programs. Move them to another division first.'
            : 'The division has no programs and will be removed.'}
        </p>
      </Modal>
    </div>
  )
}

/**
 * Training programs: what the institute sells. Each program bundles catalog
 * courses, has a price and an attendance rule, and runs as cohorts.
 */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, CalendarPlus, Clock, GraduationCap, Layers, Pencil, Plus, Trash2, Users } from 'lucide-react'

import { Button } from '../../../shared/components/Button'
import { Modal } from '../../../shared/components/Modal'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { useCertificateTemplates } from '../../institution/certificates/useCertificateTemplates'
import { useCourses } from '../../institution/hooks/useCourses'
import { useOrgStructure } from '../../institution/hooks/useOrgStructure'
import { usePeople } from '../../institution/hooks/usePeople'
import { CohortFormModal } from '../components/CohortFormModal'
import { ProgramFormModal } from '../components/ProgramFormModal'
import { useCohortRegistrations, useCohorts, useTrainingPrograms } from '../hooks/useTrainingData'
import type { TrainingProgram } from '../types'
import { cohortState, DELIVERY_LABEL, formatMoney } from '../utils/trainingUtils'

const STAT = 17
const STATUS_TONE = { active: 'success', draft: 'warning', archived: 'neutral' } as const

export function TrainingProgramsPage() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const { programs, saveProgram, deleteProgram } = useTrainingPrograms()
  const { cohorts, saveCohort } = useCohorts()
  const { registrations } = useCohortRegistrations()
  const { courses } = useCourses()
  const { departments } = useOrgStructure()
  const { templates } = useCertificateTemplates()
  const { people } = usePeople()

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [editing, setEditing] = useState<TrainingProgram | 'new' | null>(null)
  const [scheduleFor, setScheduleFor] = useState<TrainingProgram | null>(null)
  const [deleting, setDeleting] = useState<TrainingProgram | null>(null)

  const trainers = useMemo(() => people.filter((p) => p.role === 'Instructor' && p.status === 'active'), [people])
  const courseById = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses])

  const stats = useMemo(() => {
    return programs.map((p) => {
      const own = cohorts.filter((c) => c.programId === p.id)
      const states = own.map((c) => cohortState(c))
      const enrolled = registrations.filter((r) => r.programId === p.id && r.status === 'enrolled').length
      return {
        program: p,
        cohorts: own.length,
        running: states.filter((s) => s === 'active').length,
        upcoming: states.filter((s) => s === 'upcoming').length,
        enrolled,
      }
    })
  }, [programs, cohorts, registrations])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return stats.filter(
      ({ program }) =>
        (status === 'all' || program.status === status) &&
        (!q || `${program.code} ${program.name} ${program.skills.join(' ')}`.toLowerCase().includes(q)),
    )
  }, [stats, query, status])

  const totalEnrolled = registrations.filter((r) => r.status === 'enrolled').length

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Training Programs"
        subtitle="What you offer: each program bundles courses, has a price, and runs as dated cohorts."
        actions={
          <Button variant="primary" onClick={() => setEditing('new')}>
            <Plus size={16} />
            New program
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBlock label="Programs" value={programs.length} sub={`${programs.filter((p) => p.status === 'active').length} open for registration`} icon={<GraduationCap size={STAT} />} />
        <StatBlock label="Running cohorts" value={stats.reduce((s, x) => s + x.running, 0)} sub={`${stats.reduce((s, x) => s + x.upcoming, 0)} upcoming`} icon={<Layers size={STAT} />} iconBg="bg-info-bg text-info" />
        <StatBlock label="Learners enrolled" value={totalEnrolled} icon={<Users size={STAT} />} iconBg="bg-success-bg text-success" />
        <StatBlock label="Catalog courses" value={courses.length} sub="Building blocks for programs" icon={<BookOpen size={STAT} />} iconBg="bg-warning-bg text-[#8A6D00]" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SelectMenu
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'All programs' },
            { value: 'active', label: 'Active' },
            { value: 'draft', label: 'Draft' },
            { value: 'archived', label: 'Archived' },
          ]}
          aria-label="Status"
        />
        <SearchInput value={query} onChange={setQuery} placeholder="Search programs or skills…" className="sm:w-80" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {visible.map(({ program, cohorts: cohortCount, running, enrolled }) => (
          <GlassCard key={program.id} className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-secondary-text">
                  {program.code} · {program.level}
                </p>
                <h3 className="mt-0.5 text-[16px] font-bold leading-snug text-navy-900">{program.name}</h3>
              </div>
              <StatusPill label={program.status} tone={STATUS_TONE[program.status]} />
            </div>
            {program.description ? <p className="line-clamp-2 text-[13px] text-secondary-text">{program.description}</p> : null}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-navy-700">
              <span className="inline-flex items-center gap-1">
                <Clock size={13} /> {program.durationWeeks} week{program.durationWeeks === 1 ? '' : 's'} · {program.totalHours} h
              </span>
              <span>{DELIVERY_LABEL[program.deliveryMode] ?? program.deliveryMode}</span>
              <span className="font-semibold text-navy-900">{formatMoney(program.price, program.currency)}</span>
              <span>Min. attendance {program.minAttendance}%</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {program.courseIds.map((id) => (
                <span key={id} className="rounded-md bg-navy-50 px-2 py-0.5 text-[11px] font-medium text-navy-700 dark:bg-white/5">
                  {courseById.get(id)?.code ?? 'Removed course'}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-navy-50/60 p-3 text-center dark:bg-white/5">
              <div>
                <p className="text-[16px] font-bold text-navy-900">{cohortCount}</p>
                <p className="text-[11px] text-secondary-text">Cohorts</p>
              </div>
              <div>
                <p className="text-[16px] font-bold text-navy-900">{running}</p>
                <p className="text-[11px] text-secondary-text">Running</p>
              </div>
              <div>
                <p className="text-[16px] font-bold text-navy-900">{enrolled}</p>
                <p className="text-[11px] text-secondary-text">Enrolled</p>
              </div>
            </div>
            <div className="mt-auto flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => setScheduleFor(program)}>
                <CalendarPlus size={14} />
                Schedule cohort
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/training/cohorts?program=${program.id}`)}>
                View cohorts
              </Button>
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setEditing(program)} aria-label="Edit program">
                <Pencil size={14} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleting(program)} aria-label="Delete program">
                <Trash2 size={14} />
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>
      {visible.length === 0 ? (
        <GlassCard className="p-10 text-center text-[13px] text-secondary-text">
          {programs.length ? 'No programs match your filters.' : 'No programs yet. Create your first one — pick the courses it is made of and set a price.'}
        </GlassCard>
      ) : null}

      {editing ? (
        <ProgramFormModal
          program={editing === 'new' ? null : editing}
          courses={courses}
          divisions={departments.map((d) => ({ id: d.id, name: d.name }))}
          templates={templates.map((t) => ({ id: t.id, name: t.name }))}
          onClose={() => setEditing(null)}
          onSave={(input) => {
            saveProgram(input)
            setEditing(null)
            notify(editing === 'new' ? `${input.name} created.` : `${input.name} saved.`)
          }}
        />
      ) : null}

      {scheduleFor ? (
        <CohortFormModal
          cohort={null}
          programs={programs}
          trainers={trainers}
          defaultProgramId={scheduleFor.id}
          onClose={() => setScheduleFor(null)}
          onSave={(input) => {
            const id = saveCohort(input)
            setScheduleFor(null)
            notify(`${input.name} scheduled.`)
            navigate(`/admin/training/cohorts/${id}`)
          }}
        />
      ) : null}

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete program?"
        description={deleting ? deleting.name : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            {deleting && !cohorts.some((c) => c.programId === deleting.id) ? (
              <Button
                variant="danger"
                onClick={() => {
                  deleteProgram(deleting.id)
                  notify(`${deleting.name} deleted.`, 'info')
                  setDeleting(null)
                }}
              >
                Delete
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  if (deleting) saveProgram({ ...deleting, status: 'archived' })
                  notify('Program archived. Its cohorts and certificates are kept.', 'info')
                  setDeleting(null)
                }}
              >
                Archive instead
              </Button>
            )}
          </>
        }
      >
        <p className="text-[13px] text-secondary-text">
          {deleting && cohorts.some((c) => c.programId === deleting.id)
            ? 'This program has cohorts, so it cannot be deleted. Archive it to stop new registrations while keeping its history.'
            : 'The program has no cohorts and will be removed.'}
        </p>
      </Modal>
    </div>
  )
}

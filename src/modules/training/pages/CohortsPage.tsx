/**
 * Cohorts: every scheduled intake, how full it is and whether it is taking
 * registrations. Open one to manage its roster, attendance and certificates.
 */
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarClock, CalendarPlus, Link2, Layers, PlayCircle, Users } from 'lucide-react'

import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { usePeople } from '../../institution/hooks/usePeople'
import { CohortFormModal } from '../components/CohortFormModal'
import { useCohortRegistrations, useCohorts, useTrainingPrograms } from '../hooks/useTrainingData'
import type { CohortStatus } from '../types'
import { registrationLink } from '../utils/registrationLink'
import { COHORT_META, cohortPrice, cohortState, formatDateRange, formatMoney, seatsTaken } from '../utils/trainingUtils'

const STAT = 17
const TABS = ['All', 'Upcoming', 'Running', 'Completed', 'Cancelled'] as const
const TAB_STATE: Record<(typeof TABS)[number], CohortStatus | null> = {
  All: null,
  Upcoming: 'upcoming',
  Running: 'active',
  Completed: 'completed',
  Cancelled: 'cancelled',
}

export function CohortsPage() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const [params, setParams] = useSearchParams()
  const { programs } = useTrainingPrograms()
  const { cohorts, saveCohort, updateCohort } = useCohorts()
  const { registrations } = useCohortRegistrations()
  const { people } = usePeople()

  const [tab, setTab] = useState<(typeof TABS)[number]>('All')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const programFilter = params.get('program') ?? 'all'

  const programById = useMemo(() => new Map(programs.map((p) => [p.id, p])), [programs])
  const personById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people])
  const trainers = useMemo(() => people.filter((p) => p.role === 'Instructor' && p.status === 'active'), [people])

  const rows = useMemo(
    () =>
      cohorts
        .map((c) => ({
          cohort: c,
          state: cohortState(c),
          program: programById.get(c.programId),
          taken: seatsTaken(c.id, registrations),
          enrolled: registrations.filter((r) => r.cohortId === c.id && r.status === 'enrolled').length,
        }))
        .sort((a, b) => a.cohort.startDate.localeCompare(b.cohort.startDate)),
    [cohorts, programById, registrations],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const wanted = TAB_STATE[tab]
    return rows.filter(
      (r) =>
        (!wanted || r.state === wanted) &&
        (programFilter === 'all' || r.cohort.programId === programFilter) &&
        (!q || `${r.cohort.name} ${r.cohort.code} ${r.program?.name ?? ''}`.toLowerCase().includes(q)),
    )
  }, [rows, tab, programFilter, query])

  const capacity = rows.filter((r) => r.state !== 'cancelled' && r.cohort.seatCapacity > 0)
  const fillRate = capacity.length
    ? Math.round((capacity.reduce((s, r) => s + Math.min(r.taken, r.cohort.seatCapacity), 0) / capacity.reduce((s, r) => s + r.cohort.seatCapacity, 0)) * 100)
    : 0

  async function copyLink(cohortId?: string) {
    try {
      await navigator.clipboard.writeText(registrationLink(cohortId))
      notify('Registration link copied.')
    } catch {
      notify(registrationLink(cohortId), 'info')
    }
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Cohorts"
        subtitle="Scheduled intakes of your programs: dates, seats, trainer and registration."
        actions={
          <>
            <Button variant="secondary" onClick={() => void copyLink()}>
              <Link2 size={16} />
              Registration page link
            </Button>
            <Button variant="primary" onClick={() => setCreating(true)} disabled={!programs.length}>
              <CalendarPlus size={16} />
              Schedule cohort
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBlock label="Upcoming" value={rows.filter((r) => r.state === 'upcoming').length} sub={`${rows.filter((r) => r.state === 'upcoming' && r.cohort.enrollmentOpen).length} taking registrations`} icon={<CalendarClock size={STAT} />} iconBg="bg-info-bg text-info" />
        <StatBlock label="Running now" value={rows.filter((r) => r.state === 'active').length} icon={<PlayCircle size={STAT} />} iconBg="bg-success-bg text-success" />
        <StatBlock label="Seats filled" value={`${fillRate}%`} sub="Across cohorts with a seat limit" icon={<Users size={STAT} />} />
        <StatBlock label="Completed" value={rows.filter((r) => r.state === 'completed').length} icon={<Layers size={STAT} />} iconBg="bg-warning-bg text-[#8A6D00]" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <FilterTabs tabs={[...TABS]} active={tab} onChange={(t) => setTab(t as (typeof TABS)[number])} />
          <SelectMenu
            value={programFilter}
            onChange={(v) => setParams(v === 'all' ? {} : { program: v })}
            options={[{ value: 'all', label: 'All programs' }, ...programs.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` }))]}
            aria-label="Program"
          />
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder="Search cohorts…" className="lg:w-72" />
      </div>

      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-navy-50/60 text-left text-[11px] uppercase tracking-wide text-secondary-text dark:bg-white/5">
              <tr>
                <th className="px-5 py-3 font-medium">Cohort</th>
                <th className="px-5 py-3 font-medium">Dates</th>
                <th className="px-5 py-3 font-medium">Trainer</th>
                <th className="px-5 py-3 font-medium">Seats</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Registration</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(({ cohort, state, program, taken, enrolled }) => {
                const trainer = cohort.trainerId ? personById.get(cohort.trainerId) : undefined
                const cap = cohort.seatCapacity
                return (
                  <tr key={cohort.id} className="border-b border-divider last:border-0 hover:bg-navy-50/40 dark:hover:bg-white/[0.03]">
                    <td className="px-5 py-3">
                      <Link to={`/admin/training/cohorts/${cohort.id}`} className="font-semibold text-navy-900 hover:underline">
                        {cohort.name}
                      </Link>
                      <p className="text-[12px] text-secondary-text">
                        {program ? `${program.code} — ${program.name}` : 'Program removed'}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-navy-900">
                      {formatDateRange(cohort.startDate, cohort.endDate)}
                      {cohort.schedule ? <p className="text-[12px] text-secondary-text">{cohort.schedule}</p> : null}
                    </td>
                    <td className="px-5 py-3 text-navy-900">{trainer?.name ?? <span className="text-danger">Not assigned</span>}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-navy-100 dark:bg-white/10">
                          <div className={`h-full rounded-full ${cap && taken >= cap ? 'bg-danger' : 'bg-lemon-500'}`} style={{ width: `${cap ? Math.min(100, (taken / cap) * 100) : taken ? 100 : 0}%` }} />
                        </div>
                        <span className="whitespace-nowrap text-navy-900">
                          {taken}
                          {cap ? ` / ${cap}` : ''}
                        </span>
                      </div>
                      <p className="text-[12px] text-secondary-text">{enrolled} enrolled</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-navy-900">{formatMoney(cohortPrice(cohort, program), program?.currency)}</td>
                    <td className="px-5 py-3">
                      {state === 'completed' || state === 'cancelled' ? (
                        <span className="text-secondary-text">—</span>
                      ) : (
                        <label className="inline-flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={cohort.enrollmentOpen}
                            onChange={(e) => {
                              updateCohort(cohort.id, { enrollmentOpen: e.target.checked })
                              notify(e.target.checked ? `${cohort.name} is open for registration.` : `Registration for ${cohort.name} closed.`, 'info')
                            }}
                            className="accent-lemon-500"
                          />
                          <span className="text-navy-900">{cohort.enrollmentOpen ? 'Open' : 'Closed'}</span>
                          {cohort.enrollmentOpen ? (
                            <button type="button" onClick={() => void copyLink(cohort.id)} className="text-secondary-text hover:text-navy-900" title="Copy this cohort's registration link">
                              <Link2 size={13} />
                            </button>
                          ) : null}
                        </label>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill label={COHORT_META[state].label} tone={COHORT_META[state].tone} />
                    </td>
                  </tr>
                )
              })}
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-secondary-text">
                    {cohorts.length ? 'No cohorts match your filters.' : programs.length ? 'No cohorts yet. Schedule the first intake of a program.' : 'Create a training program first, then schedule its cohorts.'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {creating ? (
        <CohortFormModal
          cohort={null}
          programs={programs.filter((p) => p.status !== 'archived')}
          trainers={trainers}
          defaultProgramId={programFilter !== 'all' ? programFilter : undefined}
          onClose={() => setCreating(false)}
          onSave={(input) => {
            const id = saveCohort(input)
            setCreating(false)
            notify(`${input.name} scheduled.`)
            navigate(`/admin/training/cohorts/${id}`)
          }}
        />
      ) : null}
    </div>
  )
}

/**
 * Attendance across cohorts. Trainers take it per session; this page shows
 * where it is being kept up, and who is at risk of missing their certificate.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardCheck, TriangleAlert, UserRoundCheck } from 'lucide-react'

import { FilterTabs } from '../../../shared/components/FilterTabs'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { usePeople } from '../../institution/hooks/usePeople'
import { useCohortAttendance, useCohortRegistrations, useCohorts, useTrainingPrograms } from '../hooks/useTrainingData'
import { attendanceRate, COHORT_META, cohortState, daysBetween, minAttendance, todayIso } from '../utils/trainingUtils'

const STAT = 17

export function TrainingAttendancePage() {
  const { programs } = useTrainingPrograms()
  const { cohorts } = useCohorts()
  const { registrations } = useCohortRegistrations()
  const { sessions } = useCohortAttendance()
  const { people } = usePeople()
  const [tab, setTab] = useState('Running')

  const today = todayIso()
  const personById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people])

  const rows = useMemo(
    () =>
      cohorts
        .map((c) => {
          const state = cohortState(c, today)
          const program = programs.find((p) => p.id === c.programId)
          const own = sessions.filter((s) => s.cohortId === c.id)
          const enrolled = registrations.filter((r) => r.cohortId === c.id && r.status === 'enrolled')
          const rates = enrolled.map((r) => ({ r, rate: attendanceRate(r.studentId, c.id, sessions) }))
          const known = rates.filter((x) => x.rate !== null)
          const min = minAttendance(program)
          return {
            c,
            state,
            program,
            sessionCount: own.length,
            lastSession: own.map((s) => s.date).sort().pop(),
            average: known.length ? Math.round(known.reduce((s, x) => s + (x.rate ?? 0), 0) / known.length) : null,
            atRisk: known.filter((x) => (x.rate ?? 0) < min),
            enrolled: enrolled.length,
            min,
          }
        })
        .sort((a, b) => b.c.startDate.localeCompare(a.c.startDate)),
    [cohorts, programs, sessions, registrations, today],
  )

  const visible = rows.filter((r) => (tab === 'Running' ? r.state === 'active' : tab === 'Completed' ? r.state === 'completed' : r.state !== 'cancelled'))
  const running = rows.filter((r) => r.state === 'active')
  const withAverage = running.filter((r) => r.average !== null)
  const overall = withAverage.length ? Math.round(withAverage.reduce((s, r) => s + (r.average ?? 0), 0) / withAverage.length) : null
  const stale = running.filter((r) => !r.lastSession || daysBetween(r.lastSession, today) > 7)

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader title="Attendance" subtitle="Session attendance by cohort. Learners need each program's minimum to be certified." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatBlock label="Average attendance" value={overall === null ? '—' : `${overall}%`} sub="Running cohorts" icon={<UserRoundCheck size={STAT} />} iconBg="bg-success-bg text-success" />
        <StatBlock label="Learners at risk" value={running.reduce((s, r) => s + r.atRisk.length, 0)} sub="Below their program's minimum" icon={<TriangleAlert size={STAT} />} iconBg="bg-danger-bg text-danger" />
        <StatBlock label="Cohorts behind on attendance" value={stale.length} sub="Nothing recorded in the last 7 days" icon={<ClipboardCheck size={STAT} />} iconBg="bg-warning-bg text-[#8A6D00]" />
      </div>

      <FilterTabs tabs={['Running', 'Completed', 'All']} active={tab} onChange={setTab} />

      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-navy-50/60 text-left text-[11px] uppercase tracking-wide text-secondary-text dark:bg-white/5">
              <tr>
                <th className="px-5 py-3 font-medium">Cohort</th>
                <th className="px-5 py-3 font-medium">Trainer</th>
                <th className="px-5 py-3 font-medium">Sessions</th>
                <th className="px-5 py-3 font-medium">Average</th>
                <th className="px-5 py-3 font-medium">At risk</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.c.id} className="border-b border-divider last:border-0">
                  <td className="px-5 py-3">
                    <Link to={`/admin/training/cohorts/${r.c.id}`} className="font-semibold text-navy-900 hover:underline">
                      {r.c.name}
                    </Link>
                    <p className="text-[12px] text-secondary-text">
                      {r.program?.name} · {r.enrolled} enrolled · {r.min}% needed
                    </p>
                  </td>
                  <td className="px-5 py-3 text-navy-900">{(r.c.trainerId && personById.get(r.c.trainerId)?.name) || '—'}</td>
                  <td className="px-5 py-3">
                    <p className="text-navy-900">{r.sessionCount}</p>
                    <p className="text-[12px] text-secondary-text">{r.lastSession ? `Last: ${r.lastSession}` : 'None yet'}</p>
                  </td>
                  <td className={`px-5 py-3 font-semibold ${r.average !== null && r.average < r.min ? 'text-danger' : 'text-navy-900'}`}>{r.average === null ? '—' : `${r.average}%`}</td>
                  <td className="px-5 py-3">
                    {r.atRisk.length ? (
                      <span className="text-danger" title={r.atRisk.map((x) => x.r.studentName).join(', ')}>
                        {r.atRisk.length} · {r.atRisk.slice(0, 2).map((x) => x.r.studentName.split(' ')[0]).join(', ')}
                        {r.atRisk.length > 2 ? '…' : ''}
                      </span>
                    ) : (
                      <span className="text-secondary-text">None</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill label={COHORT_META[r.state].label} tone={COHORT_META[r.state].tone} />
                  </td>
                </tr>
              ))}
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-secondary-text">
                    No cohorts here yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}

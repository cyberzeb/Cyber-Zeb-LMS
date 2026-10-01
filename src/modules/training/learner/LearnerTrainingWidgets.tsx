/**
 * Training Edition pieces of the learner portal: the cohort summary on the
 * dashboard, and attendance by cohort session.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CreditCard, GraduationCap } from 'lucide-react'

import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { getSessionPerson } from '../../../shared/storage/session'
import { useEnrollments } from '../../institution/hooks/useEnrollments'
import { useCohortAttendance, useCohortRegistrations, useCohorts, useTrainingPrograms } from '../hooks/useTrainingData'
import { attendanceRate, cohortProgress, cohortState, formatDateRange, MARK_META, minAttendance, registrationState } from '../utils/trainingUtils'

function useMyCohorts() {
  const me = getSessionPerson()
  const myId = me?.id ?? ''
  const { programs } = useTrainingPrograms()
  const { cohorts } = useCohorts()
  const { registrations } = useCohortRegistrations()
  return useMemo(
    () =>
      registrations
        .filter((r) => r.studentId === myId && r.status !== 'cancelled')
        .map((r) => ({
          reg: r,
          state: registrationState(r),
          cohort: cohorts.find((c) => c.id === r.cohortId),
          program: programs.find((p) => p.id === r.programId),
        }))
        .filter((x) => x.cohort && x.program),
    [registrations, myId, cohorts, programs],
  )
}

/** Dashboard card: the learner's cohorts at a glance, with anything unpaid first. */
export function LearnerCohortsCard() {
  const me = getSessionPerson()
  const mine = useMyCohorts()
  const { enrollments } = useEnrollments()
  const { sessions } = useCohortAttendance()
  const current = mine.filter((m) => m.cohort && cohortState(m.cohort) !== 'completed').sort((a, b) => Number(a.state === 'enrolled') - Number(b.state === 'enrolled'))

  return (
    <GlassCard className="p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-[15px] font-bold text-navy-900">
          <GraduationCap size={17} /> My programs
        </h3>
        <Link to="/student/programs" className="text-[13px] font-semibold text-lemon-600 hover:underline">
          All programs <ArrowRight size={13} className="inline" />
        </Link>
      </div>
      {current.length === 0 ? (
        <p className="py-4 text-[13px] text-secondary-text">
          You are not in a running program. <Link to="/student/programs" className="font-semibold text-navy-900 hover:underline">See open intakes</Link>.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {current.map(({ reg, state, cohort, program }) => {
            const progress = cohortProgress(me?.id ?? '', cohort!.id, enrollments)
            const rate = attendanceRate(me?.id ?? '', cohort!.id, sessions)
            return (
              <li key={reg.id} className="flex flex-col gap-2 rounded-xl border border-divider p-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-navy-900">{program!.name}</p>
                  <p className="text-[12px] text-secondary-text">
                    {cohort!.name} · {formatDateRange(cohort!.startDate, cohort!.endDate)}
                  </p>
                </div>
                {state === 'enrolled' ? (
                  <div className="flex items-center gap-4 text-[12.5px] text-navy-900">
                    <span>
                      <span className="font-bold">{progress}%</span> done
                    </span>
                    <span>
                      <span className={`font-bold ${rate !== null && rate < minAttendance(program) ? 'text-danger' : ''}`}>{rate === null ? '—' : `${rate}%`}</span> attendance
                    </span>
                  </div>
                ) : (
                  <Link to="/student/payments" className="inline-flex items-center gap-1.5 rounded-lg bg-warning-bg px-3 py-1.5 text-[12.5px] font-semibold text-[#8A6D00]">
                    <CreditCard size={14} /> Pay to confirm your seat
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </GlassCard>
  )
}

/** Attendance page for a learner: their mark in every session of their cohorts. */
export function LearnerCohortAttendancePage() {
  const me = getSessionPerson()
  const myId = me?.id ?? ''
  const mine = useMyCohorts().filter((m) => m.state === 'enrolled')
  const { sessions } = useCohortAttendance()

  const rows = mine.map((m) => {
    const own = sessions
      .filter((s) => s.cohortId === m.cohort!.id && s.marks?.[myId])
      .sort((a, b) => b.date.localeCompare(a.date))
    return { ...m, sessions: own, rate: attendanceRate(myId, m.cohort!.id, sessions), min: minAttendance(m.program) }
  })
  const all = rows.flatMap((r) => r.sessions)
  const counted = all.filter((s) => s.marks[myId] !== 'excused')
  const attended = counted.filter((s) => s.marks[myId] === 'present' || s.marks[myId] === 'late').length

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader title="Attendance" subtitle="Your attendance at each session. Programs need a minimum to award the certificate." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatBlock label="Overall attendance" value={counted.length ? `${Math.round((attended / counted.length) * 100)}%` : '—'} />
        <StatBlock label="Sessions attended" value={attended} sub={`of ${counted.length} recorded`} />
        <StatBlock label="Absences" value={all.filter((s) => s.marks[myId] === 'absent').length} />
      </div>
      {rows.map((r) => (
        <GlassCard key={r.reg.id} className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider px-5 py-4">
            <div>
              <h3 className="text-[15px] font-bold text-navy-900">{r.program!.name}</h3>
              <p className="text-[12.5px] text-secondary-text">
                {r.cohort!.name} · minimum {r.min}%
              </p>
            </div>
            <span className={`text-[20px] font-bold ${r.rate !== null && r.rate < r.min ? 'text-danger' : 'text-navy-900'}`}>{r.rate === null ? '—' : `${r.rate}%`}</span>
          </div>
          <ul>
            {r.sessions.map((s) => {
              const mark = s.marks[myId]
              return (
                <li key={s.id} className="flex items-center gap-3 border-b border-divider px-5 py-2.5 last:border-0">
                  <span className="w-28 text-[13px] font-semibold text-navy-900">{s.date}</span>
                  <span className="flex-1 truncate text-[13px] text-secondary-text">{s.topic || 'Session'}</span>
                  <StatusPill label={MARK_META[mark].label} tone={MARK_META[mark].tone} />
                </li>
              )
            })}
            {r.sessions.length === 0 ? <li className="px-5 py-6 text-center text-[13px] text-secondary-text">No sessions recorded yet.</li> : null}
          </ul>
        </GlassCard>
      ))}
      {rows.length === 0 ? <GlassCard className="p-8 text-center text-[13px] text-secondary-text">Attendance appears here once you are enrolled in a cohort.</GlassCard> : null}
    </div>
  )
}

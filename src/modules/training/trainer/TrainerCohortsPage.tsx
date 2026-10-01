/**
 * Trainer portal: the cohorts I lead. Pick one to see its roster (progress and
 * attendance per learner) and to take attendance after each session.
 */
import { useMemo, useState } from 'react'
import { CalendarDays, ClipboardCheck, MapPin, Pencil, Users } from 'lucide-react'

import { runCertificateCheck } from '../../../shared/api/trainingApi'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { getSessionPerson } from '../../../shared/storage/session'
import { useEnrollments } from '../../institution/hooks/useEnrollments'
import { TakeAttendanceModal } from '../components/TakeAttendanceModal'
import { useCohortAttendance, useCohortRegistrations, useCohorts, useRefreshTraining, useTrainingPrograms } from '../hooks/useTrainingData'
import type { CohortSession } from '../types'
import { attendanceRate, COHORT_META, cohortProgress, cohortState, DELIVERY_LABEL, formatDateRange, MARK_META, minAttendance } from '../utils/trainingUtils'

export function TrainerCohortsPage() {
  const me = getSessionPerson()
  const { notify } = useToast()
  const refresh = useRefreshTraining()
  const { programs } = useTrainingPrograms()
  const { cohorts } = useCohorts()
  const { registrations } = useCohortRegistrations()
  const { sessions, saveSession } = useCohortAttendance()
  const { enrollments } = useEnrollments()

  const mine = useMemo(
    () =>
      cohorts
        .filter((c) => c.trainerId === me?.id)
        .map((c) => ({ c, state: cohortState(c) }))
        .sort((a, b) => {
          const order = { active: 0, upcoming: 1, completed: 2, cancelled: 3 }
          return order[a.state] - order[b.state] || a.c.startDate.localeCompare(b.c.startDate)
        }),
    [cohorts, me?.id],
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = mine.find((m) => m.c.id === selectedId) ?? mine[0]
  const [attendance, setAttendance] = useState<CohortSession | 'new' | null>(null)

  const cohort = selected?.c
  const program = programs.find((p) => p.id === cohort?.programId)
  const minAtt = minAttendance(program)
  const roster = registrations
    .filter((r) => r.cohortId === cohort?.id && r.status === 'enrolled')
    .map((r) => ({ id: r.studentId, name: r.studentName }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const cohortSessions = sessions.filter((s) => s.cohortId === cohort?.id).sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader title="My Cohorts" subtitle="The cohorts you lead. Take attendance after each session — it counts towards each learner's certificate." />

      {mine.length === 0 ? (
        <GlassCard className="p-10 text-center text-[13px] text-secondary-text">You are not leading a cohort yet. The training team assigns trainers to cohorts.</GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {mine.map(({ c, state }) => {
              const count = registrations.filter((r) => r.cohortId === c.id && r.status === 'enrolled').length
              const active = c.id === cohort?.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`rounded-2xl border p-4 text-left transition-colors ${active ? 'border-lemon-500 bg-lemon-50 dark:bg-lemon-500/10' : 'border-divider bg-white hover:bg-navy-50 dark:bg-[#0a121e] dark:hover:bg-white/5'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[14px] font-bold text-navy-900">{c.name}</p>
                    <StatusPill label={COHORT_META[state].label} tone={COHORT_META[state].tone} />
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-secondary-text">{programs.find((p) => p.id === c.programId)?.name}</p>
                  <p className="mt-2 text-[12px] text-navy-700">
                    {formatDateRange(c.startDate, c.endDate)} · {count} learner{count === 1 ? '' : 's'}
                  </p>
                </button>
              )
            })}
          </div>

          {cohort ? (
            <>
              <GlassCard className="p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-[18px] font-bold text-navy-900">{cohort.name}</h2>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-navy-700">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={13} /> {formatDateRange(cohort.startDate, cohort.endDate)}
                        {cohort.schedule ? ` · ${cohort.schedule}` : ''}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={13} /> {cohort.location || DELIVERY_LABEL[cohort.deliveryMode]}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users size={13} /> {roster.length} enrolled · {minAtt}% attendance needed
                      </span>
                    </div>
                  </div>
                  <Button variant="primary" disabled={!roster.length} onClick={() => setAttendance('new')}>
                    <ClipboardCheck size={16} /> Take attendance
                  </Button>
                </div>
              </GlassCard>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <GlassCard className="overflow-hidden p-0">
                  <div className="border-b border-divider px-5 py-3 text-[13px] font-bold text-navy-900">Roster</div>
                  <table className="w-full text-[13px]">
                    <thead className="text-left text-[11px] uppercase tracking-wide text-secondary-text">
                      <tr>
                        <th className="px-5 py-2 font-medium">Learner</th>
                        <th className="px-5 py-2 font-medium">Progress</th>
                        <th className="px-5 py-2 font-medium">Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roster.map((r) => {
                        const progress = cohortProgress(r.id, cohort.id, enrollments)
                        const rate = attendanceRate(r.id, cohort.id, sessions)
                        return (
                          <tr key={r.id} className="border-t border-divider">
                            <td className="px-5 py-2.5 font-semibold text-navy-900">{r.name}</td>
                            <td className="px-5 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-navy-100 dark:bg-white/10">
                                  <div className="h-full rounded-full bg-lemon-500" style={{ width: `${progress}%` }} />
                                </div>
                                <span className="text-navy-900">{progress}%</span>
                              </div>
                            </td>
                            <td className={`px-5 py-2.5 font-semibold ${rate !== null && rate < minAtt ? 'text-danger' : 'text-navy-900'}`}>{rate === null ? '—' : `${rate}%`}</td>
                          </tr>
                        )
                      })}
                      {roster.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-5 py-8 text-center text-secondary-text">
                            No learners enrolled yet.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </GlassCard>

                <GlassCard className="overflow-hidden p-0">
                  <div className="border-b border-divider px-5 py-3 text-[13px] font-bold text-navy-900">Sessions</div>
                  <ul>
                    {cohortSessions.map((s) => {
                      const values = Object.values(s.marks ?? {})
                      return (
                        <li key={s.id} className="flex items-center gap-3 border-b border-divider px-5 py-2.5 last:border-0">
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-navy-900">{s.date}</p>
                            <p className="truncate text-[12px] text-secondary-text">{s.topic || 'No topic'}</p>
                          </div>
                          <span className="text-[12px] text-secondary-text">
                            {(['present', 'late', 'absent'] as const).map((m) => `${values.filter((v) => v === m).length}${MARK_META[m].short}`).join(' · ')}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => setAttendance(s)} aria-label="Edit attendance">
                            <Pencil size={13} />
                          </Button>
                        </li>
                      )
                    })}
                    {cohortSessions.length === 0 ? <li className="px-5 py-8 text-center text-[13px] text-secondary-text">No sessions recorded yet.</li> : null}
                  </ul>
                </GlassCard>
              </div>
            </>
          ) : null}
        </>
      )}

      {attendance && cohort ? (
        <TakeAttendanceModal
          cohort={cohort}
          roster={roster}
          session={attendance === 'new' ? null : attendance}
          existingDates={cohortSessions.map((s) => s.date)}
          onClose={() => setAttendance(null)}
          onSave={(session) => {
            saveSession({ ...session, takenById: me?.id, takenByName: me?.name, takenAt: new Date().toISOString() })
            setAttendance(null)
            notify(`Attendance for ${session.date} saved.`)
            void runCertificateCheck().then(refresh).catch(() => undefined)
          }}
        />
      ) : null}
    </div>
  )
}

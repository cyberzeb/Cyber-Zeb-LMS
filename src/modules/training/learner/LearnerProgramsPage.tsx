/**
 * The learner's programs: the cohorts they are in (dates, trainer, courses,
 * progress, attendance and certificate), and open intakes they can join.
 */
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Award, CalendarDays, CreditCard, ExternalLink, Loader2, MapPin, UserRound, Video } from 'lucide-react'

import { apiErrorMessage } from '../../../shared/api/client'
import { cancelRegistration, registerForCohort } from '../../../shared/api/trainingApi'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { getSessionPerson } from '../../../shared/storage/session'
import { useCertificates } from '../../institution/hooks/useCertificates'
import { useCourses } from '../../institution/hooks/useCourses'
import { useEnrollments } from '../../institution/hooks/useEnrollments'
import { usePeople } from '../../institution/hooks/usePeople'
import { useCohortAttendance, useCohortRegistrations, useCohorts, useRefreshTraining, useTrainingPrograms } from '../hooks/useTrainingData'
import {
  attendanceRate,
  COHORT_META,
  cohortPrice,
  cohortProgress,
  cohortState,
  DELIVERY_LABEL,
  formatDateRange,
  formatMoney,
  HOLD_DAYS,
  holdsSeat,
  minAttendance,
  REGISTRATION_META,
  registrationClosedReason,
  registrationState,
  seatsLeft,
} from '../utils/trainingUtils'

export function LearnerProgramsPage() {
  const me = getSessionPerson()
  const navigate = useNavigate()
  const { notify } = useToast()
  const refresh = useRefreshTraining()
  const { programs } = useTrainingPrograms()
  const { cohorts } = useCohorts()
  const { registrations } = useCohortRegistrations()
  const { sessions } = useCohortAttendance()
  const { enrollments } = useEnrollments()
  const { courses } = useCourses()
  const { certificates } = useCertificates()
  const { people } = usePeople()
  const [busy, setBusy] = useState<string | null>(null)

  const myId = me?.id ?? ''
  const programById = useMemo(() => new Map(programs.map((p) => [p.id, p])), [programs])
  const courseById = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses])
  const personById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people])
  const mine = useMemo(
    () =>
      registrations
        .filter((r) => r.studentId === myId && r.status !== 'cancelled')
        .map((r) => ({ reg: r, cohort: cohorts.find((c) => c.id === r.cohortId), program: programById.get(r.programId) }))
        .sort((a, b) => (b.cohort?.startDate ?? '').localeCompare(a.cohort?.startDate ?? '')),
    [registrations, myId, cohorts, programById],
  )
  const seated = new Set(mine.filter((m) => holdsSeat(m.reg)).map((m) => m.reg.cohortId))
  const open = cohorts
    .filter((c) => !seated.has(c.id) && registrationClosedReason(c, programById.get(c.programId), registrations) === null)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

  async function join(cohortId: string) {
    setBusy(cohortId)
    try {
      const result = await registerForCohort(cohortId)
      await refresh()
      if (result.status === 'pending_payment') {
        notify(`Seat reserved in ${result.cohortName}. Pay within ${HOLD_DAYS} days to confirm it.`)
        navigate('/student/payments')
      } else {
        notify(`You are enrolled in ${result.cohortName}.`)
      }
    } catch (err) {
      notify(apiErrorMessage(err) ?? 'Registration failed. Please try again.', 'error')
    } finally {
      setBusy(null)
    }
  }

  async function cancel(registrationId: string, cohortName: string) {
    setBusy(registrationId)
    try {
      await cancelRegistration(registrationId, { reason: 'Cancelled by learner' })
      await refresh()
      notify(`Your registration for ${cohortName} was cancelled.`, 'info')
    } catch (err) {
      notify(apiErrorMessage(err) ?? 'Could not cancel. Please contact the training team.', 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader title="My Programs" subtitle="Your cohorts, what is left to do, and programs you can join next." />

      <section className="flex flex-col gap-4">
        {mine.map(({ reg, cohort, program }) => {
          if (!cohort || !program) return null
          const state = cohortState(cohort)
          const regState = registrationState(reg)
          const trainer = cohort.trainerId ? personById.get(cohort.trainerId) : undefined
          const progress = cohortProgress(myId, cohort.id, enrollments)
          const rate = attendanceRate(myId, cohort.id, sessions)
          const minAtt = minAttendance(program)
          const certificate = certificates.find((c) => c.studentId === myId && (c.programId ?? c.courseId) === program.id)
          // In the order the program teaches them.
          const myCourses = enrollments
            .filter((e) => e.studentId === myId && e.cohortId === cohort.id && e.status !== 'withdrawn')
            .sort((a, b) => program.courseIds.indexOf(a.courseId) - program.courseIds.indexOf(b.courseId))
          return (
            <GlassCard key={reg.id} className="p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-secondary-text">
                    {program.code} · {program.credentialType}
                  </p>
                  <h2 className="text-[18px] font-bold text-navy-900">{program.name}</h2>
                  <p className="text-[13px] text-secondary-text">{cohort.name}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-navy-700">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={13} /> {formatDateRange(cohort.startDate, cohort.endDate)}
                      {cohort.schedule ? ` · ${cohort.schedule}` : ''}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={13} /> {cohort.location || DELIVERY_LABEL[cohort.deliveryMode]}
                    </span>
                    {trainer ? (
                      <span className="inline-flex items-center gap-1">
                        <UserRound size={13} /> {trainer.name}
                      </span>
                    ) : null}
                    {cohort.meetingUrl && regState === 'enrolled' ? (
                      <a href={cohort.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-info hover:underline">
                        <Video size={13} /> Join online <ExternalLink size={11} />
                      </a>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill label={REGISTRATION_META[regState].label} tone={REGISTRATION_META[regState].tone} />
                  <StatusPill label={COHORT_META[state].label} tone={COHORT_META[state].tone} />
                </div>
              </div>

              {regState === 'pending_payment' || regState === 'expired' ? (
                <div className="mt-4 flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning-bg/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[13px] text-navy-900">
                    {regState === 'expired'
                      ? 'Your seat hold has expired. Pay now if seats are still available, or contact the training team.'
                      : `Pay the registration fee of ${formatMoney(Number(reg.amount) || 0, reg.currency)} to confirm your place.`}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="primary" onClick={() => navigate('/student/payments')}>
                      <CreditCard size={15} /> Pay now
                    </Button>
                    <Button variant="ghost" disabled={busy !== null} onClick={() => void cancel(reg.id, cohort.name)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-navy-50/60 p-3 dark:bg-white/5">
                      <p className="text-[11.5px] text-secondary-text">Progress</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-navy-100 dark:bg-white/10">
                          <div className="h-full rounded-full bg-lemon-500" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-[13px] font-bold text-navy-900">{progress}%</span>
                      </div>
                    </div>
                    <div className="rounded-xl bg-navy-50/60 p-3 dark:bg-white/5">
                      <p className="text-[11.5px] text-secondary-text">Attendance (need {minAtt}%)</p>
                      <p className={`mt-1 text-[16px] font-bold ${rate !== null && rate < minAtt ? 'text-danger' : 'text-navy-900'}`}>{rate === null ? 'No sessions yet' : `${rate}%`}</p>
                    </div>
                    <div className="rounded-xl bg-navy-50/60 p-3 dark:bg-white/5">
                      <p className="text-[11.5px] text-secondary-text">Certificate</p>
                      {certificate?.status === 'issued' ? (
                        <Link to="/student/certificates" className="mt-1 inline-flex items-center gap-1.5 text-[14px] font-bold text-success hover:underline">
                          <Award size={15} /> Earned — view it
                        </Link>
                      ) : (
                        <p className="mt-1 text-[13px] text-navy-900">
                          {certificate?.status === 'pending' ? 'Awaiting approval' : 'Finish every course' + (rate !== null ? ` and keep attendance at ${minAtt}%` : '')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    {myCourses.map((e) => (
                      <div key={e.id} className="flex items-center gap-3 rounded-lg border border-divider px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-navy-900">{courseById.get(e.courseId)?.title ?? e.courseTitle}</p>
                          <p className="text-[11.5px] text-secondary-text">{e.courseCode}</p>
                        </div>
                        <span className="text-[12.5px] font-semibold text-navy-900">{Math.min(100, e.progress ?? 0)}%</span>
                        <Button variant={(e.progress ?? 0) >= 100 ? 'ghost' : 'secondary'} size="sm" onClick={() => navigate(`/student/courses/${e.courseId}/learn`)}>
                          {(e.progress ?? 0) >= 100 ? 'Review' : (e.progress ?? 0) > 0 ? 'Continue' : 'Start'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </GlassCard>
          )
        })}
        {mine.length === 0 ? (
          <GlassCard className="p-8 text-center text-[13px] text-secondary-text">You are not in a program yet. Pick an intake below to get started.</GlassCard>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-[17px] font-bold text-navy-900">Open for registration</h2>
          <p className="text-[13px] text-secondary-text">Intakes you can join now.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {open.map((cohort) => {
            const program = programById.get(cohort.programId)
            if (!program) return null
            const left = seatsLeft(cohort, registrations)
            const price = cohortPrice(cohort, program)
            return (
              <GlassCard key={cohort.id} className="flex flex-col gap-3 p-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-secondary-text">
                    {program.code} · {program.durationWeeks} week{program.durationWeeks === 1 ? '' : 's'} · {program.totalHours} h
                  </p>
                  <h3 className="text-[16px] font-bold text-navy-900">{program.name}</h3>
                  <p className="text-[13px] text-secondary-text">{cohort.name}</p>
                </div>
                {program.description ? <p className="line-clamp-2 text-[13px] text-secondary-text">{program.description}</p> : null}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-navy-700">
                  <span>{formatDateRange(cohort.startDate, cohort.endDate)}</span>
                  <span>{cohort.location || DELIVERY_LABEL[cohort.deliveryMode]}</span>
                  <span>{left === null ? 'Open enrollment' : `${left} seat${left === 1 ? '' : 's'} left`}</span>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3">
                  <span className="text-[16px] font-bold text-navy-900">{formatMoney(price, program.currency)}</span>
                  <Button variant="primary" disabled={busy !== null} onClick={() => void join(cohort.id)}>
                    {busy === cohort.id ? <Loader2 size={15} className="animate-spin" /> : null}
                    Register
                  </Button>
                </div>
              </GlassCard>
            )
          })}
        </div>
        {open.length === 0 ? <GlassCard className="p-8 text-center text-[13px] text-secondary-text">No other intakes are open right now.</GlassCard> : null}
      </section>
    </div>
  )
}

/**
 * Training Edition admin home: what is running, what is filling up, what needs
 * a decision, and how much has been earned — all from live data.
 */
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  CalendarClock,
  CalendarPlus,
  GraduationCap,
  Layers,
  Megaphone,
  Plus,
  Users,
  Wallet,
} from 'lucide-react'

import { AnnouncementDashboardList } from '../../../shared/components/announcements/AnnouncementFeedCard'
import { Button } from '../../../shared/components/Button'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useOrganizationConfig } from '../../../shared/config/useOrganizationConfig'
import { useAnnouncements } from '../../../shared/hooks/useAnnouncements'
import { useApiCollection } from '../../../shared/hooks/useApiCollection'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { formatAnnouncementAudience, formatAnnouncementDate, normalizeAnnouncementRecord } from '../../../shared/storage/announcementUtils'
import { getSessionPerson } from '../../../shared/storage/session'
import { STORAGE_KEYS } from '../../../shared/storage/keys'
import { useCertificates } from '../../institution/hooks/useCertificates'
import { usePeople } from '../../institution/hooks/usePeople'
import type { PaymentRecord } from '../../institution/types/platform'
import { useCohortAttendance, useCohortRegistrations, useCohorts, useTrainingPrograms } from '../hooks/useTrainingData'
import {
  attendanceRate,
  COHORT_META,
  cohortState,
  daysBetween,
  formatDateRange,
  formatMoney,
  minAttendance,
  registrationState,
  seatsTaken,
  todayIso,
} from '../utils/trainingUtils'

const STAT = 17
const NO_PAYMENTS: PaymentRecord[] = []

interface Attention {
  id: string
  title: string
  detail: string
  tone: 'danger' | 'warning' | 'info'
  to: string
}

export function TrainingOverviewPage() {
  const navigate = useNavigate()
  const me = getSessionPerson()
  const { organizationName } = useOrganizationConfig()
  const { programs } = useTrainingPrograms()
  const { cohorts } = useCohorts()
  const { registrations } = useCohortRegistrations()
  const { sessions } = useCohortAttendance()
  const { certificates } = useCertificates()
  const { people } = usePeople()
  const { announcements } = useAnnouncements()
  const [payments] = useApiCollection<PaymentRecord[]>(STORAGE_KEYS.payments, NO_PAYMENTS)

  const today = todayIso()
  const personById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people])
  const programById = useMemo(() => new Map(programs.map((p) => [p.id, p])), [programs])
  const invoiceById = useMemo(() => new Map(payments.map((p) => [p.id, p])), [payments])

  const data = useMemo(() => {
    const withState = cohorts.map((c) => ({ c, state: cohortState(c, today), taken: seatsTaken(c.id, registrations, today) }))
    const running = withState.filter((x) => x.state === 'active')
    const upcoming = withState.filter((x) => x.state === 'upcoming').sort((a, b) => a.c.startDate.localeCompare(b.c.startDate))
    const limited = withState.filter((x) => (x.state === 'active' || x.state === 'upcoming') && x.c.seatCapacity > 0)
    const fill = limited.length
      ? Math.round((limited.reduce((s, x) => s + Math.min(x.taken, x.c.seatCapacity), 0) / limited.reduce((s, x) => s + x.c.seatCapacity, 0)) * 100)
      : 0

    // Completion: of learners enrolled in finished cohorts, how many were certified.
    const finished = new Set(withState.filter((x) => x.state === 'completed').map((x) => x.c.id))
    const finishedRegs = registrations.filter((r) => r.status === 'enrolled' && finished.has(r.cohortId))
    const certifiedPairs = new Set(certificates.filter((c) => c.status === 'issued').map((c) => `${c.studentId}:${c.programId ?? c.courseId}`))
    const completion = finishedRegs.length ? Math.round((finishedRegs.filter((r) => certifiedPairs.has(`${r.studentId}:${r.programId}`)).length / finishedRegs.length) * 100) : 0

    const collected = registrations.reduce((s, r) => s + (r.invoiceId && invoiceById.get(r.invoiceId)?.status === 'paid' ? Number(r.amount) || 0 : 0), 0)
    const pending = registrations.filter((r) => registrationState(r, today) === 'pending_payment')
    const outstanding = pending.reduce((s, r) => s + (Number(r.amount) || 0), 0)

    const attention: Attention[] = []
    for (const r of registrations.filter((x) => registrationState(x, today) === 'expired')) {
      attention.push({ id: `exp-${r.id}`, title: `Unpaid hold expired — ${r.studentName}`, detail: `Registered ${r.createdAt}; the seat was released.`, tone: 'danger', to: `/admin/training/cohorts/${r.cohortId}` })
    }
    for (const x of upcoming) {
      const days = daysBetween(today, x.c.startDate)
      if (!x.c.trainerId) attention.push({ id: `tr-${x.c.id}`, title: `No trainer for ${x.c.name}`, detail: `Starts in ${days} day${days === 1 ? '' : 's'}.`, tone: days <= 14 ? 'danger' : 'warning', to: `/admin/training/cohorts/${x.c.id}` })
      if (days <= 14 && x.c.seatCapacity > 0 && x.taken < x.c.seatCapacity / 2)
        attention.push({ id: `low-${x.c.id}`, title: `Low registrations — ${x.c.name}`, detail: `${x.taken} of ${x.c.seatCapacity} seats taken, starts in ${days} day${days === 1 ? '' : 's'}.`, tone: 'warning', to: `/admin/training/cohorts/${x.c.id}` })
    }
    for (const x of running) {
      const own = sessions.filter((s) => s.cohortId === x.c.id)
      const last = own.map((s) => s.date).sort().pop()
      if (!last || daysBetween(last, today) > 7)
        attention.push({ id: `att-${x.c.id}`, title: `No attendance recorded — ${x.c.name}`, detail: last ? `Last session recorded ${last}.` : 'No sessions recorded yet.', tone: 'info', to: `/admin/training/cohorts/${x.c.id}` })
      const program = programById.get(x.c.programId)
      const below = registrations.filter((r) => {
        if (r.cohortId !== x.c.id || r.status !== 'enrolled') return false
        const rate = attendanceRate(r.studentId, x.c.id, sessions)
        return rate !== null && rate < minAttendance(program)
      })
      if (below.length)
        attention.push({ id: `below-${x.c.id}`, title: `${below.length} learner${below.length === 1 ? '' : 's'} below attendance minimum`, detail: `${x.c.name} — they will not be certified unless attendance improves.`, tone: 'warning', to: `/admin/training/cohorts/${x.c.id}` })
    }

    return { running, upcoming, fill, completion, collected, pending, outstanding, attention }
  }, [cohorts, registrations, certificates, invoiceById, sessions, programById, today])

  const learners = people.filter((p) => p.role === 'Student' && p.status === 'active').length
  const currency = programs[0]?.currency ?? 'ETB'
  const recentRegs = [...registrations].sort((a, b) => (b.registeredAt ?? b.createdAt).localeCompare(a.registeredAt ?? a.createdAt)).slice(0, 6)
  const recentAnnouncements = [...announcements]
    .map(normalizeAnnouncementRecord)
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt))
    .slice(0, 3)
  const toneClass = { danger: 'border-l-danger', warning: 'border-l-warning', info: 'border-l-info' }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-navy-900">Welcome back{me?.name ? `, ${me.name.split(' ')[0]}` : ''}</h1>
          <p className="mt-1 text-[14px] text-secondary-text">{organizationName} — programs, cohorts and registrations at a glance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate('/admin/training/programs')}>
            <Plus size={16} /> New program
          </Button>
          <Button variant="primary" onClick={() => navigate('/admin/training/cohorts')}>
            <CalendarPlus size={16} /> Schedule cohort
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <StatBlock label="Active learners" value={learners} icon={<Users size={STAT} />} />
        <StatBlock label="Running cohorts" value={data.running.length} sub={`${data.upcoming.length} upcoming`} icon={<Layers size={STAT} />} iconBg="bg-info-bg text-info" />
        <StatBlock label="Seats filled" value={`${data.fill}%`} sub="Running and upcoming cohorts" icon={<GraduationCap size={STAT} />} iconBg="bg-warning-bg text-[#8A6D00]" />
        <StatBlock label="Completion rate" value={`${data.completion}%`} sub="Certified in finished cohorts" icon={<Award size={STAT} />} iconBg="bg-success-bg text-success" />
        <StatBlock label="Certificates issued" value={certificates.filter((c) => c.status === 'issued').length} icon={<Award size={STAT} />} />
        <StatBlock label="Fees collected" value={formatMoney(data.collected, currency)} sub={data.outstanding ? `${formatMoney(data.outstanding, currency)} awaiting payment` : 'Nothing outstanding'} icon={<Wallet size={STAT} />} iconBg="bg-success-bg text-success" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <GlassCard className="p-0">
          <div className="flex items-center justify-between border-b border-divider px-5 py-4">
            <div>
              <h3 className="text-[15px] font-bold text-navy-900">Upcoming and running cohorts</h3>
              <p className="text-[12.5px] text-secondary-text">Seats taken, including unpaid holds.</p>
            </div>
            <Link to="/admin/training/cohorts" className="text-[13px] font-semibold text-lemon-600 hover:underline">
              All cohorts <ArrowRight size={13} className="inline" />
            </Link>
          </div>
          <ul>
            {[...data.running, ...data.upcoming].slice(0, 6).map(({ c, state, taken }) => {
              const program = programById.get(c.programId)
              const trainer = c.trainerId ? personById.get(c.trainerId) : undefined
              return (
                <li key={c.id} className="flex items-center gap-4 border-b border-divider px-5 py-3 last:border-0">
                  <div className="min-w-0 flex-1">
                    <Link to={`/admin/training/cohorts/${c.id}`} className="text-[13.5px] font-semibold text-navy-900 hover:underline">
                      {c.name}
                    </Link>
                    <p className="truncate text-[12px] text-secondary-text">
                      {program?.name} · {formatDateRange(c.startDate, c.endDate)} · {trainer?.name ?? 'No trainer'}
                    </p>
                  </div>
                  <div className="hidden w-32 sm:block">
                    <div className="h-1.5 overflow-hidden rounded-full bg-navy-100 dark:bg-white/10">
                      <div className="h-full rounded-full bg-lemon-500" style={{ width: `${c.seatCapacity ? Math.min(100, (taken / c.seatCapacity) * 100) : 0}%` }} />
                    </div>
                    <p className="mt-1 text-right text-[11.5px] text-secondary-text">
                      {taken}
                      {c.seatCapacity ? ` / ${c.seatCapacity}` : ''} seats
                    </p>
                  </div>
                  <StatusPill label={COHORT_META[state].label} tone={COHORT_META[state].tone} />
                </li>
              )
            })}
            {data.running.length + data.upcoming.length === 0 ? (
              <li className="px-5 py-10 text-center text-[13px] text-secondary-text">Nothing scheduled. Create a program and schedule its first cohort.</li>
            ) : null}
          </ul>
        </GlassCard>

        <GlassCard className="p-0">
          <div className="border-b border-divider px-5 py-4">
            <h3 className="text-[15px] font-bold text-navy-900">Needs attention</h3>
            <p className="text-[12.5px] text-secondary-text">Unpaid holds, missing trainers, low sign-ups and attendance.</p>
          </div>
          <ul className="flex flex-col gap-2 p-4">
            {data.attention.slice(0, 7).map((a) => (
              <li key={a.id}>
                <Link to={a.to} className={`block rounded-lg border border-divider border-l-4 ${toneClass[a.tone]} px-3 py-2.5 hover:bg-navy-50 dark:hover:bg-white/5`}>
                  <p className="text-[13px] font-semibold text-navy-900">{a.title}</p>
                  <p className="text-[12px] text-secondary-text">{a.detail}</p>
                </Link>
              </li>
            ))}
            {data.attention.length === 0 ? <li className="py-8 text-center text-[13px] text-secondary-text">All clear — nothing needs a decision right now.</li> : null}
          </ul>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <GlassCard className="p-0">
          <div className="flex items-center justify-between border-b border-divider px-5 py-4">
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-navy-900">
              <CalendarClock size={16} /> Latest registrations
            </h3>
            <Link to="/admin/enrollments" className="text-[13px] font-semibold text-lemon-600 hover:underline">
              All registrations <ArrowRight size={13} className="inline" />
            </Link>
          </div>
          <ul>
            {recentRegs.map((r) => {
              const state = registrationState(r, today)
              return (
                <li key={r.id} className="flex items-center gap-3 border-b border-divider px-5 py-3 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-navy-900">{r.studentName}</p>
                    <p className="truncate text-[12px] text-secondary-text">
                      {cohorts.find((c) => c.id === r.cohortId)?.name ?? 'Removed cohort'} · {r.createdAt}
                    </p>
                  </div>
                  <StatusPill
                    label={state === 'enrolled' ? 'Enrolled' : state === 'pending_payment' ? 'Awaiting payment' : state === 'expired' ? 'Hold expired' : 'Cancelled'}
                    tone={state === 'enrolled' ? 'success' : state === 'pending_payment' ? 'warning' : state === 'expired' ? 'danger' : 'neutral'}
                  />
                </li>
              )
            })}
            {recentRegs.length === 0 ? <li className="px-5 py-10 text-center text-[13px] text-secondary-text">No registrations yet.</li> : null}
          </ul>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-navy-900">
              <Megaphone size={16} /> Recent announcements
            </h3>
            <Button variant="secondary" onClick={() => navigate('/admin/announcements')}>
              View all
            </Button>
          </div>
          <AnnouncementDashboardList
            items={recentAnnouncements.map((a) => ({
              id: a.id,
              title: a.title,
              body: a.body,
              postedAt: formatAnnouncementDate(a.postedAt),
              priority: a.priority,
              audience: formatAnnouncementAudience(a),
            }))}
          />
        </GlassCard>
      </div>
    </div>
  )
}

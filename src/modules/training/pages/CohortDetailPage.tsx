/**
 * One cohort: its roster (with payment, progress, attendance and certificate
 * for each learner), its attendance sessions, and the actions around them.
 */
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  CalendarDays,
  ClipboardCheck,
  Link2,
  Loader2,
  MapPin,
  Pencil,
  Trash2,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'

import { apiErrorMessage } from '../../../shared/api/client'
import { cancelRegistration, confirmRegistration, enrollInCohort, runCertificateCheck } from '../../../shared/api/trainingApi'
import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { Modal } from '../../../shared/components/Modal'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useApiCollection } from '../../../shared/hooks/useApiCollection'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { getSessionPerson } from '../../../shared/storage/session'
import { STORAGE_KEYS } from '../../../shared/storage/keys'
import { useCertificates } from '../../institution/hooks/useCertificates'
import { useEnrollments } from '../../institution/hooks/useEnrollments'
import { usePeople } from '../../institution/hooks/usePeople'
import type { PaymentRecord } from '../../institution/types/platform'
import { CohortFormModal } from '../components/CohortFormModal'
import { EnrollLearnersModal } from '../components/EnrollLearnersModal'
import { TakeAttendanceModal } from '../components/TakeAttendanceModal'
import { useCohortAttendance, useCohortRegistrations, useCohorts, useRefreshTraining, useTrainingPrograms } from '../hooks/useTrainingData'
import type { CohortRegistration, CohortSession } from '../types'
import { registrationLink } from '../utils/registrationLink'
import {
  attendanceRate,
  COHORT_META,
  cohortPrice,
  cohortProgress,
  cohortState,
  DELIVERY_LABEL,
  downloadCsv,
  formatDateRange,
  formatMoney,
  MARK_META,
  minAttendance,
  REGISTRATION_META,
  registrationState,
  seatsTaken,
} from '../utils/trainingUtils'

const STAT = 17
const NO_PAYMENTS: PaymentRecord[] = []

export function CohortDetailPage() {
  const { cohortId = '' } = useParams()
  const { notify } = useToast()
  const me = getSessionPerson()
  const refresh = useRefreshTraining()
  const { programs } = useTrainingPrograms()
  const { cohorts, saveCohort } = useCohorts()
  const { registrations } = useCohortRegistrations()
  const { sessions, saveSession, deleteSession } = useCohortAttendance()
  const { enrollments } = useEnrollments()
  const { certificates } = useCertificates()
  const { people, setPeople } = usePeople()
  const [payments] = useApiCollection<PaymentRecord[]>(STORAGE_KEYS.payments, NO_PAYMENTS)

  const [tab, setTab] = useState<'Roster' | 'Attendance'>('Roster')
  const [showCancelled, setShowCancelled] = useState(false)
  const [editing, setEditing] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [attendance, setAttendance] = useState<CohortSession | 'new' | null>(null)
  const [withdrawing, setWithdrawing] = useState<CohortRegistration | null>(null)
  const [refund, setRefund] = useState(false)

  const cohort = cohorts.find((c) => c.id === cohortId)
  const program = programs.find((p) => p.id === cohort?.programId)
  const personById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people])
  const invoiceById = useMemo(() => new Map(payments.map((p) => [p.id, p])), [payments])
  const learners = useMemo(() => people.filter((p) => p.role === 'Student' && p.status === 'active'), [people])
  const trainers = useMemo(() => people.filter((p) => p.role === 'Instructor' && p.status === 'active'), [people])

  const cohortRegs = useMemo(() => registrations.filter((r) => r.cohortId === cohortId), [registrations, cohortId])
  const cohortSessions = useMemo(
    () => sessions.filter((s) => s.cohortId === cohortId).sort((a, b) => b.date.localeCompare(a.date)),
    [sessions, cohortId],
  )
  const enrolled = cohortRegs.filter((r) => r.status === 'enrolled')
  const roster = useMemo(
    () =>
      cohortRegs
        .filter((r) => showCancelled || r.status !== 'cancelled')
        .map((r) => {
          const certificate = certificates.find(
            (c) => c.studentId === r.studentId && (c.programId === program?.id || (c.courseId === program?.id && !!program)),
          )
          return {
            reg: r,
            state: registrationState(r),
            progress: cohortProgress(r.studentId, cohortId, enrollments),
            attendance: attendanceRate(r.studentId, cohortId, sessions),
            invoice: r.invoiceId ? invoiceById.get(r.invoiceId) : undefined,
            certificate,
          }
        })
        .sort((a, b) => a.reg.studentName.localeCompare(b.reg.studentName)),
    [cohortRegs, showCancelled, certificates, program, cohortId, enrollments, sessions, invoiceById],
  )

  if (!cohort) {
    return (
      <GlassCard className="p-10 text-center">
        <p className="text-[14px] font-semibold text-navy-900">Cohort not found</p>
        <Link to="/admin/training/cohorts" className="mt-2 inline-block text-[13px] text-lemon-600 hover:underline">
          Back to cohorts
        </Link>
      </GlassCard>
    )
  }

  const state = cohortState(cohort)
  const trainer = cohort.trainerId ? personById.get(cohort.trainerId) : undefined
  const price = cohortPrice(cohort, program)
  const currency = program?.currency ?? 'ETB'
  const taken = seatsTaken(cohort.id, registrations)
  const minAtt = minAttendance(program)
  const withRate = roster.filter((r) => r.reg.status === 'enrolled' && r.attendance !== null)
  const avgAttendance = withRate.length ? Math.round(withRate.reduce((s, r) => s + (r.attendance ?? 0), 0) / withRate.length) : null
  const enrolledRows = roster.filter((r) => r.reg.status === 'enrolled')
  const avgProgress = enrolledRows.length ? Math.round(enrolledRows.reduce((s, r) => s + r.progress, 0) / enrolledRows.length) : 0
  const collected = cohortRegs.reduce((s, r) => s + (r.invoiceId && invoiceById.get(r.invoiceId)?.status === 'paid' ? Number(r.amount) || 0 : 0), 0)
  const certified = roster.filter((r) => r.certificate && r.certificate.status === 'issued').length

  async function act(key: string, fn: () => Promise<unknown>, done: string) {
    setBusy(key)
    try {
      await fn()
      await refresh()
      notify(done)
    } catch (err) {
      notify(apiErrorMessage(err) ?? 'That did not work. Please try again.', 'error')
    } finally {
      setBusy(null)
    }
  }

  async function checkCertificates() {
    setBusy('certs')
    try {
      const r = await runCertificateCheck()
      await refresh()
      const n = r.issued.length + r.pending.length
      notify(
        n ? `${n} new certificate${n === 1 ? '' : 's'}${r.pending.length ? ' (some await approval)' : ''}.` : 'No one new has met the requirements yet.',
        n ? 'success' : 'info',
      )
    } catch (err) {
      notify(apiErrorMessage(err) ?? 'Could not check certificates.', 'error')
    } finally {
      setBusy(null)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(registrationLink(cohort?.id))
      notify('Registration link copied.')
    } catch {
      notify(registrationLink(cohort?.id), 'info')
    }
  }

  const rosterForAttendance = enrolled
    .map((r) => ({ id: r.studentId, name: r.studentName }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col gap-4">
        <Link to="/admin/training/cohorts" className="inline-flex w-fit items-center gap-1.5 text-[12.5px] font-medium text-secondary-text hover:text-navy-900">
          <ArrowLeft size={14} /> All cohorts
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-bold tracking-tight text-navy-900">{cohort.name}</h1>
              <StatusPill label={COHORT_META[state].label} tone={COHORT_META[state].tone} />
              {state !== 'completed' && state !== 'cancelled' ? (
                <StatusPill label={cohort.enrollmentOpen ? 'Registration open' : 'Registration closed'} tone={cohort.enrollmentOpen ? 'success' : 'neutral'} />
              ) : null}
            </div>
            <p className="mt-1 text-[14px] text-secondary-text">
              {program ? `${program.code} — ${program.name}` : 'Program removed'} · {cohort.code}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-navy-700">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} /> {formatDateRange(cohort.startDate, cohort.endDate)}
                {cohort.schedule ? ` · ${cohort.schedule}` : ''}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} /> {cohort.location || DELIVERY_LABEL[cohort.deliveryMode] || cohort.deliveryMode}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users size={14} /> Trainer: {trainer?.name ?? <span className="text-danger">not assigned</span>}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wallet size={14} /> {formatMoney(price, currency)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {cohort.enrollmentOpen && state !== 'completed' && state !== 'cancelled' ? (
              <Button variant="secondary" onClick={() => void copyLink()}>
                <Link2 size={16} /> Registration link
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil size={16} /> Edit
            </Button>
            <Button variant="secondary" onClick={() => setAttendance('new')} disabled={!enrolled.length}>
              <ClipboardCheck size={16} /> Take attendance
            </Button>
            <Button variant="primary" onClick={() => setEnrolling(true)} disabled={state === 'cancelled'}>
              <UserPlus size={16} /> Add learners
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatBlock label="Seats" value={cohort.seatCapacity ? `${taken} / ${cohort.seatCapacity}` : taken} sub={`${enrolled.length} enrolled · ${cohortRegs.filter((r) => registrationState(r) === 'pending_payment').length} awaiting payment`} icon={<Users size={STAT} />} />
        <StatBlock label="Average progress" value={`${avgProgress}%`} sub="Through the program's courses" icon={<BadgeCheck size={STAT} />} iconBg="bg-info-bg text-info" />
        <StatBlock
          label="Attendance"
          value={avgAttendance === null ? '—' : `${avgAttendance}%`}
          sub={`${cohortSessions.length} session${cohortSessions.length === 1 ? '' : 's'} · ${minAtt}% needed`}
          icon={<ClipboardCheck size={STAT} />}
          iconBg="bg-warning-bg text-[#8A6D00]"
        />
        <StatBlock label="Certified" value={certified} sub={`of ${enrolled.length} enrolled`} icon={<Award size={STAT} />} iconBg="bg-success-bg text-success" />
        <StatBlock label="Fees collected" value={formatMoney(collected, currency)} icon={<Wallet size={STAT} />} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs tabs={['Roster', 'Attendance']} active={tab} onChange={(t) => setTab(t as 'Roster' | 'Attendance')} />
        <div className="flex flex-wrap items-center gap-2">
          {tab === 'Roster' ? (
            <>
              <label className="inline-flex items-center gap-2 text-[12.5px] text-secondary-text">
                <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} className="accent-lemon-500" />
                Show cancelled
              </label>
              <Button
                variant="secondary"
                size="sm"
                disabled={busy !== null || !enrolled.length}
                onClick={() => void checkCertificates()}
              >
                {busy === 'certs' ? <Loader2 size={14} className="animate-spin" /> : <Award size={14} />}
                Check certificates
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!roster.length}
                onClick={() =>
                  downloadCsv(
                    `${cohort.code || cohort.name}-roster.csv`,
                    roster.map((r) => ({
                      Learner: r.reg.studentName,
                      Email: r.reg.studentEmail ?? personById.get(r.reg.studentId)?.email ?? '',
                      Phone: r.reg.phone ?? '',
                      Status: REGISTRATION_META[r.state].label,
                      Registered: r.reg.createdAt,
                      Fee: r.reg.amount,
                      Invoice: r.invoice?.status ?? '',
                      'Progress %': r.progress,
                      'Attendance %': r.attendance ?? '',
                      Certificate: r.certificate?.certificateId ?? '',
                    })),
                  )
                }
              >
                CSV
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {tab === 'Roster' ? (
        <GlassCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-navy-50/60 text-left text-[11px] uppercase tracking-wide text-secondary-text dark:bg-white/5">
                <tr>
                  <th className="px-5 py-3 font-medium">Learner</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Fee</th>
                  <th className="px-5 py-3 font-medium">Progress</th>
                  <th className="px-5 py-3 font-medium">Attendance</th>
                  <th className="px-5 py-3 font-medium">Certificate</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roster.map(({ reg, state: regState, progress, attendance: rate, invoice, certificate }) => (
                  <tr key={reg.id} className="border-b border-divider last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-navy-900">{reg.studentName}</p>
                      <p className="text-[12px] text-secondary-text">
                        {reg.studentEmail ?? personById.get(reg.studentId)?.email}
                        {reg.phone ? ` · ${reg.phone}` : ''}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill label={REGISTRATION_META[regState].label} tone={REGISTRATION_META[regState].tone} />
                      <p className="mt-1 text-[11.5px] text-secondary-text">
                        {reg.source === 'public' ? 'Registered online' : reg.source === 'self' ? 'Learner portal' : 'Added by admin'} · {reg.createdAt}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <p className="text-navy-900">{formatMoney(Number(reg.amount) || 0, reg.currency)}</p>
                      {invoice ? (
                        <p className={`text-[12px] ${invoice.status === 'paid' ? 'text-success' : invoice.status === 'refunded' ? 'text-secondary-text' : 'text-[#8A6D00]'}`}>
                          {invoice.status === 'paid' ? `Paid${(invoice as PaymentRecord & { method?: string }).method ? ` · ${(invoice as PaymentRecord & { method?: string }).method}` : ''}` : invoice.status}
                        </p>
                      ) : reg.status === 'enrolled' && !reg.amount ? (
                        <p className="text-[12px] text-secondary-text">{reg.confirmedBy === 'waived' ? 'Waived' : 'No charge'}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3">
                      {reg.status === 'enrolled' ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-navy-100 dark:bg-white/10">
                            <div className="h-full rounded-full bg-lemon-500" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-navy-900">{progress}%</span>
                        </div>
                      ) : (
                        <span className="text-secondary-text">—</span>
                      )}
                    </td>
                    <td className={`px-5 py-3 font-semibold ${rate !== null && rate < minAtt ? 'text-danger' : 'text-navy-900'}`}>{rate === null ? <span className="font-normal text-secondary-text">—</span> : `${rate}%`}</td>
                    <td className="px-5 py-3">
                      {certificate ? (
                        <StatusPill label={certificate.status === 'issued' ? 'Issued' : certificate.status === 'pending' ? 'Awaiting approval' : 'Revoked'} tone={certificate.status === 'issued' ? 'success' : certificate.status === 'pending' ? 'warning' : 'danger'} />
                      ) : reg.status === 'enrolled' && progress >= 100 && rate !== null && rate < minAtt ? (
                        <span className="text-[12px] text-danger">Attendance below {minAtt}%</span>
                      ) : (
                        <span className="text-secondary-text">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        {reg.status === 'pending_payment' ? (
                          <>
                            <Button variant="outline-green" size="sm" disabled={busy !== null} onClick={() => void act(reg.id, () => confirmRegistration(reg.id, 'offline'), `${reg.studentName} marked as paid and enrolled.`)}>
                              {busy === reg.id ? <Loader2 size={13} className="animate-spin" /> : null}
                              Mark paid
                            </Button>
                            <Button variant="ghost" size="sm" disabled={busy !== null} onClick={() => void act(reg.id, () => confirmRegistration(reg.id, 'waived'), `Fee waived — ${reg.studentName} is enrolled.`)}>
                              Waive fee
                            </Button>
                            <Button variant="ghost" size="sm" disabled={busy !== null} onClick={() => void act(reg.id, () => cancelRegistration(reg.id, { reason: 'Cancelled by admin' }), `${reg.studentName}'s registration was cancelled.`)} aria-label="Cancel registration">
                              <Trash2 size={13} />
                            </Button>
                          </>
                        ) : reg.status === 'enrolled' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy !== null}
                            onClick={() => {
                              setRefund(false)
                              setWithdrawing(reg)
                            }}
                          >
                            Withdraw
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {roster.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-secondary-text">
                      No learners yet. Share the registration link, or add learners yourself.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </GlassCard>
      ) : (
        <AttendanceTab
          sessions={cohortSessions}
          roster={rosterForAttendance}
          minAttendance={minAtt}
          onEdit={(s) => setAttendance(s)}
          onDelete={(s) => {
            deleteSession(s.id)
            notify(`Attendance for ${s.date} deleted.`, 'info')
          }}
          rateOf={(id) => attendanceRate(id, cohortId, sessions)}
        />
      )}

      {editing ? (
        <CohortFormModal
          cohort={cohort}
          programs={programs}
          trainers={trainers}
          onClose={() => setEditing(false)}
          onSave={(input) => {
            saveCohort(input)
            setEditing(false)
            notify('Cohort saved.')
          }}
        />
      ) : null}

      {enrolling ? (
        <EnrollLearnersModal
          cohort={cohort}
          price={price}
          currency={currency}
          learners={learners}
          registrations={registrations}
          busy={busy === 'enroll'}
          onAddLearner={(person) => setPeople((prev) => [person, ...prev])}
          onClose={() => setEnrolling(false)}
          onEnroll={(ids, charge) =>
            void act(
              'enroll',
              async () => {
                await enrollInCohort(cohort.id, ids, charge)
                setEnrolling(false)
              },
              charge && price > 0 ? `Invoiced ${ids.length} learner${ids.length === 1 ? '' : 's'}. Their seats are held until paid.` : `Enrolled ${ids.length} learner${ids.length === 1 ? '' : 's'}.`,
            )
          }
        />
      ) : null}

      {attendance ? (
        <TakeAttendanceModal
          cohort={cohort}
          roster={rosterForAttendance}
          session={attendance === 'new' ? null : attendance}
          existingDates={cohortSessions.map((s) => s.date)}
          onClose={() => setAttendance(null)}
          onSave={(session) => {
            saveSession({ ...session, takenById: me?.id, takenByName: me?.name, takenAt: new Date().toISOString() })
            setAttendance(null)
            setTab('Attendance')
            notify(`Attendance for ${session.date} saved.`)
            // Attendance can be the last requirement for a certificate.
            void runCertificateCheck().then(refresh).catch(() => undefined)
          }}
        />
      ) : null}

      <Modal
        open={withdrawing !== null}
        onClose={() => setWithdrawing(null)}
        title="Withdraw learner?"
        description={withdrawing ? `${withdrawing.studentName} will lose access to the program's courses.` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setWithdrawing(null)}>
              Keep enrolled
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                const reg = withdrawing
                setWithdrawing(null)
                if (reg) void act(reg.id, () => cancelRegistration(reg.id, { reason: 'Withdrawn by admin', refund }), `${reg.studentName} withdrawn.`)
              }}
            >
              Withdraw
            </Button>
          </>
        }
      >
        {withdrawing && Number(withdrawing.amount) > 0 ? (
          <label className="flex items-center gap-2 text-[13px] text-navy-900">
            <input type="checkbox" checked={refund} onChange={(e) => setRefund(e.target.checked)} className="accent-lemon-500" />
            Mark the fee ({formatMoney(Number(withdrawing.amount), withdrawing.currency)}) as refunded
          </label>
        ) : (
          <p className="text-[13px] text-secondary-text">No fee was paid for this place.</p>
        )}
      </Modal>
    </div>
  )
}

function AttendanceTab({
  sessions,
  roster,
  minAttendance: minAtt,
  onEdit,
  onDelete,
  rateOf,
}: {
  sessions: CohortSession[]
  roster: { id: string; name: string }[]
  minAttendance: number
  onEdit: (s: CohortSession) => void
  onDelete: (s: CohortSession) => void
  rateOf: (studentId: string) => number | null
}) {
  const recent = [...sessions].slice(0, 10).reverse()
  if (!sessions.length) {
    return <GlassCard className="p-10 text-center text-[13px] text-secondary-text">No sessions recorded yet. Use “Take attendance” after each class.</GlassCard>
  }
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <GlassCard className="overflow-hidden p-0">
        <div className="border-b border-divider px-5 py-3 text-[13px] font-bold text-navy-900">Sessions</div>
        <ul>
          {sessions.map((s) => {
            const values = Object.values(s.marks ?? {})
            const attended = values.filter((m) => m === 'present' || m === 'late').length
            const counted = values.filter((m) => m !== 'excused').length
            return (
              <li key={s.id} className="flex items-center gap-3 border-b border-divider px-5 py-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-navy-900">{s.date}</p>
                  <p className="truncate text-[12px] text-secondary-text">
                    {s.topic || 'No topic'}
                    {s.takenByName ? ` · by ${s.takenByName}` : ''}
                  </p>
                </div>
                <span className="text-[13px] font-semibold text-navy-900">{counted ? Math.round((attended / counted) * 100) : 0}%</span>
                <Button variant="ghost" size="sm" onClick={() => onEdit(s)} aria-label="Edit attendance">
                  <Pencil size={13} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(s)} aria-label="Delete session">
                  <Trash2 size={13} />
                </Button>
              </li>
            )
          })}
        </ul>
      </GlassCard>
      <GlassCard className="overflow-hidden p-0">
        <div className="border-b border-divider px-5 py-3 text-[13px] font-bold text-navy-900">By learner (last {recent.length} sessions)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="text-left text-[11px] uppercase tracking-wide text-secondary-text">
              <tr>
                <th className="px-5 py-2 font-medium">Learner</th>
                {recent.map((s) => (
                  <th key={s.id} className="px-1.5 py-2 text-center font-medium" title={s.topic}>
                    {s.date.slice(5)}
                  </th>
                ))}
                <th className="px-5 py-2 text-right font-medium">Rate</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((r) => {
                const rate = rateOf(r.id)
                return (
                  <tr key={r.id} className="border-t border-divider">
                    <td className="whitespace-nowrap px-5 py-2 text-navy-900">{r.name}</td>
                    {recent.map((s) => {
                      const mark = s.marks?.[r.id]
                      return (
                        <td key={s.id} className="px-1.5 py-2 text-center">
                          {mark ? (
                            <span
                              title={MARK_META[mark].label}
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold ${
                                mark === 'present' ? 'bg-success-bg text-success' : mark === 'late' ? 'bg-warning-bg text-[#8A6D00]' : mark === 'absent' ? 'bg-danger-bg text-danger' : 'bg-navy-50 text-secondary-text dark:bg-white/5'
                              }`}
                            >
                              {MARK_META[mark].short}
                            </span>
                          ) : (
                            <span className="text-secondary-text">·</span>
                          )}
                        </td>
                      )
                    })}
                    <td className={`px-5 py-2 text-right font-semibold ${rate !== null && rate < minAtt ? 'text-danger' : 'text-navy-900'}`}>{rate === null ? '—' : `${rate}%`}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}

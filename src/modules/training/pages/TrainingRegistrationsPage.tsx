/**
 * Every cohort registration in one place: who signed up, for which intake,
 * whether they have paid, and what is still waiting on the training team.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ClipboardList, Hourglass, Link2, Loader2, TriangleAlert, Wallet } from 'lucide-react'

import { apiErrorMessage } from '../../../shared/api/client'
import { cancelRegistration, confirmRegistration } from '../../../shared/api/trainingApi'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useApiCollection } from '../../../shared/hooks/useApiCollection'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { STORAGE_KEYS } from '../../../shared/storage/keys'
import type { PaymentRecord } from '../../institution/types/platform'
import { useCohortRegistrations, useCohorts, useRefreshTraining, useTrainingPrograms } from '../hooks/useTrainingData'
import { registrationLink } from '../utils/registrationLink'
import { downloadCsv, formatMoney, REGISTRATION_META, registrationState } from '../utils/trainingUtils'

const STAT = 17
const NO_PAYMENTS: PaymentRecord[] = []

export function TrainingRegistrationsPage() {
  const { notify } = useToast()
  const refresh = useRefreshTraining()
  const { programs } = useTrainingPrograms()
  const { cohorts } = useCohorts()
  const { registrations } = useCohortRegistrations()
  const [payments] = useApiCollection<PaymentRecord[]>(STORAGE_KEYS.payments, NO_PAYMENTS)

  const [status, setStatus] = useState('open')
  const [programFilter, setProgramFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const programById = useMemo(() => new Map(programs.map((p) => [p.id, p])), [programs])
  const cohortById = useMemo(() => new Map(cohorts.map((c) => [c.id, c])), [cohorts])
  const invoiceById = useMemo(() => new Map(payments.map((p) => [p.id, p])), [payments])

  const rows = useMemo(
    () =>
      registrations
        .map((r) => ({ reg: r, state: registrationState(r), cohort: cohortById.get(r.cohortId), program: programById.get(r.programId) }))
        .sort((a, b) => (b.reg.registeredAt ?? b.reg.createdAt).localeCompare(a.reg.registeredAt ?? a.reg.createdAt)),
    [registrations, cohortById, programById],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter(
      (r) =>
        (status === 'all' || (status === 'open' ? r.state === 'pending_payment' || r.state === 'expired' : r.state === status)) &&
        (programFilter === 'all' || r.reg.programId === programFilter) &&
        (!q || `${r.reg.studentName} ${r.reg.studentEmail ?? ''} ${r.cohort?.name ?? ''}`.toLowerCase().includes(q)),
    )
  }, [rows, status, programFilter, query])

  const count = (s: string) => rows.filter((r) => r.state === s).length
  const paid = registrations.reduce((sum, r) => sum + (r.invoiceId && invoiceById.get(r.invoiceId)?.status === 'paid' ? Number(r.amount) || 0 : 0), 0)
  const outstanding = rows.filter((r) => r.state === 'pending_payment').reduce((sum, r) => sum + (Number(r.reg.amount) || 0), 0)
  const currency = programs[0]?.currency ?? 'ETB'

  async function act(id: string, fn: () => Promise<unknown>, done: string) {
    setBusy(id)
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

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Registrations"
        subtitle="Cohort sign-ups from the registration page, the learner portal and your team."
        actions={
          <Button
            variant="secondary"
            onClick={() =>
              void navigator.clipboard
                .writeText(registrationLink())
                .then(() => notify('Registration page link copied.'))
                .catch(() => notify(registrationLink(), 'info'))
            }
          >
            <Link2 size={16} /> Registration page link
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatBlock label="Registrations" value={rows.length} icon={<ClipboardList size={STAT} />} />
        <StatBlock label="Enrolled" value={count('enrolled')} icon={<CheckCircle2 size={STAT} />} iconBg="bg-success-bg text-success" />
        <StatBlock label="Awaiting payment" value={count('pending_payment')} sub={`${formatMoney(outstanding, currency)} outstanding`} icon={<Hourglass size={STAT} />} iconBg="bg-warning-bg text-[#8A6D00]" />
        <StatBlock label="Holds expired" value={count('expired')} sub="Seat released — follow up or cancel" icon={<TriangleAlert size={STAT} />} iconBg="bg-danger-bg text-danger" />
        <StatBlock label="Fees collected" value={formatMoney(paid, currency)} icon={<Wallet size={STAT} />} iconBg="bg-info-bg text-info" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <SelectMenu
            value={status}
            onChange={setStatus}
            options={[
              { value: 'open', label: 'Needs action' },
              { value: 'all', label: 'All registrations' },
              { value: 'enrolled', label: 'Enrolled' },
              { value: 'pending_payment', label: 'Awaiting payment' },
              { value: 'expired', label: 'Hold expired' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            aria-label="Status"
          />
          <SelectMenu value={programFilter} onChange={setProgramFilter} options={[{ value: 'all', label: 'All programs' }, ...programs.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` }))]} aria-label="Program" />
          <span className="self-center text-[13px] font-semibold text-navy-700">{visible.length} shown</span>
        </div>
        <div className="flex gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search learner or cohort…" className="lg:w-72" />
          <Button
            variant="secondary"
            disabled={!visible.length}
            onClick={() =>
              downloadCsv(
                `registrations-${new Date().toISOString().slice(0, 10)}.csv`,
                visible.map(({ reg, state, cohort, program }) => ({
                  Learner: reg.studentName,
                  Email: reg.studentEmail ?? '',
                  Phone: reg.phone ?? '',
                  Organization: reg.organization ?? '',
                  Program: program?.name ?? '',
                  Cohort: cohort?.name ?? '',
                  Registered: reg.createdAt,
                  Source: reg.source,
                  Fee: reg.amount,
                  Currency: reg.currency,
                  Status: REGISTRATION_META[state].label,
                })),
              )
            }
          >
            CSV
          </Button>
        </div>
      </div>

      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-navy-50/60 text-left text-[11px] uppercase tracking-wide text-secondary-text dark:bg-white/5">
              <tr>
                <th className="px-5 py-3 font-medium">Learner</th>
                <th className="px-5 py-3 font-medium">Cohort</th>
                <th className="px-5 py-3 font-medium">Registered</th>
                <th className="px-5 py-3 font-medium">Fee</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(({ reg, state, cohort, program }) => (
                <tr key={reg.id} className="border-b border-divider last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-navy-900">{reg.studentName}</p>
                    <p className="text-[12px] text-secondary-text">
                      {reg.studentEmail}
                      {reg.phone ? ` · ${reg.phone}` : ''}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    {cohort ? (
                      <Link to={`/admin/training/cohorts/${cohort.id}`} className="font-medium text-navy-900 hover:underline">
                        {cohort.name}
                      </Link>
                    ) : (
                      <span className="text-secondary-text">Removed cohort</span>
                    )}
                    <p className="text-[12px] text-secondary-text">{program?.name}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-navy-900">{reg.createdAt}</p>
                    <p className="text-[12px] text-secondary-text">{reg.source === 'public' ? 'Registration page' : reg.source === 'self' ? 'Learner portal' : 'Added by admin'}</p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-navy-900">{formatMoney(Number(reg.amount) || 0, reg.currency)}</td>
                  <td className="px-5 py-3">
                    <StatusPill label={REGISTRATION_META[state].label} tone={REGISTRATION_META[state].tone} />
                  </td>
                  <td className="px-5 py-3">
                    {reg.status === 'pending_payment' ? (
                      <div className="flex justify-end gap-1">
                        <Button variant="outline-green" size="sm" disabled={busy !== null} onClick={() => void act(reg.id, () => confirmRegistration(reg.id, 'offline'), `${reg.studentName} marked as paid and enrolled.`)}>
                          {busy === reg.id ? <Loader2 size={13} className="animate-spin" /> : null}
                          Mark paid
                        </Button>
                        <Button variant="ghost" size="sm" disabled={busy !== null} onClick={() => void act(reg.id, () => cancelRegistration(reg.id, { reason: 'Cancelled by admin' }), `${reg.studentName}'s registration was cancelled.`)}>
                          Cancel
                        </Button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-secondary-text">
                    {rows.length ? (status === 'open' ? 'Nothing needs your attention — every registration is settled.' : 'No registrations match your filters.') : 'No registrations yet. Share your registration page link to start taking sign-ups.'}
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

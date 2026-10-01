/**
 * Learners of a training institute: who they are, which cohorts they are in,
 * how they are doing, and what they still owe.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, GraduationCap, Loader2, Pencil, UserPlus, Users, Wallet } from 'lucide-react'

import { apiErrorMessage } from '../../../shared/api/client'
import { enrollInCohort } from '../../../shared/api/trainingApi'
import { Button } from '../../../shared/components/Button'
import { FormField } from '../../../shared/components/FormField'
import { Modal } from '../../../shared/components/Modal'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useApiCollection } from '../../../shared/hooks/useApiCollection'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { STORAGE_KEYS } from '../../../shared/storage/keys'
import { useCertificates } from '../../institution/hooks/useCertificates'
import { useEnrollments } from '../../institution/hooks/useEnrollments'
import { usePeople } from '../../institution/hooks/usePeople'
import type { PersonRow } from '../../institution/types'
import type { PaymentRecord } from '../../institution/types/platform'
import { useCohortAttendance, useCohortRegistrations, useCohorts, useRefreshTraining, useTrainingPrograms } from '../hooks/useTrainingData'
import {
  attendanceRate,
  cohortPrice,
  cohortProgress,
  cohortState,
  downloadCsv,
  formatMoney,
  registrationClosedReason,
  seatsLeft,
} from '../utils/trainingUtils'

const STAT = 17
const NO_PAYMENTS: PaymentRecord[] = []

interface LearnerForm {
  id?: string
  name: string
  email: string
  phone: string
  organization: string
  status: PersonRow['status']
}

export function TrainingLearnersPage() {
  const { notify } = useToast()
  const refresh = useRefreshTraining()
  const { people, setPeople } = usePeople()
  const { programs } = useTrainingPrograms()
  const { cohorts } = useCohorts()
  const { registrations } = useCohortRegistrations()
  const { sessions } = useCohortAttendance()
  const { enrollments } = useEnrollments()
  const { certificates } = useCertificates()
  const [payments] = useApiCollection<PaymentRecord[]>(STORAGE_KEYS.payments, NO_PAYMENTS)

  const [query, setQuery] = useState('')
  const [cohortFilter, setCohortFilter] = useState('all')
  const [form, setForm] = useState<LearnerForm | null>(null)
  const [enrollFor, setEnrollFor] = useState<PersonRow | null>(null)
  const [enrollCohort, setEnrollCohort] = useState('')
  const [charge, setCharge] = useState(true)
  const [busy, setBusy] = useState(false)

  const cohortById = useMemo(() => new Map(cohorts.map((c) => [c.id, c])), [cohorts])
  const programById = useMemo(() => new Map(programs.map((p) => [p.id, p])), [programs])
  const learners = useMemo(() => people.filter((p) => p.role === 'Student'), [people])

  const rows = useMemo(
    () =>
      learners.map((person) => {
        const regs = registrations.filter((r) => r.studentId === person.id && r.status !== 'cancelled')
        const enrolled = regs.filter((r) => r.status === 'enrolled')
        const rates = enrolled.map((r) => attendanceRate(person.id, r.cohortId, sessions)).filter((x): x is number => x !== null)
        const progress = enrolled.map((r) => cohortProgress(person.id, r.cohortId, enrollments))
        const owed = payments.filter((p) => p.studentId === person.id && (p.status === 'pending' || p.status === 'overdue')).reduce((s, p) => s + Number(p.amount || 0), 0)
        return {
          person,
          regs,
          progress: progress.length ? Math.round(progress.reduce((a, b) => a + b, 0) / progress.length) : null,
          attendance: rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null,
          certificates: certificates.filter((c) => c.studentId === person.id && c.status === 'issued').length,
          owed,
        }
      }),
    [learners, registrations, sessions, enrollments, payments, certificates],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows
      .filter(
        (r) =>
          (cohortFilter === 'all' || (cohortFilter === 'none' ? r.regs.length === 0 : r.regs.some((x) => x.cohortId === cohortFilter))) &&
          (!q || `${r.person.name} ${r.person.email} ${r.person.organization ?? ''}`.toLowerCase().includes(q)),
      )
      .sort((a, b) => a.person.name.localeCompare(b.person.name))
  }, [rows, cohortFilter, query])

  const openCohorts = cohorts.filter((c) => {
    const s = cohortState(c)
    return s === 'upcoming' || s === 'active'
  })
  const emailTaken =
    !!form && people.some((p) => p.id !== form.id && p.email.toLowerCase() === form.email.trim().toLowerCase())
  const formValid = !!form && form.name.trim().length > 1 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()) && !emailTaken

  function saveLearner() {
    if (!form || !formValid) return
    const name = form.name.trim()
    const initials = name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
    if (form.id) {
      setPeople((prev) =>
        prev.map((p) =>
          p.id === form.id
            ? { ...p, name, initials, email: form.email.trim().toLowerCase(), phone: form.phone.trim() || null, organization: form.organization.trim() || null, department: form.organization.trim() || p.department, status: form.status }
            : p,
        ),
      )
      notify(`${name} saved.`)
    } else {
      const person: PersonRow = {
        id: createId('lrn'),
        name,
        initials,
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        organization: form.organization.trim() || null,
        role: 'Student',
        department: form.organization.trim() || 'Independent learner',
        campusId: 'c1',
        status: form.status,
        verificationStatus: 'verified',
        addedByRole: 'Admin',
        lastActive: 'Never',
        joinedAt: new Date().toISOString().slice(0, 10),
        source: 'admin',
      }
      setPeople((prev) => [person, ...prev])
      notify(`${name} added. They can sign in with ${person.email}.`)
    }
    setForm(null)
  }

  async function enroll() {
    if (!enrollFor || !enrollCohort) return
    setBusy(true)
    try {
      const cohort = cohortById.get(enrollCohort)
      const [result] = await enrollInCohort(enrollCohort, [enrollFor.id], charge)
      await refresh()
      notify(
        result?.alreadyRegistered
          ? `${enrollFor.name} is already in ${cohort?.name}.`
          : result?.status === 'pending_payment'
            ? `${enrollFor.name} was invoiced for ${cohort?.name}. The seat is held until paid.`
            : `${enrollFor.name} is enrolled in ${cohort?.name}.`,
      )
      setEnrollFor(null)
    } catch (err) {
      notify(apiErrorMessage(err) ?? 'Could not enroll this learner.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const chosenCohort = cohortById.get(enrollCohort)
  const chosenPrice = chosenCohort ? cohortPrice(chosenCohort, programById.get(chosenCohort.programId)) : 0

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Learners"
        subtitle="Everyone who trains with you — their cohorts, progress, attendance and balance."
        actions={
          <Button variant="primary" onClick={() => setForm({ name: '', email: '', phone: '', organization: '', status: 'active' })}>
            <UserPlus size={16} /> Add learner
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBlock label="Learners" value={learners.length} sub={`${learners.filter((p) => p.status === 'active').length} active`} icon={<Users size={STAT} />} />
        <StatBlock label="In a cohort now" value={rows.filter((r) => r.regs.some((x) => x.status === 'enrolled' && cohortById.get(x.cohortId) && cohortState(cohortById.get(x.cohortId)!) !== 'completed')).length} icon={<GraduationCap size={STAT} />} iconBg="bg-info-bg text-info" />
        <StatBlock label="Certificates issued" value={certificates.filter((c) => c.status === 'issued').length} icon={<Award size={STAT} />} iconBg="bg-success-bg text-success" />
        <StatBlock label="Balance outstanding" value={formatMoney(rows.reduce((s, r) => s + r.owed, 0), programs[0]?.currency ?? 'ETB')} sub={`${rows.filter((r) => r.owed > 0).length} learners`} icon={<Wallet size={STAT} />} iconBg="bg-warning-bg text-[#8A6D00]" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <SelectMenu
            value={cohortFilter}
            onChange={setCohortFilter}
            options={[{ value: 'all', label: 'All learners' }, { value: 'none', label: 'Not in any cohort' }, ...cohorts.map((c) => ({ value: c.id, label: c.name }))]}
            aria-label="Cohort"
          />
          <span className="self-center text-[13px] font-semibold text-navy-700">{visible.length} shown</span>
        </div>
        <div className="flex gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, email or organization…" className="lg:w-80" />
          <Button
            variant="secondary"
            disabled={!visible.length}
            onClick={() =>
              downloadCsv(
                `learners-${new Date().toISOString().slice(0, 10)}.csv`,
                visible.map((r) => ({
                  Name: r.person.name,
                  Email: r.person.email,
                  Phone: r.person.phone ?? '',
                  Organization: r.person.organization ?? '',
                  Cohorts: r.regs.map((x) => cohortById.get(x.cohortId)?.name ?? '').join('; '),
                  'Progress %': r.progress ?? '',
                  'Attendance %': r.attendance ?? '',
                  Certificates: r.certificates,
                  Outstanding: r.owed,
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
                <th className="px-5 py-3 font-medium">Cohorts</th>
                <th className="px-5 py-3 font-medium">Progress</th>
                <th className="px-5 py-3 font-medium">Attendance</th>
                <th className="px-5 py-3 font-medium">Certificates</th>
                <th className="px-5 py-3 font-medium">Balance</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.person.id} className="border-b border-divider last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-navy-900">
                      {r.person.name} {r.person.status !== 'active' ? <StatusPill label={r.person.status} tone="neutral" /> : null}
                    </p>
                    <p className="text-[12px] text-secondary-text">
                      {r.person.email}
                      {r.person.phone ? ` · ${r.person.phone}` : ''}
                    </p>
                    {r.person.organization ? <p className="text-[12px] text-secondary-text">{r.person.organization}</p> : null}
                  </td>
                  <td className="px-5 py-3">
                    {r.regs.length ? (
                      <div className="flex flex-col gap-0.5">
                        {r.regs.map((x) => (
                          <Link key={x.id} to={`/admin/training/cohorts/${x.cohortId}`} className="text-navy-900 hover:underline">
                            {cohortById.get(x.cohortId)?.name ?? 'Removed cohort'}
                            {x.status === 'pending_payment' ? <span className="text-[12px] text-[#8A6D00]"> · awaiting payment</span> : null}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="text-secondary-text">None</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-navy-900">{r.progress === null ? '—' : `${r.progress}%`}</td>
                  <td className="px-5 py-3 text-navy-900">{r.attendance === null ? '—' : `${r.attendance}%`}</td>
                  <td className="px-5 py-3 text-navy-900">{r.certificates}</td>
                  <td className={`whitespace-nowrap px-5 py-3 ${r.owed ? 'font-semibold text-[#8A6D00]' : 'text-secondary-text'}`}>{r.owed ? formatMoney(r.owed, programs[0]?.currency) : '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!openCohorts.length || r.person.status !== 'active'}
                        onClick={() => {
                          setEnrollFor(r.person)
                          setEnrollCohort(openCohorts[0]?.id ?? '')
                          setCharge(true)
                        }}
                      >
                        Enroll
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Edit learner"
                        onClick={() =>
                          setForm({
                            id: r.person.id,
                            name: r.person.name,
                            email: r.person.email,
                            phone: r.person.phone ?? '',
                            organization: r.person.organization ?? '',
                            status: r.person.status,
                          })
                        }
                      >
                        <Pencil size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-secondary-text">
                    {learners.length ? 'No learners match your filters.' : 'No learners yet. They appear here when they register, or add them yourself.'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <Modal
        open={form !== null}
        onClose={() => setForm(null)}
        title={form?.id ? 'Edit learner' : 'Add learner'}
        description="Learners sign in with their email address and a one-time code."
        footer={
          <>
            <span className="mr-auto text-[12px] text-danger">{emailTaken ? 'Someone already uses this email.' : ''}</span>
            <Button variant="secondary" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={!formValid} onClick={saveLearner}>
              {form?.id ? 'Save' : 'Add learner'}
            </Button>
          </>
        }
      >
        {form ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <FormField label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <FormField label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <FormField label="Organization (optional)" value={form.organization} onChange={(v) => setForm({ ...form, organization: v })} placeholder="Employer or sponsor" />
            <FormField label="Status" type="select" value={form.status} onChange={(v) => setForm({ ...form, status: v as PersonRow['status'] })} options={['active', 'suspended']} />
          </div>
        ) : null}
      </Modal>

      <Modal
        open={enrollFor !== null}
        onClose={() => setEnrollFor(null)}
        title={`Enroll ${enrollFor?.name ?? ''}`}
        description="Pick an upcoming or running cohort."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEnrollFor(null)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={!enrollCohort || busy} onClick={() => void enroll()}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : null}
              {charge && chosenPrice > 0 ? 'Send invoice' : 'Enroll'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <SelectMenu
            value={enrollCohort}
            onChange={setEnrollCohort}
            options={openCohorts.map((c) => {
              const left = seatsLeft(c, registrations)
              const program = programById.get(c.programId)
              return {
                value: c.id,
                label: `${c.name} — ${program?.name ?? ''}`,
                hint: `${left === null ? 'no seat limit' : `${left} seats left`} · ${formatMoney(cohortPrice(c, program), program?.currency)}`,
              }
            })}
            aria-label="Cohort"
          />
          {chosenCohort && registrationClosedReason(chosenCohort, programById.get(chosenCohort.programId), registrations) ? (
            <p className="text-[12px] text-secondary-text">
              Note: {registrationClosedReason(chosenCohort, programById.get(chosenCohort.programId), registrations)} Admins can still add learners while seats remain.
            </p>
          ) : null}
          {chosenPrice > 0 ? (
            <label className="flex items-center gap-2 text-[13px] text-navy-900">
              <input type="checkbox" checked={charge} onChange={(e) => setCharge(e.target.checked)} className="accent-lemon-500" />
              Invoice the fee ({formatMoney(chosenPrice, programById.get(chosenCohort?.programId ?? '')?.currency)}) — untick for a sponsored place
            </label>
          ) : null}
        </div>
      </Modal>
    </div>
  )
}

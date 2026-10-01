/**
 * Public program catalog and registration for a training institute — the link
 * the institute shares on its website and social media. No sign-in: a learner
 * picks a cohort and registers; a paid program then asks them to sign in with
 * the same email and pay, which confirms the seat.
 */
import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, Loader2, MapPin, UserRound, Users, X } from 'lucide-react'

import brandLogo from '../../../assets/Logo.jpg'
import { apiErrorMessage } from '../../../shared/api/client'
import { fetchPublicCatalog, registerPublic } from '../../../shared/api/trainingApi'
import { ThemeToggle } from '../../../shared/components/ThemeToggle'
import type { PublicCohort, PublicProgram, RegistrationResult } from '../types'
import { DELIVERY_LABEL, formatDateRange, formatMoney, HOLD_DAYS } from '../utils/trainingUtils'

const inputClass =
  'w-full px-3.5 py-2.5 text-[14px] input-surface rounded-xl outline-none focus:ring-2 focus:ring-lemon-500/25'

export function JoinTrainingPage() {
  const { tenantCode = '' } = useParams()
  const [params] = useSearchParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-catalog', tenantCode],
    queryFn: () => fetchPublicCatalog(tenantCode),
    retry: false,
  })

  const preselected = params.get('cohort')
  const [picked, setPicked] = useState<{ program: PublicProgram; cohort: PublicCohort } | null>(null)
  // A shared link can open straight on one cohort (?cohort=…).
  const initialProgram = preselected ? data?.programs.find((p) => p.cohorts.some((c) => c.id === preselected)) : undefined
  const initialCohort = initialProgram?.cohorts.find((c) => c.id === preselected)
  const initial = initialProgram && initialCohort ? { program: initialProgram, cohort: initialCohort } : null
  const [dismissedInitial, setDismissedInitial] = useState(false)
  const active = picked ?? (dismissedInitial ? null : initial)

  const programs = data?.programs.filter((p) => p.cohorts.length > 0) ?? []

  return (
    <div className="marketing-page font-sans min-h-screen flex flex-col">
      <header className="border-b border-divider">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={brandLogo} alt="Brana LMS" className="h-9 w-auto rounded-lg object-contain" />
            <span className="font-extrabold text-[15px] marketing-section-heading">{data?.organizationName ?? 'Training programs'}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-[13px] font-semibold marketing-body-text hover:underline">
              Learner sign in
            </Link>
            <ThemeToggle variant="content" />
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <span className="marketing-accent-label">Programs & registration</span>
          <h1 className="mt-3 text-[30px] marketing-section-heading">{data ? `Train with ${data.organizationName}` : 'Find your next program'}</h1>
          <p className="mt-2 max-w-2xl text-[14.5px] marketing-body-text">
            Pick a program and an intake that suits you. Registration takes a minute; you will get an email with the next steps.
          </p>

          <div className="mt-8">
            {isLoading ? (
              <p className="flex items-center gap-2 text-[14px] marketing-body-text">
                <Loader2 size={16} className="animate-spin" /> Loading programs…
              </p>
            ) : error ? (
              <div className="rounded-2xl border border-danger/40 bg-danger-bg p-5 text-danger">
                <p className="text-[16px] font-bold">This registration page is not available</p>
                <p className="mt-1 text-[13.5px] marketing-body-text">{apiErrorMessage(error) ?? 'Check the link, or contact the training provider.'}</p>
              </div>
            ) : programs.length === 0 ? (
              <div className="rounded-2xl border border-divider p-8 text-center">
                <p className="text-[16px] font-bold marketing-section-heading">No intakes are open right now</p>
                <p className="mt-1 text-[13.5px] marketing-body-text">New cohorts are announced regularly — please check back soon.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {programs.map((program) => (
                  <ProgramCard key={program.id} program={program} onPick={(cohort) => setPicked({ program, cohort })} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {active ? (
        <RegisterSheet
          tenantCode={tenantCode}
          program={active.program}
          cohort={active.cohort}
          onClose={() => {
            setPicked(null)
            setDismissedInitial(true)
          }}
        />
      ) : null}
    </div>
  )
}

function ProgramCard({ program, onPick }: { program: PublicProgram; onPick: (cohort: PublicCohort) => void }) {
  return (
    <article className="rounded-2xl border border-divider p-6 bg-white/60 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11.5px] font-bold uppercase tracking-wide marketing-body-text opacity-80">
            {program.code}
            {program.level ? ` · ${program.level}` : ''}
            {program.credentialType ? ` · ${program.credentialType}` : ''}
          </p>
          <h2 className="mt-1 text-[20px] font-extrabold marketing-section-heading">{program.name}</h2>
        </div>
        <p className="text-[18px] font-extrabold text-lemon-700 dark:text-lemon-500">{formatMoney(program.price, program.currency)}</p>
      </div>
      {program.description ? <p className="mt-3 text-[14px] marketing-body-text">{program.description}</p> : null}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] marketing-body-text">
        {program.durationWeeks ? (
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} /> {program.durationWeeks} week{program.durationWeeks === 1 ? '' : 's'}{program.totalHours ? ` · ${program.totalHours} hours` : ''}
          </span>
        ) : null}
        {program.deliveryMode ? <span>{DELIVERY_LABEL[program.deliveryMode] ?? program.deliveryMode}</span> : null}
      </div>
      {program.courses.length ? (
        <div className="mt-4">
          <p className="text-[12px] font-bold uppercase tracking-wide marketing-body-text opacity-80">What you will study</p>
          <ul className="mt-1.5 grid grid-cols-1 gap-1 text-[13.5px] marketing-section-heading sm:grid-cols-2">
            {program.courses.map((c) => (
              <li key={c.code} className="flex items-start gap-2">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-lemon-600" /> {c.title}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {program.skills.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {program.skills.map((s) => (
            <span key={s} className="rounded-full border border-divider px-2.5 py-0.5 text-[12px] marketing-body-text">
              {s}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-2">
        <p className="text-[12px] font-bold uppercase tracking-wide marketing-body-text opacity-80">Upcoming intakes</p>
        {program.cohorts.map((cohort) => (
          <div key={cohort.id} className="flex flex-col gap-3 rounded-xl border border-divider p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-bold marketing-section-heading">{cohort.name}</p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] marketing-body-text">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays size={13} /> {formatDateRange(cohort.startDate, cohort.endDate)}
                </span>
                {cohort.schedule ? <span>{cohort.schedule}</span> : null}
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} /> {cohort.location || DELIVERY_LABEL[cohort.deliveryMode ?? ''] || 'To be confirmed'}
                </span>
                {cohort.trainerName ? (
                  <span className="inline-flex items-center gap-1">
                    <UserRound size={13} /> {cohort.trainerName}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <Users size={13} /> {cohort.seatsLeft === null ? 'Open enrollment' : cohort.seatsLeft === 0 ? 'Full' : `${cohort.seatsLeft} seat${cohort.seatsLeft === 1 ? '' : 's'} left`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-bold marketing-section-heading">{formatMoney(cohort.price, cohort.currency)}</span>
              {cohort.open ? (
                <button
                  type="button"
                  onClick={() => onPick(cohort)}
                  className="rounded-xl bg-lemon-500 px-4 py-2 text-[13.5px] font-bold text-[#020810] hover:bg-lemon-400 transition-colors cursor-pointer"
                >
                  Register
                </button>
              ) : (
                <span className="rounded-xl border border-divider px-3 py-2 text-[12.5px] marketing-body-text">{cohort.closedReason ?? 'Closed'}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

function RegisterSheet({ tenantCode, program, cohort, onClose }: { tenantCode: string; program: PublicProgram; cohort: PublicCohort; onClose: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [organization, setOrganization] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RegistrationResult | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (name.trim().length < 2) return setError('Please enter your full name.')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError('Please enter a valid email address.')
    setBusy(true)
    try {
      setResult(await registerPublic(tenantCode, { cohortId: cohort.id, name: name.trim(), email: email.trim(), phone: phone.trim(), organization: organization.trim() }))
    } catch (err) {
      setError(apiErrorMessage(err) ?? 'Registration failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const signInLink = (redirect: string) => `/login?email=${encodeURIComponent(email.trim().toLowerCase())}&redirect=${encodeURIComponent(redirect)}`

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Register for ${program.name}`}>
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-2xl dark:bg-[#0a121e] sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-wide marketing-body-text opacity-80">{program.name}</p>
            <h2 className="text-[20px] font-extrabold marketing-section-heading">{cohort.name}</h2>
            <p className="mt-1 text-[13px] marketing-body-text">
              {formatDateRange(cohort.startDate, cohort.endDate)} · {formatMoney(cohort.price, cohort.currency)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 marketing-body-text hover:bg-black/5 dark:hover:bg-white/10" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {result ? (
          <div className="mt-5">
            {result.status === 'enrolled' ? (
              <>
                <div className="rounded-xl border border-success/40 bg-success-bg p-4 text-success">
                  <p className="text-[15px] font-bold">{result.alreadyRegistered ? 'You are already enrolled' : 'You are enrolled!'}</p>
                  <p className="mt-1 text-[13.5px] marketing-body-text">Your place in {result.cohortName} is confirmed. We have emailed you the details.</p>
                </div>
                <Link to={signInLink('/student')} className="mt-4 inline-flex w-full justify-center rounded-xl bg-lemon-500 px-4 py-2.5 text-[14px] font-bold text-[#020810] hover:bg-lemon-400">
                  Sign in to start learning
                </Link>
              </>
            ) : (
              <>
                <div className="rounded-xl border border-warning/40 bg-warning-bg p-4">
                  <p className="text-[15px] font-bold text-[#8A6D00] dark:text-warning">{result.alreadyRegistered ? 'You have already registered' : 'Your seat is reserved'}</p>
                  <p className="mt-1 text-[13.5px] marketing-body-text">
                    Pay the registration fee of <strong>{formatMoney(result.amount, result.currency)}</strong> within {HOLD_DAYS} days to confirm your place. Sign in with{' '}
                    <strong>{email.trim().toLowerCase()}</strong> — we send you a one-time code, no password needed.
                  </p>
                </div>
                <Link to={signInLink('/student/payments')} className="mt-4 inline-flex w-full justify-center rounded-xl bg-lemon-500 px-4 py-2.5 text-[14px] font-bold text-[#020810] hover:bg-lemon-400">
                  Sign in and pay now
                </Link>
              </>
            )}
            <button type="button" onClick={onClose} className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold marketing-body-text hover:underline">
              <ArrowLeft size={14} /> Back to programs
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="mt-5 flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-bold marketing-section-heading">Full name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoComplete="name" required />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-bold marketing-section-heading">Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="email" required />
              <span className="text-[12px] marketing-body-text">You will sign in with this address.</span>
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-[12.5px] font-bold marketing-section-heading">Phone</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} autoComplete="tel" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[12.5px] font-bold marketing-section-heading">Organization (optional)</span>
                <input value={organization} onChange={(e) => setOrganization(e.target.value)} className={inputClass} autoComplete="organization" />
              </label>
            </div>
            {error ? <p className="rounded-xl bg-danger-bg px-3 py-2 text-[13px] text-danger">{error}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-lemon-500 px-4 py-2.5 text-[14px] font-bold text-[#020810] hover:bg-lemon-400 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              {cohort.price > 0 ? `Register — ${formatMoney(cohort.price, cohort.currency)}` : 'Register for free'}
            </button>
            <p className="text-center text-[12px] marketing-body-text">
              {cohort.price > 0 ? `Your seat is held for ${HOLD_DAYS} days while you pay.` : 'You will be enrolled straight away.'}
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

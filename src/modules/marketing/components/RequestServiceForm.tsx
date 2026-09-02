import { useState, type FormEvent, type ReactNode } from 'react'
import { CheckCircle2, GraduationCap, Briefcase, Building2, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { InstitutionType, ServiceRequestPayload } from '../types'
import { submitServiceRequest } from '../api/leadApi'

const INSTITUTION_EDITIONS: {
  value: InstitutionType
  label: string
  description: string
  icon: LucideIcon
}[] = [
  {
    value: 'college_university',
    label: 'University Edition',
    description: 'Colleges & universities — programs, departments, academic calendar.',
    icon: GraduationCap,
  },
  {
    value: 'corporate',
    label: 'Corporate Edition',
    description: 'Companies & enterprises — employee training and compliance.',
    icon: Briefcase,
  },
  {
    value: 'training',
    label: 'Training Edition',
    description: 'Training providers & academies — courses, cohorts, certificates.',
    icon: Building2,
  },
]

const EMPTY_FORM: ServiceRequestPayload = {
  institutionName: '',
  institutionType: 'college_university',
  contactName: '',
  email: '',
  phone: '',
  estimatedUsers: '',
  preferredSubdomain: '',
  message: '',
}

const TOTAL_STEPS = 3

export function RequestServiceForm() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<ServiceRequestPayload>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function update<K extends keyof ServiceRequestPayload>(key: K, value: ServiceRequestPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function validateStep(current: number): string {
    if (current === 1) {
      if (!form.institutionName.trim()) return 'Please enter your institution name.'
      if (!form.institutionType) return 'Please select your institution edition.'
    }
    if (current === 2) {
      if (!form.contactName.trim()) return 'Please enter a contact person.'
      if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Please enter a valid email address.'
      if (!form.phone.trim()) return 'Please enter a phone number.'
    }
    return ''
  }

  function goNext() {
    const err = validateStep(step)
    if (err) {
      setError(err)
      return
    }
    setError('')
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  function goBack() {
    setError('')
    setStep((s) => Math.max(s - 1, 1))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await submitServiceRequest(form)
      setSubmitted(true)
    } catch {
      setError('Something went wrong sending your request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="marketing-form-panel p-10 md:p-14 text-center marketing-reveal-visible">
        <div className="marketing-success-icon w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} strokeWidth={2.25} />
        </div>
        <h3 className="text-[22px] font-extrabold marketing-section-heading">Request received!</h3>
        <p className="mt-3 text-[14px] marketing-body-text max-w-md mx-auto leading-relaxed">
          Thank you, {form.contactName.split(' ')[0] || 'there'}. Our team has been notified
          and will review <strong>{form.institutionName}</strong>&rsquo;s request. You&rsquo;ll
          receive a custom proposal and invoice at <strong>{form.email}</strong> within 1
          business day. Once payment and the agreement are confirmed, we&rsquo;ll email you
          your dedicated Brana LMS link — with <strong>all modules included</strong>.
        </p>
        <button
          onClick={() => {
            setForm(EMPTY_FORM)
            setStep(1)
            setSubmitted(false)
          }}
          className="mt-7 text-navy-900 font-bold text-[13.5px] border-b-2 border-lemon-500 pb-1 cursor-pointer"
        >
          Submit another request
        </button>
      </div>
    )
  }

  return (
    <div className="marketing-form-panel p-7 md:p-10">
      {/* progress */}
      <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full bg-divider overflow-hidden">
            <div
              className="h-full bg-lemon-500 transition-all duration-500"
              style={{ width: i + 1 <= step ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-[19px] font-extrabold marketing-section-heading">Choose your edition</h3>
              <p className="text-[13px] marketing-body-text mt-1">Step 1 of {TOTAL_STEPS}</p>
            </div>

            <Field label="Institution name">
              <input
                value={form.institutionName}
                onChange={(e) => update('institutionName', e.target.value)}
                placeholder="e.g. Addis Ababa University"
                className={inputClass}
              />
            </Field>

            <Field label="Institution edition">
              <div className="grid gap-2.5">
                {INSTITUTION_EDITIONS.map((ed) => {
                  const active = form.institutionType === ed.value
                  const Icon = ed.icon
                  return (
                    <button
                      type="button"
                      key={ed.value}
                      onClick={() => update('institutionType', ed.value)}
                      className={`flex items-start gap-3 text-left px-4 py-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                        active
                          ? 'marketing-module-active bg-lemon-50 border-lemon-500'
                          : 'surface-panel border-divider hover:border-lemon-500/40'
                      }`}
                    >
                      <span
                        className={`mt-0.5 shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                          active ? 'bg-lemon-500 text-[#020810]' : 'bg-navy-50 text-navy-500'
                        }`}
                      >
                        <Icon size={18} strokeWidth={2.25} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-bold marketing-section-heading">{ed.label}</span>
                        <span className="block text-[12.5px] marketing-body-text mt-0.5">{ed.description}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </Field>

            <div className="flex items-start gap-2.5 rounded-xl bg-lemon-50 border border-lemon-500/30 px-4 py-3">
              <Sparkles size={16} strokeWidth={2.25} className="mt-0.5 shrink-0 text-lemon-700" />
              <p className="text-[12.5px] marketing-body-text">
                <strong className="marketing-section-heading">All modules included.</strong> Every
                edition ships with the full platform — courses, assessments, live classes,
                attendance, payments, certificates, reports and more. No add-ons to pick.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Estimated users">
                <input
                  value={form.estimatedUsers}
                  onChange={(e) => update('estimatedUsers', e.target.value)}
                  placeholder="e.g. 2,000 students"
                  className={inputClass}
                />
              </Field>
              <Field label="Preferred subdomain">
                <div className="flex items-center">
                  <input
                    value={form.preferredSubdomain}
                    onChange={(e) => update('preferredSubdomain', e.target.value)}
                    placeholder="aau"
                    className={`${inputClass} rounded-r-none`}
                  />
                  <span className="marketing-subdomain-suffix text-[12.5px] text-secondary-text bg-canvas border border-l-0 border-divider rounded-r-lg px-3 py-2.5 whitespace-nowrap">
                    .brana-lms.com
                  </span>
                </div>
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-[19px] font-extrabold marketing-section-heading">Contact details</h3>
              <p className="text-[13px] marketing-body-text mt-1">Step 2 of {TOTAL_STEPS}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact person">
                <input
                  value={form.contactName}
                  onChange={(e) => update('contactName', e.target.value)}
                  placeholder="Full name"
                  className={inputClass}
                />
              </Field>
              <Field label="Phone number">
                <input
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+251 9xx xxx xxx"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Email address">
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@institution.edu.et"
                className={inputClass}
              />
            </Field>

            <Field label="Anything else we should know? (optional)">
              <textarea
                value={form.message}
                onChange={(e) => update('message', e.target.value)}
                rows={3}
                placeholder="Tell us about your timeline, existing systems, or special requirements..."
                className={`${inputClass} resize-none`}
              />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-[19px] font-extrabold marketing-section-heading">Review your request</h3>
              <p className="text-[13px] marketing-body-text mt-1">Step 3 of {TOTAL_STEPS}</p>
            </div>

            <div className="marketing-review-panel bg-canvas rounded-2xl p-5 space-y-3 text-[13.5px]">
              <Row label="Institution" value={form.institutionName || '—'} />
              <Row
                label="Edition"
                value={INSTITUTION_EDITIONS.find((e) => e.value === form.institutionType)?.label ?? '—'}
              />
              <Row label="Contact" value={`${form.contactName || '—'} · ${form.email || '—'}`} />
              <Row label="Phone" value={form.phone || '—'} />
              <Row
                label="Subdomain"
                value={
                  form.preferredSubdomain
                    ? `${form.preferredSubdomain}.brana-lms.com`
                    : 'To be assigned'
                }
              />
              <Row label="Modules" value="All modules included" />
            </div>

            <p className="text-[12.5px] marketing-body-text leading-relaxed">
              By submitting, our team will contact you with a custom proposal and invoice.
              This is a demo request form — no payment is collected here.
            </p>
          </div>
        )}

        {error && (
          <p className="mt-4 text-[13px] font-semibold text-danger bg-danger-bg px-3.5 py-2.5 rounded-lg">
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="text-navy-900 font-bold text-[13.5px] px-5 py-3 rounded-xl border border-divider hover:bg-navy-50 dark:hover:bg-[#111b2e] transition-colors cursor-pointer"
            >
              Back
            </button>
          ) : (
            <span />
          )}

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={goNext}
              className="marketing-btn-primary bg-[#1B2340] dark:bg-[#111b2e] text-white font-bold text-[13.5px] px-7 py-3 rounded-xl hover:bg-[#243056] dark:hover:bg-[#1a2744] transition-colors cursor-pointer"
            >
              Continue →
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="marketing-btn-primary bg-lemon-500 text-[#020810] font-bold text-[13.5px] px-7 py-3 rounded-xl hover:bg-lemon-200 transition-colors cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Sending…' : 'Submit Request'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

const inputClass =
  'w-full text-[13.5px] text-navy-900 input-surface rounded-lg px-3.5 py-2.5 outline-none focus:border-lemon-500 focus:ring-2 focus:ring-lemon-500/20 transition-all'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-bold marketing-section-heading mb-1.5">{label}</span>
      {children}
    </label>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="marketing-body-text font-semibold">{label}</span>
      <span className="marketing-section-heading font-bold text-right">{value}</span>
    </div>
  )
}

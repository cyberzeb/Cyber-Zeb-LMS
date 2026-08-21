import { useState, type FormEvent, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { InstitutionType, ModuleKey, ServiceRequestPayload } from '../types'
import {
  ALWAYS_ON_MODULES,
  MODULE_GROUPS,
  MODULE_LABELS,
} from '../types'
import { listPublicModules, submitAddOnModuleRequest, submitServiceRequest } from '../api/leadApi'

const INSTITUTION_TYPES: { value: InstitutionType; label: string }[] = [
  { value: 'university', label: 'University / College' },
  { value: 'school', label: 'Primary / Secondary School' },
  { value: 'business', label: 'Business / Corporate' },
  { value: 'government', label: 'Government Institution' },
  { value: 'ngo', label: 'NGO / International Org' },
  { value: 'training_provider', label: 'Training Provider' },
]

const EMPTY_FORM: ServiceRequestPayload = {
  institutionName: '',
  institutionType: 'university',
  contactName: '',
  email: '',
  phone: '',
  estimatedUsers: '',
  preferredSubdomain: '',
  modules: [...ALWAYS_ON_MODULES],
  message: '',
}

const TOTAL_STEPS = 3

export function RequestServiceForm() {
  const [requestMode, setRequestMode] = useState<'new_institution' | 'add_modules'>('new_institution')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<ServiceRequestPayload>(EMPTY_FORM)
  const [tenantLookup, setTenantLookup] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  // Catalog is only for pricing display — its failures must never become the
  // step-3 / submit error banner ("Network Error" while the request succeeded).
  const { data: catalog = [] } = useQuery({
    queryKey: ['public-modules'],
    queryFn: listPublicModules,
    retry: 1,
    throwOnError: false,
  })

  const catalogByKey = new Map(catalog.map((item) => [item.key, item]))
  const total = form.modules.reduce((sum, key) => {
    const item = catalogByKey.get(key)
    return sum + Number(item?.annual_price ?? 0)
  }, 0)
  const currency = catalog.find((item) => item.currency)?.currency ?? 'USD'

  function update<K extends keyof ServiceRequestPayload>(key: K, value: ServiceRequestPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function toggleModule(mod: ModuleKey) {
    if (ALWAYS_ON_MODULES.includes(mod)) return
    setForm((f) => ({
      ...f,
      modules: f.modules.includes(mod)
        ? f.modules.filter((m) => m !== mod)
        : [...f.modules, mod],
    }))
  }

  function validateStep(current: number): string {
    if (current === 1) {
      if (requestMode === 'add_modules') {
        if (!tenantLookup.trim()) return 'Please enter your institution subdomain or setup email.'
      } else {
        if (!form.institutionName.trim()) return 'Please enter your institution name.'
        if (!form.institutionType) return 'Please select your institution type.'
      }
    }
    if (current === 2) {
      if (!form.contactName.trim()) return 'Please enter a contact person.'
      if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Please enter a valid email address.'
      if (!form.phone.trim()) return 'Please enter a phone number.'
      if (form.modules.length === 0) return 'Please select at least one module.'
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
      if (requestMode === 'add_modules') {
        await submitAddOnModuleRequest({
          requestKind: 'add_modules',
          tenantLookup,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone,
          modules: form.modules.filter((m) => !ALWAYS_ON_MODULES.includes(m)),
          message: form.message,
        })
      } else {
        await submitServiceRequest(form)
      }
      setError('')
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong sending your request.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-3xl p-10 md:p-14 text-center border border-divider shadow-[0_20px_50px_rgba(27,35,64,0.1)]">
        <div className="w-16 h-16 rounded-2xl bg-leaf-50 text-leaf-700 flex items-center justify-center text-3xl mx-auto mb-6">
          ✓
        </div>
        <h3 className="text-[22px] font-extrabold text-navy-900">Request received!</h3>
        <p className="mt-3 text-[14px] text-secondary-text max-w-md mx-auto leading-relaxed">
          Thank you, {form.contactName.split(' ')[0] || 'there'}. Our team has been notified
          and will review <strong>{requestMode === 'add_modules' ? tenantLookup : form.institutionName}</strong>&rsquo;s request. You&rsquo;ll
          receive a custom proposal and invoice at <strong>{form.email}</strong> within 1
          business day. Once payment and the agreement are confirmed, we&rsquo;ll email you
          your dedicated Berana LMS link.
        </p>
        <button
          onClick={() => {
            setForm({ ...EMPTY_FORM, modules: [...ALWAYS_ON_MODULES] })
            setTenantLookup('')
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
    <div className="bg-white rounded-3xl p-7 md:p-10 border border-divider shadow-[0_20px_50px_rgba(27,35,64,0.1)]">
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
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-canvas p-1">
              {[
                ['new_institution', 'New Institution'],
                ['add_modules', 'Add Modules'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setRequestMode(value as 'new_institution' | 'add_modules')
                    setForm({ ...EMPTY_FORM, modules: value === 'new_institution' ? [...ALWAYS_ON_MODULES] : [] })
                    setTenantLookup('')
                  }}
                  className={`rounded-xl px-3 py-2 text-[12.5px] font-extrabold transition-colors ${
                    requestMode === value ? 'bg-white text-navy-900 shadow-sm' : 'text-secondary-text'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div>
              <h3 className="text-[19px] font-extrabold text-navy-900">
                {requestMode === 'add_modules' ? 'Find your institution' : 'Tell us about your institution'}
              </h3>
              <p className="text-[13px] text-secondary-text mt-1">Step 1 of {TOTAL_STEPS}</p>
            </div>

            {requestMode === 'add_modules' ? (
              <Field label="Institution subdomain or setup email">
                <input
                  value={tenantLookup}
                  onChange={(e) => setTenantLookup(e.target.value)}
                  placeholder="aau or admin@institution.edu.et"
                  className={inputClass}
                />
              </Field>
            ) : (
              <>
                <Field label="Institution name">
                  <input
                    value={form.institutionName}
                    onChange={(e) => update('institutionName', e.target.value)}
                    placeholder="e.g. Addis Ababa University"
                    className={inputClass}
                  />
                </Field>

                <Field label="Institution type">
                  <select
                    value={form.institutionType}
                    onChange={(e) => update('institutionType', e.target.value as InstitutionType)}
                    className={inputClass}
                  >
                    {INSTITUTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>

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
                      <span className="text-[12.5px] text-secondary-text bg-canvas border border-l-0 border-divider rounded-r-lg px-3 py-2.5 whitespace-nowrap">
                        .berana-lms.com
                      </span>
                    </div>
                  </Field>
                </div>
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-[19px] font-extrabold text-navy-900">Contact details &amp; modules needed</h3>
              <p className="text-[13px] text-secondary-text mt-1">Step 2 of {TOTAL_STEPS}</p>
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

            <Field label="Which modules do you need?">
              <div className="mb-3 rounded-xl border border-divider bg-canvas px-4 py-3">
                <p className="text-[12px] font-extrabold text-navy-900">
                  Estimated annual cost: {currency} {total.toLocaleString()}
                </p>
                <p className="text-[11.5px] text-secondary-text mt-0.5">
                  Final invoice can be adjusted by Cyber-Zeb before payment.
                </p>
              </div>
              <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                {MODULE_GROUPS.map((group) => (
                  <div key={group.title}>
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-secondary-text mb-2">
                      {group.title}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.keys.map((key) => {
                        const locked = ALWAYS_ON_MODULES.includes(key)
                        const catalogItem = catalogByKey.get(key)
                        if (catalog.length && !catalogItem?.is_active) return null
                        if (requestMode === 'add_modules' && locked) return null
                        const active = form.modules.includes(key) || locked
                        return (
                          <button
                            type="button"
                            key={key}
                            disabled={locked}
                            onClick={() => toggleModule(key)}
                            className={`flex items-start gap-2 text-left text-[12.5px] font-semibold px-3.5 py-2.5 rounded-xl border transition-all ${
                              locked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'
                            } ${
                              active
                                ? 'bg-lemon-50 border-lemon-500 text-navy-900'
                                : 'bg-white border-divider text-secondary-text hover:border-navy-200'
                            }`}
                          >
                            <span
                              className={`mt-0.5 w-3.5 h-3.5 rounded border flex-shrink-0 ${
                                active ? 'bg-lemon-500 border-lemon-700' : 'border-divider bg-white'
                              }`}
                            />
                            <span>
                              {MODULE_LABELS[key]}
                              <span className="block text-[10.5px] font-semibold text-secondary-text">
                                {catalogItem?.currency ?? 'USD'}{' '}
                                {Number(catalogItem?.annual_price ?? 0).toLocaleString()} / year
                              </span>
                              {locked && (
                                <span className="block text-[10.5px] font-semibold text-secondary-text">
                                  Always included
                                </span>
                              )}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
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
              <h3 className="text-[19px] font-extrabold text-navy-900">Review your request</h3>
              <p className="text-[13px] text-secondary-text mt-1">Step 3 of {TOTAL_STEPS}</p>
            </div>

            <div className="bg-canvas rounded-2xl p-5 space-y-3 text-[13.5px]">
              <Row label="Institution" value={form.institutionName || '—'} />
              <Row
                label="Type"
                value={INSTITUTION_TYPES.find((t) => t.value === form.institutionType)?.label ?? '—'}
              />
              <Row label="Contact" value={`${form.contactName || '—'} · ${form.email || '—'}`} />
              <Row label="Phone" value={form.phone || '—'} />
              <Row
                label="Institution path"
                value={
                  requestMode === 'add_modules'
                    ? tenantLookup || '—'
                    : form.preferredSubdomain
                      ? `${form.preferredSubdomain}.berana-lms.com`
                      : 'To be assigned'
                }
              />
              <Row
                label="Modules"
                value={
                  form.modules.length
                    ? form.modules.map((m) => MODULE_LABELS[m]).join(', ')
                    : '—'
                }
              />
              <Row label="Estimated annual cost" value={`${currency} ${total.toLocaleString()}`} />
            </div>

            <p className="text-[12.5px] text-secondary-text leading-relaxed">
              By submitting, our team will contact you with a custom proposal and invoice.
              No payment is collected on this form.
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
              className="text-navy-900 font-bold text-[13.5px] px-5 py-3 rounded-xl border border-divider hover:bg-canvas transition-colors cursor-pointer"
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
              className="bg-navy-900 text-white font-bold text-[13.5px] px-7 py-3 rounded-xl hover:bg-navy-700 transition-colors cursor-pointer"
            >
              Continue →
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="bg-lemon-500 text-navy-900 font-bold text-[13.5px] px-7 py-3 rounded-xl hover:bg-lemon-200 transition-colors cursor-pointer disabled:opacity-60"
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
  'w-full text-[13.5px] text-navy-900 bg-white border border-divider rounded-lg px-3.5 py-2.5 outline-none focus:border-lemon-500 focus:ring-2 focus:ring-lemon-500/20 transition-all'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-bold text-navy-900 mb-1.5">{label}</span>
      {children}
    </label>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-secondary-text font-semibold shrink-0">{label}</span>
      <span className="text-navy-900 font-bold text-right">{value}</span>
    </div>
  )
}

/**
 * The institution registration page.
 *
 * Replaces the short form that used to sit on the landing page: an institution
 * now fills in its Institution Master Data (the ten groups from the collection
 * guide) and picks the modules it wants. Only the selected modules are
 * activated, so the picker starts with everything ticked and the institution
 * removes what it does not need.
 */
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Lock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import brandLogo from '../../../assets/Logo.jpg'
import { Footer } from '../components/Footer'
import { ThemeToggle } from '../../../shared/components/ThemeToggle'
import { LanguageSwitcher } from '../../../shared/components/LanguageSwitcher'
import {
  ALL_MODULE_KEYS,
  ALWAYS_ON_MODULES,
  MODULE_CATALOG,
  type ModuleKey,
} from '../../../shared/constants/modules'
import { submitServiceRequest } from '../api/leadApi'
import {
  BILLING_CYCLE_OPTIONS,
  EMPTY_MASTER_DATA,
  OWNERSHIP_OPTIONS,
  TERM_STRUCTURE_OPTIONS,
  missingRequiredFields,
  type MasterDataForm,
} from '../masterData'
import type { InstitutionType } from '../types'

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

const STEPS = [
  'Institution',
  'Contact',
  'People',
  'Academics',
  'Modules',
  'Review',
] as const

type BasicForm = {
  institutionName: string
  institutionType: InstitutionType
  contactName: string
  email: string
  phone: string
  estimatedUsers: string
  preferredSubdomain: string
  message: string
}

const EMPTY_BASIC: BasicForm = {
  institutionName: '',
  institutionType: 'college_university',
  contactName: '',
  email: '',
  phone: '',
  estimatedUsers: '',
  preferredSubdomain: '',
  message: '',
}

export function RequestPage() {
  const [step, setStep] = useState(0)
  const [basic, setBasic] = useState<BasicForm>(EMPTY_BASIC)
  const [master, setMaster] = useState<MasterDataForm>(EMPTY_MASTER_DATA)
  // Every module ticked to begin with; the institution removes what it does not want.
  const [selected, setSelected] = useState<ModuleKey[]>(ALL_MODULE_KEYS)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<{ ref?: string } | null>(null)
  const [error, setError] = useState('')

  const missing = useMemo(
    () => missingRequiredFields(master, basic.institutionName),
    [master, basic.institutionName],
  )

  function setSection<K extends keyof MasterDataForm>(
    section: K,
    patch: Partial<MasterDataForm[K]>,
  ) {
    setMaster((current) => ({ ...current, [section]: { ...current[section], ...patch } }))
  }

  function toggleModule(key: ModuleKey) {
    if (ALWAYS_ON_MODULES.includes(key)) return
    setSelected((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key],
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (missing.length) {
      setError(`Please complete: ${missing.join(', ')}.`)
      return
    }
    setSubmitting(true)
    try {
      const result = await submitServiceRequest({
        ...basic,
        selectedModules: selected,
        masterData: master,
      })
      setSubmitted({ ref: (result as { institution_ref?: string })?.institution_ref })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your request.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Shell>
        <div className="max-w-xl mx-auto text-center py-16">
          <CheckCircle2 size={44} className="mx-auto text-lemon-600 dark:text-lemon-500" />
          <h1 className="mt-5 text-[26px] marketing-section-heading">Request received</h1>
          <p className="mt-3 text-[14.5px] marketing-body-text">
            Thank you. Our team will review your institution record and send a proposal and
            invoice to <strong>{basic.email}</strong>. Once payment is confirmed we activate
            your workspace and email the sign-in details.
          </p>
          {submitted.ref ? (
            <p className="mt-5 inline-block rounded-xl bg-canvas-subtle px-4 py-2.5 text-[13px] font-semibold marketing-section-heading">
              Your institution reference: {submitted.ref}
            </p>
          ) : null}
          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[13.5px] font-bold text-lemon-700 dark:text-lemon-500 hover:underline"
            >
              <ArrowLeft size={15} /> Back to home
            </Link>
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="max-w-3xl mx-auto py-10 md:py-14">
        <header className="mb-8">
          <span className="marketing-accent-label">Get Started</span>
          <h1 className="mt-3 text-[28px] md:text-[34px] marketing-section-heading">
            Register your institution
          </h1>
          <p className="mt-3 text-[14.5px] marketing-body-text max-w-xl">
            Tell us about your institution and choose the modules you need. Fields marked
            required are the minimum we need to set your workspace up; everything else can be
            completed later by your administrator.
          </p>
        </header>

        <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 mb-8" aria-label="Progress">
          {STEPS.map((label, index) => (
            <li key={label} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(index)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors cursor-pointer ${
                  index === step
                    ? 'bg-lemon-500 text-[#020810]'
                    : index < step
                      ? 'bg-lemon-500/15 text-lemon-700 dark:text-lemon-500'
                      : 'bg-canvas-subtle marketing-body-text'
                }`}
                aria-current={index === step ? 'step' : undefined}
              >
                {index + 1}. {label}
              </button>
            </li>
          ))}
        </ol>

        <form onSubmit={handleSubmit} className="space-y-8">
          {step === 0 ? (
            <>
              <Section title="Institution identity" required>
                <Field label="Legal institution name" required>
                  <Input
                    value={basic.institutionName}
                    onChange={(v) => setBasic({ ...basic, institutionName: v })}
                    placeholder="Demo Technology Institute"
                  />
                </Field>
                <Field label="Institution code">
                  <Input
                    value={master.identity.institution_code}
                    onChange={(v) => setSection('identity', { institution_code: v })}
                    placeholder="DTI"
                  />
                </Field>
                <Field label="Short name / acronym">
                  <Input
                    value={master.identity.short_name}
                    onChange={(v) => setSection('identity', { short_name: v })}
                    placeholder="DTI"
                  />
                </Field>
                <Field label="Ownership type">
                  <Select
                    value={master.identity.ownership_type}
                    onChange={(v) =>
                      setSection('identity', {
                        ownership_type: v as MasterDataForm['identity']['ownership_type'],
                      })
                    }
                    options={OWNERSHIP_OPTIONS}
                    placeholder="Select ownership"
                  />
                </Field>
                <Field label="Registration / license number">
                  <Input
                    value={master.identity.registration_number}
                    onChange={(v) => setSection('identity', { registration_number: v })}
                    placeholder="EDU-2026-001"
                  />
                </Field>
                <Field label="Year established">
                  <Input
                    type="number"
                    value={master.identity.year_established}
                    onChange={(v) => setSection('identity', { year_established: v })}
                    placeholder="2015"
                  />
                </Field>
              </Section>

              <Section title="Edition" required>
                <div className="sm:col-span-2 grid gap-3">
                  {INSTITUTION_EDITIONS.map((ed) => {
                    const active = basic.institutionType === ed.value
                    return (
                      <button
                        key={ed.value}
                        type="button"
                        onClick={() => setBasic({ ...basic, institutionType: ed.value })}
                        className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer ${
                          active
                            ? 'border-lemon-500 bg-lemon-500/10'
                            : 'border-divider hover:border-lemon-500/40'
                        }`}
                      >
                        <ed.icon size={20} className="mt-0.5 shrink-0" />
                        <span>
                          <span className="block text-[14px] font-bold marketing-section-heading">
                            {ed.label}
                          </span>
                          <span className="block text-[12.5px] marketing-body-text">
                            {ed.description}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </Section>

              <Section title="Physical address" required>
                <Field label="Country" required>
                  <Input
                    value={master.address.country}
                    onChange={(v) => setSection('address', { country: v })}
                    placeholder="Ethiopia"
                  />
                </Field>
                <Field label="State / region">
                  <Input
                    value={master.address.state_region}
                    onChange={(v) => setSection('address', { state_region: v })}
                  />
                </Field>
                <Field label="City">
                  <Input
                    value={master.address.city}
                    onChange={(v) => setSection('address', { city: v })}
                  />
                </Field>
                <Field label="Sub-city / district">
                  <Input
                    value={master.address.sub_city}
                    onChange={(v) => setSection('address', { sub_city: v })}
                  />
                </Field>
                <Field label="Street address">
                  <Input
                    value={master.address.street}
                    onChange={(v) => setSection('address', { street: v })}
                  />
                </Field>
                <Field label="Postal / ZIP code">
                  <Input
                    value={master.address.postal_code}
                    onChange={(v) => setSection('address', { postal_code: v })}
                  />
                </Field>
              </Section>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Section title="Institution contact information" required>
                <Field label="Official email" required>
                  <Input
                    type="email"
                    value={master.contact.official_email}
                    onChange={(v) => setSection('contact', { official_email: v })}
                    placeholder="info@demo.edu"
                  />
                </Field>
                <Field label="Website">
                  <Input
                    value={master.contact.website}
                    onChange={(v) => setSection('contact', { website: v })}
                    placeholder="www.demo.edu"
                  />
                </Field>
                <Field label="Main telephone">
                  <Input
                    value={master.contact.main_phone}
                    onChange={(v) => setSection('contact', { main_phone: v })}
                    placeholder="+251 9xx xxx xxx"
                  />
                </Field>
                <Field label="Secondary telephone">
                  <Input
                    value={master.contact.secondary_phone}
                    onChange={(v) => setSection('contact', { secondary_phone: v })}
                  />
                </Field>
                <Field label="General inquiry email">
                  <Input
                    type="email"
                    value={master.contact.inquiry_email}
                    onChange={(v) => setSection('contact', { inquiry_email: v })}
                  />
                </Field>
                <Field label="Admissions email">
                  <Input
                    type="email"
                    value={master.contact.admissions_email}
                    onChange={(v) => setSection('contact', { admissions_email: v })}
                  />
                </Field>
                <Field label="Registrar email">
                  <Input
                    type="email"
                    value={master.contact.registrar_email}
                    onChange={(v) => setSection('contact', { registrar_email: v })}
                  />
                </Field>
              </Section>

              <Section title="Primary contact person" required>
                <Field label="Full name" required>
                  <Input
                    value={master.primary_contact.full_name}
                    onChange={(v) => setSection('primary_contact', { full_name: v })}
                    placeholder="Dr. Sara Example"
                  />
                </Field>
                <Field label="Email" required>
                  <Input
                    type="email"
                    value={master.primary_contact.email}
                    onChange={(v) => setSection('primary_contact', { email: v })}
                  />
                </Field>
                <Field label="Job title">
                  <Input
                    value={master.primary_contact.job_title}
                    onChange={(v) => setSection('primary_contact', { job_title: v })}
                    placeholder="Director of Academic Services"
                  />
                </Field>
                <Field label="Department / office">
                  <Input
                    value={master.primary_contact.department}
                    onChange={(v) => setSection('primary_contact', { department: v })}
                  />
                </Field>
                <Field label="Mobile / telephone">
                  <Input
                    value={master.primary_contact.phone}
                    onChange={(v) => setSection('primary_contact', { phone: v })}
                  />
                </Field>
              </Section>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Section title="Institution leadership">
                <Field label="President / CEO / Director">
                  <Input
                    value={master.leadership.president}
                    onChange={(v) => setSection('leadership', { president: v })}
                  />
                </Field>
                <Field label="Vice president / deputy">
                  <Input
                    value={master.leadership.vice_president}
                    onChange={(v) => setSection('leadership', { vice_president: v })}
                  />
                </Field>
                <Field label="Academic head">
                  <Input
                    value={master.leadership.academic_head}
                    onChange={(v) => setSection('leadership', { academic_head: v })}
                  />
                </Field>
                <Field label="Registrar">
                  <Input
                    value={master.leadership.registrar}
                    onChange={(v) => setSection('leadership', { registrar: v })}
                  />
                </Field>
                <Field label="HR contact">
                  <Input
                    value={master.leadership.hr_contact}
                    onChange={(v) => setSection('leadership', { hr_contact: v })}
                  />
                </Field>
                <Field label="Finance contact">
                  <Input
                    value={master.leadership.finance_contact}
                    onChange={(v) => setSection('leadership', { finance_contact: v })}
                  />
                </Field>
              </Section>

              <Section
                title="Berana LMS administrator"
                required
                hint="This person receives the sign-in code and administers your workspace."
              >
                <Field label="Full name" required>
                  <Input
                    value={master.lms_administrator.full_name}
                    onChange={(v) => setSection('lms_administrator', { full_name: v })}
                    placeholder="Daniel Example"
                  />
                </Field>
                <Field label="Official email" required>
                  <Input
                    type="email"
                    value={master.lms_administrator.email}
                    onChange={(v) => setSection('lms_administrator', { email: v })}
                    placeholder="lmsadmin@demo.edu"
                  />
                </Field>
                <Field label="Job title">
                  <Input
                    value={master.lms_administrator.job_title}
                    onChange={(v) => setSection('lms_administrator', { job_title: v })}
                  />
                </Field>
                <Field label="Department">
                  <Input
                    value={master.lms_administrator.department}
                    onChange={(v) => setSection('lms_administrator', { department: v })}
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    value={master.lms_administrator.phone}
                    onChange={(v) => setSection('lms_administrator', { phone: v })}
                  />
                </Field>
              </Section>

              <Section title="Who should we reply to?" required>
                <Field label="Contact person" required>
                  <Input
                    value={basic.contactName}
                    onChange={(v) => setBasic({ ...basic, contactName: v })}
                  />
                </Field>
                <Field label="Reply-to email" required>
                  <Input
                    type="email"
                    value={basic.email}
                    onChange={(v) => setBasic({ ...basic, email: v })}
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    value={basic.phone}
                    onChange={(v) => setBasic({ ...basic, phone: v })}
                  />
                </Field>
                <Field label="Preferred subdomain">
                  <Input
                    value={basic.preferredSubdomain}
                    onChange={(v) => setBasic({ ...basic, preferredSubdomain: v })}
                    placeholder="dti"
                  />
                </Field>
              </Section>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Section title="Academic structure">
                <Field label="Number of campuses">
                  <Input
                    type="number"
                    value={master.academic_structure.campus_count}
                    onChange={(v) => setSection('academic_structure', { campus_count: v })}
                    placeholder="2"
                  />
                </Field>
                <Field label="Campuses" hint="Comma separated">
                  <Input
                    value={master.academic_structure.campuses}
                    onChange={(v) => setSection('academic_structure', { campuses: v })}
                    placeholder="Main Campus, City Campus"
                  />
                </Field>
                <Field label="Colleges / schools" hint="Comma separated">
                  <Input
                    value={master.academic_structure.colleges}
                    onChange={(v) => setSection('academic_structure', { colleges: v })}
                    placeholder="School of Computing, School of Business"
                  />
                </Field>
                <Field label="Faculties" hint="Comma separated">
                  <Input
                    value={master.academic_structure.faculties}
                    onChange={(v) => setSection('academic_structure', { faculties: v })}
                  />
                </Field>
                <Field label="Departments" hint="Comma separated">
                  <Input
                    value={master.academic_structure.departments}
                    onChange={(v) => setSection('academic_structure', { departments: v })}
                  />
                </Field>
                <Field label="Academic units" hint="Comma separated">
                  <Input
                    value={master.academic_structure.academic_units}
                    onChange={(v) => setSection('academic_structure', { academic_units: v })}
                  />
                </Field>
              </Section>

              <Section title="Academic calendar">
                <Field label="Current academic year">
                  <Input
                    value={master.academic_calendar.current_academic_year}
                    onChange={(v) =>
                      setSection('academic_calendar', { current_academic_year: v })
                    }
                    placeholder="2026/27"
                  />
                </Field>
                <Field label="Term structure">
                  <Select
                    value={master.academic_calendar.term_structure}
                    onChange={(v) =>
                      setSection('academic_calendar', {
                        term_structure: v as MasterDataForm['academic_calendar']['term_structure'],
                      })
                    }
                    options={TERM_STRUCTURE_OPTIONS}
                    placeholder="Select structure"
                  />
                </Field>
                <Field label="Number of terms">
                  <Input
                    type="number"
                    value={master.academic_calendar.term_count}
                    onChange={(v) => setSection('academic_calendar', { term_count: v })}
                    placeholder="2"
                  />
                </Field>
                <Field label="Academic year start">
                  <Input
                    type="date"
                    value={master.academic_calendar.start_date}
                    onChange={(v) => setSection('academic_calendar', { start_date: v })}
                  />
                </Field>
                <Field label="Academic year end">
                  <Input
                    type="date"
                    value={master.academic_calendar.end_date}
                    onChange={(v) => setSection('academic_calendar', { end_date: v })}
                  />
                </Field>
                <Field label="Registration opens">
                  <Input
                    type="date"
                    value={master.academic_calendar.registration_start}
                    onChange={(v) => setSection('academic_calendar', { registration_start: v })}
                  />
                </Field>
                <Field label="Registration closes">
                  <Input
                    type="date"
                    value={master.academic_calendar.registration_end}
                    onChange={(v) => setSection('academic_calendar', { registration_end: v })}
                  />
                </Field>
                <Field label="Classes start">
                  <Input
                    type="date"
                    value={master.academic_calendar.class_start}
                    onChange={(v) => setSection('academic_calendar', { class_start: v })}
                  />
                </Field>
                <Field label="Classes end">
                  <Input
                    type="date"
                    value={master.academic_calendar.class_end}
                    onChange={(v) => setSection('academic_calendar', { class_end: v })}
                  />
                </Field>
                <Field label="Examinations start">
                  <Input
                    type="date"
                    value={master.academic_calendar.exam_start}
                    onChange={(v) => setSection('academic_calendar', { exam_start: v })}
                  />
                </Field>
                <Field label="Examinations end">
                  <Input
                    type="date"
                    value={master.academic_calendar.exam_end}
                    onChange={(v) => setSection('academic_calendar', { exam_end: v })}
                  />
                </Field>
              </Section>

              <Section title="Certification">
                <Field label="Certificate types" hint="Comma separated">
                  <Input
                    value={master.certification.certificate_types}
                    onChange={(v) => setSection('certification', { certificate_types: v })}
                    placeholder="Completion Certificate"
                  />
                </Field>
                <Field label="Authorized signatory">
                  <Input
                    value={master.certification.signatory_name}
                    onChange={(v) => setSection('certification', { signatory_name: v })}
                  />
                </Field>
                <Field label="Signatory title">
                  <Input
                    value={master.certification.signatory_title}
                    onChange={(v) => setSection('certification', { signatory_title: v })}
                    placeholder="President / Registrar"
                  />
                </Field>
                <Field label="Certificate numbering format">
                  <Input
                    value={master.certification.numbering_format}
                    onChange={(v) => setSection('certification', { numbering_format: v })}
                    placeholder="DTI-CERT-YYYY-#####"
                  />
                </Field>
                <label className="sm:col-span-2 flex items-center gap-2.5 text-[13px] marketing-body-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={master.certification.has_institutional_seal}
                    onChange={(e) =>
                      setSection('certification', { has_institutional_seal: e.target.checked })
                    }
                    className="h-4 w-4 accent-[var(--color-lemon-500)] cursor-pointer"
                  />
                  Institutional seal / stamp is available
                </label>
              </Section>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <Section
                title="Choose your modules"
                hint="Every module is selected. Untick anything you do not need — only what you keep is activated."
              >
                <div className="sm:col-span-2 grid gap-2.5">
                  {MODULE_CATALOG.map((mod) => {
                    const isCore = ALWAYS_ON_MODULES.includes(mod.key)
                    const checked = isCore || selected.includes(mod.key)
                    return (
                      <label
                        key={mod.key}
                        className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                          checked
                            ? 'border-lemon-500/60 bg-lemon-500/5'
                            : 'border-divider opacity-70'
                        } ${isCore ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isCore}
                          onChange={() => toggleModule(mod.key)}
                          className="mt-0.5 h-4 w-4 accent-[var(--color-lemon-500)]"
                        />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-[13.5px] font-bold marketing-section-heading">
                            {mod.label}
                            {isCore ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-canvas-subtle px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide">
                                <Lock size={10} /> Always included
                              </span>
                            ) : null}
                          </span>
                          <span className="block text-[12.5px] marketing-body-text">
                            {mod.description}
                          </span>
                        </span>
                      </label>
                    )
                  })}
                </div>
                <p className="sm:col-span-2 text-[12.5px] marketing-body-text">
                  {selected.length} of {ALL_MODULE_KEYS.length} modules selected. You can request
                  more at any time after activation.
                </p>
              </Section>

              <Section title="Subscription & licensing">
                <Field label="Berana package">
                  <Input
                    value={master.subscription.package}
                    onChange={(v) => setSection('subscription', { package: v })}
                    placeholder="Berana Professional"
                  />
                </Field>
                <Field label="License type">
                  <Input
                    value={master.subscription.license_type}
                    onChange={(v) => setSection('subscription', { license_type: v })}
                    placeholder="SaaS Annual"
                  />
                </Field>
                <Field label="Contracted users">
                  <Input
                    type="number"
                    value={master.subscription.contracted_users}
                    onChange={(v) => setSection('subscription', { contracted_users: v })}
                    placeholder="5000"
                  />
                </Field>
                <Field label="Billing cycle">
                  <Select
                    value={master.subscription.billing_cycle}
                    onChange={(v) =>
                      setSection('subscription', {
                        billing_cycle: v as MasterDataForm['subscription']['billing_cycle'],
                      })
                    }
                    options={BILLING_CYCLE_OPTIONS}
                    placeholder="Select cycle"
                  />
                </Field>
                <Field label="Estimated users">
                  <Input
                    value={basic.estimatedUsers}
                    onChange={(v) => setBasic({ ...basic, estimatedUsers: v })}
                    placeholder="2,000 students"
                  />
                </Field>
                <p className="sm:col-span-2 text-[12.5px] marketing-body-text">
                  Activation, renewal and expiry dates are set by Cyber-Zeb when your
                  subscription starts.
                </p>
              </Section>
            </>
          ) : null}

          {step === 5 ? (
            <Section title="Review & submit">
              <div className="sm:col-span-2 space-y-2">
                <Row label="Institution" value={basic.institutionName || '—'} />
                <Row
                  label="Edition"
                  value={
                    INSTITUTION_EDITIONS.find((e) => e.value === basic.institutionType)?.label ??
                    '—'
                  }
                />
                <Row label="Country" value={master.address.country || '—'} />
                <Row label="Official email" value={master.contact.official_email || '—'} />
                <Row
                  label="Primary contact"
                  value={
                    master.primary_contact.full_name
                      ? `${master.primary_contact.full_name} · ${master.primary_contact.email}`
                      : '—'
                  }
                />
                <Row
                  label="LMS administrator"
                  value={
                    master.lms_administrator.full_name
                      ? `${master.lms_administrator.full_name} · ${master.lms_administrator.email}`
                      : '—'
                  }
                />
                <Row
                  label="Modules"
                  value={`${selected.length} of ${ALL_MODULE_KEYS.length} selected`}
                />
              </div>

              <div className="sm:col-span-2">
                <Field label="Anything else we should know? (optional)">
                  <textarea
                    value={basic.message}
                    onChange={(e) => setBasic({ ...basic, message: e.target.value })}
                    rows={4}
                    placeholder="Timeline, existing systems, special requirements…"
                    className="w-full px-3.5 py-2.5 text-[13.5px] input-surface rounded-xl outline-none focus:ring-2 focus:ring-lemon-500/25"
                  />
                </Field>
              </div>

              {missing.length ? (
                <p className="sm:col-span-2 text-[13px] font-semibold text-danger bg-danger-bg px-3.5 py-2.5 rounded-lg">
                  Still required: {missing.join(', ')}.
                </p>
              ) : null}
            </Section>
          ) : null}

          {error ? (
            <p className="text-[13px] font-semibold text-danger bg-danger-bg px-3.5 py-2.5 rounded-lg">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="rounded-xl px-5 py-2.5 text-[13.5px] font-bold marketing-body-text disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                className="rounded-xl bg-lemon-500 px-6 py-2.5 text-[13.5px] font-bold text-[#020810] hover:bg-lemon-400 transition-colors cursor-pointer"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-lemon-500 px-6 py-2.5 text-[13.5px] font-bold text-[#020810] hover:bg-lemon-400 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
                {submitting ? 'Submitting…' : 'Submit request'}
              </button>
            )}
          </div>
        </form>
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="marketing-page font-sans min-h-screen flex flex-col">
      <header className="border-b border-divider">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={brandLogo} alt="Brana LMS" className="h-9 w-auto rounded-lg object-contain" />
            <span className="font-extrabold text-[15px] marketing-section-heading">
              Brana <span className="text-lemon-700 dark:text-lemon-500">LMS</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <LanguageSwitcher variant="content" />
            <ThemeToggle variant="content" />
          </div>
        </div>
      </header>
      <main className="flex-1 px-6">{children}</main>
      <Footer />
    </div>
  )
}

function Section({
  title,
  hint,
  required,
  children,
}: {
  title: string
  hint?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <fieldset className="rounded-2xl border border-divider p-5 md:p-6">
      <legend className="px-2 text-[14px] font-bold marketing-section-heading">
        {title}
        {required ? <span className="text-danger"> *</span> : null}
      </legend>
      {hint ? <p className="mb-4 text-[12.5px] marketing-body-text">{hint}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-[12px] font-bold marketing-section-heading mb-1.5">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11.5px] marketing-body-text">{hint}</span> : null}
    </label>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 text-[13.5px] input-surface rounded-xl outline-none focus:ring-2 focus:ring-lemon-500/25"
    />
  )
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3.5 py-2.5 text-[13.5px] input-surface rounded-xl outline-none focus:ring-2 focus:ring-lemon-500/25 cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-divider py-2 text-[13px]">
      <span className="marketing-body-text font-semibold">{label}</span>
      <span className="marketing-section-heading text-right">{value}</span>
    </div>
  )
}

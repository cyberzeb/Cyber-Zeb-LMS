/**
 * Institution Master Data — the ten groups from the Berana LMS Institution
 * Master Data Collection Guide, mirroring the backend schema in
 * `app/modules/onboarding/master_data.py`.
 *
 * Institution ID is deliberately absent: it is generated server-side ("INST-0001")
 * and a value sent from here is ignored.
 */

export type OwnershipType =
  | 'public'
  | 'private'
  | 'government'
  | 'ngo'
  | 'religious'
  | 'other'

export type TermStructure = 'semester' | 'trimester' | 'quarter' | 'year' | 'continuous'

export type BillingCycle = 'annual' | 'semi_annual' | 'quarterly' | 'monthly'

export interface MasterDataForm {
  identity: {
    institution_code: string
    short_name: string
    ownership_type: OwnershipType | ''
    registration_number: string
    year_established: string
  }
  contact: {
    main_phone: string
    secondary_phone: string
    official_email: string
    website: string
    inquiry_email: string
    admissions_email: string
    registrar_email: string
  }
  address: {
    country: string
    state_region: string
    city: string
    sub_city: string
    street: string
    postal_code: string
  }
  primary_contact: {
    full_name: string
    job_title: string
    department: string
    email: string
    phone: string
  }
  leadership: {
    president: string
    vice_president: string
    academic_head: string
    registrar: string
    hr_contact: string
    finance_contact: string
  }
  academic_structure: {
    campus_count: string
    campuses: string
    colleges: string
    faculties: string
    departments: string
    academic_units: string
  }
  academic_calendar: {
    current_academic_year: string
    start_date: string
    end_date: string
    term_structure: TermStructure | ''
    term_count: string
    registration_start: string
    registration_end: string
    class_start: string
    class_end: string
    exam_start: string
    exam_end: string
  }
  certification: {
    certificate_types: string
    signatory_name: string
    signatory_title: string
    numbering_format: string
    has_institutional_seal: boolean
  }
  lms_administrator: {
    full_name: string
    job_title: string
    department: string
    email: string
    phone: string
    administrator_role: string
  }
  subscription: {
    package: string
    license_type: string
    contracted_users: string
    billing_cycle: BillingCycle | ''
  }
}

export const EMPTY_MASTER_DATA: MasterDataForm = {
  identity: {
    institution_code: '',
    short_name: '',
    ownership_type: '',
    registration_number: '',
    year_established: '',
  },
  contact: {
    main_phone: '',
    secondary_phone: '',
    official_email: '',
    website: '',
    inquiry_email: '',
    admissions_email: '',
    registrar_email: '',
  },
  address: {
    country: '',
    state_region: '',
    city: '',
    sub_city: '',
    street: '',
    postal_code: '',
  },
  primary_contact: { full_name: '', job_title: '', department: '', email: '', phone: '' },
  leadership: {
    president: '',
    vice_president: '',
    academic_head: '',
    registrar: '',
    hr_contact: '',
    finance_contact: '',
  },
  academic_structure: {
    campus_count: '',
    campuses: '',
    colleges: '',
    faculties: '',
    departments: '',
    academic_units: '',
  },
  academic_calendar: {
    current_academic_year: '',
    start_date: '',
    end_date: '',
    term_structure: '',
    term_count: '',
    registration_start: '',
    registration_end: '',
    class_start: '',
    class_end: '',
    exam_start: '',
    exam_end: '',
  },
  certification: {
    certificate_types: '',
    signatory_name: '',
    signatory_title: '',
    numbering_format: '',
    has_institutional_seal: false,
  },
  lms_administrator: {
    full_name: '',
    job_title: '',
    department: '',
    email: '',
    phone: '',
    administrator_role: 'Institution Admin',
  },
  subscription: { package: '', license_type: '', contracted_users: '', billing_cycle: '' },
}

export const OWNERSHIP_OPTIONS: { value: OwnershipType; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'government', label: 'Government' },
  { value: 'ngo', label: 'NGO / Non-profit' },
  { value: 'religious', label: 'Religious' },
  { value: 'other', label: 'Other' },
]

export const TERM_STRUCTURE_OPTIONS: { value: TermStructure; label: string }[] = [
  { value: 'semester', label: 'Semester' },
  { value: 'trimester', label: 'Trimester' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Full year' },
  { value: 'continuous', label: 'Continuous / rolling' },
]

export const BILLING_CYCLE_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: 'annual', label: 'Annual' },
  { value: 'semi_annual', label: 'Semi-annual' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'monthly', label: 'Monthly' },
]

/** Labels for the console's read-only view, in the guide's order. */
export const MASTER_DATA_SECTIONS: { key: keyof MasterDataForm; label: string }[] = [
  { key: 'identity', label: 'Institution Identity' },
  { key: 'contact', label: 'Contact Information' },
  { key: 'address', label: 'Physical Address' },
  { key: 'primary_contact', label: 'Primary Contact Person' },
  { key: 'leadership', label: 'Institution Leadership' },
  { key: 'academic_structure', label: 'Academic Structure' },
  { key: 'academic_calendar', label: 'Academic Calendar' },
  { key: 'certification', label: 'Certification Information' },
  { key: 'lms_administrator', label: 'Berana LMS Administrator' },
  { key: 'subscription', label: 'Subscription & Licensing' },
]

export const MASTER_DATA_FIELD_LABELS: Record<string, string> = {
  institution_code: 'Institution code',
  short_name: 'Short name / acronym',
  ownership_type: 'Ownership type',
  registration_number: 'Registration / license number',
  year_established: 'Year established',
  main_phone: 'Main telephone',
  secondary_phone: 'Secondary telephone',
  official_email: 'Official email',
  website: 'Website',
  inquiry_email: 'General inquiry email',
  admissions_email: 'Admissions email',
  registrar_email: 'Registrar email',
  country: 'Country',
  state_region: 'State / region',
  city: 'City',
  sub_city: 'Sub-city / district',
  street: 'Street address',
  postal_code: 'Postal / ZIP code',
  full_name: 'Full name',
  job_title: 'Job title',
  department: 'Department / office',
  email: 'Email',
  phone: 'Telephone',
  president: 'President / CEO / Director',
  vice_president: 'Vice president / deputy',
  academic_head: 'Academic head',
  registrar: 'Registrar',
  hr_contact: 'HR contact',
  finance_contact: 'Finance contact',
  campus_count: 'Number of campuses',
  campuses: 'Campuses',
  colleges: 'Colleges / schools',
  faculties: 'Faculties',
  departments: 'Departments',
  academic_units: 'Academic units',
  current_academic_year: 'Current academic year',
  start_date: 'Academic year start',
  end_date: 'Academic year end',
  term_structure: 'Term structure',
  term_count: 'Number of terms',
  registration_start: 'Registration opens',
  registration_end: 'Registration closes',
  class_start: 'Classes start',
  class_end: 'Classes end',
  exam_start: 'Examinations start',
  exam_end: 'Examinations end',
  certificate_types: 'Certificate types',
  signatory_name: 'Authorized signatory',
  signatory_title: 'Signatory title',
  numbering_format: 'Certificate numbering format',
  has_institutional_seal: 'Institutional seal available',
  administrator_role: 'Administrator role',
  package: 'Berana package',
  license_type: 'License type',
  contracted_users: 'Contracted users',
  billing_cycle: 'Billing cycle',
}

const csv = (value: string): string[] =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

const text = (value: string): string | undefined => value.trim() || undefined

const num = (value: string): number | undefined => {
  const parsed = Number(value.trim())
  return value.trim() && Number.isFinite(parsed) ? parsed : undefined
}

/**
 * Convert the form (all strings, as HTML inputs produce) into the JSON the API
 * expects. Empty fields are dropped rather than sent as "", which the backend
 * would reject for typed fields such as dates and enums.
 */
export function toMasterDataPayload(form: MasterDataForm): Record<string, unknown> {
  return {
    identity: {
      institution_code: text(form.identity.institution_code),
      short_name: text(form.identity.short_name),
      ownership_type: form.identity.ownership_type || undefined,
      registration_number: text(form.identity.registration_number),
      year_established: num(form.identity.year_established),
    },
    contact: {
      main_phone: text(form.contact.main_phone),
      secondary_phone: text(form.contact.secondary_phone),
      official_email: text(form.contact.official_email),
      website: text(form.contact.website),
      inquiry_email: text(form.contact.inquiry_email),
      admissions_email: text(form.contact.admissions_email),
      registrar_email: text(form.contact.registrar_email),
    },
    address: {
      country: text(form.address.country),
      state_region: text(form.address.state_region),
      city: text(form.address.city),
      sub_city: text(form.address.sub_city),
      street: text(form.address.street),
      postal_code: text(form.address.postal_code),
    },
    primary_contact: {
      full_name: text(form.primary_contact.full_name),
      job_title: text(form.primary_contact.job_title),
      department: text(form.primary_contact.department),
      email: text(form.primary_contact.email),
      phone: text(form.primary_contact.phone),
    },
    leadership: {
      president: text(form.leadership.president),
      vice_president: text(form.leadership.vice_president),
      academic_head: text(form.leadership.academic_head),
      registrar: text(form.leadership.registrar),
      hr_contact: text(form.leadership.hr_contact),
      finance_contact: text(form.leadership.finance_contact),
    },
    academic_structure: {
      campus_count: num(form.academic_structure.campus_count),
      campuses: csv(form.academic_structure.campuses),
      colleges: csv(form.academic_structure.colleges),
      faculties: csv(form.academic_structure.faculties),
      departments: csv(form.academic_structure.departments),
      academic_units: csv(form.academic_structure.academic_units),
    },
    academic_calendar: {
      current_academic_year: text(form.academic_calendar.current_academic_year),
      start_date: text(form.academic_calendar.start_date),
      end_date: text(form.academic_calendar.end_date),
      term_structure: form.academic_calendar.term_structure || undefined,
      term_count: num(form.academic_calendar.term_count),
      registration_start: text(form.academic_calendar.registration_start),
      registration_end: text(form.academic_calendar.registration_end),
      class_start: text(form.academic_calendar.class_start),
      class_end: text(form.academic_calendar.class_end),
      exam_start: text(form.academic_calendar.exam_start),
      exam_end: text(form.academic_calendar.exam_end),
    },
    certification: {
      certificate_types: csv(form.certification.certificate_types),
      signatory_name: text(form.certification.signatory_name),
      signatory_title: text(form.certification.signatory_title),
      numbering_format: text(form.certification.numbering_format),
      has_institutional_seal: form.certification.has_institutional_seal,
    },
    lms_administrator: {
      full_name: form.lms_administrator.full_name.trim(),
      job_title: text(form.lms_administrator.job_title),
      department: text(form.lms_administrator.department),
      email: form.lms_administrator.email.trim(),
      phone: text(form.lms_administrator.phone),
      administrator_role: form.lms_administrator.administrator_role.trim() || 'Institution Admin',
    },
    subscription: {
      package: text(form.subscription.package),
      license_type: text(form.subscription.license_type),
      contracted_users: num(form.subscription.contracted_users),
      billing_cycle: form.subscription.billing_cycle || undefined,
    },
  }
}

/**
 * The guide's required minimum, checked in the browser so the user is told which
 * step to go back to. The backend enforces the same rules regardless.
 */
export function missingRequiredFields(form: MasterDataForm, institutionName: string): string[] {
  const missing: string[] = []
  if (!institutionName.trim()) missing.push('Legal institution name')
  if (!form.address.country.trim()) missing.push('Country')
  if (!form.contact.official_email.trim()) missing.push('Official institution email')
  if (!form.primary_contact.full_name.trim()) missing.push('Primary contact name')
  if (!form.primary_contact.email.trim()) missing.push('Primary contact email')
  if (!form.lms_administrator.full_name.trim()) missing.push('LMS administrator name')
  if (!form.lms_administrator.email.trim()) missing.push('LMS administrator email')
  return missing
}

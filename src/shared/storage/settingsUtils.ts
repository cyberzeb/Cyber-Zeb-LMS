export interface InstitutionSettingsState {
  general: {
    name: string
    timezone: string
    language: string
    currency: string
  }
  branding: {
    domain: string
    sender: string
    primary: string
  }
  academic: {
    grading: string
    attendance: string
    completion: string
    /**
     * Corporate edition: the default window an employee gets to finish training
     * assigned from a job role, when that role does not set its own.
     */
    trainingDueDays?: string
  }
  modules: Record<string, boolean>
  integrations: Record<string, boolean>
  /** Automatic certificates on course completion (applied by the server). */
  certificates: {
    autoIssue: boolean
    rule: 'lessons' | 'passed' | 'both'
    minPercent: number
    requireApproval: boolean
  }
  /** Which LMS events send email (the server also honours each person's own switches). */
  notifications: {
    email: boolean
    announcements: boolean
    assessments: boolean
    grades: boolean
    liveClasses: boolean
    certificates: boolean
    invoices: boolean
  }
}

export const defaultInstitutionSettings: InstitutionSettingsState = {
  general: {
    name: 'Berana University',
    timezone: '(GMT+3) East Africa Time',
    language: 'English',
    currency: 'ETB — Ethiopian Birr',
  },
  branding: {
    domain: 'learn.berana.edu',
    sender: 'no-reply@berana.edu',
    primary: 'Lemon / Navy',
  },
  academic: {
    grading: 'Letter Grade (A–F)',
    attendance: '75% minimum',
    completion: 'All modules + passing grade',
  },
  modules: {
    virtualClassroom: true,
    attendance: true,
    assessments: true,
    payments: false,
    certificates: true,
    parentPortal: false,
  },
  integrations: {
    zoom: true,
    googleSso: true,
    microsoftSso: false,
    stripe: false,
    emailSms: true,
  },
  certificates: {
    autoIssue: true,
    rule: 'passed',
    minPercent: 50,
    requireApproval: true,
  },
  notifications: {
    email: true,
    announcements: true,
    assessments: true,
    grades: true,
    liveClasses: true,
    certificates: true,
    invoices: true,
  },
}

/** Deep-merge partial portal settings (from API seed `{}`) with role defaults. */
export function mergePortalSettings<T>(
  defaults: T,
  raw: Partial<T> | null | undefined,
): T {
  if (!raw || typeof raw !== 'object') return defaults
  const result = { ...defaults }
  for (const section of Object.keys(defaults as object) as (keyof T)[]) {
    const defaultSection = defaults[section]
    const rawSection = raw[section]
    if (defaultSection && typeof defaultSection === 'object' && !Array.isArray(defaultSection)) {
      result[section] = {
        ...(defaultSection as object),
        ...((rawSection as object | undefined) ?? {}),
      } as T[keyof T]
    } else if (rawSection !== undefined) {
      result[section] = rawSection as T[keyof T]
    }
  }
  return result
}

/** Merge partial localStorage settings with defaults (seed data may only store general.name). */
export function normalizeInstitutionSettings(
  raw: Partial<InstitutionSettingsState> | null | undefined,
): InstitutionSettingsState {
  return {
    general: { ...defaultInstitutionSettings.general, ...raw?.general },
    branding: { ...defaultInstitutionSettings.branding, ...raw?.branding },
    academic: { ...defaultInstitutionSettings.academic, ...raw?.academic },
    modules: { ...defaultInstitutionSettings.modules, ...raw?.modules },
    integrations: { ...defaultInstitutionSettings.integrations, ...raw?.integrations },
    certificates: { ...defaultInstitutionSettings.certificates, ...raw?.certificates },
    notifications: { ...defaultInstitutionSettings.notifications, ...raw?.notifications },
  }
}

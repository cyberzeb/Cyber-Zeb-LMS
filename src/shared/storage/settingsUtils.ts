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
  }
  modules: Record<string, boolean>
  integrations: Record<string, boolean>
}

export const defaultCorporateSettings: InstitutionSettingsState = {
  general: {
    name: 'Horizon Bank',
    timezone: '(GMT+3) East Africa Time',
    language: 'English',
    currency: 'ETB — Ethiopian Birr',
  },
  branding: {
    domain: 'learn.horizonbank.et',
    sender: 'learning@horizonbank.et',
    primary: 'Navy / Gold',
  },
  academic: {
    grading: 'Pass / Fail with score',
    attendance: 'Not tracked',
    completion: 'All mandatory modules + assessment pass',
  },
  modules: {
    virtualClassroom: true,
    attendance: false,
    assessments: true,
    payments: false,
    certificates: true,
    parentPortal: false,
  },
  integrations: {
    zoom: true,
    googleSso: true,
    microsoftSso: true,
    stripe: false,
    emailSms: true,
  },
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
  }
}

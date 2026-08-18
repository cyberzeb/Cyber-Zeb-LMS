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

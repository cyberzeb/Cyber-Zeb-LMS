export type AppLanguage = 'en' | 'am' | 'ar'

export interface LanguageOption {
  code: AppLanguage
  label: string
  nativeLabel: string
  dir: 'ltr' | 'rtl'
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', dir: 'ltr' },
  { code: 'am', label: 'Amharic', nativeLabel: 'አማርኛ', dir: 'ltr' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl' },
]

export const LANGUAGE_STORAGE_KEY = 'berana:language'
export const DEFAULT_LANGUAGE: AppLanguage = 'en'

export function isAppLanguage(value: string | null): value is AppLanguage {
  return value === 'en' || value === 'am' || value === 'ar'
}

export function languageMeta(code: AppLanguage): LanguageOption {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0]
}

export function applyDocumentLanguage(code: AppLanguage) {
  const meta = languageMeta(code)
  const root = document.documentElement
  root.lang = meta.code
  root.dir = meta.dir
}

export function readStoredLanguage(): AppLanguage {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (isAppLanguage(stored)) return stored
  } catch {
    /* ignore */
  }
  return DEFAULT_LANGUAGE
}

export function writeStoredLanguage(code: AppLanguage) {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code)
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import {
  applyDocumentLanguage,
  DEFAULT_LANGUAGE,
  type AppLanguage,
  readStoredLanguage,
  writeStoredLanguage,
} from './languages'
import { interpolate, translations, ENGLISH_TO_KEY, type TranslationKey } from './translations'

interface LanguageContextValue {
  language: AppLanguage
  setLanguage: (code: AppLanguage) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
  tx: (text: string, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() =>
    typeof window === 'undefined' ? DEFAULT_LANGUAGE : readStoredLanguage(),
  )

  useEffect(() => {
    applyDocumentLanguage(language)
    writeStoredLanguage(language)
  }, [language])

  const setLanguage = useCallback((code: AppLanguage) => {
    setLanguageState(code)
  }, [])

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const template = translations[language][key] ?? translations.en[key] ?? key
      return interpolate(template, vars)
    },
    [language],
  )

  const tx = useCallback(
    (text: string, vars?: Record<string, string | number>) => {
      const key = ENGLISH_TO_KEY[text]
      if (key) return t(key, vars)
      return interpolate(text, vars)
    },
    [t],
  )

  const value = useMemo(
    () => ({ language, setLanguage, t, tx }),
    [language, setLanguage, t, tx],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return ctx
}

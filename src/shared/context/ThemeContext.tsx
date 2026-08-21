import { createContext, useContext, useEffect, useCallback, type ReactNode } from 'react'
import { useLocalStorageState } from '../hooks/useLocalStorageState'

export type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  isDark: boolean
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}

const STORAGE_KEY = 'berana:theme'
const LEGACY_STUDENT_KEY = 'berana:student-theme'

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readInitialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      const parsed = JSON.parse(stored) as Theme
      if (parsed === 'light' || parsed === 'dark') return parsed
    }
    const legacy = window.localStorage.getItem(LEGACY_STUDENT_KEY)
    if (legacy !== null) {
      const parsed = JSON.parse(legacy) as Theme
      if (parsed === 'light' || parsed === 'dark') return parsed
    }
  } catch {
    /* ignore corrupt storage */
  }
  return 'light'
}

function applyThemeClasses(isDark: boolean) {
  const root = document.documentElement
  if (isDark) {
    root.classList.add('portal-dark')
    document.body.classList.add('sdm-portal-dark')
  } else {
    root.classList.remove('portal-dark')
    document.body.classList.remove('sdm-portal-dark')
  }
}

/**
 * App-wide theme provider. Persists to `berana:theme` and syncs `portal-dark`
 * on `<html>` plus `sdm-portal-dark` on `<body>` for portaled UI (modals, toasts).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeRaw] = useLocalStorageState<Theme>(STORAGE_KEY, readInitialTheme())

  const isDark = theme === 'dark'

  useEffect(() => {
    applyThemeClasses(isDark)
  }, [isDark])

  const setTheme = useCallback(
    (t: Theme) => setThemeRaw(t),
    [setThemeRaw],
  )

  const toggleTheme = useCallback(
    () => setThemeRaw((prev) => (prev === 'dark' ? 'light' : 'dark')),
    [setThemeRaw],
  )

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>')
  }
  return ctx
}

/** Apply saved theme before React mounts — call from index.html inline script too. */
export function initThemeFromStorage() {
  applyThemeClasses(readInitialTheme() === 'dark')
}

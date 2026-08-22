export type ThemeMode = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'berana:theme'

export function readStoredTheme(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* ignore */
  }
  return 'dark'
}

export function writeStoredTheme(mode: ThemeMode) {
  window.localStorage.setItem(THEME_STORAGE_KEY, mode)
}

export function applyThemeClass(mode: ThemeMode) {
  const root = document.documentElement
  if (mode === 'dark') {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
  } else {
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
  }
}

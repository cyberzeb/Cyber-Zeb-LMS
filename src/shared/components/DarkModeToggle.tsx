import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

interface DarkModeToggleProps {
  /** 'icon' — header button; 'labeled' — settings-style control */
  variant?: 'icon' | 'labeled'
  /** Header variant styling for dark admin navbar vs light marketing navbar */
  tone?: 'header' | 'marketing'
}

export function DarkModeToggle({ variant = 'icon', tone = 'header' }: DarkModeToggleProps) {
  const { isDark, toggleTheme } = useTheme()

  if (variant === 'labeled') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={toggleTheme}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[12.5px] font-semibold border border-divider bg-white/70 text-navy-900 hover:bg-navy-50 transition-colors cursor-pointer"
      >
        {isDark ? <Moon size={15} className="text-lemon-500" /> : <Sun size={15} />}
        {isDark ? 'Dark mode' : 'Light mode'}
      </button>
    )
  }

  const headerClass =
    tone === 'marketing'
      ? 'relative w-9 h-9 rounded-lg flex items-center justify-center text-navy-200 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer'
      : 'relative w-9 h-9 rounded-lg flex items-center justify-center text-navy-200 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      className={headerClass}
    >
      {isDark ? <Sun size={17} className="text-lemon-500" /> : <Moon size={17} />}
    </button>
  )
}

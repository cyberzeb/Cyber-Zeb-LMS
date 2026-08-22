import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../theme/ThemeProvider'

interface ThemeToggleProps {
  /** Header bar on dark navy — light icons */
  variant?: 'header' | 'marketing' | 'content'
  className?: string
}

export function ThemeToggle({ variant = 'content', className = '' }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme()

  const styles =
    variant === 'header' || variant === 'marketing'
      ? 'text-navy-200 hover:text-white hover:bg-white/[0.06]'
      : 'text-secondary-text hover:text-navy-900 hover:bg-navy-50'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${styles} ${className}`}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}

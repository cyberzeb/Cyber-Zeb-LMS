import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Globe } from 'lucide-react'

import { LANGUAGES, languageMeta } from '../i18n/languages'
import { useLanguage } from '../i18n/LanguageProvider'

interface LanguageSwitcherProps {
  variant?: 'header' | 'marketing' | 'content'
}

export function LanguageSwitcher({ variant = 'content' }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const current = languageMeta(language)

  const buttonStyles =
    variant === 'header' || variant === 'marketing'
      ? 'text-navy-200 hover:bg-white/[0.06] hover:text-white'
      : 'text-secondary-text hover:bg-navy-50 hover:text-navy-900'

  const menuStyles =
    variant === 'header' || variant === 'marketing'
      ? 'border-white/15 bg-[#1a2338] text-white'
      : 'border-divider bg-white dark:bg-[#111b2e] text-navy-900 shadow-lg'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('header.language')}
        className={`flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-[12px] transition-colors cursor-pointer ${buttonStyles}`}
      >
        <Globe size={14} className="shrink-0" />
        <span>{current.nativeLabel}</span>
        <ChevronDown size={14} className="shrink-0" />
      </button>

      {open ? (
        <div
          role="listbox"
          className={`absolute top-full end-0 mt-1.5 min-w-[10.5rem] rounded-xl border shadow-xl z-50 py-1.5 ${menuStyles}`}
        >
          {LANGUAGES.map((option) => (
            <button
              key={option.code}
              type="button"
              role="option"
              aria-selected={option.code === language}
              onClick={() => {
                setLanguage(option.code)
                setOpen(false)
              }}
              className={`w-full text-start px-3 py-2 text-[12px] transition-colors cursor-pointer ${
                option.code === language
                  ? variant === 'content'
                    ? 'text-lemon-700 dark:text-lemon-500 font-semibold'
                    : 'text-lemon-500 font-semibold'
                  : variant === 'content'
                    ? 'hover:bg-navy-50 dark:hover:bg-white/10'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="block">{option.nativeLabel}</span>
              <span
                className={`block text-[10px] ${
                  variant === 'content' ? 'text-secondary-text' : 'text-navy-200'
                }`}
              >
                {option.label}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

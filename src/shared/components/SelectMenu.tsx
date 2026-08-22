import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export interface SelectMenuOption {
  value: string
  label: string
  hint?: string
}

interface SelectMenuProps {
  value: string
  options: SelectMenuOption[]
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  'aria-label'?: string
}

export function SelectMenu({
  value,
  options,
  onChange,
  placeholder = 'Select…',
  className = '',
  'aria-label': ariaLabel,
}: SelectMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = options.find((opt) => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center justify-between gap-2 h-9 w-full min-w-[220px] rounded-lg border border-divider bg-white dark:bg-navy-50 px-3 text-[12.5px] text-navy-900 hover:border-navy-200 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25 transition-colors"
      >
        <span className="truncate text-left">{selected?.label ?? placeholder}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-secondary-text transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute top-full left-0 z-50 mt-1.5 w-full min-w-[220px] max-h-64 overflow-y-auto rounded-xl border border-divider bg-white dark:bg-[#0a121e] shadow-lg py-1.5"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-[12.5px] transition-colors ${
                    isSelected
                      ? 'bg-lemon-500/10 text-navy-900 font-semibold'
                      : 'text-navy-900 hover:bg-navy-50 dark:hover:bg-[#111b2e]'
                  }`}
                >
                  <span className="block truncate">{opt.label}</span>
                  {opt.hint ? (
                    <span className="block text-[10px] text-secondary-text mt-0.5">{opt.hint}</span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

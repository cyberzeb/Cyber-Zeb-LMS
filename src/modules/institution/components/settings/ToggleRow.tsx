import { useLanguage } from '../../../../shared/i18n/LanguageProvider'

interface ToggleRowProps {
  label: string
  description?: string
  enabled: boolean
  onToggle: () => void
}

export function ToggleRow({ label, description, enabled, onToggle }: ToggleRowProps) {
  const { tx } = useLanguage()
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-navy-900">{tx(label)}</div>
        {description && (
          <div className="text-[11.5px] text-secondary-text mt-0.5 leading-snug">{tx(description)}</div>
        )}
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full shrink-0 transition-colors cursor-pointer
          ${enabled ? 'bg-lemon-500' : 'bg-navy-200'}`}
      >
        <span
          className={`absolute top-0.5 start-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform
            ${enabled ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  )
}

import { useLanguage } from '../i18n/LanguageProvider'

interface FormFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'number' | 'select' | 'textarea' | 'date' | 'datetime-local'
  options?: string[]
  placeholder?: string
  hint?: string
  min?: string
  max?: string
}

export function FormField({
  label,
  value,
  onChange,
  type = 'text',
  options = [],
  placeholder,
  hint,
  min,
  max,
}: FormFieldProps) {
  const { tx } = useLanguage()
  const baseClass =
    'w-full bg-white dark:bg-navy-50 border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 placeholder:text-secondary-text focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25 transition-all'
  const pickerClass =
    type === 'date' || type === 'datetime-local' ? 'dark:[color-scheme:dark]' : ''

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-navy-900">{tx(label)}</span>
      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseClass} cursor-pointer dark:[color-scheme:dark]`}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {tx(opt)}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          value={value}
          placeholder={placeholder ? tx(placeholder) : undefined}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseClass} resize-y min-h-[72px]`}
        />
      ) : (
        <input
          type={type}
          value={value}
          min={min}
          max={max}
          placeholder={placeholder ? tx(placeholder) : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseClass} ${pickerClass}`}
        />
      )}
      {hint && <span className="text-[11px] text-secondary-text">{tx(hint)}</span>}
    </label>
  )
}

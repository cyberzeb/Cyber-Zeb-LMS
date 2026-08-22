interface SettingFieldProps {
  label: string
  value: string
  hint?: string
  type?: 'text' | 'select'
  options?: string[]
  onChange?: (value: string) => void
}

export function SettingField({
  label,
  value,
  hint,
  type = 'text',
  options = [],
  onChange,
}: SettingFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-navy-900">{label}</span>
      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full bg-white/70 dark:bg-navy-50 border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-navy-200 focus:ring-2 focus:ring-lemon-500/25 cursor-pointer dark:[color-scheme:dark]"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full bg-white/70 dark:bg-navy-50 border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-navy-200 focus:ring-2 focus:ring-lemon-500/25"
        />
      )}
      {hint && <span className="text-[11px] text-secondary-text">{hint}</span>}
    </label>
  )
}

interface FormFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'number' | 'select'
  options?: string[]
  placeholder?: string
  hint?: string
}

export function FormField({
  label,
  value,
  onChange,
  type = 'text',
  options = [],
  placeholder,
  hint,
}: FormFieldProps) {
  const baseClass =
    'w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 placeholder:text-secondary-text focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25 transition-all'

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-navy-900">{label}</span>
      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseClass} cursor-pointer`}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        />
      )}
      {hint && <span className="text-[11px] text-secondary-text">{hint}</span>}
    </label>
  )
}

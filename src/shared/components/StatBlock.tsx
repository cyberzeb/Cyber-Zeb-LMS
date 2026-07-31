interface StatBlockProps {
  label: string
  value: string | number
  sub?: string
  icon?: string
  iconBg?: string
}

export function StatBlock({ label, value, sub, icon, iconBg = 'bg-lemon-50' }: StatBlockProps) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11.5px] font-semibold uppercase tracking-wide text-secondary-text">
          {label}
        </span>
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${iconBg}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="text-2xl font-extrabold text-navy-900">{value}</div>
      {sub && <div className="text-[11.5px] text-secondary-text mt-0.5">{sub}</div>}
    </div>
  )
}
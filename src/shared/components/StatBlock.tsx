interface StatBlockProps {
  label: string
  value: string | number
  sub?: string
  icon?: string
  iconBg?: string
  trend?: 'up' | 'down'
}

export function StatBlock({ label, value, sub, icon, iconBg, trend }: StatBlockProps) {
  const chipClass =
    iconBg ??
    'bg-gradient-to-br from-lemon-50 to-lemon-200 ring-1 ring-lemon-500/20'

  return (
    <div className="group p-5 transition-colors hover:bg-white/40 first:rounded-l-2xl last:rounded-r-2xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-secondary-text">
          {label}
        </span>
        {icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${chipClass}`}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <div className="text-[26px] leading-none font-extrabold text-navy-900 tracking-tight">
          {value}
        </div>
        {trend && (
          <span
            className={`text-[11px] font-bold mb-0.5 ${trend === 'up' ? 'text-lemon-700' : 'text-danger'}`}
          >
            {trend === 'up' ? '▲' : '▼'}
          </span>
        )}
      </div>
      {sub && <div className="text-[11.5px] text-secondary-text mt-1.5">{sub}</div>}
    </div>
  )
}

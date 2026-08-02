import { GlassCard } from '../../../shared/layout/GlassCard'
import type { TrendPoint } from '../types'

interface MiniBarChartProps {
  title: string
  subtitle?: string
  data: TrendPoint[]
  unit?: string
}

export function MiniBarChart({ title, subtitle, data, unit = '' }: MiniBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <GlassCard className="p-6 flex flex-col h-full">
      <div className="mb-5">
        <h3 className="font-extrabold text-[15px] text-navy-900 leading-none">{title}</h3>
        {subtitle && <p className="text-[11.5px] text-secondary-text mt-1.5">{subtitle}</p>}
      </div>

      <div className="flex items-end justify-between gap-2 flex-1 min-h-[140px]">
        {data.map((point) => {
          const heightPct = Math.round((point.value / max) * 100)
          return (
            <div key={point.label} className="flex flex-col items-center gap-2 flex-1 group">
              <div className="text-[10.5px] font-bold text-navy-900 opacity-0 group-hover:opacity-100 transition-opacity">
                {point.value}
                {unit}
              </div>
              <div className="w-full flex items-end justify-center h-[120px]">
                <div
                  className="w-full max-w-[26px] rounded-t-md bg-gradient-to-t from-navy-700 to-lemon-500 transition-all"
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                />
              </div>
              <span className="text-[10px] text-secondary-text font-semibold uppercase tracking-wide">
                {point.label}
              </span>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}

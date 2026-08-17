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
    <GlassCard className="p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[14px] text-navy-900">{title}</h3>
          {subtitle && <p className="text-[11px] text-secondary-text mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 flex-1 min-h-[140px]">
        {data.map((point) => {
          const heightPct = Math.round((point.value / max) * 100)
          return (
            <div key={point.label} className="flex flex-col items-center gap-2 flex-1 group">
              <div className="text-[10px] font-semibold text-navy-900 opacity-0 group-hover:opacity-100 transition-opacity">
                {point.value}
                {unit}
              </div>
              <div className="w-full flex items-end justify-center h-[120px]">
                <div
                  className="w-full max-w-[24px] rounded-t bg-info transition-all"
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                />
              </div>
              <span className="text-[10px] text-secondary-text font-medium">{point.label}</span>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}

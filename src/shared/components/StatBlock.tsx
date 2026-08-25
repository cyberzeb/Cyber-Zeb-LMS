import type { ReactNode } from 'react'
import { GlassCard } from '../layout/GlassCard'
import { Sparkline } from './Sparkline'
import { useLanguage } from '../i18n/LanguageProvider'

interface StatBlockProps {
  label: string
  value: string | number
  sub?: string
  icon?: ReactNode
  iconBg?: string
  trend?: 'up' | 'down'
  trendValue?: string
  sparkline?: number[]
  sparklineColor?: string
}

export function StatBlock({
  label,
  value,
  sub,
  icon,
  iconBg,
  trend,
  trendValue,
  sparkline,
  sparklineColor,
}: StatBlockProps) {
  const { tx } = useLanguage()
  const chipClass = iconBg ?? 'bg-navy-50 text-navy-700'
  const lineColor =
    sparklineColor ?? (trend === 'down' ? '#E53935' : trend === 'up' ? '#16A34A' : '#1976D2')

  return (
    <GlassCard className="p-4 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-medium text-secondary-text">{tx(label)}</span>
          <div className="flex items-end gap-2 mt-1.5">
            <div className="text-[22px] leading-none font-bold text-navy-900 tracking-tight">{value}</div>
            {trend && trendValue && (
              <span className={`text-[11px] font-semibold mb-0.5 ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
                {trendValue}
              </span>
            )}
          </div>
          {sub && <div className="text-[11px] text-secondary-text mt-1">{tx(sub)}</div>}
        </div>
        {icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${chipClass}`}>
            {icon}
          </div>
        )}
      </div>
      {sparkline && sparkline.length > 1 && (
        <div className="mt-2.5 pt-2 border-t border-divider">
          <Sparkline data={sparkline} color={lineColor} height={28} />
        </div>
      )}
    </GlassCard>
  )
}

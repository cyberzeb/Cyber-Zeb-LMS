import type { ReactNode } from 'react'
import { GlassCard } from '../layout/GlassCard'
<<<<<<< HEAD
=======
import { Sparkline } from './Sparkline'
>>>>>>> origin/main

interface StatBlockProps {
  label: string
  value: string | number
  sub?: string
  icon?: ReactNode
  iconBg?: string
  trend?: 'up' | 'down'
<<<<<<< HEAD
}

export function StatBlock({ label, value, sub, icon, iconBg, trend }: StatBlockProps) {
  const chipClass =
    iconBg ??
    'bg-gradient-to-br from-lemon-50 to-lemon-200 ring-1 ring-lemon-500/20 text-lemon-900'

  return (
    <GlassCard className="group p-5 transition-transform duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-secondary-text">
          {label}
        </span>
        {icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${chipClass}`}
          >
=======
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
  const chipClass = iconBg ?? 'bg-navy-50 text-navy-700'
  const lineColor =
    sparklineColor ?? (trend === 'down' ? '#E53935' : trend === 'up' ? '#16A34A' : '#1976D2')

  return (
    <GlassCard className="p-4 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-medium text-secondary-text">{label}</span>
          <div className="flex items-end gap-2 mt-1.5">
            <div className="text-[22px] leading-none font-bold text-navy-900 tracking-tight">{value}</div>
            {trend && trendValue && (
              <span className={`text-[11px] font-semibold mb-0.5 ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
                {trendValue}
              </span>
            )}
          </div>
          {sub && <div className="text-[11px] text-secondary-text mt-1">{sub}</div>}
        </div>
        {icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${chipClass}`}>
>>>>>>> origin/main
            {icon}
          </div>
        )}
      </div>
<<<<<<< HEAD
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
=======
      {sparkline && sparkline.length > 1 && (
        <div className="mt-2.5 pt-2 border-t border-divider">
          <Sparkline data={sparkline} color={lineColor} height={28} />
        </div>
      )}
>>>>>>> origin/main
    </GlassCard>
  )
}

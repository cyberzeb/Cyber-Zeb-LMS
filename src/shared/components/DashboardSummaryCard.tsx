import type { ReactNode } from 'react'
import { GlassCard } from '../layout/GlassCard'
import { Button } from '../components/Button'

interface DashboardSummaryCardProps {
  title: string
  viewAllLabel?: string
  onViewAll?: () => void
  children: ReactNode
  className?: string
}

export function DashboardSummaryCard({
  title,
  viewAllLabel = 'View All',
  onViewAll,
  children,
  className = '',
}: DashboardSummaryCardProps) {
  return (
    <GlassCard className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-bold text-navy-900">{title}</h3>
        {onViewAll && (
          <Button size="sm" variant="ghost" onClick={onViewAll}>
            {viewAllLabel}
          </Button>
        )}
      </div>
      {children}
    </GlassCard>
  )
}

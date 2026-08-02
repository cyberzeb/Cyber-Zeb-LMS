import type { ReactNode } from 'react'
import { GlassCard } from '../../../shared/layout/GlassCard'

interface LmsSectionCardProps {
  title: string
  description?: string
  eyebrow?: string
  actionLabel?: string
  onAction?: () => void
  children: ReactNode
  className?: string
}

export function LmsSectionCard({
  title,
  description,
  eyebrow,
  actionLabel,
  onAction,
  children,
  className = '',
}: LmsSectionCardProps) {
  return (
    <GlassCard className={`p-6 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          {eyebrow && (
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-lemon-700">
              {eyebrow}
            </div>
          )}
          <h2 className="text-[17px] font-extrabold leading-tight text-navy-900">{title}</h2>
          {description && <p className="mt-1.5 text-[12.5px] text-secondary-text">{description}</p>}
        </div>

        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="shrink-0 rounded-full border border-navy-900/10 bg-white/80 px-4 py-2 text-[12px] font-semibold text-navy-900 transition hover:bg-white"
          >
            {actionLabel}
          </button>
        )}
      </div>

      {children}
    </GlassCard>
  )
}
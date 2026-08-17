import type { ReactNode } from 'react'
import { Megaphone } from 'lucide-react'
import { Button } from '../Button'
import { GlassCard } from '../../layout/GlassCard'

export type AnnouncementPriority = 'normal' | 'important'

export function announcementCardClass(priority: AnnouncementPriority, accent: 'neutral' | 'info' = 'neutral') {
  if (priority === 'important') {
    return 'border-l-warning bg-gradient-to-r from-warning-bg/50 via-white to-white hover:shadow-md hover:border-warning/40'
  }
  if (accent === 'info') {
    return 'border-l-info bg-gradient-to-r from-info-bg/35 via-white to-white hover:shadow-md hover:border-info/30'
  }
  return 'border-l-navy-300 bg-gradient-to-r from-navy-50/50 via-white to-white hover:shadow-md hover:border-navy-200'
}

interface AnnouncementFeaturedBannerProps {
  title: string
  body: string
  postedAt: string
  meta?: ReactNode
}

export function AnnouncementFeaturedBanner({
  title,
  body,
  postedAt,
  meta,
}: AnnouncementFeaturedBannerProps) {
  return (
    <GlassCard className="relative overflow-hidden p-0 border-warning/40 shadow-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/15 via-lemon-50/80 to-white" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="relative p-6 md:p-7 flex flex-col md:flex-row md:items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-warning to-amber-400 text-navy-900 flex items-center justify-center shrink-0 shadow-sm">
          <Megaphone size={22} strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-warning/25 ring-1 ring-warning/30 px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider text-amber-950">
            Important · {postedAt}
          </div>
          <h2 className="mt-3 text-[19px] md:text-[20px] font-extrabold text-navy-900 leading-snug">{title}</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-secondary-text line-clamp-3">{body}</p>
          {meta ? <div className="mt-3 text-[12px] font-medium text-navy-700">{meta}</div> : null}
        </div>
      </div>
    </GlassCard>
  )
}

interface AnnouncementEmptyStateProps {
  title: string
  description: string
  action?: ReactNode
  compact?: boolean
}

export function AnnouncementEmptyState({
  title,
  description,
  action,
  compact = false,
}: AnnouncementEmptyStateProps) {
  return (
    <GlassCard className={`text-center ${compact ? 'p-8' : 'p-12'}`}>
      <div className="mx-auto w-14 h-14 rounded-2xl bg-navy-50 text-navy-400 flex items-center justify-center mb-4">
        <Megaphone size={compact ? 26 : 30} strokeWidth={1.75} />
      </div>
      <p className="text-[15px] font-bold text-navy-900">{title}</p>
      <p className="text-[13px] text-secondary-text mt-1.5 max-w-sm mx-auto leading-relaxed">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </GlassCard>
  )
}

export function AnnouncementFilterBar({
  count,
  children,
}: {
  count: number
  children: ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      {children}
      <span className="inline-flex items-center self-start sm:self-auto rounded-full bg-navy-50 px-3 py-1 text-[11.5px] font-semibold text-navy-700">
        {count} announcement{count === 1 ? '' : 's'}
      </span>
    </div>
  )
}

export function AnnouncementCreateButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="primary" onClick={onClick}>
      <Megaphone size={15} />
      New announcement
    </Button>
  )
}

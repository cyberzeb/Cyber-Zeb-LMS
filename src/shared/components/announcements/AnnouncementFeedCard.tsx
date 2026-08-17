import type { ReactNode } from 'react'
import { Building2, Calendar, Eye, Shield, Users } from 'lucide-react'
import { Button } from '../Button'
import { StatusPill } from '../StatusPill'
import { Monogram } from '../Monogram'
import { GlassCard } from '../../layout/GlassCard'
import { announcementCardClass, type AnnouncementPriority } from './AnnouncementUi'

export interface AnnouncementFeedItem {
  id: string
  title: string
  body: string
  postedAt: string
  priority: AnnouncementPriority
  audience?: string
  course?: string
  author?: string
  authorName?: string
  views?: number
  isOwn?: boolean
}

interface AnnouncementFeedCardProps {
  item: AnnouncementFeedItem
  variant: 'admin' | 'instructor' | 'student'
  onEdit?: () => void
  onDelete?: () => void
}

function AudienceTag({ label, icon }: { label: string; icon: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-navy-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy-600">
      {icon}
      {label}
    </span>
  )
}

export function AnnouncementFeedCard({ item, variant, onEdit, onDelete }: AnnouncementFeedCardProps) {
  const authorLabel = item.authorName ?? item.author
  const isImportant = item.priority === 'important'
  const accent = variant === 'student' ? 'info' : 'neutral'

  const audienceLabel =
    item.audience ??
    (item.course ? item.course : variant === 'student' ? 'Campus-wide' : undefined)

  return (
    <GlassCard
      className={`p-0 overflow-hidden transition-all duration-200 border-l-4 ${announcementCardClass(item.priority, accent)}`}
    >
      <div className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex gap-4 min-w-0 flex-1">
          {variant === 'student' && authorLabel ? (
            <Monogram label={authorLabel} size="md" className="shrink-0 hidden sm:flex" />
          ) : null}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill
                label={isImportant ? 'Important' : 'Update'}
                tone={isImportant ? 'warning' : variant === 'student' ? 'info' : 'neutral'}
              />
              {variant === 'instructor' && item.isOwn === false ? (
                <AudienceTag label="Admin" icon={<Shield size={10} />} />
              ) : null}
              {audienceLabel ? (
                <AudienceTag
                  label={audienceLabel}
                  icon={
                    item.course || audienceLabel.includes('course') || audienceLabel.includes('students') ? (
                      <Building2 size={10} />
                    ) : (
                      <Users size={10} />
                    )
                  }
                />
              ) : null}
            </div>

            <h3 className="mt-2 text-[16px] font-bold text-navy-900 leading-snug">{item.title}</h3>
            <p className="mt-2 text-[13px] text-secondary-text leading-relaxed">{item.body}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] font-medium text-navy-600">
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} className="text-secondary-text" />
                {item.postedAt}
              </span>
              {authorLabel ? <span>{authorLabel}</span> : null}
              {typeof item.views === 'number' ? (
                <span className="inline-flex items-center gap-1">
                  <Eye size={12} className="text-secondary-text" />
                  {item.views} views
                </span>
              ) : null}
              {variant === 'instructor' && item.isOwn === false ? (
                <span className="text-secondary-text">From administration</span>
              ) : null}
            </div>
          </div>
        </div>

        {variant === 'admin' ? (
          <div className="flex gap-2 shrink-0 self-start">
            <Button variant="secondary" size="sm" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="secondary" size="sm" onClick={onDelete}>
              Delete
            </Button>
          </div>
        ) : variant === 'instructor' && item.isOwn !== false ? (
          <Button variant="secondary" size="sm" className="shrink-0 self-start" onClick={onEdit}>
            Edit
          </Button>
        ) : null}
      </div>
    </GlassCard>
  )
}

interface AnnouncementDashboardListProps {
  items: AnnouncementFeedItem[]
  emptyMessage?: string
  showAuthor?: boolean
  showViews?: boolean
}

export function AnnouncementDashboardList({
  items,
  emptyMessage = 'No announcements yet.',
  showAuthor = false,
  showViews = false,
}: AnnouncementDashboardListProps) {
  if (items.length === 0) {
    return <p className="text-[12px] text-secondary-text text-center py-6">{emptyMessage}</p>
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={`rounded-xl border p-3 transition-colors hover:bg-navy-50/40 ${
            item.priority === 'important' ? 'border-warning/30 bg-warning-bg/20' : 'border-divider'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-navy-900 truncate">{item.title}</p>
              <p className="text-[10.5px] text-secondary-text mt-0.5 truncate">
                {showAuthor && item.author ? `${item.author} · ` : ''}
                {showViews && typeof item.views === 'number' ? `${item.views} views · ` : ''}
                {item.postedAt}
              </p>
            </div>
            <StatusPill
              label={item.priority === 'important' ? 'Important' : 'Update'}
              tone={item.priority === 'important' ? 'warning' : 'neutral'}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

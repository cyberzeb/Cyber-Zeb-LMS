import { CalendarClock, Clock3, MapPin } from 'lucide-react'
import { Button } from './Button'

export interface CalendarNextUpEvent {
  title: string
  course: string
  type: string
  startAt: string
  location: string
}

interface CalendarNextUpCardProps {
  event: CalendarNextUpEvent
  onViewDetails?: () => void
}

type SchedulableEvent = CalendarNextUpEvent & { accent?: string }

export function pickNextScheduleEvent(items: SchedulableEvent[]): CalendarNextUpEvent | undefined {
  if (items.length === 0) return undefined

  const live = items.filter((item) => item.type === 'Live class')
  if (live.length > 0) return live[0]

  const assessments = items.filter((item) => item.type === 'Exam' || item.type === 'Deadline')
  const overdue = assessments.filter((item) => item.accent === 'bg-danger')
  if (overdue.length > 0) return overdue[0]
  if (assessments.length > 0) return assessments[0]

  return items[0]
}

export function CalendarNextUpCard({ event, onViewDetails }: CalendarNextUpCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 hero-banner shadow-[var(--shadow-card)]">
      <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-lemon-500/10 blur-3xl pointer-events-none" />
      <div className="relative p-6 md:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-lemon-500 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#020810] shadow-sm">
            <CalendarClock size={12} className="text-[#020810]" />
            Next up
          </div>
          <h2 className="mt-3 text-[20px] md:text-[22px] font-bold text-white leading-tight">{event.title}</h2>
          <p className="mt-2 text-[13px] text-[#c5cade]">
            {event.course} · {event.type}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11.5px]">
            <span className="hero-banner-chip">
              <Clock3 size={12} />
              {event.startAt}
            </span>
            <span className="hero-banner-chip">
              <MapPin size={12} />
              {event.location}
            </span>
          </div>
        </div>
        <Button variant="primary" className="shrink-0" onClick={onViewDetails}>
          View details
        </Button>
      </div>
    </div>
  )
}

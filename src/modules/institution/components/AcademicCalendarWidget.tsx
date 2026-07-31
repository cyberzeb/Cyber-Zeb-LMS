import { GlassCard } from '../../../shared/layout/GlassCard'
import type { CalendarEvent } from '../types'

interface AcademicCalendarWidgetProps {
  events: CalendarEvent[]
  onViewFullCalendar?: () => void
}

export function AcademicCalendarWidget({
  events,
  onViewFullCalendar,
}: AcademicCalendarWidgetProps) {
  return (
    <GlassCard className="p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-extrabold text-[17px] text-navy-900 leading-none">Academic Calendar</h3>
          <button
            onClick={onViewFullCalendar}
            className="text-lemon-700 hover:text-lemon-900 font-bold text-[12.5px] transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            Full calendar
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3.5 pb-3 border-b border-divider/40 last:border-0 last:pb-0"
            >
              <div className="w-11 h-11 rounded-lg bg-navy-900 flex flex-col items-center justify-center shrink-0 shadow-sm border border-navy-700">
                <span className="text-[8.5px] uppercase tracking-widest text-lemon-500 font-extrabold leading-none">
                  {event.month}
                </span>
                <span className="text-[16px] font-extrabold text-white leading-none mt-0.5">
                  {event.day}
                </span>
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-navy-900 text-[14px] truncate leading-tight">
                  {event.title}
                </h4>
                <p className="text-[11.5px] text-secondary-text mt-1 truncate leading-none">
                  {event.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}

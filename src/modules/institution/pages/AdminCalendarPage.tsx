import { useMemo, useState } from 'react'
import { CalendarClock, CalendarDays, Clock3, MonitorPlay } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { CalendarNextUpCard, pickNextScheduleEvent } from '../../../shared/components/CalendarNextUpCard'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { ScheduleCalendarCard } from '../../students/components/AssessmentCards'
import type { EventType, ScheduleItem } from '../../students/types'
import { useInstitutionOverview } from '../hooks/useInstitution'
import type { InstitutionOverviewData } from '../types'

const tabs = ['All', 'Live class', 'Exam', 'Office hour', 'Deadline', 'Academic']

function buildAdminSchedule(data: InstitutionOverviewData): ScheduleItem[] {
  const items: ScheduleItem[] = []

  for (const session of data.upcomingLiveClasses) {
    items.push({
      id: `live-${session.id}`,
      title: session.title,
      course: session.course,
      startAt: `${session.date} · ${session.time}`,
      type: 'Live class',
      location: `Virtual · ${session.instructor}`,
      accent: 'bg-info',
    })
  }

  for (const deadline of data.upcomingDeadlines) {
    items.push({
      id: `deadline-${deadline.id}`,
      title: deadline.title,
      course: deadline.course,
      startAt: deadline.dueIn,
      type: deadline.status === 'overdue' ? 'Deadline' : 'Exam',
      location: 'Online submission',
      accent: deadline.status === 'overdue' ? 'bg-danger' : 'bg-warning',
    })
  }

  for (const event of data.calendarEvents) {
    items.push({
      id: `academic-${event.id}`,
      title: event.title,
      course: 'Institution-wide',
      startAt: `${event.month} ${event.day}`,
      type: 'Deadline',
      location: event.subtitle,
      accent: 'bg-navy-900',
    })
  }

  return items
}

export function AdminCalendarPage() {
  const { data, isLoading, isError } = useInstitutionOverview()
  const [activeTab, setActiveTab] = useState('All')

  const schedule = useMemo(() => (data ? buildAdminSchedule(data) : []), [data])

  const filtered = useMemo(() => {
    if (activeTab === 'All') return schedule
    if (activeTab === 'Academic') {
      return schedule.filter((item) => item.id.startsWith('academic-'))
    }
    return schedule.filter((item) => item.type === (activeTab as EventType))
  }, [schedule, activeTab])

  const stats = useMemo(
    () => ({
      total: schedule.length,
      live: schedule.filter((e) => e.type === 'Live class').length,
      exams: schedule.filter((e) => e.type === 'Exam').length,
      deadlines: schedule.filter((e) => e.type === 'Deadline').length,
    }),
    [schedule],
  )

  const nextEvent = useMemo(() => pickNextScheduleEvent(schedule), [schedule])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lemon-500" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-4 bg-danger-bg text-danger rounded-xl border border-danger/30 text-center font-medium">
        Failed to load calendar data. Please try again.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Academic Calendar"
        subtitle="Institution-wide sessions, assessment deadlines, and academic milestones."
        actions={
          <Button variant="primary">
            <CalendarDays size={15} />
            Export calendar
          </Button>
        }
      />

      {nextEvent ? (
        <CalendarNextUpCard
          event={{
            title: nextEvent.title,
            course: nextEvent.course,
            type: nextEvent.type,
            startAt: nextEvent.startAt,
            location: nextEvent.location,
          }}
        />
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatBlock
          label="Scheduled"
          value={stats.total}
          sub="Upcoming items"
          icon={<CalendarDays size={17} />}
          iconBg="bg-navy-50 text-navy-600"
        />
        <StatBlock
          label="Live sessions"
          value={stats.live}
          sub="Virtual classes"
          icon={<MonitorPlay size={17} />}
          iconBg="bg-lemon-100 text-lemon-800"
        />
        <StatBlock
          label="Assessments"
          value={stats.exams}
          sub="Exams & quizzes"
          icon={<CalendarClock size={17} />}
          iconBg="bg-danger-bg text-danger"
        />
        <StatBlock
          label="Deadlines"
          value={stats.deadlines}
          sub="Due dates"
          icon={<Clock3 size={17} />}
          iconBg="bg-info-bg text-info"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <span className="text-[12px] text-secondary-text">
          {filtered.length} event{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      <ScheduleCalendarCard schedule={filtered} />
    </div>
  )
}

export default AdminCalendarPage

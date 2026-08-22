import { useMemo, useState } from 'react'
import { CalendarDays, Clock3, MonitorPlay } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { CalendarNextUpCard, pickNextScheduleEvent } from '../../../shared/components/CalendarNextUpCard'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { ScheduleCalendarCard } from '../../students/components/AssessmentCards'
import { InstructorPageError, InstructorPageLoading } from '../components/InstructorPageStates'
import { useInstructorDashboard } from '../hooks/useInstructorDashboard'
import type { EventType } from '../types'

const tabs = ['All', 'Live class', 'Exam', 'Office hour', 'Deadline']

export function InstructorCalendarPage() {
  const { data, isLoading, isError } = useInstructorDashboard()
  const [activeTab, setActiveTab] = useState('All')

  const stats = useMemo(() => {
    if (!data) return { total: 0, live: 0, exams: 0, deadlines: 0 }
    return {
      total: data.schedule.length,
      live: data.schedule.filter((e) => e.type === 'Live class').length,
      exams: data.schedule.filter((e) => e.type === 'Exam').length,
      deadlines: data.schedule.filter((e) => e.type === 'Deadline').length,
    }
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return []
    if (activeTab === 'All') return data.schedule
    return data.schedule.filter((e) => e.type === (activeTab as EventType))
  }, [data, activeTab])

  const nextEvent = useMemo(
    () => (data ? pickNextScheduleEvent(data.schedule) : undefined),
    [data],
  )

  if (isLoading) return <InstructorPageLoading />
  if (isError || !data) return <InstructorPageError message="Failed to load calendar." />

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Schedule & Calendar"
        subtitle="Classes, exams, office hours, and grading deadlines in one planner."
        actions={
          <Button variant="primary">
            <CalendarDays size={15} />
            Add event
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
          label="This week"
          value={stats.total}
          sub="Scheduled items"
          icon={<CalendarDays size={17} />}
          iconBg="bg-navy-50 text-navy-600"
        />
        <StatBlock
          label="Live classes"
          value={stats.live}
          sub="Virtual sessions"
          icon={<MonitorPlay size={17} />}
          iconBg="bg-lemon-100 text-lemon-800"
        />
        <StatBlock
          label="Exams"
          value={stats.exams}
          sub="Assessment dates"
          icon={<CalendarDays size={17} />}
          iconBg="bg-danger-bg text-danger"
        />
        <StatBlock
          label="Deadlines"
          value={stats.deadlines}
          sub="Grading cutoffs"
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

export default InstructorCalendarPage

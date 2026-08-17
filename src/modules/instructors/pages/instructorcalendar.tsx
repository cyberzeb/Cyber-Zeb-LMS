import { useMemo, useState } from 'react'
import { CalendarClock, CalendarDays, Clock3, MapPin, MonitorPlay } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { GlassCard } from '../../../shared/layout/GlassCard'
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

  const nextEvent = data?.schedule[0]

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
        <GlassCard className="relative overflow-hidden p-0 border-info/30">
          <div className="absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900" />
          <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-lemon-500/10 blur-3xl" />
          <div className="relative p-6 md:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-lemon-500 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-navy-900 shadow-sm">
                <CalendarClock size={12} className="text-navy-900" />
                Next up
              </div>
              <h2 className="mt-3 text-[20px] md:text-[22px] font-bold text-white leading-tight">{nextEvent.title}</h2>
              <p className="mt-2 text-[13px] text-navy-200">
                {nextEvent.course} · {nextEvent.type}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11.5px]">
                <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-white/90">
                  <Clock3 size={12} />
                  {nextEvent.startAt}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-white/90">
                  <MapPin size={12} />
                  {nextEvent.location}
                </span>
              </div>
            </div>
            <Button variant="primary" className="shrink-0">
              View details
            </Button>
          </div>
        </GlassCard>
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
          icon={<CalendarClock size={17} />}
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

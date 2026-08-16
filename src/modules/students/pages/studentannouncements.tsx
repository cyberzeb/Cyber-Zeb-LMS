import { useMemo, useState } from 'react'
import { Bell, Building2, Megaphone, Sparkles } from 'lucide-react'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { Monogram } from '../../../shared/components/Monogram'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StudentPageError, StudentPageLoading } from '../components/StudentPageStates'
import { useStudentDashboard } from '../hooks/useStudentDashboard'

const tabs = ['All', 'Important', 'Updates']

export function StudentAnnouncementsPage() {
  const { data, isLoading, isError } = useStudentDashboard()
  const [activeTab, setActiveTab] = useState('All')

  const filtered = useMemo(() => {
    if (!data) return []
    if (activeTab === 'Important') return data.announcements.filter((a) => a.priority === 'important')
    if (activeTab === 'Updates') return data.announcements.filter((a) => a.priority === 'normal')
    return data.announcements
  }, [data, activeTab])

  const stats = useMemo(() => {
    if (!data) return { total: 0, important: 0, course: 0 }
    return {
      total: data.announcements.length,
      important: data.announcements.filter((a) => a.priority === 'important').length,
      course: data.announcements.filter((a) => a.course).length,
    }
  }, [data])

  if (isLoading) return <StudentPageLoading />
  if (isError || !data) return <StudentPageError message="Failed to load announcements." />

  const latestImportant = data.announcements.find((a) => a.priority === 'important')

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Announcements"
        subtitle="Course updates, exam notices, and campus news from your instructors."
      />

      {latestImportant ? (
        <GlassCard className="relative overflow-hidden p-0 border-warning/30">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-lemon-50 to-white" />
          <div className="relative p-6 flex flex-col md:flex-row md:items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning text-navy-900 flex items-center justify-center shrink-0">
              <Megaphone size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-warning/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-900">
                Important · {latestImportant.postedAt}
              </div>
              <h2 className="mt-2 text-[18px] font-bold text-navy-900 leading-snug">{latestImportant.title}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-secondary-text line-clamp-2">
                {latestImportant.body}
              </p>
              <p className="mt-2 text-[12px] font-semibold text-navy-700">
                {latestImportant.author}
                {latestImportant.course ? ` · ${latestImportant.course}` : ''}
              </p>
            </div>
          </div>
        </GlassCard>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBlock
          label="Total posts"
          value={stats.total}
          sub="This term"
          icon={<Bell size={17} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Important"
          value={stats.important}
          sub="Needs attention"
          icon={<Sparkles size={17} />}
          iconBg="bg-warning-bg text-warning"
        />
        <StatBlock
          label="Course-specific"
          value={stats.course}
          sub="From instructors"
          icon={<Building2 size={17} />}
          iconBg="bg-navy-50 text-navy-600"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <span className="text-[12px] text-secondary-text">{filtered.length} announcement{filtered.length === 1 ? '' : 's'}</span>
      </div>

      <div className="flex flex-col gap-4">
        {filtered.map((item) => (
          <GlassCard
            key={item.id}
            className={`p-0 overflow-hidden hover:shadow-md transition-shadow border-l-4 ${
              item.priority === 'important'
                ? 'border-l-warning bg-gradient-to-r from-warning-bg/40 to-white'
                : 'border-l-info bg-gradient-to-r from-info-bg/30 to-white'
            }`}
          >
            <div className="p-5 flex gap-4">
              <Monogram label={item.author} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill
                    label={item.priority === 'important' ? 'Important' : 'Update'}
                    tone={item.priority === 'important' ? 'warning' : 'info'}
                  />
                  {item.course ? (
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text">
                      {item.course}
                    </span>
                  ) : (
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text">
                      Campus-wide
                    </span>
                  )}
                </div>
                <h3 className="mt-1.5 text-[16px] font-bold text-navy-900 leading-snug">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-secondary-text">{item.body}</p>
                <p className="mt-3 text-[11.5px] font-semibold text-navy-600">
                  {item.author} · {item.postedAt}
                </p>
              </div>
            </div>
          </GlassCard>
        ))}

        {filtered.length === 0 ? (
          <GlassCard className="p-10 text-center">
            <Megaphone size={32} className="mx-auto text-navy-300 mb-3" />
            <p className="text-[14px] font-semibold text-navy-900">No announcements here</p>
            <p className="text-[12.5px] text-secondary-text mt-1">Try another filter.</p>
          </GlassCard>
        ) : null}
      </div>
    </div>
  )
}

export default StudentAnnouncementsPage

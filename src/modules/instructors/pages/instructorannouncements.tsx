import { useMemo, useState } from 'react'
import { Bell, Eye, Megaphone, Plus, Sparkles } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { InstructorPageError, InstructorPageLoading } from '../components/InstructorPageStates'
import { useInstructorDashboard } from '../hooks/useInstructorDashboard'

const tabs = ['All', 'Important', 'Updates']

export function InstructorAnnouncementsPage() {
  const { data, isLoading, isError } = useInstructorDashboard()
  const [activeTab, setActiveTab] = useState('All')

  const filtered = useMemo(() => {
    if (!data) return []
    if (activeTab === 'Important') return data.announcements.filter((a) => a.priority === 'important')
    if (activeTab === 'Updates') return data.announcements.filter((a) => a.priority === 'normal')
    return data.announcements
  }, [data, activeTab])

  const stats = useMemo(() => {
    if (!data) return { total: 0, important: 0, views: 0 }
    return {
      total: data.announcements.length,
      important: data.announcements.filter((a) => a.priority === 'important').length,
      views: data.announcements.reduce((sum, a) => sum + a.views, 0),
    }
  }, [data])

  if (isLoading) return <InstructorPageLoading />
  if (isError || !data) return <InstructorPageError message="Failed to load announcements." />

  const latestImportant = data.announcements.find((a) => a.priority === 'important')

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Announcements"
        subtitle="Publish course updates, exam notices, and important messages to your students."
        actions={
          <Button variant="primary">
            <Plus size={15} />
            New announcement
          </Button>
        }
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
              <p className="mt-2 text-[12px] text-navy-700 flex items-center gap-1">
                <Eye size={13} />
                {latestImportant.views} views
                {latestImportant.course ? ` · ${latestImportant.course}` : ''}
              </p>
            </div>
          </div>
        </GlassCard>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBlock
          label="Published"
          value={stats.total}
          sub="Total announcements"
          icon={<Megaphone size={17} />}
          iconBg="bg-navy-50 text-navy-600"
        />
        <StatBlock
          label="Important"
          value={stats.important}
          sub="High-priority posts"
          icon={<Bell size={17} />}
          iconBg="bg-warning-bg text-warning"
        />
        <StatBlock
          label="Total views"
          value={stats.views}
          sub="Student engagement"
          icon={<Sparkles size={17} />}
          iconBg="bg-lemon-100 text-lemon-800"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <span className="text-[12px] text-secondary-text">
          {filtered.length} announcement{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((announcement) => (
          <GlassCard
            key={announcement.id}
            className={`p-0 overflow-hidden hover:shadow-md transition-shadow border-l-4 ${
              announcement.priority === 'important'
                ? 'border-l-warning bg-gradient-to-r from-warning-bg/40 to-white'
                : 'border-l-navy-300 bg-gradient-to-r from-navy-50/40 to-white'
            }`}
          >
            <div className="p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill
                    label={announcement.priority === 'important' ? 'Important' : 'Update'}
                    tone={announcement.priority === 'important' ? 'warning' : 'neutral'}
                  />
                  {announcement.course ? (
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text">
                      {announcement.course}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-2 text-[15px] font-bold text-navy-900">{announcement.title}</h3>
                <p className="mt-2 text-[13px] text-secondary-text leading-relaxed">{announcement.body}</p>
                <p className="mt-2 text-[12px] text-secondary-text">
                  {announcement.postedAt} · {announcement.views} views
                </p>
              </div>
              <Button variant="secondary" size="sm" className="shrink-0 self-start">
                Edit
              </Button>
            </div>
          </GlassCard>
        ))}

        {filtered.length === 0 ? (
          <GlassCard className="p-10 text-center">
            <Megaphone size={32} className="mx-auto text-navy-300 mb-3" />
            <p className="text-[14px] font-semibold text-navy-900">No announcements yet</p>
            <p className="text-[12.5px] text-secondary-text mt-1">Publish your first update to reach students.</p>
          </GlassCard>
        ) : null}
      </div>
    </div>
  )
}

export default InstructorAnnouncementsPage

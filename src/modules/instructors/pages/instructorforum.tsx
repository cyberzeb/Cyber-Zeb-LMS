import { useMemo, useState } from 'react'
import { AlertTriangle, MessageSquare, MessageSquareText, Pin, Shield, Users } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Monogram } from '../../../shared/components/Monogram'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { InstructorPageError, InstructorPageLoading } from '../components/InstructorPageStates'
import { useInstructorDashboard } from '../hooks/useInstructorDashboard'

const tabs = ['All threads', 'Pinned', 'Needs moderation']

export function InstructorForumPage() {
  const { data, isLoading, isError } = useInstructorDashboard()
  const [activeTab, setActiveTab] = useState('All threads')

  const stats = useMemo(() => {
    if (!data) return { threads: 0, pinned: 0, moderation: 0 }
    return {
      threads: data.forumThreads.length,
      pinned: data.forumThreads.filter((t) => t.pinned).length,
      moderation: data.forumThreads.filter((t) => t.needsModeration).length,
    }
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return []
    if (activeTab === 'Pinned') return data.forumThreads.filter((t) => t.pinned)
    if (activeTab === 'Needs moderation') return data.forumThreads.filter((t) => t.needsModeration)
    return data.forumThreads
  }, [data, activeTab])

  if (isLoading) return <InstructorPageLoading />
  if (isError || !data) return <InstructorPageError message="Failed to load discussion forum." />

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Discussion Forum"
        subtitle="Moderate threads, pin important posts, and engage with your students."
        actions={
          <Button variant="primary">
            <MessageSquare size={15} />
            New thread
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBlock
          label="Active threads"
          value={stats.threads}
          sub="Across your courses"
          icon={<MessageSquareText size={17} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Pinned"
          value={stats.pinned}
          sub="Highlighted posts"
          icon={<Pin size={17} />}
          iconBg="bg-lemon-100 text-lemon-800"
        />
        <StatBlock
          label="Needs moderation"
          value={stats.moderation}
          sub="Awaiting review"
          icon={<Shield size={17} />}
          iconBg="bg-warning-bg text-warning"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <span className="text-[12px] text-secondary-text">{filtered.length} thread{filtered.length === 1 ? '' : 's'}</span>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((thread) => (
          <GlassCard
            key={thread.id}
            className={`p-0 overflow-hidden hover:shadow-md transition-shadow border-l-4 ${
              thread.needsModeration
                ? 'border-l-warning bg-gradient-to-r from-warning-bg/50 to-white'
                : thread.pinned
                  ? 'border-l-lemon-500 bg-gradient-to-r from-lemon-50/80 to-white'
                  : 'border-l-navy-300 bg-gradient-to-r from-navy-50/40 to-white'
            }`}
          >
            <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <Monogram label={thread.author} size="md" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {thread.pinned ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-lemon-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-lemon-900">
                        <Pin size={10} />
                        Pinned
                      </span>
                    ) : null}
                    {thread.needsModeration ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                        <AlertTriangle size={10} />
                        Review
                      </span>
                    ) : null}
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text">
                      {thread.course}
                    </span>
                  </div>
                  <h3 className="mt-1 text-[15px] font-bold text-navy-900 leading-snug">{thread.title}</h3>
                  <p className="mt-1.5 text-[12px] text-secondary-text">
                    <span className="font-semibold text-navy-700">{thread.author}</span> · {thread.replies} replies ·{' '}
                    {thread.lastActivity}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex flex-col items-center rounded-xl bg-navy-50 px-4 py-2 border border-divider">
                  <span className="text-[18px] font-extrabold text-navy-900 leading-none">{thread.replies}</span>
                  <span className="text-[9px] font-semibold uppercase text-secondary-text mt-0.5">Replies</span>
                </div>
                <Button variant="secondary" size="sm">
                  Moderate
                </Button>
              </div>
            </div>
          </GlassCard>
        ))}

        {filtered.length === 0 ? (
          <GlassCard className="p-10 text-center">
            <Users size={32} className="mx-auto text-navy-300 mb-3" />
            <p className="text-[14px] font-semibold text-navy-900">No threads in this view</p>
          </GlassCard>
        ) : null}
      </div>
    </div>
  )
}

export default InstructorForumPage

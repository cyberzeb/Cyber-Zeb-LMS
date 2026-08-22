import { useMemo } from 'react'
import { BookOpen, FileDown, FileText, PlayCircle, Plus, Search } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { Monogram } from '../../../shared/components/Monogram'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { InstructorPageError, InstructorPageLoading } from '../components/InstructorPageStates'
import { useInstructorDashboard } from '../hooks/useInstructorDashboard'

export function InstructorResourcesPage() {
  const { data, isLoading, isError } = useInstructorDashboard()

  const stats = useMemo(() => {
    if (!data) return { total: 0, syllabus: 0, notes: 0, video: 0 }
    return {
      total: data.resources.length,
      syllabus: data.resources.filter((r) => r.kind === 'Syllabus').length,
      notes: data.resources.filter((r) => r.kind === 'Lecture Notes').length,
      video: data.resources.filter((r) => r.kind === 'Video').length,
    }
  }, [data])

  if (isLoading) return <InstructorPageLoading />
  if (isError || !data) return <InstructorPageError message="Failed to load resources." />

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Library"
        subtitle="Upload syllabi, lecture notes, readings, and videos for your students."
        actions={
          <>
            <Button variant="secondary">
              <Search size={15} />
              Search
            </Button>
            <Button variant="primary">
              <Plus size={15} />
              Upload resource
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatBlock
          label="Total files"
          value={stats.total}
          sub="Published resources"
          icon={<BookOpen size={17} />}
          iconBg="bg-navy-50 text-navy-600"
        />
        <StatBlock
          label="Syllabi"
          value={stats.syllabus}
          sub="Course outlines"
          icon={<BookOpen size={17} />}
          iconBg="bg-navy-900 text-white"
        />
        <StatBlock
          label="Lecture notes"
          value={stats.notes}
          sub="Slides & handouts"
          icon={<FileText size={17} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Videos"
          value={stats.video}
          sub="Recorded sessions"
          icon={<PlayCircle size={17} />}
          iconBg="bg-success-bg text-success"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.resources.map((resource) => (
          <GlassCard
            key={resource.id}
            className="p-0 overflow-hidden hover:shadow-md transition-shadow border-l-4 border-l-lemon-500"
          >
            <div className="p-5 flex gap-4">
              <Monogram label={resource.kind} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill label={resource.kind} tone="info" />
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text">
                    {resource.course}
                  </span>
                </div>
                <h3 className="mt-1.5 text-[15px] font-bold text-navy-900 leading-snug">{resource.title}</h3>
                <p className="mt-1 text-[12px] text-secondary-text">
                  {resource.size} · {resource.updatedAt}
                </p>
                <p className="mt-1 text-[12px] text-navy-700 font-semibold">{resource.downloads} downloads</p>
                <Button variant="secondary" size="sm" className="mt-3">
                  <FileDown size={13} />
                  Manage
                </Button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {data.resources.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <BookOpen size={32} className="mx-auto text-navy-300 mb-3" />
          <p className="text-[14px] font-semibold text-navy-900">No resources uploaded yet</p>
        </GlassCard>
      ) : null}
    </div>
  )
}

export default InstructorResourcesPage

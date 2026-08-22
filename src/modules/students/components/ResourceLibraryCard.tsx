import type { ReactElement } from 'react'
import { BookOpen, Download, FileText, Layers3, PlayCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { GlassCard } from '../../../shared/layout/GlassCard'
import type { CourseResource, ResourceKind } from '../types'

interface ResourceLibraryCardProps {
  resources: CourseResource[]
}

const resourceOptions: Array<'All' | ResourceKind> = ['All', 'Syllabus', 'Lecture Notes', 'Reading', 'Video']

const resourceIcons: Record<ResourceKind, ReactElement> = {
  Syllabus: <BookOpen size={16} />,
  'Lecture Notes': <FileText size={16} />,
  Reading: <Layers3 size={16} />,
  Video: <PlayCircle size={16} />,
}

const kindAccent: Record<ResourceKind, string> = {
  Syllabus: 'border-l-navy-500 from-navy-50',
  'Lecture Notes': 'border-l-info from-info-bg/50',
  Reading: 'border-l-lemon-500 from-lemon-50/70',
  Video: 'border-l-success from-success-bg/50',
}

const kindIconBg: Record<ResourceKind, string> = {
  Syllabus: 'bg-navy-900 text-white',
  'Lecture Notes': 'bg-info text-white',
  Reading: 'bg-lemon-500 text-navy-900',
  Video: 'bg-success text-white',
}

export function ResourceLibraryCard({ resources }: ResourceLibraryCardProps) {
  const [activeFilter, setActiveFilter] = useState<'All' | ResourceKind>('All')

  const visibleResources = useMemo(() => {
    if (activeFilter === 'All') return resources
    return resources.filter((resource) => resource.kind === activeFilter)
  }, [activeFilter, resources])

  if (resources.length === 0) {
    return (
      <GlassCard className="p-10 text-center">
        <BookOpen size={32} className="mx-auto text-navy-300 mb-3" />
        <p className="text-[14px] font-semibold text-navy-900">No resources available</p>
        <p className="text-[12.5px] text-secondary-text mt-1">Materials appear when courses are assigned.</p>
      </GlassCard>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <FilterTabs
        tabs={resourceOptions}
        active={activeFilter}
        onChange={(tab) => setActiveFilter(tab as 'All' | ResourceKind)}
      />

      {visibleResources.length === 0 ? (
        <GlassCard className="p-8 text-center text-[13px] text-secondary-text">
          No resources match this filter.
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleResources.map((resource) => (
            <GlassCard
              key={resource.id}
              className={`p-0 overflow-hidden border-l-4 bg-gradient-to-r ${kindAccent[resource.kind]} to-card-end hover:shadow-md transition-shadow`}
            >
              <div className="p-5 flex gap-4">
                <div
                  className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${kindIconBg[resource.kind]}`}
                >
                  {resourceIcons[resource.kind]}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-secondary-text">
                    {resource.kind}
                  </div>
                  <h3 className="mt-1 text-[15px] font-bold text-navy-900 leading-snug">{resource.title}</h3>
                  <p className="mt-1.5 text-[12px] text-secondary-text">
                    {resource.course} · {resource.size}
                  </p>
                  <p className="mt-0.5 text-[11px] text-secondary-text">{resource.updatedAt}</p>

                  <a href={resource.href} className="inline-block mt-3">
                    <Button variant="primary" size="sm">
                      <Download size={13} />
                      Download
                    </Button>
                  </a>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}

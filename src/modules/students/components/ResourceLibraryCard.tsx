import type { ReactElement } from 'react'
import { Download, FileText, PlayCircle, BookOpen, Layers3 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { LmsSectionCard } from './LmsSectionCard'
import type { CourseResource, ResourceKind } from '../types'

interface ResourceLibraryCardProps {
  resources: CourseResource[]
}

const resourceOptions: Array<'All' | ResourceKind> = ['All', 'Syllabus', 'Lecture Notes', 'Reading', 'Video']

const resourceIcons: Record<ResourceKind, ReactElement> = {
  Syllabus: <BookOpen size={14} />,
  'Lecture Notes': <FileText size={14} />,
  Reading: <Layers3 size={14} />,
  Video: <PlayCircle size={14} />,
}

export function ResourceLibraryCard({ resources }: ResourceLibraryCardProps) {
  const [activeFilter, setActiveFilter] = useState<'All' | ResourceKind>('All')

  const visibleResources = useMemo(() => {
    if (activeFilter === 'All') {
      return resources
    }

    return resources.filter((resource) => resource.kind === activeFilter)
  }, [activeFilter, resources])

  return (
    <LmsSectionCard
      eyebrow="Course content & resources"
      title="Digital library"
      description="Access syllabi, lecture notes, readings, and instructional videos for every course."
      className="h-full"
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {resourceOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setActiveFilter(option)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
              activeFilter === option
                ? 'bg-lemon-500 text-navy-900 shadow-sm'
                : 'bg-navy-50 text-navy-700 hover:bg-navy-100'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {visibleResources.map((resource) => (
          <div
            key={resource.id}
            className="rounded-2xl border border-divider/70 bg-white/80 p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-navy-700">
                  {resourceIcons[resource.kind]}
                  {resource.kind}
                </div>
                <h3 className="mt-2 text-[14px] font-bold leading-tight text-navy-900">{resource.title}</h3>
                <p className="mt-1 text-[12px] text-secondary-text">
                  {resource.course} · {resource.size} · {resource.updatedAt}
                </p>
              </div>

              <a
                href={resource.href}
                className="inline-flex items-center gap-1.5 rounded-full bg-lemon-500 px-3 py-2 text-[11px] font-bold text-navy-900 transition hover:bg-lemon-200"
              >
                <Download size={13} />
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </LmsSectionCard>
  )
}
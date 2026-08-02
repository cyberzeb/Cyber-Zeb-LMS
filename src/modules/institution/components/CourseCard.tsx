import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatusPill, type StatusTone } from '../../../shared/components/StatusPill'
import type { CourseSummary } from '../types'

interface CourseCardProps {
  course: CourseSummary
  onOpen?: (course: CourseSummary) => void
}

const statusMap: Record<CourseSummary['status'], { label: string; tone: StatusTone }> = {
  published: { label: 'Published', tone: 'success' },
  draft: { label: 'Draft', tone: 'warning' },
  archived: { label: 'Archived', tone: 'neutral' },
}

export function CourseCard({ course, onOpen }: CourseCardProps) {
  const status = statusMap[course.status]

  return (
    <GlassCard
      className="p-5 flex flex-col gap-4 hover:shadow-[0_12px_32px_rgba(27,35,64,0.12)] hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-navy-50 flex items-center justify-center text-xl shrink-0">
            {course.icon}
          </div>
          <div className="min-w-0">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text">
              {course.code}
            </div>
            <h3 className="font-extrabold text-navy-900 text-[15px] leading-tight truncate">
              {course.title}
            </h3>
          </div>
        </div>
        <StatusPill label={status.label} tone={status.tone} />
      </div>

      <div className="flex flex-col gap-1.5 text-[12px] text-secondary-text">
        <div className="flex items-center gap-1.5">
          <span>👤</span>
          <span className="text-navy-700 font-medium truncate">{course.instructor}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>🏛️</span>
          <span className="truncate">{course.department}</span>
        </div>
      </div>

      {/* Content build progress */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-secondary-text">
            Content Ready
          </span>
          <span className="text-[11px] font-bold text-navy-900">{course.progressPercent}%</span>
        </div>
        <div className="h-1.5 w-full bg-navy-50 rounded-full overflow-hidden">
          <div
            className="h-full bg-lemon-500 rounded-full"
            style={{ width: `${course.progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-divider/50">
        <div className="flex gap-5">
          <div>
            <div className="text-[14px] font-extrabold text-navy-900">
              {course.enrolledCount.toLocaleString()}
            </div>
            <div className="text-[9.5px] uppercase tracking-wider text-secondary-text font-semibold">
              Enrolled
            </div>
          </div>
          <div>
            <div className="text-[14px] font-extrabold text-navy-900">{course.moduleCount}</div>
            <div className="text-[9.5px] uppercase tracking-wider text-secondary-text font-semibold">
              Modules
            </div>
          </div>
        </div>
        <button
          onClick={() => onOpen?.(course)}
          className="text-lemon-700 hover:text-lemon-900 font-bold text-[12px] cursor-pointer bg-transparent border-none p-0"
        >
          Manage →
        </button>
      </div>
    </GlassCard>
  )
}

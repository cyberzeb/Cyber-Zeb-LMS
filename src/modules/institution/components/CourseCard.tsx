import { CheckCircle2, Clock, GraduationCap, Trash2, User, XCircle } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatusPill, type StatusTone } from '../../../shared/components/StatusPill'
import { Monogram } from '../../../shared/components/Monogram'
import { Button } from '../../../shared/components/Button'
import { isCorporateEdition } from '../../../shared/config/edition'
import type { CourseApprovalStatus, CourseRecord } from '../types'

interface CourseCardProps {
  course: CourseRecord
  onOpen?: (course: CourseRecord) => void
  onDelete?: (course: CourseRecord) => void
  onApprove?: (course: CourseRecord) => void
  onReject?: (course: CourseRecord) => void
}

const statusMap: Record<CourseRecord['status'], { label: string; tone: StatusTone }> = {
  published: { label: 'Published', tone: 'success' },
  draft: { label: 'Draft', tone: 'warning' },
  archived: { label: 'Archived', tone: 'neutral' },
}

const approvalMap: Record<CourseApprovalStatus, { label: string; tone: StatusTone }> = {
  approved: { label: 'Approved', tone: 'success' },
  pending: { label: 'Pending approval', tone: 'warning' },
  rejected: { label: 'Rejected', tone: 'danger' },
}

export function CourseCard({ course, onOpen, onDelete, onApprove, onReject }: CourseCardProps) {
  const corporateMode = isCorporateEdition()
  const status = statusMap[course.status]
  const approval = course.approvalStatus ? approvalMap[course.approvalStatus] : null
  const showApprovalActions = course.approvalStatus === 'pending' && onApprove && onReject
  const trainerLabel = course.instructor !== 'Unassigned' ? course.instructor : 'No trainer assigned'

  return (
    <GlassCard
      className="group p-5 flex flex-col gap-4 hover:shadow-[0_12px_32px_rgba(27,35,64,0.12)] hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Monogram label={course.title} size="md" />
          <div className="min-w-0">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text">
              {course.code}
            </div>
            <h3 className="font-extrabold text-navy-900 text-[15px] leading-tight truncate">
              {course.title}
            </h3>
            {course.submittedByName ? (
              <p className="text-[10.5px] text-secondary-text mt-0.5 truncate">
                Proposed by {course.submittedByName}
                {course.submittedAt ? ` · ${course.submittedAt}` : ''}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StatusPill label={status.label} tone={status.tone} />
          {approval ? <StatusPill label={approval.label} tone={approval.tone} /> : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 text-[12px] text-secondary-text">
        <div className="flex items-center gap-2">
          <User size={13} className="text-navy-500 shrink-0" />
          <span className="text-navy-700 font-medium truncate">
            {corporateMode ? trainerLabel : course.instructor !== 'Unassigned' ? course.instructor : 'No instructor assigned'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <GraduationCap size={13} className="text-navy-500 shrink-0" />
          <span className="text-navy-700 font-medium truncate">
            {corporateMode ? (course.level === 'Mandatory' ? 'Mandatory training' : course.level) : course.level}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-navy-500 shrink-0" />
          <span className="truncate">
            {course.deliveryMode ?? (corporateMode ? 'Self-paced module' : 'Instructor-led')}
            {course.durationWeeks ? ` · ${course.durationWeeks} week${course.durationWeeks === 1 ? '' : 's'}` : ''}
            {!corporateMode && course.credits ? ` · ${course.credits} credits` : ''}
          </span>
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

      {course.reviewNote && course.approvalStatus === 'rejected' ? (
        <div className="rounded-lg border border-danger/20 bg-danger-bg/40 px-3 py-2 text-[11.5px] text-danger leading-relaxed">
          {course.reviewNote}
        </div>
      ) : null}

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
        <div className="flex items-center gap-1">
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(course)
              }}
              aria-label="Delete course"
              className="opacity-0 group-hover:opacity-100 text-secondary-text hover:text-danger hover:bg-danger-bg w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          )}
          {!showApprovalActions ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpen?.(course)
              }}
              className="text-lemon-700 hover:text-lemon-900 font-bold text-[12px] cursor-pointer bg-transparent border-none px-1"
            >
              Manage →
            </button>
          ) : null}
        </div>
      </div>

      {showApprovalActions ? (
        <div
          className="flex flex-wrap gap-2 pt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="primary"
            size="sm"
            onClick={() => onApprove(course)}
          >
            <CheckCircle2 size={13} />
            Approve
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onReject(course)}
          >
            <XCircle size={13} />
            Reject
          </Button>
        </div>
      ) : null}
    </GlassCard>
  )
}

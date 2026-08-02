import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatusPill, type StatusTone } from '../../../shared/components/StatusPill'
import type { ProgramRow } from '../types'

interface ProgramsTableProps {
  programs: ProgramRow[]
  onManage?: (program: ProgramRow) => void
}

const statusMap: Record<ProgramRow['status'], { label: string; tone: StatusTone }> = {
  active: { label: 'Active', tone: 'success' },
  draft: { label: 'Draft', tone: 'warning' },
  archived: { label: 'Archived', tone: 'neutral' },
}

const levelColors: Record<ProgramRow['level'], string> = {
  Undergraduate: 'bg-info-bg text-info',
  Postgraduate: 'bg-lemon-50 text-lemon-900',
  Doctoral: 'bg-navy-50 text-navy-700',
  Certificate: 'bg-warning-bg text-[#8A6D00]',
}

export function ProgramsTable({ programs, onManage }: ProgramsTableProps) {
  return (
    <GlassCard className="p-0 overflow-hidden">
      {/* Header row (desktop) */}
      <div className="hidden md:grid grid-cols-[2.4fr_1.2fr_1fr_0.9fr_0.9fr_0.8fr] gap-4 px-6 py-3.5 border-b border-divider/60 bg-gradient-to-b from-white/70 to-white/30">
        {['Program', 'Department', 'Level', 'Courses', 'Enrolled', 'Status'].map((h) => (
          <span
            key={h}
            className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text"
          >
            {h}
          </span>
        ))}
      </div>

      <div className="divide-y divide-divider/50">
        {programs.map((program) => {
          const status = statusMap[program.status]
          return (
            <div
              key={program.id}
              onClick={() => onManage?.(program)}
              className="grid grid-cols-1 md:grid-cols-[2.4fr_1.2fr_1fr_0.9fr_0.9fr_0.8fr] gap-2 md:gap-4 px-6 py-4 items-center cursor-pointer transition-all hover:bg-white/60 hover:shadow-[inset_3px_0_0_var(--color-lemon-500)]"
            >
              <div className="min-w-0">
                <div className="font-bold text-navy-900 text-[14px] truncate leading-tight">
                  {program.name}
                </div>
                <div className="text-[11.5px] text-secondary-text mt-0.5">
                  {program.code} · {program.duration}
                </div>
              </div>

              <div className="text-[12.5px] text-navy-700 truncate">{program.department}</div>

              <div>
                <span
                  className={`inline-block text-[10.5px] font-bold px-2.5 py-1 rounded-md ${levelColors[program.level]}`}
                >
                  {program.level}
                </span>
              </div>

              <div className="text-[13px] font-semibold text-navy-900">
                {program.courseCount}
                <span className="md:hidden text-secondary-text font-normal text-[11.5px]"> courses</span>
              </div>

              <div className="text-[13px] font-semibold text-navy-900">
                {program.enrolledCount.toLocaleString()}
                <span className="md:hidden text-secondary-text font-normal text-[11.5px]"> enrolled</span>
              </div>

              <div>
                <StatusPill label={status.label} tone={status.tone} />
              </div>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}

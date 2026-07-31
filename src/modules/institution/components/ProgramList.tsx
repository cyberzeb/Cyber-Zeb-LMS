import { GlassCard } from '../../../shared/layout/GlassCard'
import type { Program } from '../types'

interface ProgramListProps {
  programs: Program[]
  onViewAll?: () => void
}

export function ProgramList({ programs, onViewAll }: ProgramListProps) {
  return (
    <GlassCard className="p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-extrabold text-[17px] text-navy-900 leading-none">Programs Offered</h3>
          <button
            onClick={onViewAll}
            className="text-lemon-700 hover:text-lemon-900 font-bold text-[12.5px] transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            View all
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {programs.map((program) => (
            <div
              key={program.id}
              className="flex items-center gap-3.5 pb-3 border-b border-divider/40 last:border-0 last:pb-0"
            >
              <div className="shrink-0 bg-navy-50 text-navy-700 font-extrabold text-[10.5px] px-2.5 py-1.5 rounded-lg min-w-[48px] text-center uppercase tracking-wider">
                {program.level}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-navy-900 text-[14px] truncate leading-tight">
                  {program.name}
                </h4>
                <p className="text-[11.5px] text-secondary-text mt-1 truncate leading-none">
                  {program.subtitle}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[13.5px] font-extrabold text-navy-900">
                  {program.enrolledCount.toLocaleString()}
                </div>
                <div className="text-[9px] text-secondary-text uppercase tracking-wider font-semibold">
                  Enrolled
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}

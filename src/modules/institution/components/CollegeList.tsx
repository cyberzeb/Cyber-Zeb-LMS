import { GraduationCap } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import type { College, Department } from '../types'

interface CollegeListProps {
  colleges: College[]
  departments: Department[]
  onViewAll?: () => void
}

export function CollegeList({ colleges, departments, onViewAll }: CollegeListProps) {
  return (
    <GlassCard className="p-6">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-extrabold text-[17px] text-navy-900 leading-none">Colleges</h3>
        <button
          onClick={onViewAll}
          className="text-lemon-700 hover:text-lemon-900 font-bold text-[12.5px] transition-colors cursor-pointer bg-transparent border-none p-0"
        >
          View all →
        </button>
      </div>

      {colleges.length > 0 ? (
        <div className="flex flex-col gap-3">
          {colleges.map((college) => {
            const deptCount = departments.filter((d) => d.collegeId === college.id).length
            return (
              <div
                key={college.id}
                className="nested-panel-strong flex items-center gap-3 px-4 py-3"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lemon-50 to-lemon-200 ring-1 ring-lemon-500/20 text-lemon-900 flex items-center justify-center shrink-0">
                  <GraduationCap size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-[14px] text-navy-900 truncate">{college.name}</p>
                  <p className="text-[11.5px] text-secondary-text truncate">
                    Dean: {college.deanName} · {deptCount} department{deptCount === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-[13px] text-secondary-text font-medium">No colleges configured yet.</p>
      )}
    </GlassCard>
  )
}

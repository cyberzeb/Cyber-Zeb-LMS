import { Building2 } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import type { Campus } from '../types'

interface OrgStructureTreeProps {
  campuses: Campus[]
  onAddCampus?: () => void
}

export function OrgStructureTree({ campuses, onAddCampus }: OrgStructureTreeProps) {
  return (
    <GlassCard className="p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-extrabold text-[17px] text-navy-900 leading-none">Organization Structure</h3>
          <button
            onClick={onAddCampus}
            className="text-lemon-700 hover:text-lemon-900 font-bold text-[12.5px] transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            + Add Campus
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {campuses.map((campus) => {
            const isPending = campus.status === 'pending'
            return (
              <div
                key={campus.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border border-divider/40 bg-white/30 transition-all hover:bg-white/50 ${
                  isPending ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center shrink-0">
                    <Building2 size={17} />
                  </span>
                  <div>
                    <h4 className="font-bold text-navy-900 text-[14.5px] leading-tight">
                      {campus.name}
                    </h4>
                    {isPending && (
                      <span className="inline-block mt-1.5 text-[9px] font-bold text-warning uppercase bg-warning-bg px-1.5 py-0.5 rounded">
                        Not activated
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-secondary-text uppercase tracking-wider font-semibold">
                    Departments
                  </span>
                  <span className="bg-navy-50 text-navy-700 font-extrabold text-[11px] px-2 py-0.5 rounded-full">
                    {campus.deptCount}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </GlassCard>
  )
}

import { GlassCard } from '../../../shared/layout/GlassCard'
import type { Leader } from '../types'

interface LeadershipListProps {
  leaders: Leader[]
}

export function LeadershipList({ leaders }: LeadershipListProps) {
  return (
    <GlassCard className="p-6 h-full flex flex-col justify-between">
      <div>
        <h3 className="font-extrabold text-[17px] text-navy-900 leading-none mb-5">Leadership</h3>

        <div className="flex flex-col gap-4">
          {leaders.map((leader) => (
            <div
              key={leader.id}
              className="flex items-center gap-3.5 pb-3 border-b border-divider/40 last:border-0 last:pb-0"
            >
              <div className="w-9 h-9 rounded-full bg-navy-900 text-lemon-500 font-bold text-[12.5px] flex items-center justify-center shadow-sm shrink-0">
                {leader.initials}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-navy-900 text-[14px] truncate leading-tight">
                  {leader.name}
                </h4>
                <p className="text-[11.5px] text-secondary-text mt-1 truncate leading-none">
                  {leader.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}

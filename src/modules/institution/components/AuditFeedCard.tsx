import { GlassCard } from '../../../shared/layout/GlassCard'
import type { AuditLogEntry } from '../types'

interface AuditFeedCardProps {
  entries: AuditLogEntry[]
  onViewFullLog?: () => void
}

export function AuditFeedCard({ entries, onViewFullLog }: AuditFeedCardProps) {
  const getDotColor = (type: 'warn' | 'info' | 'ok') => {
    if (type === 'warn') return 'bg-warning'
    if (type === 'info') return 'bg-info'
    return 'bg-lemon-500'
  }

  return (
    <GlassCard className="p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-extrabold text-[17px] text-navy-900 leading-none">Recent Audit Activity</h3>
          <button
            onClick={onViewFullLog}
            className="text-lemon-700 hover:text-lemon-900 font-bold text-[12.5px] transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            View full log
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex gap-3 pb-3 border-b border-divider/40 last:border-0 last:pb-0"
            >
              <div className="mt-1.5 shrink-0">
                <span className={`inline-block w-2 h-2 rounded-full ${getDotColor(entry.type)}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[13.5px] text-navy-900 font-semibold leading-snug">
                  {entry.text}
                </p>
                <p className="text-[11px] text-secondary-text mt-1 leading-none">
                  {entry.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}

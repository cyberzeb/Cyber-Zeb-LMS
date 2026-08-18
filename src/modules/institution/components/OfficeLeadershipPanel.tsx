import { Crown } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { STAFF_OFFICES } from '../data/staffOffices'
import { getOfficeHead } from '../utils/staffHeadUtils'
import type { Campus, PersonRow } from '../types'

interface OfficeLeadershipPanelProps {
  staff: PersonRow[]
  campuses: Campus[]
  campusFilter: string
}

export function OfficeLeadershipPanel({ staff, campuses, campusFilter }: OfficeLeadershipPanelProps) {
  const campusIds =
    campusFilter === 'all' ? campuses.map((c) => c.id) : campuses.filter((c) => c.id === campusFilter).map((c) => c.id)

  const rows = campusIds.flatMap((campusId) => {
    const campus = campuses.find((c) => c.id === campusId)
    return STAFF_OFFICES.map((office) => ({
      campusId,
      campusCode: campus?.code ?? '—',
      office,
      head: getOfficeHead(staff, office, campusId),
    }))
  })

  if (rows.length === 0) return null

  return (
    <GlassCard className="p-4 md:p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-lemon-50 text-lemon-900 flex items-center justify-center">
          <Crown size={16} />
        </div>
        <div>
          <h3 className="text-[14px] font-extrabold text-navy-900">Office Leadership</h3>
          <p className="text-[11.5px] text-secondary-text">Department heads assigned per campus and office</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
        {rows.map((row) => (
          <div
            key={`${row.campusId}-${row.office}`}
            className={`rounded-xl border px-3 py-2.5 ${
              row.head
                ? 'border-lemon-500/30 bg-lemon-500/[0.06]'
                : 'border-divider/60 bg-white/50'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[12px] font-bold text-navy-900 truncate">{row.office}</div>
                <div className="text-[10px] text-secondary-text mt-0.5">{row.campusCode}</div>
              </div>
              {row.head ? (
                <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-lemon-500 text-navy-900">
                  Head
                </span>
              ) : null}
            </div>
            <div className="mt-2 text-[11.5px] text-navy-700">
              {row.head ? (
                <>
                  <span className="font-semibold">{row.head.name}</span>
                  <span className="block text-[10px] text-secondary-text truncate">{row.head.email}</span>
                </>
              ) : (
                <span className="text-secondary-text italic">No head assigned</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

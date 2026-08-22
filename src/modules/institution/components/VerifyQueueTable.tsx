import { Check, X } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatusPill, type StatusTone } from '../../../shared/components/StatusPill'
import type { Campus, PersonRow } from '../types'

interface VerifyQueueTableProps {
  people: PersonRow[]
  campuses: Campus[]
  onVerify: (person: PersonRow) => void
  onReject: (person: PersonRow) => void
  busyId?: string | null
}

const roleColors: Record<PersonRow['role'], string> = {
  Student: 'bg-info-bg text-info',
  Instructor: 'bg-lemon-50 text-lemon-900',
  Admin: 'bg-navy-50 text-navy-700',
  Guardian: 'bg-warning-bg text-[#8A6D00]',
  Staff: 'bg-navy-50 text-navy-500',
  HelpDesk: 'bg-info-bg text-info',
}

function campusLabel(campusId: string | undefined, campuses: Campus[]): string {
  if (!campusId) return '—'
  return campuses.find((c) => c.id === campusId)?.code ?? '—'
}

export function VerifyQueueTable({
  people,
  campuses,
  onVerify,
  onReject,
  busyId = null,
}: VerifyQueueTableProps) {
  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="hidden md:grid md:grid-cols-[2fr_0.9fr_1fr_1.2fr_1fr_0.8fr] gap-3 px-6 py-3.5 border-b border-divider/60 bg-gradient-to-b from-white/70 to-white/30">
        {['Person', 'Role', 'Campus', 'Submitted By', 'Submitted', 'Actions'].map((h) => (
          <span
            key={h}
            className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text"
          >
            {h}
          </span>
        ))}
      </div>

      <div className="divide-y divide-divider/50">
        {people.map((person) => {
          const busy = busyId === person.id
          return (
            <div
              key={person.id}
              className="grid grid-cols-1 md:grid-cols-[2fr_0.9fr_1fr_1.2fr_1fr_0.8fr] gap-2 md:gap-3 px-6 py-3.5 items-center"
            >
              <div className="min-w-0">
                <div className="font-bold text-navy-900 text-[13.5px] truncate">{person.name}</div>
                <div className="text-[11.5px] text-secondary-text truncate">{person.email}</div>
                <div className="text-[11px] text-secondary-text truncate mt-0.5">{person.department}</div>
              </div>

              <div>
                <span className={`inline-block text-[10.5px] font-bold px-2.5 py-1 rounded-md ${roleColors[person.role]}`}>
                  {person.role}
                </span>
              </div>

              <div className="text-[12px] font-semibold text-navy-700">
                {campusLabel(person.campusId, campuses)}
              </div>

              <div className="text-[12px] text-navy-700 truncate">
                {person.submittedByName ?? 'Staff member'}
              </div>

              <div className="text-[12px] text-secondary-text">{person.submittedAt ?? '—'}</div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onVerify(person)}
                  className="inline-flex items-center gap-1 text-[11.5px] font-bold px-2.5 py-1.5 rounded-lg bg-success-bg text-success hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  <Check size={13} />
                  Verify
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onReject(person)}
                  className="inline-flex items-center gap-1 text-[11.5px] font-bold px-2.5 py-1.5 rounded-lg bg-danger-bg text-danger hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  <X size={13} />
                  Reject
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}

export function VerificationStatusPill({ status }: { status: PersonRow['verificationStatus'] }) {
  const map: Record<
    NonNullable<PersonRow['verificationStatus']>,
    { label: string; tone: StatusTone }
  > = {
    verified: { label: 'Verified', tone: 'success' },
    pending: { label: 'Pending', tone: 'warning' },
    rejected: { label: 'Rejected', tone: 'danger' },
  }
  const item = status ? map[status] : map.verified
  return <StatusPill label={item.label} tone={item.tone} />
}

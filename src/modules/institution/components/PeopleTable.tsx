import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatusPill, type StatusTone } from '../../../shared/components/StatusPill'
import type { PersonRow } from '../types'

interface PeopleTableProps {
  people: PersonRow[]
  onSelect?: (person: PersonRow) => void
}

const statusMap: Record<PersonRow['status'], { label: string; tone: StatusTone }> = {
  active: { label: 'Active', tone: 'success' },
  invited: { label: 'Invited', tone: 'warning' },
  suspended: { label: 'Suspended', tone: 'danger' },
}

const roleColors: Record<PersonRow['role'], string> = {
  Student: 'bg-info-bg text-info',
  Instructor: 'bg-lemon-50 text-lemon-900',
  Admin: 'bg-navy-50 text-navy-700',
  Parent: 'bg-warning-bg text-[#8A6D00]',
  Staff: 'bg-navy-50 text-navy-500',
}

const avatarColors = [
  'bg-navy-900 text-lemon-500',
  'bg-lemon-500 text-navy-900',
  'bg-navy-700 text-white',
  'bg-info text-white',
]

export function PeopleTable({ people, onSelect }: PeopleTableProps) {
  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="hidden md:grid grid-cols-[2.4fr_1.2fr_1.4fr_1fr_0.9fr] gap-4 px-6 py-3.5 border-b border-divider/60 bg-gradient-to-b from-white/70 to-white/30">
        {['Name', 'Role', 'Department', 'Last Active', 'Status'].map((h) => (
          <span
            key={h}
            className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text"
          >
            {h}
          </span>
        ))}
      </div>

      <div className="divide-y divide-divider/50">
        {people.map((person, i) => {
          const status = statusMap[person.status]
          return (
            <div
              key={person.id}
              onClick={() => onSelect?.(person)}
              className="grid grid-cols-1 md:grid-cols-[2.4fr_1.2fr_1.4fr_1fr_0.9fr] gap-2 md:gap-4 px-6 py-3.5 items-center cursor-pointer transition-all hover:bg-white/60 hover:shadow-[inset_3px_0_0_var(--color-lemon-500)]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 ${avatarColors[i % avatarColors.length]}`}
                >
                  {person.initials}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-navy-900 text-[13.5px] truncate leading-tight">
                    {person.name}
                  </div>
                  <div className="text-[11.5px] text-secondary-text truncate">{person.email}</div>
                </div>
              </div>

              <div>
                <span
                  className={`inline-block text-[10.5px] font-bold px-2.5 py-1 rounded-md ${roleColors[person.role]}`}
                >
                  {person.role}
                </span>
              </div>

              <div className="text-[12.5px] text-navy-700 truncate">{person.department}</div>

              <div className="text-[12px] text-secondary-text">{person.lastActive}</div>

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

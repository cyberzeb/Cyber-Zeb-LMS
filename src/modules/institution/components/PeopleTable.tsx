import { Trash2 } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatusPill, type StatusTone } from '../../../shared/components/StatusPill'
import type { PersonRow } from '../types'

interface PeopleTableProps {
  people: PersonRow[]
  hideRoleColumn?: boolean
  departmentLabel?: string
  onSelect?: (person: PersonRow) => void
  onDelete?: (person: PersonRow) => void
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
  Guardian: 'bg-warning-bg text-[#8A6D00]',
  Staff: 'bg-navy-50 text-navy-500',
  HelpDesk: 'bg-info-bg text-info',
}

const avatarColors = [
  'bg-navy-900 text-lemon-500',
  'bg-lemon-500 text-navy-900',
  'bg-navy-700 text-white',
  'bg-info text-white',
]

export function PeopleTable({
  people,
  hideRoleColumn = false,
  departmentLabel = 'Department',
  onSelect,
  onDelete,
}: PeopleTableProps) {
  const gridCols = hideRoleColumn
    ? 'md:grid-cols-[2.4fr_1.6fr_1fr_0.9fr]'
    : 'md:grid-cols-[2.4fr_1.2fr_1.4fr_1fr_0.9fr]'
  const headers = hideRoleColumn
    ? ['Name', departmentLabel, 'Last Active', 'Status']
    : ['Name', 'Role', departmentLabel, 'Last Active', 'Status']

  return (
    <GlassCard className="p-0 overflow-hidden">
      <div
        className={`hidden md:grid ${gridCols} gap-4 px-6 py-3.5 border-b border-divider/60 bg-gradient-to-b from-white/70 to-white/30`}
      >
        {headers.map((h) => (
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
              className={`group grid grid-cols-1 ${gridCols} gap-2 md:gap-4 px-6 py-3.5 items-center cursor-pointer transition-all hover:bg-white/60 hover:shadow-[inset_3px_0_0_var(--color-lemon-500)]`}
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

              {!hideRoleColumn && (
                <div>
                  <span
                    className={`inline-block text-[10.5px] font-bold px-2.5 py-1 rounded-md ${roleColors[person.role]}`}
                  >
                    {person.role}
                  </span>
                </div>
              )}

              <div className="text-[12.5px] text-navy-700 truncate">{person.department}</div>

              <div className="text-[12px] text-secondary-text">{person.lastActive}</div>

              <div className="flex items-center justify-between gap-2">
                <StatusPill label={status.label} tone={status.tone} />
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(person)
                    }}
                    aria-label="Remove user"
                    className="opacity-0 md:group-hover:opacity-100 text-secondary-text hover:text-danger hover:bg-danger-bg w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}

import { Pencil, Trash2 } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatusPill, type StatusTone } from '../../../shared/components/StatusPill'
import { isCorporateEdition } from '../../../shared/config/edition'
import { tTerm } from '../../../shared/config/terminology'
import type { Campus, PersonRow } from '../types'

interface StudentsTableProps {
  students: PersonRow[]
  campuses: Campus[]
  onEdit: (student: PersonRow) => void
  onDelete: (student: PersonRow) => void
}

const statusMap: Record<PersonRow['status'], { label: string; tone: StatusTone }> = {
  active: { label: 'Active', tone: 'success' },
  invited: { label: 'Invited', tone: 'warning' },
  suspended: { label: 'Suspended', tone: 'danger' },
}

const avatarColors = [
  'bg-navy-900 text-lemon-500',
  'bg-lemon-500 text-navy-900',
  'bg-navy-700 text-white',
  'bg-info text-white',
]

function campusLabel(campusId: string | undefined, campuses: Campus[]): string {
  if (!campusId) return '—'
  const campus = campuses.find((c) => c.id === campusId)
  return campus ? campus.code : '—'
}

export function StudentsTable({ students, campuses, onEdit, onDelete }: StudentsTableProps) {
  const corporateMode = isCorporateEdition()
  const locationLabel = corporateMode ? tTerm('location') : 'Campus'
  const headers = corporateMode
    ? ['Name', 'Department', 'Last Active', 'Status', '']
    : ['Name', locationLabel, 'Department', 'Last Active', 'Status', '']

  const gridCols = corporateMode
    ? 'md:grid-cols-[2.2fr_1.4fr_1fr_0.9fr_0.7fr]'
    : 'md:grid-cols-[2.2fr_0.9fr_1.4fr_1fr_0.9fr_0.7fr]'

  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className={`hidden md:grid ${gridCols} gap-4 px-6 py-3.5 table-header-bar`}>
        {headers.map((h) => (
          <span key={h || 'actions'} className="table-header-label">
            {h}
          </span>
        ))}
      </div>

      <div className="divide-y divide-divider/50">
        {students.map((student, i) => {
          const status = statusMap[student.status]
          return (
            <div
              key={student.id}
              className={`group grid grid-cols-1 ${gridCols} gap-2 md:gap-4 px-6 py-3.5 items-center table-row-hover`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 ${avatarColors[i % avatarColors.length]}`}
                >
                  {student.initials}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-navy-900 text-[13.5px] truncate leading-tight">
                    {student.name}
                  </div>
                  <div className="text-[11.5px] text-secondary-text truncate">{student.email}</div>
                </div>
              </div>

              {!corporateMode ? (
                <div>
                  <span className="inline-block text-[10.5px] font-bold px-2.5 py-1 rounded-md bg-navy-50 text-navy-700">
                    {campusLabel(student.campusId, campuses)}
                  </span>
                </div>
              ) : null}

              <div className="text-[12.5px] text-navy-700 truncate">{student.department}</div>
              <div className="text-[12px] text-secondary-text">{student.lastActive}</div>

              <div>
                <StatusPill label={status.label} tone={status.tone} />
              </div>

              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(student)}
                  aria-label={`Edit ${student.name}`}
                  className="text-secondary-text hover:text-navy-900 hover:bg-navy-50 w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(student)}
                  aria-label={`Remove ${student.name}`}
                  className="opacity-70 md:opacity-0 md:group-hover:opacity-100 text-secondary-text hover:text-danger hover:bg-danger-bg w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}

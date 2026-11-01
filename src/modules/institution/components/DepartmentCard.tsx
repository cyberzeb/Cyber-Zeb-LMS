import type { KeyboardEvent } from 'react'
import { Building2, GraduationCap, Plus, Settings2, Trash2, User } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { Monogram } from '../../../shared/components/Monogram'

interface DepartmentCardProps {
  name: string
  headName: string
  studentsCount: number
  facultyCount: number
  campusName?: string
  campusCode?: string
  /** Programs this department offers (BSc, MSc …). */
  programs?: { id: string; code: string; name: string }[]
  onOpenProgram?: (programId: string) => void
  onAddProgram?: () => void
  onClick?: () => void
  onDelete?: () => void
}

export function DepartmentCard({
  name,
  headName,
  studentsCount,
  facultyCount,
  campusName,
  campusCode,
  programs = [],
  onOpenProgram,
  onAddProgram,
  onClick,
  onDelete,
}: DepartmentCardProps) {
  const card = (
    <GlassCard
      className={`group p-5 flex flex-col gap-4 hover:shadow-[0_12px_32px_rgba(27,35,64,0.12)] hover:-translate-y-0.5 transition-all ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Monogram label={name} size="md" />
          <div className="min-w-0">
            {campusCode ? (
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text">
                {campusCode}
              </div>
            ) : null}
            <h3 className="font-extrabold text-navy-900 text-[15px] leading-tight">{name}</h3>
            <div className="text-[11px] text-secondary-text mt-0.5">
              {programs.length} program{programs.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {onClick ? (
            <span className="opacity-0 group-hover:opacity-100 text-secondary-text w-7 h-7 rounded-lg flex items-center justify-center transition-all">
              <Settings2 size={14} />
            </span>
          ) : null}
          {onDelete ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              aria-label="Delete department"
              className="opacity-0 group-hover:opacity-100 text-secondary-text hover:text-danger hover:bg-danger-bg w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0"
            >
              <Trash2 size={14} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 text-[12px] text-secondary-text">
        <div className="flex items-center gap-2">
          <User size={13} className="text-navy-500 shrink-0" />
          <span className="text-navy-700 font-medium truncate">{headName}</span>
        </div>
        {campusName ? (
          <div className="flex items-center gap-2">
            <Building2 size={13} className="text-navy-500 shrink-0" />
            <span className="truncate">{campusName}</span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        {programs.map((program) => (
          <button
            key={program.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenProgram?.(program.id)
            }}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left nested-panel-strong hover:ring-1 hover:ring-lemon-500/40 transition-all cursor-pointer"
          >
            <GraduationCap size={13} className="text-lemon-700 shrink-0" />
            <span className="text-[12px] font-semibold text-navy-900 truncate">{program.name}</span>
            <span className="ml-auto text-[10.5px] text-secondary-text shrink-0">{program.code}</span>
          </button>
        ))}
        {onAddProgram ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onAddProgram()
            }}
            className="self-start inline-flex items-center gap-1 text-[11.5px] font-bold text-lemon-700 hover:text-lemon-900 cursor-pointer px-1"
          >
            <Plus size={12} />
            {programs.length === 0 ? 'Add first program' : 'Add program'}
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-4 sm:gap-6 pt-3 border-t border-divider/50 flex-wrap">
        <div>
          <div className="text-[14px] font-extrabold text-navy-900">
            {studentsCount.toLocaleString()}
          </div>
          <div className="text-[9.5px] uppercase tracking-wider text-secondary-text font-semibold">
            Students
          </div>
        </div>
        <div>
          <div className="text-[14px] font-extrabold text-navy-900">
            {facultyCount.toLocaleString()}
          </div>
          <div className="text-[9.5px] uppercase tracking-wider text-secondary-text font-semibold">
            Faculty
          </div>
        </div>
      </div>
    </GlassCard>
  )

  if (!onClick) return card

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-lemon-500/40"
    >
      {card}
    </div>
  )
}

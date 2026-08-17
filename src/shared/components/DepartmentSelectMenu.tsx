import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Monogram } from './Monogram'
import type { Campus, Department } from '../../modules/institution/types'

interface DepartmentSelectMenuProps {
  value: string
  departments: Department[]
  campuses: Campus[]
  campusFilter?: string
  onChange: (value: string) => void
  className?: string
  'aria-label'?: string
}

export function DepartmentSelectMenu({
  value,
  departments,
  campuses,
  campusFilter = 'all',
  onChange,
  className = '',
  'aria-label': ariaLabel = 'Filter by department',
}: DepartmentSelectMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const scopedDepartments = useMemo(() => {
    if (campusFilter === 'all') return departments
    return departments.filter((d) => d.campusId === campusFilter)
  }, [departments, campusFilter])

  const grouped = useMemo(() => {
    if (campusFilter !== 'all') {
      return [{ campus: campuses.find((c) => c.id === campusFilter), items: scopedDepartments }]
    }
    const byCampus = new Map<string, Department[]>()
    for (const dept of scopedDepartments) {
      const list = byCampus.get(dept.campusId) ?? []
      list.push(dept)
      byCampus.set(dept.campusId, list)
    }
    return campuses
      .filter((c) => byCampus.has(c.id))
      .map((campus) => ({ campus, items: byCampus.get(campus.id) ?? [] }))
  }, [campusFilter, campuses, scopedDepartments])

  const selected = useMemo(() => {
    if (value === 'all') return null
    return departments.find((d) => d.id === value) ?? null
  }, [departments, value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center justify-between gap-2 h-9 w-full min-w-[220px] rounded-lg border border-divider bg-white px-3 text-[12.5px] text-navy-900 hover:border-navy-200 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25 transition-colors"
      >
        <span className="truncate text-left">
          {selected ? selected.name : 'All departments'}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-secondary-text transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-full min-w-[280px] max-h-72 overflow-y-auto rounded-xl border border-divider bg-white shadow-lg py-1">
          <button
            type="button"
            role="option"
            aria-selected={value === 'all'}
            onClick={() => {
              onChange('all')
              setOpen(false)
            }}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-[12.5px] transition-colors ${
              value === 'all'
                ? 'bg-lemon-500/10 text-navy-900 font-semibold'
                : 'text-navy-900 hover:bg-navy-50'
            }`}
          >
            <span>All departments</span>
            {value === 'all' ? <Check size={14} className="text-lemon-700 shrink-0" /> : null}
          </button>

          {grouped.map(({ campus, items }) => (
            <div key={campus?.id ?? 'unknown'}>
              {campusFilter === 'all' && campus ? (
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-secondary-text">
                  {campus.code}
                </div>
              ) : null}
              <ul role="listbox">
                {items.map((dept) => {
                  const isSelected = dept.id === value
                  return (
                    <li key={dept.id} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(dept.id)
                          setOpen(false)
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                          isSelected
                            ? 'bg-lemon-500/10 text-navy-900'
                            : 'text-navy-900 hover:bg-navy-50'
                        }`}
                      >
                        <Monogram label={dept.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className={`text-[12.5px] truncate ${isSelected ? 'font-semibold' : ''}`}>
                            {dept.name}
                          </div>
                          <div className="text-[10px] text-secondary-text truncate">
                            {dept.headName}
                          </div>
                        </div>
                        {isSelected ? (
                          <Check size={14} className="text-lemon-700 shrink-0" />
                        ) : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

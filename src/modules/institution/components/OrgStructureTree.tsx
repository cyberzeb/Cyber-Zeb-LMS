import { useState } from 'react'
import { Building2, ChevronDown, ChevronRight, Pencil, Zap } from 'lucide-react'
import { Monogram } from '../../../shared/components/Monogram'
import { GlassCard } from '../../../shared/layout/GlassCard'
import type { Campus, CampusRecord, Department } from '../types'

interface OrgStructureTreeProps {
  campuses: Campus[]
  departments: Department[]
  onAddCampus?: () => void
  onCampusClick?: (campusId: string) => void
  onEditCampus?: (campus: CampusRecord) => void
  onActivateCampus?: (campusId: string) => void
  onManageDepartments?: (campusId: string) => void
}

/** Campus → Department hierarchy. */
export function OrgStructureTree({
  campuses,
  departments,
  onAddCampus,
  onCampusClick,
  onEditCampus,
  onActivateCampus,
  onManageDepartments,
}: OrgStructureTreeProps) {
  const [expandedCampuses, setExpandedCampuses] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(campuses.map((c) => [c.id, c.status === 'active'])),
  )

  const toggleCampus = (campusId: string) => {
    setExpandedCampuses((prev) => ({ ...prev, [campusId]: !prev[campusId] }))
  }

  return (
    <GlassCard className="p-6">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="font-extrabold text-[17px] text-navy-900 leading-none">
            Campus &amp; Department Tree
          </h3>
          <p className="text-[12px] text-secondary-text mt-1.5">Campus → Department hierarchy</p>
        </div>
        <button
          type="button"
          onClick={onAddCampus}
          className="text-lemon-700 hover:text-lemon-900 font-bold text-[12.5px] transition-colors cursor-pointer bg-transparent border-none p-0"
        >
          + Add Campus
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {campuses.map((campus) => {
          const isPending = campus.status === 'pending'
          const campusDepartments = departments.filter((d) => d.campusId === campus.id)
          const isCampusOpen = expandedCampuses[campus.id] ?? false

          return (
            <div
              key={campus.id}
              className={`nested-panel transition-all ${isPending ? 'opacity-80' : ''}`}
            >
              <div className="flex items-center justify-between p-3.5 gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleCampus(campus.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-navy-700 hover:bg-navy-50 shrink-0"
                    aria-label={isCampusOpen ? 'Collapse campus' : 'Expand campus'}
                  >
                    {isCampusOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <span className="w-9 h-9 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center shrink-0">
                    <Building2 size={17} />
                  </span>
                  <button
                    type="button"
                    onClick={() => onCampusClick?.(campus.id)}
                    className="text-left min-w-0 bg-transparent border-none p-0 cursor-pointer"
                  >
                    <h4 className="font-bold text-navy-900 text-[14.5px] leading-tight truncate hover:text-lemon-700 transition-colors">
                      {campus.name}
                    </h4>
                    <p className="text-[11px] text-secondary-text mt-0.5 truncate">
                      {campus.code} · {campusDepartments.length} department
                      {campusDepartments.length === 1 ? '' : 's'}
                    </p>
                  </button>
                  {isPending && (
                    <span className="inline-block shrink-0 text-[9px] font-bold text-warning uppercase bg-warning-bg px-1.5 py-0.5 rounded">
                      Not activated
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isPending ? (
                    <button
                      type="button"
                      onClick={() => onActivateCampus?.(campus.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-lemon-700 hover:text-lemon-900 px-2 py-1 rounded-lg hover:bg-lemon-500/10"
                    >
                      <Zap size={12} />
                      Activate
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onEditCampus?.(campus)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-secondary-text hover:text-navy-900 hover:bg-navy-50"
                      aria-label="Edit campus"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
              </div>

              {isCampusOpen && (
                <div className="px-4 pb-3.5 pt-0 ml-11 border-t border-divider/30">
                  {campusDepartments.length > 0 ? (
                    <ul className="mt-3 space-y-1.5">
                      {campusDepartments.map((dept) => (
                        <li
                          key={dept.id}
                          className="nested-panel-strong flex items-center justify-between gap-2 rounded-md px-2.5 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Monogram label={dept.name} size="sm" />
                            <div className="min-w-0">
                              <p className="text-[12.5px] font-semibold text-navy-900 truncate">
                                {dept.name}
                              </p>
                              <p className="text-[10.5px] text-secondary-text truncate">
                                Head: {dept.headName}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] text-secondary-text shrink-0">
                            {dept.studentsCount.toLocaleString()} students
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-[12px] text-secondary-text">
                      No departments yet for this campus.
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => onManageDepartments?.(campus.id)}
                      className="text-[12px] font-bold text-lemon-700 hover:text-lemon-900"
                    >
                      + Add department
                    </button>
                    <button
                      type="button"
                      onClick={() => onManageDepartments?.(campus.id)}
                      className="text-[12px] font-bold text-navy-600 hover:text-navy-900"
                    >
                      Manage departments →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}

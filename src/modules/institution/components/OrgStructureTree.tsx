import { useState } from 'react'
import { Building2, ChevronDown, ChevronRight, GraduationCap, Pencil, Zap } from 'lucide-react'
import { Monogram } from '../../../shared/components/Monogram'
import { GlassCard } from '../../../shared/layout/GlassCard'
import type { Campus, CampusRecord, College, Department } from '../types'

interface OrgStructureTreeProps {
  campuses: Campus[]
  colleges: College[]
  departments: Department[]
  onAddCampus?: () => void
  onAddCollege?: (campusId: string) => void
  onCampusClick?: (campusId: string) => void
  onEditCampus?: (campus: CampusRecord) => void
  onActivateCampus?: (campusId: string) => void
  onManageDepartments?: (campusId: string, collegeId?: string) => void
}

export function OrgStructureTree({
  campuses,
  colleges,
  departments,
  onAddCampus,
  onAddCollege,
  onCampusClick,
  onEditCampus,
  onActivateCampus,
  onManageDepartments,
}: OrgStructureTreeProps) {
  const [expandedCampuses, setExpandedCampuses] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(campuses.map((c) => [c.id, c.status === 'active'])),
  )
  const [expandedColleges, setExpandedColleges] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(colleges.map((c) => [c.id, true])),
  )

  const toggleCampus = (campusId: string) => {
    setExpandedCampuses((prev) => ({ ...prev, [campusId]: !prev[campusId] }))
  }

  const toggleCollege = (collegeId: string) => {
    setExpandedColleges((prev) => ({ ...prev, [collegeId]: !prev[collegeId] }))
  }

  return (
    <GlassCard className="p-6">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="font-extrabold text-[17px] text-navy-900 leading-none">
            Campus &amp; College Tree
          </h3>
          <p className="text-[12px] text-secondary-text mt-1.5">
            Campus → College → Department hierarchy
          </p>
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
          const campusColleges = colleges.filter((c) => c.campusId === campus.id)
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
                      {campus.code} · {campusColleges.length} college
                      {campusColleges.length === 1 ? '' : 's'}
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
                  {campusColleges.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {campusColleges.map((college) => {
                        const collegeDepartments = departments.filter((d) => d.collegeId === college.id)
                        const isCollegeOpen = expandedColleges[college.id] ?? true

                        return (
                          <li
                            key={college.id}
                            className="nested-panel-strong rounded-lg"
                          >
                            <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() => toggleCollege(college.id)}
                                  className="w-6 h-6 rounded-md flex items-center justify-center text-navy-600 hover:bg-navy-50 shrink-0"
                                >
                                  {isCollegeOpen ? (
                                    <ChevronDown size={14} />
                                  ) : (
                                    <ChevronRight size={14} />
                                  )}
                                </button>
                                <span className="w-7 h-7 rounded-md bg-lemon-50 text-lemon-900 flex items-center justify-center shrink-0">
                                  <GraduationCap size={14} />
                                </span>
                                <div className="min-w-0">
                                  <p className="text-[13px] font-semibold text-navy-900 truncate">
                                    {college.name}
                                  </p>
                                  <p className="text-[10.5px] text-secondary-text truncate">
                                    Dean: {college.deanName} · {collegeDepartments.length} dept
                                    {collegeDepartments.length === 1 ? '' : 's'}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => onManageDepartments?.(campus.id, college.id)}
                                className="text-[11px] font-bold text-lemon-700 hover:text-lemon-900 shrink-0"
                              >
                                + Dept
                              </button>
                            </div>

                            {isCollegeOpen && (
                              <div className="px-3 pb-2.5 ml-9">
                                {collegeDepartments.length > 0 ? (
                                  <ul className="space-y-1.5">
                                    {collegeDepartments.map((dept) => (
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
                                  <p className="text-[11.5px] text-secondary-text py-1">
                                    No departments in this college yet.
                                  </p>
                                )}
                              </div>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <p className="mt-3 text-[12px] text-secondary-text">
                      No colleges yet for this campus.
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => onAddCollege?.(campus.id)}
                      className="text-[12px] font-bold text-lemon-700 hover:text-lemon-900"
                    >
                      + Add college
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

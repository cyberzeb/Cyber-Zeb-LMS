import { useEffect, useMemo, useState } from 'react'
import { UserCog } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { Monogram } from '../../../shared/components/Monogram'
import { StatusPill } from '../../../shared/components/StatusPill'
import {
  applyDepartmentHeadAssignments,
  getEligibleDepartmentHeads,
  resolveDepartmentHeadId,
} from '../utils/departmentHeadUtils'
import type { Campus, College, Department, PersonRow } from '../types'

interface ManageDepartmentHeadsModalProps {
  open: boolean
  departments: Department[]
  people: PersonRow[]
  campuses: Campus[]
  colleges: College[]
  onClose: () => void
  onSave: (departments: Department[]) => void
}

export function ManageDepartmentHeadsModal({
  open,
  departments,
  people,
  campuses,
  colleges,
  onClose,
  onSave,
}: ManageDepartmentHeadsModalProps) {
  const [assignments, setAssignments] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    const next: Record<string, string> = {}
    for (const dept of departments) {
      next[dept.id] = resolveDepartmentHeadId(dept, people)
    }
    setAssignments(next)
  }, [open, departments, people])

  const sortedDepartments = useMemo(
    () =>
      [...departments].sort((a, b) => {
        const campusA = campuses.find((c) => c.id === a.campusId)?.name ?? ''
        const campusB = campuses.find((c) => c.id === b.campusId)?.name ?? ''
        if (campusA !== campusB) return campusA.localeCompare(campusB)
        const collegeA = colleges.find((c) => c.id === a.collegeId)?.name ?? ''
        const collegeB = colleges.find((c) => c.id === b.collegeId)?.name ?? ''
        if (collegeA !== collegeB) return collegeA.localeCompare(collegeB)
        return a.name.localeCompare(b.name)
      }),
    [departments, campuses, colleges],
  )

  const assignedCount = useMemo(
    () => Object.values(assignments).filter(Boolean).length,
    [assignments],
  )

  const handleSave = () => {
    const updated = applyDepartmentHeadAssignments(departments, assignments, people)
    onSave(updated)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      icon={<UserCog size={18} />}
      title="Manage Department Heads"
      description="Assign an instructor or staff member as head for each academic department. Selections are saved to local storage."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Head Assignments
          </Button>
        </>
      }
    >
      {departments.length === 0 ? (
        <p className="text-[13px] text-secondary-text font-medium py-6 text-center">
          No departments in the current view. Add departments first, then assign heads.
        </p>
      ) : people.filter((p) => p.role === 'Instructor' || p.role === 'Staff').length === 0 ? (
        <p className="text-[13px] text-secondary-text font-medium py-6 text-center">
          Add instructors or staff under People before assigning department heads.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 pb-1">
            <p className="text-[12.5px] text-secondary-text">
              {assignedCount} of {departments.length} department
              {departments.length === 1 ? '' : 's'} have a head assigned
            </p>
          </div>

          <div className="max-h-[420px] overflow-y-auto app-scroll pr-1 flex flex-col gap-2.5">
            {sortedDepartments.map((dept) => {
              const campus = campuses.find((c) => c.id === dept.campusId)
              const college = colleges.find((c) => c.id === dept.collegeId)
              const eligible = getEligibleDepartmentHeads(people, dept)
              const selectedId = assignments[dept.id] ?? ''
              const selectedPerson = people.find((p) => p.id === selectedId)

              return (
                <div
                  key={dept.id}
                  className={`rounded-xl border px-4 py-3.5 ${
                    selectedId
                      ? 'border-lemon-500/30 bg-lemon-500/[0.05]'
                      : 'border-divider/70 bg-white'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-[14px] font-extrabold text-navy-900">{dept.name}</h4>
                        {selectedId ? (
                          <StatusPill label="Head assigned" tone="success" />
                        ) : (
                          <StatusPill label="Vacant" tone="warning" />
                        )}
                      </div>
                      <p className="text-[11.5px] text-secondary-text mt-1">
                        {college?.name ?? 'College'} · {campus?.name ?? 'Campus'}
                        {campus?.code ? ` (${campus.code})` : ''}
                      </p>
                    </div>

                    <div className="w-full lg:w-[280px] shrink-0">
                      <SelectMenu
                        value={selectedId}
                        onChange={(value) =>
                          setAssignments((prev) => ({ ...prev, [dept.id]: value }))
                        }
                        placeholder="Select head…"
                        aria-label={`Head for ${dept.name}`}
                        options={[
                          { value: '', label: 'No head assigned' },
                          ...eligible.map((person) => ({
                            value: person.id,
                            label: person.name,
                            hint: `${person.role} · ${person.department || 'No department'}`,
                          })),
                        ]}
                      />
                    </div>
                  </div>

                  {selectedPerson ? (
                    <div className="mt-3 pt-3 border-t border-divider/50 flex items-center gap-2.5">
                      <Monogram label={selectedPerson.name} size="sm" />
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-semibold text-navy-900 truncate">
                          {selectedPerson.name}
                        </div>
                        <div className="text-[11px] text-secondary-text truncate">
                          {selectedPerson.email} · {selectedPerson.role}
                        </div>
                      </div>
                    </div>
                  ) : eligible.length === 0 ? (
                    <p className="mt-2 text-[11.5px] text-secondary-text italic">
                      No active instructors on this campus — add people first.
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Modal>
  )
}

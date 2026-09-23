/**
 * Automatic training assignment from job roles.
 *
 * A job role lists the training its holders must complete. This turns that list
 * into real assignments: every employee in the role gets a mandatory enrollment
 * with a due date, and a certification that has passed its recertification
 * interval is assigned again.
 *
 * Assignment is idempotent — running it twice creates nothing the second time —
 * so it is safe to call whenever a role changes or an employee joins it.
 */
import { useCallback, useMemo } from 'react'

import { useEnrollments } from '../../institution/hooks/useEnrollments'
import { usePeople } from '../../institution/hooks/usePeople'
import { useCourses } from '../../institution/hooks/useCourses'
import type { CourseEnrollment, PersonRow } from '../../institution/types'
import type { JobRole } from '../types'
import { useJobRoles } from './useJobRoles'
import {
  assignRequiredTrainingForRole,
  buildComplianceAlerts,
  buildEmployeeComplianceRows,
  employeesInRole,
} from '../utils/complianceUtils'

export interface AssignmentResult {
  /** How many enrollments were created. */
  created: number
  /** How many employees received at least one. */
  employees: number
}

export function useRequiredTraining() {
  const { people } = usePeople()
  const { courses } = useCourses()
  const { jobRoles } = useJobRoles()
  const { enrollments, setEnrollments } = useEnrollments()

  const activeEmployees = useMemo(
    () => people.filter((p) => p.role === 'Student' && p.status === 'active'),
    [people],
  )

  const complianceRows = useMemo(
    () => buildEmployeeComplianceRows(activeEmployees, enrollments, jobRoles),
    [activeEmployees, enrollments, jobRoles],
  )

  const alerts = useMemo(
    () => buildComplianceAlerts(activeEmployees, enrollments, jobRoles, courses),
    [activeEmployees, enrollments, jobRoles, courses],
  )

  /** What would be created, without writing anything. */
  const previewFor = useCallback(
    (targets: PersonRow[]): CourseEnrollment[] => {
      const rows: CourseEnrollment[] = []
      for (const person of targets) {
        const role = jobRoles.find((r) => r.id === person.jobRoleId)
        if (!role || role.status !== 'active') continue
        // Pass the rows queued so far, so two courses are not double-created.
        rows.push(
          ...assignRequiredTrainingForRole(person, role, courses, [...enrollments, ...rows]),
        )
      }
      return rows
    },
    [courses, enrollments, jobRoles],
  )

  const commit = useCallback(
    (rows: CourseEnrollment[]): AssignmentResult => {
      if (rows.length === 0) return { created: 0, employees: 0 }
      setEnrollments((prev) => {
        // Recertification replaces the expired round rather than piling up.
        const replaced = new Set(rows.map((r) => `${r.studentId}:${r.courseId}`))
        const kept = prev.filter((e) => !replaced.has(`${e.studentId}:${e.courseId}`))
        return [...rows, ...kept]
      })
      return { created: rows.length, employees: new Set(rows.map((r) => r.studentId)).size }
    },
    [setEnrollments],
  )

  /** Assign everything one employee owes for their current job role. */
  const assignForEmployee = useCallback(
    (person: PersonRow): AssignmentResult => commit(previewFor([person])),
    [commit, previewFor],
  )

  /** Assign for every active holder of a role — use after editing its training. */
  const assignForRole = useCallback(
    (role: JobRole): AssignmentResult =>
      commit(previewFor(employeesInRole(role.id, activeEmployees))),
    [activeEmployees, commit, previewFor],
  )

  /** Bring the whole organization up to date. */
  const assignAll = useCallback(
    (): AssignmentResult => commit(previewFor(activeEmployees)),
    [activeEmployees, commit, previewFor],
  )

  /** How many assignments are outstanding across the organization. */
  const pendingCount = useMemo(() => previewFor(activeEmployees).length, [
    activeEmployees,
    previewFor,
  ])

  return {
    jobRoles,
    activeEmployees,
    enrollments,
    complianceRows,
    alerts,
    pendingCount,
    previewFor,
    assignForEmployee,
    assignForRole,
    assignAll,
  }
}

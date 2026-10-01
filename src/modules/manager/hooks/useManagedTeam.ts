import { useMemo } from 'react'

import { useCertificates } from '../../institution/hooks/useCertificates'
import { useCourses } from '../../institution/hooks/useCourses'
import { useEnrollments } from '../../institution/hooks/useEnrollments'
import { usePeople } from '../../institution/hooks/usePeople'
import { useJobRoles } from '../../corporate/hooks/useJobRoles'
import { useTeams } from '../../corporate/hooks/useTeams'
import {
  buildComplianceAlerts,
  buildEmployeeComplianceRows,
  computeOrganizationComplianceRate,
} from '../../corporate/utils/complianceUtils'
import { getSessionPerson } from '../../../shared/storage/session'

/**
 * The teams this manager leads, their members and everything about their
 * training. The server only sends a manager their own team's records, so this
 * is also exactly what they are allowed to see.
 */
export function useManagedTeam() {
  const me = getSessionPerson()
  const { teams } = useTeams()
  const { people } = usePeople()
  const { enrollments } = useEnrollments()
  const { jobRoles } = useJobRoles()
  const { courses } = useCourses()
  const { certificates } = useCertificates()

  const myTeams = useMemo(() => teams.filter((t) => t.managerId === me?.id), [teams, me?.id])
  const teamIds = useMemo(() => new Set(myTeams.map((t) => t.id)), [myTeams])
  const members = useMemo(
    () =>
      people.filter(
        (p) => p.teamId && teamIds.has(p.teamId) && p.id !== me?.id && p.status !== 'suspended',
      ),
    [people, teamIds, me?.id],
  )
  const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members])
  const teamEnrollments = useMemo(
    () => enrollments.filter((e) => memberIds.has(e.studentId)),
    [enrollments, memberIds],
  )
  const rows = useMemo(
    () => buildEmployeeComplianceRows(members, teamEnrollments, jobRoles),
    [members, teamEnrollments, jobRoles],
  )
  const alerts = useMemo(
    () => buildComplianceAlerts(members, teamEnrollments, jobRoles, courses),
    [members, teamEnrollments, jobRoles, courses],
  )
  const teamCertificates = useMemo(
    () => certificates.filter((c) => memberIds.has(c.studentId)),
    [certificates, memberIds],
  )

  return {
    me,
    teams: myTeams,
    members,
    enrollments: teamEnrollments,
    rows,
    alerts,
    certificates: teamCertificates,
    courses,
    jobRoles,
    complianceRate: computeOrganizationComplianceRate(rows),
  }
}

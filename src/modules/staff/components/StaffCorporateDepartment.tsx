/**
 * Corporate Edition staff (HR / learning team) department view: the training
 * compliance of everyone in their department, instead of the University view of
 * programs, sections and GPA.
 */
import { useMemo } from 'react'
import { ShieldCheck, TriangleAlert, Users } from 'lucide-react'

import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { getSessionPerson } from '../../../shared/storage/session'
import { useJobRoles } from '../../corporate/hooks/useJobRoles'
import { COMPLIANCE_STATUS_LABEL, COMPLIANCE_STATUS_TONE } from '../../corporate/utils/complianceLabels'
import { buildEmployeeComplianceRows, computeOrganizationComplianceRate } from '../../corporate/utils/complianceUtils'
import { useEnrollments } from '../../institution/hooks/useEnrollments'
import { usePeople } from '../../institution/hooks/usePeople'

const STAT = 17

export function StaffCorporateDepartment() {
  const me = getSessionPerson()
  const { people } = usePeople()
  const { enrollments } = useEnrollments()
  const { jobRoles } = useJobRoles()

  const employees = useMemo(
    () =>
      people.filter(
        (p) =>
          p.role === 'Student' &&
          p.status === 'active' &&
          (me?.departmentId ? p.departmentId === me.departmentId : p.department === me?.department),
      ),
    [people, me?.departmentId, me?.department],
  )
  const rows = useMemo(() => buildEmployeeComplianceRows(employees, enrollments, jobRoles), [employees, enrollments, jobRoles])
  const overdue = rows.filter((r) => r.status === 'overdue').length

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader title={me?.department ?? 'My department'} subtitle="Training compliance for everyone in your department." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatBlock label="Employees" value={employees.length} icon={<Users size={STAT} />} />
        <StatBlock
          label="Compliance"
          value={`${computeOrganizationComplianceRate(rows)}%`}
          sub="Fully up to date"
          icon={<ShieldCheck size={STAT} />}
          iconBg="bg-success-bg text-success"
        />
        <StatBlock label="Overdue" value={overdue} sub="Employees with late training" icon={<TriangleAlert size={STAT} />} iconBg="bg-danger-bg text-danger" />
      </div>
      <GlassCard className="overflow-hidden p-0">
        <table className="w-full text-[13px]">
          <thead className="bg-navy-50/60 text-left text-[11px] uppercase tracking-wide text-secondary-text dark:bg-white/5">
            <tr>
              <th className="px-5 py-3 font-medium">Employee</th>
              <th className="px-5 py-3 font-medium">Job role</th>
              <th className="px-5 py-3 font-medium">Completed</th>
              <th className="px-5 py-3 font-medium">Overdue</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.employeeId} className="border-b border-divider last:border-0">
                <td className="px-5 py-3 font-semibold text-navy-900">{r.employeeName}</td>
                <td className="px-5 py-3 text-navy-900">{r.jobRoleTitle}</td>
                <td className="px-5 py-3 text-navy-900">
                  {r.completedTraining} / {r.requiredTraining}
                </td>
                <td className={`px-5 py-3 font-semibold ${r.overdueTraining ? 'text-danger' : 'text-navy-900'}`}>{r.overdueTraining}</td>
                <td className="px-5 py-3">
                  <StatusPill label={COMPLIANCE_STATUS_LABEL[r.status]} tone={COMPLIANCE_STATUS_TONE[r.status]} />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-secondary-text">
                  No employees are in your department yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </GlassCard>
    </div>
  )
}

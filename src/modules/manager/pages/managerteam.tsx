import { useMemo, useState } from 'react'
import { BellRing, ClipboardList, Eye, Loader2, Sparkles } from 'lucide-react'

import { Button } from '../../../shared/components/Button'
import { Modal } from '../../../shared/components/Modal'
import { Monogram } from '../../../shared/components/Monogram'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { AssignTrainingModal } from '../../corporate/components/AssignTrainingModal'
import { useRequiredTraining } from '../../corporate/hooks/useRequiredTraining'
import { COMPLIANCE_STATUS_LABEL, COMPLIANCE_STATUS_TONE } from '../../corporate/utils/complianceLabels'
import { isEnrollmentComplete, isEnrollmentOverdue } from '../../corporate/utils/complianceUtils'
import { useEnrollments } from '../../institution/hooks/useEnrollments'
import type { PersonRow } from '../../institution/types'
import { useRemind } from '../components/useRemind'
import { useManagedTeam } from '../hooks/useManagedTeam'

export function ManagerTeamPage() {
  const { notify } = useToast()
  const { me, members, rows, enrollments, courses, jobRoles } = useManagedTeam()
  const { previewFor } = useRequiredTraining()
  const { setEnrollments } = useEnrollments()
  const { remind, sendingId } = useRemind()
  const [query, setQuery] = useState('')
  const [assignFor, setAssignFor] = useState<string[] | null>(null)
  const [viewing, setViewing] = useState<PersonRow | null>(null)

  const rowById = useMemo(() => new Map(rows.map((r) => [r.employeeId, r])), [rows])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return members.filter((m) => !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
  }, [members, query])

  function assignRequired(person: PersonRow) {
    const created = previewFor([person])
    if (!created.length) {
      notify(`${person.name} already has everything their job role requires.`, 'info')
      return
    }
    setEnrollments((prev) => [...created, ...prev])
    notify(`Assigned ${created.length} required module${created.length === 1 ? '' : 's'} to ${person.name}.`)
  }

  const viewingEnrollments = viewing ? enrollments.filter((e) => e.studentId === viewing.id && e.status !== 'withdrawn') : []

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="My Team"
        subtitle="Each member's required training, what is late, and what is coming up."
        actions={
          <Button variant="primary" onClick={() => setAssignFor([])} disabled={!members.length}>
            <ClipboardList size={15} />
            Assign training
          </Button>
        }
      />

      <div className="flex justify-end">
        <SearchInput value={query} onChange={setQuery} placeholder="Search team members…" className="w-full sm:w-80" />
      </div>

      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-navy-50/60 text-left text-[11px] uppercase tracking-wide text-secondary-text dark:bg-white/5">
              <tr>
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Job role</th>
                <th className="px-5 py-3 font-medium">Compliance</th>
                <th className="px-5 py-3 font-medium">Overdue</th>
                <th className="px-5 py-3 font-medium">Due soon</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const row = rowById.get(m.id)
                return (
                  <tr key={m.id} className="border-b border-divider last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Monogram label={m.name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-navy-900">{m.name}</p>
                          <p className="truncate text-[12px] text-secondary-text">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-navy-900">{row?.jobRoleTitle ?? '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-navy-100 dark:bg-white/10">
                          <div className="h-full rounded-full bg-lemon-500" style={{ width: `${row?.compliancePercent ?? 0}%` }} />
                        </div>
                        <span className="font-semibold text-navy-900">{row?.compliancePercent ?? 0}%</span>
                        {row ? <StatusPill label={COMPLIANCE_STATUS_LABEL[row.status]} tone={COMPLIANCE_STATUS_TONE[row.status]} /> : null}
                      </div>
                    </td>
                    <td className={`px-5 py-3 font-semibold ${row?.overdueTraining ? 'text-danger' : 'text-navy-900'}`}>
                      {row?.overdueTraining ?? 0}
                    </td>
                    <td className="px-5 py-3 text-navy-900">{row?.dueSoonTraining ?? 0}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setViewing(m)} title="View training">
                          <Eye size={13} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => assignRequired(m)} title="Assign what their job role requires">
                          <Sparkles size={13} />
                          Required
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setAssignFor([m.id])}>
                          <ClipboardList size={13} />
                          Assign
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void remind(m.id)} disabled={sendingId === m.id}>
                          {sendingId === m.id ? <Loader2 size={13} className="animate-spin" /> : <BellRing size={13} />}
                          Remind
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-secondary-text">
                    {members.length ? 'No team members match your search.' : 'Your team has no members yet.'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {assignFor !== null ? (
        <AssignTrainingModal
          open
          employees={members}
          courses={courses}
          existing={enrollments}
          initialEmployeeIds={assignFor}
          assignedBy={me?.name ?? 'Manager'}
          onClose={() => setAssignFor(null)}
          onAssign={(created) => {
            setEnrollments((prev) => [...created, ...prev])
            setAssignFor(null)
            notify(`Assigned to ${created.length} team member${created.length === 1 ? '' : 's'}.`)
          }}
        />
      ) : null}

      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        size="lg"
        title={viewing ? `${viewing.name}'s training` : ''}
        description={viewing ? jobRoles.find((r) => r.id === viewing.jobRoleId)?.title ?? 'No job role' : undefined}
      >
        {viewingEnrollments.length === 0 ? (
          <p className="text-[13px] text-secondary-text">No training assigned yet.</p>
        ) : (
          <ul className="divide-y divide-divider">
            {viewingEnrollments.map((e) => {
              const done = isEnrollmentComplete(e)
              const late = isEnrollmentOverdue(e)
              return (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-navy-900">{e.courseTitle}</p>
                    <p className="text-[12px] text-secondary-text">
                      {e.dueDate ? `Due ${e.dueDate}` : 'No due date'} · {e.progress ?? 0}% complete
                      {e.completedOn ? ` · finished ${e.completedOn}` : ''}
                    </p>
                  </div>
                  <StatusPill
                    label={done ? 'Complete' : late ? 'Overdue' : 'In progress'}
                    tone={done ? 'success' : late ? 'danger' : 'info'}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </Modal>
    </div>
  )
}

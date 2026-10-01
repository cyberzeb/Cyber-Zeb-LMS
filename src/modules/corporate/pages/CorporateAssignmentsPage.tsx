/**
 * Corporate Edition training assignments: who has to do what, by when, and how
 * far they have got. Assignments come from job roles (automatically) or are
 * made by hand; each has a due date and counts towards compliance.
 */
import { useMemo, useState } from 'react'
import { BellRing, CalendarClock, CheckCircle2, ClipboardList, Loader2, Send, Sparkles, TriangleAlert, Undo2 } from 'lucide-react'

import { Button } from '../../../shared/components/Button'
import { Modal } from '../../../shared/components/Modal'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { apiErrorMessage } from '../../../shared/api/client'
import { runTrainingReminders } from '../../../shared/api/remindApi'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { getSessionPerson } from '../../../shared/storage/session'
import { useCourses } from '../../institution/hooks/useCourses'
import { useEnrollments } from '../../institution/hooks/useEnrollments'
import type { CourseEnrollment } from '../../institution/types'
import { useRemind } from '../../manager/components/useRemind'
import { AssignTrainingModal } from '../components/AssignTrainingModal'
import { useRequiredTraining } from '../hooks/useRequiredTraining'
import { useTeams } from '../hooks/useTeams'
import { downloadCsv } from '../utils/complianceLabels'
import { isEnrollmentComplete, isEnrollmentDueSoon, isEnrollmentOverdue } from '../utils/complianceUtils'

const STAT = 17

type AssignmentState = 'completed' | 'overdue' | 'due-soon' | 'in-progress' | 'not-started' | 'withdrawn'

function stateOf(e: CourseEnrollment): AssignmentState {
  if (e.status === 'withdrawn') return 'withdrawn'
  if (isEnrollmentComplete(e)) return 'completed'
  if (isEnrollmentOverdue(e)) return 'overdue'
  if (isEnrollmentDueSoon(e)) return 'due-soon'
  return (e.progress ?? 0) > 0 ? 'in-progress' : 'not-started'
}

const STATE_META: Record<AssignmentState, { label: string; tone: 'success' | 'danger' | 'warning' | 'info' | 'neutral' }> = {
  completed: { label: 'Completed', tone: 'success' },
  overdue: { label: 'Overdue', tone: 'danger' },
  'due-soon': { label: 'Due soon', tone: 'warning' },
  'in-progress': { label: 'In progress', tone: 'info' },
  'not-started': { label: 'Not started', tone: 'neutral' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
}

export function CorporateAssignmentsPage() {
  const { notify } = useToast()
  const me = getSessionPerson()
  const { enrollments, setEnrollments } = useEnrollments()
  const { courses } = useCourses()
  const { teams } = useTeams()
  const { activeEmployees, pendingCount, assignAll } = useRequiredTraining()
  const { remind, sendingId } = useRemind()

  const [query, setQuery] = useState('')
  const [stateFilter, setStateFilter] = useState('open')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [teamFilter, setTeamFilter] = useState('all')
  const [assignOpen, setAssignOpen] = useState(false)
  const [reminding, setReminding] = useState(false)
  const [dueEdit, setDueEdit] = useState<CourseEnrollment | null>(null)
  const [newDue, setNewDue] = useState('')

  const employeeById = useMemo(() => new Map(activeEmployees.map((p) => [p.id, p])), [activeEmployees])
  const withState = useMemo(() => enrollments.map((e) => ({ e, state: stateOf(e) })), [enrollments])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return withState
      .filter(({ e, state }) => {
        if (stateFilter === 'open' && (state === 'completed' || state === 'withdrawn')) return false
        if (stateFilter !== 'open' && stateFilter !== 'all' && state !== stateFilter) return false
        if (moduleFilter !== 'all' && e.courseId !== moduleFilter) return false
        if (teamFilter !== 'all' && employeeById.get(e.studentId)?.teamId !== teamFilter) return false
        return !q || e.studentName.toLowerCase().includes(q) || e.courseTitle.toLowerCase().includes(q) || e.courseCode.toLowerCase().includes(q)
      })
      .sort((a, b) => {
        const order: Record<AssignmentState, number> = { overdue: 0, 'due-soon': 1, 'not-started': 2, 'in-progress': 3, completed: 4, withdrawn: 5 }
        return order[a.state] - order[b.state] || (a.e.dueDate ?? '9').localeCompare(b.e.dueDate ?? '9')
      })
  }, [withState, query, stateFilter, moduleFilter, teamFilter, employeeById])

  const count = (s: AssignmentState) => withState.filter((x) => x.state === s).length
  const live = withState.filter((x) => x.state !== 'withdrawn')
  const completionRate = live.length ? Math.round((count('completed') / live.length) * 100) : 0

  function withdraw(e: CourseEnrollment) {
    setEnrollments((prev) => prev.map((x) => (x.id === e.id ? { ...x, status: 'withdrawn' } : x)))
    notify(`${e.courseTitle} withdrawn for ${e.studentName}.`, 'info')
  }

  function saveDue() {
    if (!dueEdit || !newDue) return
    setEnrollments((prev) => prev.map((x) => (x.id === dueEdit.id ? { ...x, dueDate: newDue } : x)))
    notify(`Due date for ${dueEdit.studentName} moved to ${newDue}.`)
    setDueEdit(null)
  }

  async function sendReminders() {
    setReminding(true)
    try {
      const { sent } = await runTrainingReminders()
      notify(sent ? `${sent} reminder email${sent === 1 ? '' : 's'} sent.` : 'Everyone has already been reminded today.', sent ? 'success' : 'info')
    } catch (err) {
      notify(apiErrorMessage(err) ?? 'Could not send reminders.', 'error')
    } finally {
      setReminding(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Training Assignments"
        subtitle="Required and assigned training, with due dates. Job roles assign theirs automatically."
        actions={
          <>
            <Button variant="secondary" onClick={() => void sendReminders()} disabled={reminding}>
              {reminding ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Send reminders now
            </Button>
            <Button
              variant="secondary"
              disabled={!pendingCount}
              onClick={() => {
                const r = assignAll()
                notify(`Assigned ${r.created} required module${r.created === 1 ? '' : 's'} to ${r.employees} employee${r.employees === 1 ? '' : 's'}.`)
              }}
              title="Assign everything job roles require that is not yet assigned"
            >
              <Sparkles size={16} />
              Assign required{pendingCount ? ` (${pendingCount})` : ''}
            </Button>
            <Button variant="primary" onClick={() => setAssignOpen(true)}>
              <ClipboardList size={16} />
              Assign training
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatBlock label="Assignments" value={live.length} sub={`${completionRate}% completed`} icon={<ClipboardList size={STAT} />} />
        <StatBlock label="Completed" value={count('completed')} icon={<CheckCircle2 size={STAT} />} iconBg="bg-success-bg text-success" />
        <StatBlock label="In progress" value={count('in-progress') + count('not-started')} sub={`${count('not-started')} not started`} icon={<CalendarClock size={STAT} />} iconBg="bg-info-bg text-info" />
        <StatBlock label="Due soon" value={count('due-soon')} sub="Within 14 days" icon={<CalendarClock size={STAT} />} iconBg="bg-warning-bg text-[#8A6D00]" />
        <StatBlock label="Overdue" value={count('overdue')} icon={<TriangleAlert size={STAT} />} iconBg="bg-danger-bg text-danger" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <SelectMenu
            value={stateFilter}
            onChange={setStateFilter}
            options={[
              { value: 'open', label: 'Open (not finished)' },
              { value: 'all', label: 'All assignments' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'due-soon', label: 'Due soon' },
              { value: 'not-started', label: 'Not started' },
              { value: 'in-progress', label: 'In progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'withdrawn', label: 'Withdrawn' },
            ]}
            aria-label="Status"
          />
          <SelectMenu value={moduleFilter} onChange={setModuleFilter} options={[{ value: 'all', label: 'All modules' }, ...courses.map((c) => ({ value: c.id, label: `${c.code} — ${c.title}` }))]} aria-label="Module" />
          <SelectMenu value={teamFilter} onChange={setTeamFilter} options={[{ value: 'all', label: 'All teams' }, ...teams.map((t) => ({ value: t.id, label: t.name }))]} aria-label="Team" />
          <span className="self-center text-[13px] font-semibold text-navy-700">{filtered.length} shown</span>
        </div>
        <div className="flex gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search employee or module…" className="lg:w-72" />
          <Button
            variant="secondary"
            disabled={!filtered.length}
            onClick={() =>
              downloadCsv(
                `training-assignments-${new Date().toISOString().slice(0, 10)}.csv`,
                filtered.map(({ e, state }) => ({
                  Employee: e.studentName,
                  Module: `${e.courseCode} — ${e.courseTitle}`,
                  Assigned: e.enrolledOn,
                  'Assigned by': e.assignedBy ?? '',
                  Due: e.dueDate ?? '',
                  'Progress %': e.progress ?? 0,
                  Completed: e.completedOn ?? '',
                  Status: STATE_META[state].label,
                })),
              )
            }
          >
            CSV
          </Button>
        </div>
      </div>

      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-navy-50/60 text-left text-[11px] uppercase tracking-wide text-secondary-text dark:bg-white/5">
              <tr>
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Training module</th>
                <th className="px-5 py-3 font-medium">Assigned</th>
                <th className="px-5 py-3 font-medium">Due</th>
                <th className="px-5 py-3 font-medium">Progress</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ e, state }) => (
                <tr key={e.id} className="border-b border-divider last:border-0">
                  <td className="px-5 py-3 font-semibold text-navy-900">{e.studentName}</td>
                  <td className="px-5 py-3">
                    <p className="text-navy-900">{e.courseTitle}</p>
                    <p className="text-[12px] text-secondary-text">
                      {e.courseCode}
                      {e.isMandatory ? ' · required' : ''}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-navy-900">{e.enrolledOn}</p>
                    <p className="text-[12px] text-secondary-text">{e.assignedBy ?? 'Admin'}</p>
                  </td>
                  <td className={`px-5 py-3 ${state === 'overdue' ? 'font-semibold text-danger' : 'text-navy-900'}`}>{e.dueDate ?? '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-navy-100 dark:bg-white/10">
                        <div className="h-full rounded-full bg-lemon-500" style={{ width: `${Math.min(100, e.progress ?? 0)}%` }} />
                      </div>
                      <span className="text-navy-900">{e.progress ?? 0}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill label={STATE_META[state].label} tone={STATE_META[state].tone} />
                  </td>
                  <td className="px-5 py-3">
                    {state !== 'completed' && state !== 'withdrawn' ? (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => void remind(e.studentId)} disabled={sendingId === e.studentId} title="Email a reminder">
                          {sendingId === e.studentId ? <Loader2 size={13} className="animate-spin" /> : <BellRing size={13} />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDueEdit(e)
                            setNewDue(e.dueDate ?? new Date().toISOString().slice(0, 10))
                          }}
                        >
                          Due date
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => withdraw(e)} title="Withdraw">
                          <Undo2 size={13} />
                        </Button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-secondary-text">
                    {enrollments.length ? 'No assignments match your filters.' : 'No training assigned yet. Use “Assign required” to start from job roles.'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {assignOpen ? (
        <AssignTrainingModal
          open
          employees={activeEmployees}
          courses={courses}
          existing={enrollments}
          assignedBy={me?.name ?? 'Learning admin'}
          onClose={() => setAssignOpen(false)}
          onAssign={(rows) => {
            setEnrollments((prev) => [...rows, ...prev])
            setAssignOpen(false)
            notify(`Assigned to ${rows.length} employee${rows.length === 1 ? '' : 's'}. They have been emailed.`)
          }}
        />
      ) : null}

      <Modal
        open={dueEdit !== null}
        onClose={() => setDueEdit(null)}
        title="Change due date"
        description={dueEdit ? `${dueEdit.courseTitle} for ${dueEdit.studentName}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDueEdit(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveDue} disabled={!newDue}>
              Save
            </Button>
          </>
        }
      >
        <input
          type="date"
          value={newDue}
          onChange={(ev) => setNewDue(ev.target.value)}
          className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900"
        />
      </Modal>
    </div>
  )
}

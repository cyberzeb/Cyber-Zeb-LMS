import { useEffect, useMemo, useState } from 'react'
import { MailPlus, Plus, Upload } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { Modal } from '../../../shared/components/Modal'
import { FormField } from '../../../shared/components/FormField'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { DepartmentSelectMenu } from '../../../shared/components/DepartmentSelectMenu'
import { useSyncCampusFilter } from '../hooks/useSyncCampusFilter'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { usePeople } from '../hooks/usePeople'
import { withAdminVerification } from '../utils/peopleVerification'
import { useCampusContext } from '../context/CampusContext'
import { DEFAULT_CAMPUS_ID } from '../data/orgSeedData'
import { migrateStudentRecord } from '../api/peopleApi'
import { isCorporateEdition } from '../../../shared/config/edition'
import { isValidEmail, normalizeEmail } from '../../../shared/utils/emailValidation'
import { StudentsTable } from '../components/StudentsTable'
import { StudentEditModal } from '../components/StudentEditModal'
import { StudentImportModal } from '../components/StudentImportModal'
import { usePeoplePageConfigForEdition, useHideCampusFiltersInEdition } from '../../../shared/config/useEditionPageCopy'
import { useTeams } from '../../corporate/hooks/useTeams'
import { useJobRoles } from '../../corporate/hooks/useJobRoles'
import { useEnrollments } from '../hooks/useEnrollments'
import { assignRequiredTrainingForRole } from '../../corporate/utils/complianceUtils'
import type { PersonRow } from '../types'

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function StudentsPage() {
  const { notify } = useToast()
  const corporateMode = isCorporateEdition()
  const config = usePeoplePageConfigForEdition('Student')
  const hideCampusFilters = useHideCampusFiltersInEdition()
  const { campuses, departments, activeCampuses, selectedCampusId } = useCampusContext()
  const { people, setPeople } = usePeople()
  const { teams } = useTeams()
  const { jobRoles } = useJobRoles()
  const { enrollments, setEnrollments } = useEnrollments()
  const [query, setQuery] = useState('')
  const [campusFilter, setCampusFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editStudent, setEditStudent] = useState<PersonRow | null>(null)
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    campusId: DEFAULT_CAMPUS_ID,
    departmentId: '',
    teamId: '',
    jobRoleId: '',
  })

  useEffect(() => {
    setPeople((prev) => prev.map((p) => migrateStudentRecord(p, departments)))
  }, [departments, setPeople])

  useSyncCampusFilter(selectedCampusId, setCampusFilter)

  useEffect(() => {
    setDepartmentFilter('all')
  }, [selectedCampusId])

  const students = useMemo(
    () => people.filter((p) => p.role === 'Student'),
    [people],
  )

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchesCampus = campusFilter === 'all' || s.campusId === campusFilter
      const matchesDepartment =
        departmentFilter === 'all' ||
        s.department === departments.find((d) => d.id === departmentFilter)?.name
      const q = query.trim().toLowerCase()
      const matchesQuery =
        q === '' ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q)
      return matchesCampus && matchesDepartment && matchesQuery
    })
  }, [students, campusFilter, departmentFilter, query, departments])

  const stats = useMemo(() => config.getStats(people), [people])

  const campusMenuOptions = useMemo(
    () => [
      { value: 'all', label: 'All campuses' },
      ...activeCampuses.map((c) => ({ value: c.id, label: c.name, hint: c.code })),
    ],
    [activeCampuses],
  )

  const inviteDepartments = useMemo(
    () => departments.filter((d) => d.campusId === inviteForm.campusId),
    [departments, inviteForm.campusId],
  )

  const inviteTeams = useMemo(
    () =>
      teams.filter(
        (team) => !inviteForm.departmentId || team.departmentId === inviteForm.departmentId,
      ),
    [teams, inviteForm.departmentId],
  )

  useEffect(() => {
    if (!inviteDepartments.some((d) => d.id === inviteForm.departmentId)) {
      setInviteForm((prev) => ({ ...prev, departmentId: inviteDepartments[0]?.id ?? '', teamId: '' }))
    }
  }, [inviteDepartments, inviteForm.departmentId])

  useEffect(() => {
    if (!inviteTeams.some((t) => t.id === inviteForm.teamId)) {
      setInviteForm((prev) => ({ ...prev, teamId: '' }))
    }
  }, [inviteTeams, inviteForm.teamId])

  const openInvite = () => {
    setInviteForm({
      name: '',
      email: '',
      campusId: campusFilter !== 'all' ? campusFilter : DEFAULT_CAMPUS_ID,
      departmentId: '',
      teamId: '',
      jobRoleId: '',
    })
    setInviteOpen(true)
  }

  const handleInvite = () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim() || !inviteForm.departmentId) {
      notify('Please complete all required fields.', 'error')
      return
    }
    if (!isValidEmail(inviteForm.email)) {
      notify('Enter a valid email address (e.g. name@horizonbank.et).', 'error')
      return
    }
    const dept = departments.find((d) => d.id === inviteForm.departmentId)
    if (!dept) return

    const newStudent = withAdminVerification({
      id: createId('user'),
      name: inviteForm.name.trim(),
      email: normalizeEmail(inviteForm.email),
      role: 'Student',
      department: dept.name,
      departmentId: dept.id,
      teamId: inviteForm.teamId || undefined,
      jobRoleId: inviteForm.jobRoleId || undefined,
      campusId: inviteForm.campusId,
      status: 'active',
      lastActive: 'Just added',
      initials: initialsFromName(inviteForm.name),
    })
    setPeople((prev) => [newStudent, ...prev])

    if (corporateMode && inviteForm.jobRoleId) {
      const role = jobRoles.find((r) => r.id === inviteForm.jobRoleId)
      if (role && role.requiredCourseIds.length > 0) {
        const assigned = assignRequiredTrainingForRole(newStudent, role, undefined, enrollments)
        if (assigned.length > 0) {
          setEnrollments((prev) => [...assigned, ...prev])
        }
      }
    }

    setInviteOpen(false)
    const role = inviteForm.jobRoleId
      ? jobRoles.find((r) => r.id === inviteForm.jobRoleId)
      : undefined
    notify(
      corporateMode
        ? role && role.requiredCourseIds.length > 0
          ? `${newStudent.name} added with job role “${role.title}”. Required training was assigned automatically.`
          : `${newStudent.name} added. Assign training under Training Assignments when ready.`
        : `${newStudent.name} added. Enroll them in courses under Admin → Enrollments.`,
    )
  }

  const handleDelete = (student: PersonRow) => {
    setPeople((prev) => prev.filter((p) => p.id !== student.id))
    notify(`${student.name} removed.`, 'info')
  }

  const handleSaved = (updated: PersonRow) => {
    setPeople((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    notify(`${updated.name} updated successfully.`)
  }

  const handleImported = (imported: PersonRow[], updated: PersonRow[]) => {
    setPeople((prev) => {
      const updatedById = new Map(updated.map((u) => [u.id, u]))
      const updatedByEmail = new Map(updated.map((u) => [u.email.toLowerCase(), u]))
      const next = prev.map(
        (p) => updatedById.get(p.id) ?? updatedByEmail.get(p.email.toLowerCase()) ?? p,
      )
      const existingEmails = new Set(next.map((p) => p.email.toLowerCase()))
      const additions = imported.filter((s) => !existingEmails.has(s.email.toLowerCase()))
      return [...additions, ...next]
    })
    notify(`Imported ${imported.length} student(s), updated ${updated.length}.`)
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        actions={
          <>
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <Upload size={15} />
              Import CSV
            </Button>
            <Button variant="primary" onClick={openInvite}>
              <Plus size={16} />
              {config.inviteLabel}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {stats.map((stat) => (
          <StatBlock
            key={stat.label}
            label={stat.label}
            value={typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
            sub={stat.sub}
            icon={stat.icon}
          />
        ))}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {!hideCampusFilters ? (
            <SelectMenu
              value={campusFilter}
              options={campusMenuOptions}
              onChange={(v) => {
                setCampusFilter(v)
                setDepartmentFilter('all')
              }}
              aria-label="Filter by campus"
              className="w-full sm:w-auto"
            />
          ) : null}
          <DepartmentSelectMenu
            value={departmentFilter}
            departments={departments}
            campuses={campuses}
            campusFilter={hideCampusFilters ? 'all' : campusFilter}
            onChange={setDepartmentFilter}
            className="w-full sm:w-auto"
          />
          <span className="text-[13px] font-semibold text-navy-700 whitespace-nowrap">
            {filtered.length} {config.title.toLowerCase()}
          </span>
        </div>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={config.searchPlaceholder}
          className="lg:w-80"
        />
      </div>

      {filtered.length > 0 ? (
        <StudentsTable
          students={filtered}
          campuses={campuses}
          onEdit={setEditStudent}
          onDelete={handleDelete}
        />
      ) : (
        <GlassCard className="p-10 text-center text-secondary-text text-[13.5px] font-medium">
          {config.emptyMessage}
        </GlassCard>
      )}

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        icon={<MailPlus size={18} />}
        title={config.inviteTitle}
        description={config.inviteDescription}
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleInvite} disabled={!inviteForm.departmentId}>
              Send Invite
            </Button>
          </>
        }
      >
        <FormField
          label="Full Name"
          value={inviteForm.name}
          onChange={(v) => setInviteForm({ ...inviteForm, name: v })}
          placeholder="e.g. Selam Girma"
        />
        <FormField
          label="Email Address"
          value={inviteForm.email}
          onChange={(v) => setInviteForm({ ...inviteForm, email: v })}
          placeholder={isCorporateEdition() ? 'e.g. dawit.bekele@horizonbank.et' : 'e.g. selam.girma@berana.edu'}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!hideCampusFilters ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-navy-900">Campus</span>
              <select
              value={inviteForm.campusId}
              onChange={(e) =>
                setInviteForm({ ...inviteForm, campusId: e.target.value, departmentId: '' })
              }
              className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25"
            >
              {activeCampuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </label>
          ) : null}
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-navy-900">Department</span>
            <select
              value={inviteForm.departmentId}
              onChange={(e) =>
                setInviteForm({ ...inviteForm, departmentId: e.target.value, teamId: '' })
              }
              className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25"
            >
              {inviteDepartments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {corporateMode ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-navy-900">Team</span>
              <select
                value={inviteForm.teamId}
                onChange={(e) => setInviteForm({ ...inviteForm, teamId: e.target.value })}
                className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25"
              >
                <option value="">No team</option>
                {inviteTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-navy-900">Job Role</span>
              <select
                value={inviteForm.jobRoleId}
                onChange={(e) => setInviteForm({ ...inviteForm, jobRoleId: e.target.value })}
                className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25"
              >
                <option value="">No job role</option>
                {jobRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title}
                  </option>
                ))}
              </select>
              {inviteForm.jobRoleId ? (
                <span className="text-[11px] text-secondary-text">
                  Required training for this role will be assigned automatically.
                </span>
              ) : null}
            </label>
          </div>
        ) : null}
      </Modal>

      <StudentEditModal
        open={editStudent !== null}
        student={editStudent}
        campuses={activeCampuses}
        departments={departments}
        onClose={() => setEditStudent(null)}
        onSaved={handleSaved}
      />

      <StudentImportModal
        open={importOpen}
        campuses={activeCampuses}
        departments={departments}
        existingPeople={people}
        onClose={() => setImportOpen(false)}
        onImported={handleImported}
      />
    </div>
  )
}

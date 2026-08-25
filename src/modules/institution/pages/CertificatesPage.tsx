import { useEffect, useMemo, useState } from 'react'
import { Award, BadgeCheck, Clock, Plus, ShieldOff } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { DepartmentSelectMenu } from '../../../shared/components/DepartmentSelectMenu'
import { Modal } from '../../../shared/components/Modal'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useCampusContext } from '../context/CampusContext'
import { useSyncCampusFilter } from '../hooks/useSyncCampusFilter'
import { useCertificates } from '../hooks/useCertificates'
import { usePeople } from '../hooks/usePeople'
import { useCourses } from '../hooks/useCourses'
import { certificateTemplates } from '../data/certificatesSeedData'
import { CertificatesTable } from '../components/CertificatesTable'
import { getEditionPageCopy } from '../../../shared/config/editionUi'
import { isCorporateEdition } from '../../../shared/config/edition'
import { CertificateDetailsModal } from '../components/CertificateDetailsModal'
import {
  CertificateIssueModal,
  type IssueCertificateForm,
} from '../components/CertificateIssueModal'
import type { CertificateRecord, CertificateStatus } from '../types'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'issued', label: 'Issued' },
  { value: 'pending', label: 'Pending' },
  { value: 'revoked', label: 'Revoked' },
]

const DATE_OPTIONS = [
  { value: 'all', label: 'All dates' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'last90', label: 'Last 90 days' },
  { value: 'thisYear', label: 'This year' },
]

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function matchesDateFilter(cert: CertificateRecord, filter: string): boolean {
  if (filter === 'all') return true
  const dateStr = cert.issueDate ?? cert.completionDate
  if (!dateStr) return false
  const date = new Date(dateStr)
  const now = new Date()
  if (filter === 'thisYear') return date.getFullYear() === now.getFullYear()
  const days = filter === 'last30' ? 30 : filter === 'last90' ? 90 : 0
  if (days === 0) return true
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return date >= cutoff
}

const emptyIssueForm = (): IssueCertificateForm => ({
  studentId: '',
  courseId: '',
  templateId: certificateTemplates[0]?.id ?? '',
  issueDate: todayIso(),
  expirationDate: '',
})

export function CertificatesPage() {
  const { notify } = useToast()
  const pageCopy = getEditionPageCopy('certificates')
  const corporate = isCorporateEdition()
  const { campuses, departments, activeCampuses, selectedCampusId } = useCampusContext()
  const { certificates, issueCertificate, revokeCertificate } = useCertificates()
  const { people } = usePeople()
  const { courses } = useCourses()

  const [query, setQuery] = useState('')
  const [campusFilter, setCampusFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  const [issueOpen, setIssueOpen] = useState(false)
  const [issueForm, setIssueForm] = useState<IssueCertificateForm>(emptyIssueForm)
  const [detailCert, setDetailCert] = useState<CertificateRecord | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<CertificateRecord | null>(null)

  useSyncCampusFilter(selectedCampusId, setCampusFilter)

  useEffect(() => {
    setDepartmentFilter('all')
  }, [selectedCampusId])

  const students = useMemo(
    () => people.filter((p) => p.role === 'Student' && p.status === 'active'),
    [people],
  )

  const certEnabledCourses = useMemo(
    () => courses.filter((c) => c.status !== 'archived' && c.certificateEnabled !== false),
    [courses],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return certificates.filter((cert) => {
      const matchesCampus = campusFilter === 'all' || cert.campusId === campusFilter
      const matchesDepartment =
        departmentFilter === 'all' ||
        cert.department === departments.find((d) => d.id === departmentFilter)?.name
      const matchesStatus =
        statusFilter === 'all' || cert.status === (statusFilter as CertificateStatus)
      const matchesCourse = courseFilter === 'all' || cert.courseId === courseFilter
      const matchesDate = matchesDateFilter(cert, dateFilter)
      const matchesQuery =
        q === '' ||
        cert.certificateId.toLowerCase().includes(q) ||
        cert.studentName.toLowerCase().includes(q) ||
        cert.courseTitle.toLowerCase().includes(q) ||
        cert.courseCode.toLowerCase().includes(q)
      return (
        matchesCampus &&
        matchesDepartment &&
        matchesStatus &&
        matchesCourse &&
        matchesDate &&
        matchesQuery
      )
    })
  }, [
    certificates,
    campusFilter,
    departmentFilter,
    statusFilter,
    courseFilter,
    dateFilter,
    query,
    departments,
  ])

  const stats = useMemo(() => {
    const scoped =
      campusFilter === 'all'
        ? certificates
        : certificates.filter((c) => c.campusId === campusFilter)
    return {
      total: scoped.length,
      issued: scoped.filter((c) => c.status === 'issued').length,
      pending: scoped.filter((c) => c.status === 'pending').length,
      revoked: scoped.filter((c) => c.status === 'revoked').length,
    }
  }, [certificates, campusFilter])

  const campusMenuOptions = useMemo(
    () => [
      { value: 'all', label: 'All campuses' },
      ...activeCampuses.map((c) => ({ value: c.id, label: c.name, hint: c.code })),
    ],
    [activeCampuses],
  )

  const courseMenuOptions = useMemo(
    () => [
      { value: 'all', label: 'All courses' },
      ...certEnabledCourses.map((c) => ({
        value: c.id,
        label: `${c.code} — ${c.title}`,
        hint: c.department,
      })),
    ],
    [certEnabledCourses],
  )

  const studentOptions = useMemo(
    () =>
      students.map((s) => ({
        value: s.id,
        label: s.name,
        hint: s.department,
      })),
    [students],
  )

  const courseOptions = useMemo(
    () =>
      certEnabledCourses.map((c) => ({
        value: c.id,
        label: `${c.code} — ${c.title}`,
        hint: c.department,
      })),
    [certEnabledCourses],
  )

  const openIssue = () => {
    setIssueForm({
      ...emptyIssueForm(),
      templateId: certificateTemplates[0]?.id ?? '',
    })
    setIssueOpen(true)
  }

  const handleIssue = () => {
    const student = students.find((s) => s.id === issueForm.studentId)
    const course = certEnabledCourses.find((c) => c.id === issueForm.courseId)
    const template = certificateTemplates.find((t) => t.id === issueForm.templateId)
    if (!student || !course || !template || !issueForm.issueDate) {
      notify('Please complete all required fields.', 'error')
      return
    }

    const duplicate = certificates.some(
      (c) =>
        c.studentId === student.id &&
        c.courseId === course.id &&
        c.status !== 'revoked',
    )
    if (duplicate) {
      notify('This student already has an active certificate for this course.', 'error')
      return
    }

    issueCertificate({
      studentId: student.id,
      studentName: student.name,
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      instructorId: course.instructorId,
      instructorName: course.instructor || 'Unassigned',
      department: course.department,
      campusId: student.campusId ?? 'c1',
      templateId: template.id,
      templateName: template.name,
      issueDate: issueForm.issueDate,
      expirationDate: issueForm.expirationDate || undefined,
      completionDate: issueForm.issueDate,
    })
    setIssueOpen(false)
    notify(`Certificate issued to ${student.name}.`)
  }

  const handleDownload = (cert: CertificateRecord) => {
    notify(`Downloading ${cert.certificateId}…`, 'info')
  }

  const confirmRevoke = () => {
    if (!revokeTarget) return
    revokeCertificate(revokeTarget.id)
    notify(`${revokeTarget.certificateId} has been revoked.`, 'info')
    if (detailCert?.id === revokeTarget.id) setDetailCert(null)
    setRevokeTarget(null)
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title={pageCopy.title}
        subtitle={pageCopy.subtitle}
        actions={
          <Button variant="primary" onClick={openIssue}>
            <Plus size={16} />
            {corporate ? 'Issue certification' : 'Issue Certificate'}
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatBlock
          label="Total Certificates"
          value={stats.total}
          icon={<Award size={17} />}
        />
        <StatBlock
          label="Issued"
          value={stats.issued}
          sub="Active credentials"
          icon={<BadgeCheck size={17} />}
          iconBg="bg-success-bg text-success"
        />
        <StatBlock
          label="Pending"
          value={stats.pending}
          sub="Awaiting issue"
          icon={<Clock size={17} />}
          iconBg="bg-warning-bg text-[#8A6D00]"
        />
        <StatBlock
          label="Revoked"
          value={stats.revoked}
          sub="No longer valid"
          icon={<ShieldOff size={17} />}
          iconBg="bg-danger-bg text-danger"
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
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
            <DepartmentSelectMenu
              value={departmentFilter}
              departments={departments}
              campuses={campuses}
              campusFilter={campusFilter}
              onChange={setDepartmentFilter}
              className="w-full sm:w-auto"
            />
            <SelectMenu
              value={statusFilter}
              options={STATUS_OPTIONS}
              onChange={setStatusFilter}
              aria-label="Filter by status"
              className="w-full sm:w-auto"
            />
            <SelectMenu
              value={courseFilter}
              options={courseMenuOptions}
              onChange={setCourseFilter}
              aria-label="Filter by course"
              className="w-full sm:w-auto"
            />
            <SelectMenu
              value={dateFilter}
              options={DATE_OPTIONS}
              onChange={setDateFilter}
              aria-label="Filter by date"
              className="w-full sm:w-auto"
            />
            <span className="text-[13px] font-semibold text-navy-700 whitespace-nowrap">
              {filtered.length} certificate{filtered.length === 1 ? '' : 's'}
            </span>
          </div>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by student, course, or certificate ID…"
            className="lg:w-80"
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <CertificatesTable
          certificates={filtered}
          onView={setDetailCert}
          onDownload={handleDownload}
          onRevoke={setRevokeTarget}
        />
      ) : (
        <GlassCard className="p-10 text-center text-secondary-text text-[13.5px] font-medium">
          No certificates match your filters.
        </GlassCard>
      )}

      <CertificateIssueModal
        open={issueOpen}
        form={issueForm}
        studentOptions={studentOptions}
        courseOptions={courseOptions}
        templates={certificateTemplates}
        onClose={() => setIssueOpen(false)}
        onChange={setIssueForm}
        onSubmit={handleIssue}
      />

      <CertificateDetailsModal
        open={detailCert !== null}
        certificate={detailCert}
        campuses={campuses}
        onClose={() => setDetailCert(null)}
        onDownload={handleDownload}
        onRevoke={(cert) => setRevokeTarget(cert)}
      />

      <Modal
        open={revokeTarget !== null}
        onClose={() => setRevokeTarget(null)}
        icon={<ShieldOff size={18} />}
        title="Revoke Certificate"
        description={
          revokeTarget
            ? `Revoke ${revokeTarget.certificateId} for ${revokeTarget.studentName}? This cannot be undone.`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setRevokeTarget(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmRevoke}>
              Revoke Certificate
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-secondary-text">
          Revoked certificates will no longer appear as valid credentials for the student and cannot
          be downloaded.
        </p>
      </Modal>
    </div>
  )
}

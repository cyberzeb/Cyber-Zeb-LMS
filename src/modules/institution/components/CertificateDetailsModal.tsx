import { Award, Download, ShieldOff } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { StatusPill } from '../../../shared/components/StatusPill'
import type { CampusRecord, CertificateRecord, CertificateStatus } from '../types'

const statusConfig: Record<
  CertificateStatus,
  { label: string; tone: 'success' | 'warning' | 'danger' }
> = {
  issued: { label: 'Issued', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  revoked: { label: 'Revoked', tone: 'danger' },
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface DetailRowProps {
  label: string
  value: string
  mono?: boolean
}

function DetailRow({ label, value, mono }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-secondary-text">
        {label}
      </span>
      <span className={`text-[13.5px] font-medium text-navy-900 ${mono ? 'font-mono text-[12px]' : ''}`}>
        {value}
      </span>
    </div>
  )
}

interface CertificateDetailsModalProps {
  open: boolean
  certificate: CertificateRecord | null
  campuses: CampusRecord[]
  onClose: () => void
  onDownload: (cert: CertificateRecord) => void
  onRevoke: (cert: CertificateRecord) => void
}

export function CertificateDetailsModal({
  open,
  certificate,
  campuses,
  onClose,
  onDownload,
  onRevoke,
}: CertificateDetailsModalProps) {
  if (!certificate) return null

  const campusName = campuses.find((c) => c.id === certificate.campusId)?.name ?? 'Unknown campus'
  const status = statusConfig[certificate.status]
  const canDownload = certificate.status === 'issued'
  const canRevoke = certificate.status === 'issued'

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={<Award size={18} />}
      title="Certificate Details"
      description={`${certificate.certificateId} · ${certificate.studentName}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {canRevoke ? (
            <Button variant="secondary" onClick={() => onRevoke(certificate)}>
              <ShieldOff size={15} />
              Revoke
            </Button>
          ) : null}
          {canDownload ? (
            <Button variant="primary" onClick={() => onDownload(certificate)}>
              <Download size={15} />
              Download
            </Button>
          ) : null}
        </>
      }
    >
      <div className="mb-2">
        <StatusPill label={status.label} tone={status.tone} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DetailRow label="Certificate ID" value={certificate.certificateId} mono />
        <DetailRow label="Student" value={certificate.studentName} />
        <DetailRow
          label="Course"
          value={`${certificate.courseCode} — ${certificate.courseTitle}`}
        />
        <DetailRow label="Instructor" value={certificate.instructorName} />
        <DetailRow label="Department" value={certificate.department} />
        <DetailRow label="Campus" value={campusName} />
        <DetailRow label="Completion date" value={formatDate(certificate.completionDate)} />
        <DetailRow label="Issue date" value={formatDate(certificate.issueDate)} />
        <DetailRow label="Template" value={certificate.templateName} />
        {certificate.expirationDate ? (
          <DetailRow label="Expiration date" value={formatDate(certificate.expirationDate)} />
        ) : null}
        {certificate.revokedAt ? (
          <DetailRow label="Revoked on" value={formatDate(certificate.revokedAt)} />
        ) : null}
      </div>
    </Modal>
  )
}

import { Award, Download, Loader2, ShieldOff } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { StatusPill } from '../../../shared/components/StatusPill'
import type { CampusRecord, CertificateRecord, CertificateStatus } from '../types'
import { CertificateArt } from '../certificates/CertificateArt'
import { certificateDataFrom } from '../certificates/useCertificateTemplates'
import type { CertificateTemplateDesign } from '../certificates/templateModel'

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
  template: CertificateTemplateDesign
  downloading?: boolean
  onClose: () => void
  onDownload: (cert: CertificateRecord) => void
  onRevoke: (cert: CertificateRecord) => void
}

export function CertificateDetailsModal({
  open,
  certificate,
  campuses,
  template,
  downloading,
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
      size="xl"
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
            <Button variant="primary" onClick={() => onDownload(certificate)} disabled={downloading}>
              {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              Download PDF
            </Button>
          ) : null}
        </>
      }
    >
      <div className="relative shrink-0 overflow-hidden rounded-xl bg-canvas p-3">
        <div className={`mx-auto shadow-md ring-1 ring-black/5 ${template.orientation === 'portrait' ? 'max-w-[320px]' : ''}`}>
          <CertificateArt template={template} data={certificateDataFrom(certificate)} uid="details" className="block h-auto w-full" />
        </div>
        {certificate.status === 'revoked' ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="-rotate-12 rounded-lg border-4 border-danger px-6 py-2 text-[32px] font-black tracking-[0.2em] text-danger bg-white/80 dark:bg-black/60">
              REVOKED
            </span>
          </span>
        ) : null}
      </div>
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

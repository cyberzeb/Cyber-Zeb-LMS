import { Download, Eye, ShieldOff } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { Button } from '../../../shared/components/Button'
import { StatusPill } from '../../../shared/components/StatusPill'
import type { CertificateRecord, CertificateStatus } from '../types'

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

interface CertificatesTableProps {
  certificates: CertificateRecord[]
  onView: (cert: CertificateRecord) => void
  onDownload: (cert: CertificateRecord) => void
  onRevoke: (cert: CertificateRecord) => void
}

export function CertificatesTable({
  certificates,
  onView,
  onDownload,
  onRevoke,
}: CertificatesTableProps) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="px-5 py-4 border-b border-divider/60">
        <h3 className="text-sm font-semibold text-navy-900">
          All certificates ({certificates.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-secondary-text border-b border-divider/60">
              <th className="px-5 py-3 font-medium">Certificate ID</th>
              <th className="px-5 py-3 font-medium">Student</th>
              <th className="px-5 py-3 font-medium">Course</th>
              <th className="px-5 py-3 font-medium">Instructor</th>
              <th className="px-5 py-3 font-medium">Issue Date</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {certificates.map((cert) => {
              const status = statusConfig[cert.status]
              const canDownload = cert.status === 'issued'
              const canRevoke = cert.status === 'issued'

              return (
                <tr key={cert.id} className="border-b border-divider/60 last:border-0">
                  <td className="px-5 py-3">
                    <span className="font-mono text-[12px] text-navy-700">{cert.certificateId}</span>
                  </td>
                  <td className="px-5 py-3 font-medium text-navy-900">{cert.studentName}</td>
                  <td className="px-5 py-3">
                    <div className="text-navy-900">{cert.courseCode}</div>
                    <div className="text-xs text-secondary-text">{cert.courseTitle}</div>
                  </td>
                  <td className="px-5 py-3 text-navy-700">{cert.instructorName}</td>
                  <td className="px-5 py-3 text-navy-700">{formatDate(cert.issueDate)}</td>
                  <td className="px-5 py-3">
                    <StatusPill label={status.label} tone={status.tone} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => onView(cert)}>
                        <Eye size={14} />
                        View
                      </Button>
                      {canDownload ? (
                        <Button variant="ghost" size="sm" onClick={() => onDownload(cert)}>
                          <Download size={14} />
                          Download
                        </Button>
                      ) : null}
                      {canRevoke ? (
                        <Button variant="ghost" size="sm" onClick={() => onRevoke(cert)}>
                          <ShieldOff size={14} />
                          Revoke
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}

import { useMemo, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { downloadCertificatePdf } from '../../institution/certificates/certificatePdf'
import { certificateDataFrom, useCertificateTemplates } from '../../institution/certificates/useCertificateTemplates'
import type { CertificateRecord } from '../../institution/types'
import { useManagedTeam } from '../hooks/useManagedTeam'

function validity(cert: CertificateRecord, today: string): { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' } {
  if (cert.status === 'revoked') return { label: 'Revoked', tone: 'danger' }
  if (cert.status === 'pending') return { label: 'Pending approval', tone: 'neutral' }
  if (!cert.expirationDate) return { label: 'Valid', tone: 'success' }
  const days = Math.round((Date.parse(cert.expirationDate) - Date.parse(today)) / 86_400_000)
  if (days < 0) return { label: 'Expired', tone: 'danger' }
  if (days <= 30) return { label: `Expires in ${days} days`, tone: 'warning' }
  return { label: 'Valid', tone: 'success' }
}

export function ManagerCertificationsPage() {
  const { notify } = useToast()
  const { certificates } = useManagedTeam()
  const { templateFor } = useCertificateTemplates()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const today = new Date().toISOString().slice(0, 10)

  const sorted = useMemo(
    () =>
      [...certificates].sort((a, b) =>
        (a.expirationDate ?? '9999').localeCompare(b.expirationDate ?? '9999') || a.studentName.localeCompare(b.studentName),
      ),
    [certificates],
  )

  async function download(cert: CertificateRecord) {
    setDownloadingId(cert.id)
    try {
      await downloadCertificatePdf(templateFor(cert.templateId), certificateDataFrom(cert))
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not create the PDF.', 'error')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader title="Certifications" subtitle="Your team's certifications and when they need renewing." />
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-navy-50/60 text-left text-[11px] uppercase tracking-wide text-secondary-text dark:bg-white/5">
              <tr>
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Training</th>
                <th className="px-5 py-3 font-medium">Issued</th>
                <th className="px-5 py-3 font-medium">Expires</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const v = validity(c, today)
                return (
                  <tr key={c.id} className="border-b border-divider last:border-0">
                    <td className="px-5 py-3 font-semibold text-navy-900">{c.studentName}</td>
                    <td className="px-5 py-3 text-navy-900">
                      {c.courseCode} — {c.courseTitle}
                    </td>
                    <td className="px-5 py-3 text-secondary-text">{c.issueDate ?? '—'}</td>
                    <td className="px-5 py-3 text-secondary-text">{c.expirationDate ?? 'Does not expire'}</td>
                    <td className="px-5 py-3">
                      <StatusPill label={v.label} tone={v.tone} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      {c.status === 'issued' ? (
                        <Button variant="ghost" size="sm" onClick={() => void download(c)} disabled={downloadingId === c.id}>
                          {downloadingId === c.id ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                          PDF
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-secondary-text">
                    No certifications yet. They appear here as your team completes training.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}

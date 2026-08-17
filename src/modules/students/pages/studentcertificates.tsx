import { useMemo, useState } from 'react'
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  ClipboardCopy,
  Download,
  ExternalLink,
  Hourglass,
  QrCode,
  Share2,
  ShieldCheck,
  ShieldOff,
  X,
} from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { Modal } from '../../../shared/components/Modal'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StudentPageError, StudentPageLoading } from '../components/StudentPageStates'
import { useStudentDashboard } from '../hooks/useStudentDashboard'
import type { CertificateItem, CertificatePendingReason } from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = ['All', 'Issued', 'Pending']

const PENDING_REASON_LABEL: Record<CertificatePendingReason, string> = {
  'awaiting-completion': 'Awaiting course completion',
  'awaiting-instructor-approval': 'Awaiting instructor approval',
  'awaiting-admin-approval': 'Awaiting admin approval',
}

const PENDING_REASON_TONE: Record<CertificatePendingReason, string> = {
  'awaiting-completion': 'text-info bg-info-bg border-info/20',
  'awaiting-instructor-approval': 'text-[#8A6D00] bg-warning-bg border-warning/30',
  'awaiting-admin-approval': 'text-[#8A6D00] bg-warning-bg border-warning/30',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a verification URL that could be used for sharing / QR code */
function buildVerificationUrl(credentialId: string): string {
  return `${window.location.origin}/verify/${encodeURIComponent(credentialId)}`
}

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) return navigator.clipboard.writeText(text)
  // Fallback for environments without clipboard API
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  document.body.removeChild(ta)
  return Promise.resolve()
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Row inside the details modal */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-2.5 border-b border-divider/60 last:border-0">
      <span className="text-[11px] font-bold uppercase tracking-wider text-secondary-text sm:w-40 shrink-0">
        {label}
      </span>
      <span className="text-[13px] font-medium text-navy-900 break-all">{value}</span>
    </div>
  )
}

/** QR-code placeholder panel shown inside the modal */
function QrPanel({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    void copyToClipboard(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="rounded-xl border border-divider bg-navy-50/50 p-4 flex flex-col sm:flex-row items-center gap-4">
      {/* QR placeholder — a real implementation would use a library like qrcode.react */}
      <div className="w-24 h-24 rounded-lg bg-white border border-divider flex flex-col items-center justify-center shrink-0 text-navy-300 gap-1">
        <QrCode size={36} />
        <span className="text-[9px] font-semibold text-secondary-text text-center leading-tight px-1">
          QR Code
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-navy-900">Verification link</p>
        <p className="mt-1 text-[11px] text-secondary-text break-all font-mono leading-snug">{url}</p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-2.5"
          onClick={handleCopy}
          aria-label="Copy verification link"
        >
          {copied ? <CheckCircle2 size={13} className="text-success" /> : <ClipboardCopy size={13} />}
          {copied ? 'Copied!' : 'Copy link'}
        </Button>
      </div>
    </div>
  )
}

// ─── Details Modal ────────────────────────────────────────────────────────────

interface CertDetailsModalProps {
  cert: CertificateItem | null
  open: boolean
  onClose: () => void
}

function CertDetailsModal({ cert, open, onClose }: CertDetailsModalProps) {
  const [shareTooltip, setShareTooltip] = useState(false)

  if (!cert) return null

  const verifyUrl = buildVerificationUrl(cert.credentialId)
  const isIssued = cert.status === 'issued'

  const handleShare = () => {
    if (navigator.share) {
      void navigator.share({
        title: cert.title,
        text: `Check out my certificate: ${cert.title} — ${cert.course}`,
        url: verifyUrl,
      })
    } else {
      void copyToClipboard(verifyUrl).then(() => {
        setShareTooltip(true)
        setTimeout(() => setShareTooltip(false), 2000)
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Certificate Details"
      description={cert.title}
      icon={<Award size={18} />}
      size="lg"
      footer={
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={13} />
            Close
          </Button>
          <div className="relative">
            <Button variant="secondary" size="sm" onClick={handleShare}>
              <Share2 size={13} />
              {shareTooltip ? 'Link copied!' : 'Share'}
            </Button>
          </div>
          {isIssued && (
            <Button variant="primary" size="sm">
              <Download size={13} />
              Download PDF
            </Button>
          )}
        </div>
      }
    >
      {/* Certificate banner */}
      <div className="relative rounded-xl overflow-hidden p-0">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900" />
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-lemon-500/15 blur-3xl" />
        <div className="relative p-5 flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              isIssued ? 'bg-lemon-500 text-navy-900' : 'bg-navy-700 text-navy-300'
            }`}
          >
            <Award size={28} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-lemon-400">
              {isIssued ? 'Certificate of Completion' : 'Certificate in Progress'}
            </p>
            <h3 className="mt-1 text-[17px] font-bold text-white leading-tight">{cert.title}</h3>
            <p className="mt-1 text-[12px] text-navy-200">{cert.course}</p>
          </div>
        </div>
      </div>

      {/* Verification status badge */}
      <div
        className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 border ${
          isIssued
            ? 'bg-success-bg border-success/25 text-success'
            : 'bg-warning-bg border-warning/30 text-[#8A6D00]'
        }`}
      >
        {isIssued ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}
        <span className="text-[12.5px] font-semibold">
          {isIssued ? 'Verified — This credential is authentic and issued.' : 'Not yet issued — verification unavailable until issued.'}
        </span>
      </div>

      {/* Detail rows */}
      <GlassCard className="px-4 py-1 divide-y divide-divider/60">
        {cert.institution && <DetailRow label="Institution" value={cert.institution} />}
        <DetailRow label="Course" value={cert.course} />
        {cert.instructorName && <DetailRow label="Instructor" value={cert.instructorName} />}
        {cert.department && <DetailRow label="Department" value={cert.department} />}
        {cert.completionDate && <DetailRow label="Completion date" value={cert.completionDate} />}
        <DetailRow label="Issue date" value={isIssued ? cert.issuedAt : '—'} />
        <DetailRow label="Certificate ID" value={cert.credentialId} />
        <DetailRow
          label="Status"
          value={
            isIssued
              ? 'Issued'
              : cert.pendingReason
                ? PENDING_REASON_LABEL[cert.pendingReason]
                : 'In progress'
          }
        />
      </GlassCard>

      {/* Verification QR / link — only for issued certs */}
      {isIssued && <QrPanel url={verifyUrl} />}
    </Modal>
  )
}

// ─── Certificate Card ─────────────────────────────────────────────────────────

interface CertCardProps {
  cert: CertificateItem
  onView: (cert: CertificateItem) => void
}

function CertCard({ cert, onView }: CertCardProps) {
  const [copied, setCopied] = useState(false)
  const isIssued = cert.status === 'issued'
  const verifyUrl = buildVerificationUrl(cert.credentialId)

  const handleCopyLink = () => {
    void copyToClipboard(verifyUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleShare = () => {
    if (navigator.share) {
      void navigator.share({
        title: cert.title,
        text: `${cert.title} — ${cert.course}`,
        url: verifyUrl,
      })
    } else {
      handleCopyLink()
    }
  }

  return (
    <GlassCard
      className={`p-0 overflow-hidden hover:shadow-md transition-shadow border-l-4 ${
        isIssued
          ? 'border-l-success bg-gradient-to-r from-success-bg/40 to-white'
          : 'border-l-info bg-gradient-to-r from-info-bg/40 to-white'
      }`}
    >
      <div className="p-5">
        {/* Top row: icon + meta */}
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isIssued ? 'bg-success text-white' : 'bg-info text-white'
            }`}
          >
            <Award size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <StatusPill
              label={isIssued ? 'Issued' : 'In progress'}
              tone={isIssued ? 'success' : 'info'}
            />
            <h3 className="mt-1.5 text-[15px] font-bold text-navy-900 leading-snug">
              {cert.title}
            </h3>
            <p className="mt-1 text-[12px] text-secondary-text leading-snug">{cert.course}</p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* Issue date */}
              <span className="text-[11px] text-secondary-text">
                {isIssued ? `Issued ${cert.issuedAt}` : cert.issuedAt}
              </span>
              {cert.completionDate && (
                <>
                  <span className="text-divider">·</span>
                  <span className="text-[11px] text-secondary-text">
                    Completed {cert.completionDate}
                  </span>
                </>
              )}
            </div>

            {/* Credential ID badge */}
            <span className="mt-2 inline-block rounded-md bg-navy-50 px-2 py-1 text-[10.5px] font-mono text-navy-600">
              {cert.credentialId}
            </span>
          </div>
        </div>

        {/* Pending reason banner */}
        {!isIssued && cert.pendingReason && (
          <div
            className={`mt-4 rounded-lg border px-3 py-2 text-[11.5px] font-semibold ${
              PENDING_REASON_TONE[cert.pendingReason]
            }`}
          >
            {PENDING_REASON_LABEL[cert.pendingReason]}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => onView(cert)}>
            <ExternalLink size={13} />
            View
          </Button>

          {isIssued && (
            <>
              <Button variant="primary" size="sm">
                <Download size={13} />
                Download PDF
              </Button>

              <Button variant="secondary" size="sm" onClick={handleShare}>
                <Share2 size={13} />
                Share
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyLink}
                aria-label="Copy verification link"
              >
                {copied ? (
                  <CheckCircle2 size={13} className="text-success" />
                ) : (
                  <ClipboardCopy size={13} />
                )}
                {copied ? 'Copied!' : 'Copy link'}
              </Button>
            </>
          )}
        </div>
      </div>
    </GlassCard>
  )
}

// ─── Pending Section ──────────────────────────────────────────────────────────

function PendingSection({
  certs,
  onView,
}: {
  certs: CertificateItem[]
  onView: (cert: CertificateItem) => void
}) {
  if (certs.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Hourglass size={15} className="text-info" />
        <h2 className="text-[14px] font-bold text-navy-900">Pending Certificates</h2>
        <span className="ml-auto text-[12px] text-secondary-text">
          {certs.length} pending
        </span>
      </div>

      {certs.map((cert) => (
        <GlassCard
          key={cert.id}
          className="p-0 overflow-hidden border-l-4 border-l-info bg-gradient-to-r from-info-bg/40 to-white"
        >
          <div className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 text-info flex items-center justify-center shrink-0">
              <Hourglass size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-bold text-navy-900 leading-snug">{cert.title}</h3>
              <p className="mt-0.5 text-[12px] text-secondary-text">{cert.course}</p>
              {cert.pendingReason && (
                <div
                  className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
                    PENDING_REASON_TONE[cert.pendingReason]
                  }`}
                >
                  {PENDING_REASON_LABEL[cert.pendingReason]}
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => onView(cert)}>
              <ExternalLink size={13} />
              Details
            </Button>
          </div>
        </GlassCard>
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: string }) {
  const messages: Record<string, { title: string; sub: string }> = {
    All: {
      title: 'No certificates yet',
      sub: 'Complete a course to earn your first credential.',
    },
    Issued: {
      title: 'No issued certificates',
      sub: 'Certificates will appear here once they are issued.',
    },
    Pending: {
      title: 'No pending certificates',
      sub: "You're all caught up — nothing waiting for approval.",
    },
  }
  const msg = messages[tab] ?? messages['All']!
  return (
    <GlassCard className="p-10 text-center">
      <Award size={32} className="mx-auto text-navy-300 mb-3" />
      <p className="text-[14px] font-semibold text-navy-900">{msg.title}</p>
      <p className="mt-1 text-[12px] text-secondary-text">{msg.sub}</p>
    </GlassCard>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function StudentCertificatesPage() {
  const { data, isLoading, isError } = useStudentDashboard()
  const [activeTab, setActiveTab] = useState('All')
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null)

  const stats = useMemo(() => {
    if (!data) return { issued: 0, pending: 0 }
    return {
      issued: data.certificates.filter((c) => c.status === 'issued').length,
      pending: data.certificates.filter((c) => c.status === 'in-progress').length,
    }
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return []
    if (activeTab === 'Issued') return data.certificates.filter((c) => c.status === 'issued')
    if (activeTab === 'Pending') return data.certificates.filter((c) => c.status === 'in-progress')
    return data.certificates
  }, [data, activeTab])

  const latestIssued = useMemo(
    () => data?.certificates.find((c) => c.status === 'issued'),
    [data],
  )

  const pendingCerts = useMemo(
    () => data?.certificates.filter((c) => c.status === 'in-progress') ?? [],
    [data],
  )

  if (isLoading) return <StudentPageLoading />
  if (isError || !data) return <StudentPageError message="Failed to load certificates." />

  return (
    <>
      <div className="flex flex-col gap-6 md:gap-8">
        {/* ── Header ── */}
        <PageHeader
          title="My Certificates"
          subtitle="View and manage the certificates you have earned."
        />

        {/* ── Featured banner — latest issued cert ── */}
        {latestIssued ? (
          <GlassCard className="relative overflow-hidden p-0">
            <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900" />
            <div className="absolute right-0 top-0 w-56 h-56 rounded-full bg-lemon-500/15 blur-3xl" />
            <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-lemon-500 text-navy-900 flex items-center justify-center shrink-0 shadow-lg">
                <Award size={32} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-lemon-400">
                  Latest credential
                </div>
                <h2 className="mt-2 text-[20px] md:text-[22px] font-bold text-white leading-tight">
                  {latestIssued.title}
                </h2>
                <p className="mt-1.5 text-[13px] text-navy-200">
                  {latestIssued.course}
                </p>
                <p className="mt-1 text-[11px] font-mono text-navy-300">
                  {latestIssued.credentialId} · Issued {latestIssued.issuedAt}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                  onClick={() => setSelectedCert(latestIssued)}
                >
                  <ExternalLink size={13} />
                  View
                </Button>
                <Button variant="primary">
                  <Download size={15} />
                  Download PDF
                </Button>
              </div>
            </div>
          </GlassCard>
        ) : null}

        {/* ── Summary stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatBlock
            label="Certificates Earned"
            value={stats.issued}
            sub="Ready to download"
            icon={<BadgeCheck size={17} />}
            iconBg="bg-success-bg text-success"
          />
          <StatBlock
            label="Pending Certificates"
            value={stats.pending}
            sub="Awaiting issue"
            icon={<Hourglass size={17} />}
            iconBg="bg-info-bg text-info"
          />
          <StatBlock
            label="Verified"
            value={stats.issued}
            sub="Blockchain-backed IDs"
            icon={<ShieldCheck size={17} />}
            iconBg="bg-lemon-50 text-lemon-900"
          />
        </div>

        {/* ── Filter + count ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <FilterTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
          <span className="text-[12px] text-secondary-text">
            {filtered.length} credential{filtered.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* ── Certificate cards ── */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((cert) => (
              <CertCard key={cert.id} cert={cert} onView={setSelectedCert} />
            ))}
          </div>
        ) : (
          <EmptyState tab={activeTab} />
        )}

        {/* ── Pending section (always visible when "All" tab is active and there are pending certs) ── */}
        {activeTab === 'All' && pendingCerts.length > 0 && (
          <PendingSection certs={pendingCerts} onView={setSelectedCert} />
        )}
      </div>

      {/* ── Details Modal ── */}
      <CertDetailsModal
        cert={selectedCert}
        open={selectedCert !== null}
        onClose={() => setSelectedCert(null)}
      />
    </>
  )
}

export default StudentCertificatesPage

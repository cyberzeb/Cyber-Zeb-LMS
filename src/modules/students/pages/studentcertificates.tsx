import { useMemo, useState } from 'react'
import { Award, BadgeCheck, Download, Hourglass, ShieldCheck } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StudentPageError, StudentPageLoading } from '../components/StudentPageStates'
import { useStudentDashboard } from '../hooks/useStudentDashboard'
import type { CertificateItem } from '../types'

const tabs = ['All', 'Issued', 'In progress']

const statusTone: Record<CertificateItem['status'], 'success' | 'info'> = {
  issued: 'success',
  'in-progress': 'info',
}

const statusLabel: Record<CertificateItem['status'], string> = {
  issued: 'Issued',
  'in-progress': 'In progress',
}

export function StudentCertificatesPage() {
  const { data, isLoading, isError } = useStudentDashboard()
  const [activeTab, setActiveTab] = useState('All')

  const filtered = useMemo(() => {
    if (!data) return []
    if (activeTab === 'Issued') return data.certificates.filter((c) => c.status === 'issued')
    if (activeTab === 'In progress') return data.certificates.filter((c) => c.status === 'in-progress')
    return data.certificates
  }, [data, activeTab])

  const stats = useMemo(() => {
    if (!data) return { issued: 0, inProgress: 0 }
    return {
      issued: data.certificates.filter((c) => c.status === 'issued').length,
      inProgress: data.certificates.filter((c) => c.status === 'in-progress').length,
    }
  }, [data])

  if (isLoading) return <StudentPageLoading />
  if (isError || !data) return <StudentPageError message="Failed to load certificates." />

  const latestIssued = data.certificates.find((c) => c.status === 'issued')

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Certificates & Credentials"
        subtitle="Download earned certificates and track credentials still in progress."
      />

      {latestIssued ? (
        <GlassCard className="relative overflow-hidden p-0">
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900" />
          <div className="absolute right-0 top-0 w-56 h-56 rounded-full bg-lemon-500/15 blur-3xl" />
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-lemon-500 text-navy-900 flex items-center justify-center shrink-0 shadow-lg">
              <Award size={32} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-lemon-400">Latest credential</div>
              <h2 className="mt-2 text-[20px] md:text-[22px] font-bold text-white leading-tight">{latestIssued.title}</h2>
              <p className="mt-2 text-[13px] text-navy-200">
                {latestIssued.course} · Issued {latestIssued.issuedAt}
              </p>
              <p className="mt-1 text-[11px] font-mono text-navy-300">{latestIssued.credentialId}</p>
            </div>
            <Button variant="primary" className="shrink-0">
              <Download size={15} />
              Download PDF
            </Button>
          </div>
        </GlassCard>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBlock
          label="Issued"
          value={stats.issued}
          sub="Ready to download"
          icon={<BadgeCheck size={17} />}
          iconBg="bg-success-bg text-success"
        />
        <StatBlock
          label="In progress"
          value={stats.inProgress}
          sub="Complete course to earn"
          icon={<Hourglass size={17} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Verified"
          value={stats.issued}
          sub="Blockchain-backed IDs"
          icon={<ShieldCheck size={17} />}
          iconBg="bg-lemon-100 text-lemon-800"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <span className="text-[12px] text-secondary-text">{filtered.length} credential{filtered.length === 1 ? '' : 's'}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((cert) => (
          <GlassCard
            key={cert.id}
            className={`p-0 overflow-hidden hover:shadow-md transition-shadow border-l-4 ${
              cert.status === 'issued'
                ? 'border-l-success bg-gradient-to-r from-success-bg/40 to-white'
                : 'border-l-info bg-gradient-to-r from-info-bg/40 to-white'
            }`}
          >
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    cert.status === 'issued' ? 'bg-success text-white' : 'bg-info text-white'
                  }`}
                >
                  <Award size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <StatusPill label={statusLabel[cert.status]} tone={statusTone[cert.status]} />
                  <h3 className="mt-1.5 text-[15px] font-bold text-navy-900 leading-snug">{cert.title}</h3>
                  <p className="mt-1 text-[12px] text-secondary-text">
                    {cert.course} · {cert.issuedAt}
                  </p>
                  <p className="mt-2 inline-block rounded-md bg-navy-50 px-2 py-1 text-[10.5px] font-mono text-navy-600">
                    {cert.credentialId}
                  </p>
                </div>
              </div>
              {cert.status === 'issued' ? (
                <Button variant="primary" size="sm" className="w-full mt-4">
                  <Download size={13} />
                  Download certificate
                </Button>
              ) : (
                <div className="mt-4 rounded-lg bg-info-bg/50 border border-info/20 px-3 py-2 text-[11.5px] text-info font-semibold text-center">
                  Complete course requirements to unlock
                </div>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <Award size={32} className="mx-auto text-navy-300 mb-3" />
          <p className="text-[14px] font-semibold text-navy-900">No credentials in this view</p>
        </GlassCard>
      ) : null}
    </div>
  )
}

export default StudentCertificatesPage

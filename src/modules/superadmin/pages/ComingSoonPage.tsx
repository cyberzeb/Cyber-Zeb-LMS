import { GlassCard } from '../../../shared/layout/GlassCard'

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-navy-900">{title}</h1>
        <p className="text-[13.5px] text-secondary-text mt-1">Not yet available.</p>
      </div>
      <GlassCard className="p-5">
        <p className="text-[13px] text-secondary-text">
          This section is planned but not implemented yet. No placeholder metrics or status
          indicators are shown here.
        </p>
      </GlassCard>
    </div>
  )
}

export function AppearancePage() {
  return <ComingSoonPage title="Appearance & branding" />
}

export function IntegrationsPage() {
  return <ComingSoonPage title="Integrations" />
}

export function SystemHealthPage() {
  return <ComingSoonPage title="System health" />
}

export function BackupPage() {
  return <ComingSoonPage title="Backup & restore" />
}

export function SecurityPage() {
  return <ComingSoonPage title="Security center" />
}

export function AnalyticsPage() {
  return <ComingSoonPage title="Analytics" />
}

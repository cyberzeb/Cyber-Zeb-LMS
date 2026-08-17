import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  CreditCard,
  Mail,
  Plug,
  Puzzle,
  RefreshCw,
  Shield,
  Video,
} from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { formatRelativeDate } from '../../../shared/storage/platformUtils'
import { useIntegrations } from '../hooks/usePlatformStorage'
import type { ApiIntegrationRecord, IntegrationCategory, IntegrationStatus } from '../types/platform'

const tabs = ['All', 'Connected', 'Warning', 'Disconnected']

const statusTone: Record<IntegrationStatus, 'success' | 'warning' | 'neutral'> = {
  connected: 'success',
  warning: 'warning',
  disconnected: 'neutral',
}

const categoryIcon: Record<IntegrationCategory, ReactNode> = {
  identity: <Shield size={18} />,
  payments: <CreditCard size={18} />,
  video: <Video size={18} />,
  communication: <Mail size={18} />,
  analytics: <Puzzle size={18} />,
  lms: <Plug size={18} />,
}

export function ApiIntegrationsAdminPage() {
  const { notify } = useToast()
  const { records, toggleIntegration, connectIntegration, disconnectIntegration, updateIntegration } =
    useIntegrations()
  const [activeTab, setActiveTab] = useState('All')
  const [query, setQuery] = useState('')

  const stats = useMemo(
    () => ({
      total: records.length,
      connected: records.filter((r) => r.status === 'connected').length,
      warning: records.filter((r) => r.status === 'warning').length,
      enabled: records.filter((r) => r.enabled).length,
    }),
    [records],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records.filter((r) => {
      if (activeTab === 'Connected' && r.status !== 'connected') return false
      if (activeTab === 'Warning' && r.status !== 'warning') return false
      if (activeTab === 'Disconnected' && r.status !== 'disconnected') return false
      if (!q) return true
      return (
        r.name.toLowerCase().includes(q) ||
        r.provider.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      )
    })
  }, [records, activeTab, query])

  const handleSync = (integration: ApiIntegrationRecord) => {
    updateIntegration(integration.id, {
      lastSync: new Date().toISOString(),
      status: integration.status === 'disconnected' ? 'connected' : integration.status,
    })
    notify(`Synced ${integration.name}.`)
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="API Integrations"
        subtitle="Connect external services for identity, payments, video, and communications."
        actions={
          <Button variant="secondary" onClick={() => notify('New integrations are added by platform admins.', 'info')}>
            <Plug size={15} />
            Add integration
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock label="Total" value={stats.total} sub="Available connectors" icon={<Plug size={17} />} iconBg="bg-navy-50 text-navy-600" />
        <StatBlock label="Connected" value={stats.connected} sub="Healthy connections" icon={<Shield size={17} />} iconBg="bg-success-bg text-success" />
        <StatBlock label="Warnings" value={stats.warning} sub="Needs attention" icon={<Puzzle size={17} />} iconBg="bg-warning-bg text-warning" />
        <StatBlock label="Enabled" value={stats.enabled} sub="Active in portal" icon={<RefreshCw size={17} />} iconBg="bg-info-bg text-info" />
      </div>

      <GlassCard className="p-4 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
          <SearchInput value={query} onChange={setQuery} placeholder="Search integrations…" className="sm:w-72" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map((integration) => (
            <div
              key={integration.id}
              className="rounded-xl border border-divider bg-white/80 p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-navy-50 text-navy-700 flex items-center justify-center shrink-0">
                  {categoryIcon[integration.category]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-bold text-navy-900">{integration.name}</h3>
                    <StatusPill label={integration.status} tone={statusTone[integration.status]} />
                    {!integration.enabled ? (
                      <StatusPill label="disabled" tone="neutral" />
                    ) : null}
                  </div>
                  <p className="text-[12px] text-secondary-text mt-1">{integration.provider} · {integration.category}</p>
                  <p className="text-[12.5px] text-navy-800 mt-2 leading-snug">{integration.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px] text-secondary-text">
                {integration.apiKeyMasked ? (
                  <div className="rounded-lg bg-navy-50 px-3 py-2 font-mono">{integration.apiKeyMasked}</div>
                ) : null}
                {integration.webhookUrl ? (
                  <div className="rounded-lg bg-navy-50 px-3 py-2 truncate">{integration.webhookUrl}</div>
                ) : null}
                <div className="sm:col-span-2">Last sync · {integration.lastSync === 'Never' ? 'Never' : formatRelativeDate(integration.lastSync)}</div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 border-t border-divider/60">
                {integration.status === 'disconnected' ? (
                  <Button variant="primary" size="sm" onClick={() => { connectIntegration(integration.id); notify(`${integration.name} connected.`) }}>
                    Connect
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => handleSync(integration)}>
                    <RefreshCw size={13} />
                    Sync now
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => { toggleIntegration(integration.id); notify(integration.enabled ? 'Integration disabled.' : 'Integration enabled.') }}>
                  {integration.enabled ? 'Disable' : 'Enable'}
                </Button>
                {integration.status !== 'disconnected' ? (
                  <Button variant="ghost" size="sm" onClick={() => { disconnectIntegration(integration.id); notify(`${integration.name} disconnected.`) }}>
                    Disconnect
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Plug size={28} className="mx-auto text-navy-300 mb-2" />
            <p className="text-[13px] font-semibold text-navy-900">No integrations match your filters</p>
          </div>
        ) : null}
      </GlassCard>
    </div>
  )
}

export default ApiIntegrationsAdminPage

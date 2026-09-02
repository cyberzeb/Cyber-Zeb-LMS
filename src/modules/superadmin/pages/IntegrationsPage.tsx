import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { CheckCircle, Link2, Link2Off, RefreshCw, AlertTriangle } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatusPill } from '../../../shared/components/StatusPill'
import { Button } from '../../../shared/components/Button'
import {
  listIntegrations,
  beginOAuth,
  disconnectIntegration,
} from '../api/serviceRequestApi'
import type { Integration } from '../types'

const PLATFORM_ICONS: Record<string, string> = {
  zoom: '🎥',
  microsoft_teams: '🟦',
  google_meet: '🟢',
  webex: '🔵',
}

const PLATFORM_DESCRIPTIONS: Record<string, string> = {
  zoom: 'Schedule and host live classes via Zoom meetings.',
  microsoft_teams: 'Run virtual classes through Microsoft Teams.',
  google_meet: 'Use Google Meet for live sessions linked to Google Calendar.',
  webex: 'Host live sessions via Cisco Webex.',
}

function tokenStatusPill(ts: Integration['token_status'], isConnected: boolean) {
  if (!isConnected) return <StatusPill label="Not connected" tone="neutral" />
  if (ts === 'valid') return <StatusPill label="Connected" tone="success" />
  if (ts === 'expired') return <StatusPill label="Token expired" tone="danger" />
  return <StatusPill label="Missing token" tone="warning" />
}

function IntegrationCard({ integration }: { integration: Integration }) {
  const qc = useQueryClient()
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const [actionError, setActionError] = useState('')

  const connectMutation = useMutation({
    mutationFn: () => beginOAuth(integration.platform),
    onSuccess: (data) => {
      // Open the OAuth authorization URL in a new tab
      window.open(data.authorization_url, '_blank', 'noopener,noreferrer')
      // Refresh list so the state row is updated with the new oauth_state
      qc.invalidateQueries({ queryKey: ['super-admin', 'integrations'] })
    },
    onError: (e: Error) => setActionError(e.message),
  })

  const disconnectMutation = useMutation({
    mutationFn: () => disconnectIntegration(integration.platform),
    onSuccess: () => {
      setConfirmDisconnect(false)
      qc.invalidateQueries({ queryKey: ['super-admin', 'integrations'] })
    },
    onError: (e: Error) => setActionError(e.message),
  })

  return (
    <GlassCard className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none">{PLATFORM_ICONS[integration.platform] ?? '🔗'}</span>
          <div>
            <p className="text-[14px] font-extrabold text-navy-900">{integration.display_name}</p>
            <p className="text-[12px] text-secondary-text mt-0.5">
              {PLATFORM_DESCRIPTIONS[integration.platform] ?? ''}
            </p>
          </div>
        </div>
        {tokenStatusPill(integration.token_status, integration.is_connected)}
      </div>

      {integration.is_connected && (
        <div className="rounded-xl bg-canvas px-3 py-2.5 space-y-1.5 text-[12px]">
          {integration.connected_account && (
            <p className="text-navy-900">
              <span className="text-secondary-text">Account: </span>
              <span className="font-semibold">{integration.connected_account}</span>
            </p>
          )}
          {integration.token_expires_at && (
            <p className="text-navy-900">
              <span className="text-secondary-text">Token expires: </span>
              <span className="font-semibold">
                {new Date(integration.token_expires_at).toLocaleString()}
              </span>
            </p>
          )}
          {integration.last_health_check && (
            <p className="text-navy-900 flex items-center gap-1">
              <span className="text-secondary-text">Last checked: </span>
              <span className="font-semibold">
                {new Date(integration.last_health_check).toLocaleString()}
              </span>
              {integration.last_health_ok === true && (
                <CheckCircle size={12} className="text-lemon-600" />
              )}
              {integration.last_health_ok === false && (
                <AlertTriangle size={12} className="text-danger" />
              )}
            </p>
          )}
        </div>
      )}

      {actionError && (
        <p className="text-[12.5px] font-semibold text-danger bg-danger-bg px-3 py-2 rounded-lg">
          {actionError}
        </p>
      )}

      {!integration.is_connected && (
        <Button
          type="button"
          disabled={connectMutation.isPending}
          onClick={() => {
            setActionError('')
            connectMutation.mutate()
          }}
          className="w-full justify-center"
        >
          <Link2 size={14} className="mr-1.5" />
          {connectMutation.isPending ? 'Opening OAuth…' : `Connect ${integration.display_name}`}
        </Button>
      )}

      {integration.is_connected && !confirmDisconnect && (
        <button
          type="button"
          onClick={() => setConfirmDisconnect(true)}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-divider px-4 py-2.5 text-[12.5px] font-bold text-danger hover:bg-danger-bg transition-colors"
        >
          <Link2Off size={14} />
          Disconnect
        </button>
      )}

      {confirmDisconnect && (
        <div className="rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 space-y-3">
          <p className="text-[12.5px] font-semibold text-danger">
            Disconnect {integration.display_name}? This will remove stored tokens.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="danger"
              disabled={disconnectMutation.isPending}
              onClick={() => {
                setActionError('')
                disconnectMutation.mutate()
              }}
            >
              {disconnectMutation.isPending ? 'Disconnecting…' : 'Confirm disconnect'}
            </Button>
            <button
              type="button"
              onClick={() => setConfirmDisconnect(false)}
              className="rounded-lg border border-divider px-3 py-2 text-[12px] font-bold text-navy-900"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  )
}

export function IntegrationsPage() {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['super-admin', 'integrations'],
    queryFn: listIntegrations,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-navy-900">Integrations</h1>
        <p className="text-[13.5px] text-secondary-text mt-1">
          Connect live-session platforms. OAuth tokens are stored encrypted.
        </p>
      </div>

      <div className="rounded-xl border border-info/30 bg-info-bg px-4 py-3 text-[12.5px] text-info font-semibold flex items-start gap-2">
        <RefreshCw size={14} className="mt-0.5 shrink-0" />
        <span>
          Clicking "Connect" opens the provider's authorization page in a new tab. Complete the
          flow there, then return here — the page will refresh automatically.
          <br />
          <span className="font-normal text-secondary-text">
            OAuth client IDs/secrets must be set in the server environment variables before
            connecting.
          </span>
        </span>
      </div>

      {isLoading && (
        <p className="text-[13px] text-secondary-text">Loading integrations…</p>
      )}
      {error && (
        <p className="text-[13px] font-semibold text-danger">
          {error instanceof Error ? error.message : 'Failed to load'}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {data.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>
    </div>
  )
}

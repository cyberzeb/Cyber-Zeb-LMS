import { useQuery } from '@tanstack/react-query'
import { CheckCircle, XCircle, RefreshCw, Database, Mail, Cpu } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { getSystemHealth } from '../api/serviceRequestApi'
import type { SystemHealth } from '../types'

const REFRESH_MS = 30_000

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${ok ? 'bg-lemon-500' : 'bg-danger'}`}
    />
  )
}

function MetricRow({
  label,
  value,
  ok,
  detail,
}: {
  label: string
  value: string
  ok?: boolean
  detail?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-divider last:border-0">
      <div className="flex items-center gap-2.5">
        {ok !== undefined && <StatusDot ok={ok} />}
        <div>
          <p className="text-[13px] font-semibold text-navy-900">{label}</p>
          {detail && <p className="text-[11.5px] text-secondary-text">{detail}</p>}
        </div>
      </div>
      <span
        className={`text-[13px] font-bold ${
          ok === false ? 'text-danger' : ok === true ? 'text-lemon-700' : 'text-navy-900'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function overallStatus(h: SystemHealth): 'ok' | 'degraded' {
  if (!h.db_ok || !h.api_ok) return 'degraded'
  if (h.email_success_rate_pct !== null && h.email_success_rate_pct < 50) return 'degraded'
  return 'ok'
}

export function SystemHealthPage() {
  const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['super-admin', 'system-health'],
    queryFn: getSystemHealth,
    refetchInterval: REFRESH_MS,
  })

  const status = data ? overallStatus(data) : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold text-navy-900">System Health</h1>
          <p className="text-[13.5px] text-secondary-text mt-1">
            Live status — auto-refreshes every 30 s.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-divider px-3 py-2 text-[12.5px] font-bold text-navy-900 hover:bg-canvas"
        >
          <RefreshCw size={14} />
          Refresh now
        </button>
      </div>

      {/* Overall banner */}
      {status && (
        <div
          className={`flex items-center gap-3 rounded-xl px-5 py-4 ${
            status === 'ok'
              ? 'bg-lemon-50 border border-lemon-500/30'
              : 'bg-danger-bg border border-danger/30'
          }`}
        >
          {status === 'ok' ? (
            <CheckCircle size={20} className="text-lemon-600 shrink-0" />
          ) : (
            <XCircle size={20} className="text-danger shrink-0" />
          )}
          <p
            className={`text-[14px] font-extrabold ${
              status === 'ok' ? 'text-lemon-900' : 'text-danger'
            }`}
          >
            {status === 'ok' ? 'All systems operational' : 'Degraded — one or more checks failing'}
          </p>
          {dataUpdatedAt > 0 && (
            <span className="ml-auto text-[11.5px] text-secondary-text">
              Last checked {new Date(dataUpdatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      )}

      {isLoading && (
        <GlassCard className="p-6">
          <p className="text-[13px] text-secondary-text">Checking health…</p>
        </GlassCard>
      )}

      {error && (
        <GlassCard className="p-5">
          <p className="text-[13px] font-semibold text-danger">
            {error instanceof Error ? error.message : 'Failed to load health data'}
          </p>
        </GlassCard>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Database */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Database size={16} className="text-navy-500" />
              <h2 className="text-[14px] font-extrabold text-navy-900">Database</h2>
            </div>
            <MetricRow
              label="Connection"
              value={data.db_ok ? 'Connected' : 'Unreachable'}
              ok={data.db_ok}
            />
            <MetricRow
              label="Round-trip latency"
              value={
                data.db_latency_ms !== null ? `${data.db_latency_ms} ms` : '—'
              }
              ok={
                data.db_latency_ms !== null
                  ? data.db_latency_ms < 100
                  : undefined
              }
            />
            <MetricRow
              label="Database size"
              value={data.db_size_human ?? '—'}
              detail={data.db_size_bytes !== null ? `${data.db_size_bytes.toLocaleString()} bytes` : undefined}
            />
          </GlassCard>

          {/* API */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Cpu size={16} className="text-navy-500" />
              <h2 className="text-[14px] font-extrabold text-navy-900">API</h2>
            </div>
            <MetricRow
              label="API status"
              value={data.api_ok ? 'Responding' : 'Down'}
              ok={data.api_ok}
              detail="GET /health"
            />
            <MetricRow
              label="Checked at"
              value={new Date(data.checked_at).toLocaleTimeString()}
            />
          </GlassCard>

          {/* Email */}
          <GlassCard className="p-5 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Mail size={16} className="text-navy-500" />
              <h2 className="text-[14px] font-extrabold text-navy-900">Email (last 24 h)</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-canvas p-4 text-center">
                <p className="text-[11px] font-bold text-secondary-text uppercase tracking-wide">Sent</p>
                <p className="text-[28px] font-extrabold text-navy-900 mt-1">
                  {data.email_sent_count_24h}
                </p>
              </div>
              <div className="rounded-xl bg-canvas p-4 text-center">
                <p className="text-[11px] font-bold text-secondary-text uppercase tracking-wide">Failed</p>
                <p
                  className={`text-[28px] font-extrabold mt-1 ${
                    data.email_failed_count_24h > 0 ? 'text-danger' : 'text-navy-900'
                  }`}
                >
                  {data.email_failed_count_24h}
                </p>
              </div>
              <div className="rounded-xl bg-canvas p-4 text-center">
                <p className="text-[11px] font-bold text-secondary-text uppercase tracking-wide">
                  Success rate
                </p>
                <p
                  className={`text-[28px] font-extrabold mt-1 ${
                    data.email_success_rate_pct === null
                      ? 'text-secondary-text'
                      : data.email_success_rate_pct >= 90
                        ? 'text-lemon-700'
                        : 'text-danger'
                  }`}
                >
                  {data.email_success_rate_pct !== null
                    ? `${data.email_success_rate_pct}%`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
}

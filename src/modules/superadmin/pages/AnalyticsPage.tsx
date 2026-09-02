import { useQuery } from '@tanstack/react-query'
import { useRef, useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { INSTITUTION_TYPES, institutionTypeLabel } from '../../../shared/constants/institutionTypes'
import { getAnalytics } from '../api/serviceRequestApi'
import type { ModuleDemandItem, RevenueTrendItem } from '../types'

const inputClass =
  'rounded-lg border border-divider bg-white px-3 py-2 text-[13px] text-navy-900 outline-none focus:border-lemon-500'

/** Merge multiple rows sharing the same period (different currencies) into one,
 *  summing revenue and converting to number so recharts can plot it. */
function mergeRevenueTrend(rows: RevenueTrendItem[]): { period: string; revenue: number }[] {
  const map = new Map<string, number>()
  for (const r of rows) {
    map.set(r.period, (map.get(r.period) ?? 0) + Number(r.revenue))
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, revenue]) => ({ period, revenue }))
}

/** Hook that returns the current pixel width of a container div via ResizeObserver.
 *  Falls back to 600px until the first measurement arrives. */
function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>): number {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Read immediately in case the element is already laid out
    if (el.clientWidth > 0) setWidth(el.clientWidth)
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      if (w > 0) setWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return width || 600 // safe fallback while observer hasn't fired yet
}

/** Chart wrapper — measures its own width, renders children only once a
 *  positive width is known, avoiding recharts' zero-width blank canvas. */
function ChartSizer({
  height,
  children,
}: {
  height: number
  children: (width: number) => React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const width = useContainerWidth(ref)
  return (
    <div ref={ref} style={{ width: '100%', height }}>
      {width > 0 && children(width)}
    </div>
  )
}

/** Pure CSS horizontal bar chart — no recharts, no sizing bugs. */
function ModuleDemandBars({ items }: { items: ModuleDemandItem[] }) {
  const max = Math.max(...items.map((m) => m.total_count), 1)
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3 text-[11px] font-bold text-secondary-text mb-3">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-navy-900" />
          New requests
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#d4a72c]" />
          Add-on requests
        </span>
      </div>
      {items.map((m) => (
        <div key={m.module_key} className="flex items-center gap-3">
          <span
            className="text-[11.5px] text-navy-900 shrink-0 text-right"
            style={{ width: 200 }}
          >
            {m.display_name}
          </span>
          <div className="flex-1 flex h-5 rounded overflow-hidden bg-canvas min-w-0">
            {m.request_count > 0 && (
              <div
                className="bg-navy-900 h-full transition-all"
                style={{ width: `${(m.request_count / max) * 100}%` }}
              />
            )}
            {m.addon_count > 0 && (
              <div
                className="bg-[#d4a72c] h-full transition-all"
                style={{ width: `${(m.addon_count / max) * 100}%` }}
              />
            )}
          </div>
          <span className="text-[11.5px] font-bold text-navy-900 shrink-0 w-6 text-right">
            {m.total_count}
          </span>
        </div>
      ))}
    </div>
  )
}

export function AnalyticsPage() {
  const [since, setSince] = useState('')
  const [until, setUntil] = useState('')
  const [institutionType, setInstitutionType] = useState('')
  const [applied, setApplied] = useState({ since: '', until: '', institutionType: '' })

  const { data, isLoading, error } = useQuery({
    queryKey: ['super-admin', 'analytics', applied],
    queryFn: () =>
      getAnalytics({
        since: applied.since || undefined,
        until: applied.until || undefined,
        institution_type: applied.institutionType || undefined,
      }),
  })

  const applyFilters = () =>
    setApplied({
      since: since ? new Date(since).toISOString() : '',
      until: until ? new Date(`${until}T23:59:59`).toISOString() : '',
      institutionType,
    })

  const revenueData = data ? mergeRevenueTrend(data.revenue_trend) : []
  const moduleData = data ? data.module_demand.slice(0, 15) : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-navy-900">Analytics</h1>
        <p className="text-[13.5px] text-secondary-text mt-1">
          Real data from service requests, tenants, and payments. Read-only reporting.
        </p>
      </div>

      {/* Filters */}
      <GlassCard className="p-5">
        <div className="flex flex-wrap gap-3 items-end">
          <label className="block space-y-1">
            <span className="text-[11.5px] font-bold text-navy-900">From</span>
            <input
              type="date"
              value={since}
              onChange={(e) => setSince(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11.5px] font-bold text-navy-900">To</span>
            <input
              type="date"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11.5px] font-bold text-navy-900">Institution type</span>
            <select
              value={institutionType}
              onChange={(e) => setInstitutionType(e.target.value)}
              className={inputClass}
            >
              <option value="">All types</option>
              {INSTITUTION_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={applyFilters}
            className="rounded-lg bg-navy-900 px-4 py-2 text-[12.5px] font-bold text-white"
          >
            Apply
          </button>
          {(applied.since || applied.until || applied.institutionType) && (
            <button
              type="button"
              onClick={() => {
                setSince('')
                setUntil('')
                setInstitutionType('')
                setApplied({ since: '', until: '', institutionType: '' })
              }}
              className="text-[12px] text-secondary-text hover:text-danger"
            >
              Clear filters
            </button>
          )}
        </div>
      </GlassCard>

      {isLoading && (
        <p className="text-[13px] text-secondary-text">Loading analytics…</p>
      )}
      {error && (
        <p className="text-[13px] font-semibold text-danger">
          {error instanceof Error ? error.message : 'Failed to load analytics'}
        </p>
      )}

      {data && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <GlassCard className="p-4 text-center">
              <p className="text-[11px] font-bold text-secondary-text uppercase tracking-wide">
                Activated tenants
              </p>
              <p className="text-[28px] font-extrabold text-navy-900 mt-1">
                {data.total_activated}
              </p>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <p className="text-[11px] font-bold text-secondary-text uppercase tracking-wide">
                Avg. time to activate
              </p>
              <p className="text-[28px] font-extrabold text-navy-900 mt-1">
                {data.avg_activation_days !== null
                  ? `${data.avg_activation_days}d`
                  : '—'}
              </p>
            </GlassCard>
            <GlassCard className="p-4 text-center md:col-span-2">
              <p className="text-[11px] font-bold text-secondary-text uppercase tracking-wide">
                Institution types
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {Object.entries(data.institution_type_counts).map(([type, count]) => (
                  <span
                    key={type}
                    className="text-[11.5px] font-semibold bg-navy-50 text-navy-900 px-2.5 py-1 rounded-full border border-navy-900/10"
                  >
                    {institutionTypeLabel(type)}: {count}
                  </span>
                ))}
                {Object.keys(data.institution_type_counts).length === 0 && (
                  <span className="text-[12px] text-secondary-text">No data yet</span>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Revenue trend */}
          <GlassCard className="p-5">
            <h2 className="text-[14px] font-extrabold text-navy-900 mb-4">
              Revenue trend (last 6 months)
            </h2>
            {revenueData.length === 0 ? (
              <p className="text-[13px] text-secondary-text">
                No confirmed revenue records in this period.
              </p>
            ) : (
              <ChartSizer height={240}>
                {(w) => (
                  <LineChart
                    width={w}
                    height={240}
                    data={revenueData}
                    margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                      }
                    />
                    <Tooltip
                      formatter={(value) => [
                        Number(value).toLocaleString(),
                        'Revenue',
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#0a1020"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                )}
              </ChartSizer>
            )}
          </GlassCard>

          {/* Module demand chart */}
          <GlassCard className="p-5">
            <h2 className="text-[14px] font-extrabold text-navy-900 mb-4">
              Most-requested modules
            </h2>
            {moduleData.length === 0 ? (
              <p className="text-[13px] text-secondary-text">
                No activated module data in this period.
              </p>
            ) : (
              <ModuleDemandBars items={moduleData} />
            )}
          </GlassCard>

          {/* Module demand table */}
          {data.module_demand.length > 0 && (
            <GlassCard className="overflow-hidden">
              <table className="w-full text-[12.5px]">
                <thead className="bg-canvas border-b border-divider">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold text-navy-900">Module</th>
                    <th className="text-right px-4 py-3 font-bold text-navy-900">New</th>
                    <th className="text-right px-4 py-3 font-bold text-navy-900">Add-ons</th>
                    <th className="text-right px-4 py-3 font-bold text-navy-900">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {data.module_demand.map((m: ModuleDemandItem) => (
                    <tr key={m.module_key} className="hover:bg-canvas/50">
                      <td className="px-4 py-2.5 text-navy-900">{m.display_name}</td>
                      <td className="px-4 py-2.5 text-right text-secondary-text">
                        {m.request_count}
                      </td>
                      <td className="px-4 py-2.5 text-right text-secondary-text">
                        {m.addon_count}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-navy-900">
                        {m.total_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  )
}

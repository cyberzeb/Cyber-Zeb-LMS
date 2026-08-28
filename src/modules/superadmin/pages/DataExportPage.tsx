import { useState } from 'react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { exportCsv } from '../api/serviceRequestApi'

export function DataExportPage() {
  const [busy, setBusy] = useState<'service-requests' | 'tenants' | null>(null)
  const [error, setError] = useState('')

  async function handleExport(kind: 'service-requests' | 'tenants') {
    setError('')
    setBusy(kind)
    try {
      await exportCsv(kind)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-navy-900">Data export</h1>
        <p className="text-[13.5px] text-secondary-text mt-1">
          Download CSV exports of platform data.
        </p>
      </div>

      {error && (
        <p className="text-[13px] font-semibold text-danger bg-danger-bg px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <GlassCard className="p-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => handleExport('service-requests')}
          className="rounded-lg bg-navy-900 px-4 py-2.5 text-[12.5px] font-bold text-white disabled:opacity-50"
        >
          {busy === 'service-requests' ? 'Exporting…' : 'Export service requests CSV'}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => handleExport('tenants')}
          className="rounded-lg bg-navy-900 px-4 py-2.5 text-[12.5px] font-bold text-white disabled:opacity-50"
        >
          {busy === 'tenants' ? 'Exporting…' : 'Export tenants CSV'}
        </button>
      </GlassCard>
    </div>
  )
}

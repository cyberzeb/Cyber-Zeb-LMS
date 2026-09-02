import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { HardDrive, Play, RotateCcw, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatusPill } from '../../../shared/components/StatusPill'
import { Button } from '../../../shared/components/Button'
import { listBackups, triggerBackup, restoreFromBackup } from '../api/serviceRequestApi'
import type { BackupRun } from '../types'

function statusTone(s: string) {
  if (s === 'success') return 'success' as const
  if (s === 'failed') return 'danger' as const
  return 'warning' as const
}

function statusIcon(s: string) {
  if (s === 'success') return <CheckCircle size={14} className="text-lemon-600" />
  if (s === 'failed') return <AlertTriangle size={14} className="text-danger" />
  return <Clock size={14} className="text-warning" />
}

function RestoreModal({
  backup,
  onClose,
}: {
  backup: BackupRun
  onClose: () => void
}) {
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const qc = useQueryClient()

  const restoreMutation = useMutation({
    mutationFn: () => restoreFromBackup(backup.id, confirmation),
    onSuccess: () => {
      setDone(true)
      qc.invalidateQueries({ queryKey: ['super-admin', 'backups'] })
    },
    onError: (e: Error) => setError(e.message),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-danger shrink-0" />
          <h2 className="text-[16px] font-extrabold text-navy-900">Restore from backup</h2>
        </div>

        {done ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-lemon-700 bg-lemon-50 px-3 py-2 rounded-lg">
              <CheckCircle size={14} />
              <span className="text-[13px] font-semibold">Restore initiated successfully.</span>
            </div>
            <p className="text-[12.5px] text-secondary-text">
              The database is being restored. The application may be temporarily unavailable.
            </p>
            <Button type="button" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <div className="rounded-xl bg-danger-bg border border-danger/30 px-4 py-3 space-y-1 text-[12.5px]">
              <p className="font-bold text-danger">⚠ This action is destructive and irreversible.</p>
              <p className="text-danger/80">
                All current database data will be replaced with the contents of backup{' '}
                <code className="font-mono">{backup.id.slice(0, 8)}…</code> from{' '}
                {new Date(backup.started_at).toLocaleString()}.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-navy-900">
                Type your environment name to confirm:{' '}
                <code className="font-mono bg-canvas px-1 rounded">development</code>
              </label>
              <input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="Type the environment name"
                className="w-full rounded-lg border border-divider px-3 py-2.5 text-[13px] outline-none focus:border-danger"
              />
              <p className="text-[11.5px] text-secondary-text">
                The exact value must match the APP_ENV environment variable set on the server.
              </p>
            </div>

            {error && (
              <p className="text-[12.5px] font-semibold text-danger bg-danger-bg px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="danger"
                disabled={!confirmation.trim() || restoreMutation.isPending}
                onClick={() => { setError(''); restoreMutation.mutate() }}
              >
                {restoreMutation.isPending ? 'Restoring…' : 'Restore database'}
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-divider px-3 py-2.5 text-[12.5px] font-bold text-navy-900"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function BackupPage() {
  const qc = useQueryClient()
  const [restoreTarget, setRestoreTarget] = useState<BackupRun | null>(null)
  const [triggerError, setTriggerError] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['super-admin', 'backups'],
    queryFn: () => listBackups({ limit: 20 }),
    refetchInterval: 15_000,
  })

  const triggerMutation = useMutation({
    mutationFn: triggerBackup,
    onSuccess: () => {
      setTriggerError('')
      qc.invalidateQueries({ queryKey: ['super-admin', 'backups'] })
    },
    onError: (e: Error) => setTriggerError(e.message),
  })

  const latestSuccess = data?.items.find((r) => r.status === 'success')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold text-navy-900 flex items-center gap-2">
            <HardDrive size={22} />
            Backup &amp; Restore
          </h1>
          <p className="text-[13.5px] text-secondary-text mt-1">
            Scheduled daily backups via pg_dump. Stored locally by default.
          </p>
        </div>
        <Button
          type="button"
          disabled={triggerMutation.isPending}
          onClick={() => { setTriggerError(''); triggerMutation.mutate() }}
        >
          <Play size={13} className="mr-1.5" />
          {triggerMutation.isPending ? 'Running backup…' : 'Run backup now'}
        </Button>
      </div>

      {triggerMutation.isPending && (
        <div className="flex items-center gap-2 rounded-xl bg-info-bg border border-info/30 px-4 py-3 text-[13px] text-info font-semibold">
          <Clock size={14} />
          Backup in progress — this may take a few minutes. The page auto-refreshes.
        </div>
      )}
      {triggerMutation.isSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-lemon-50 border border-lemon-500/30 px-4 py-3 text-[13px] text-lemon-700 font-semibold">
          <CheckCircle size={14} />
          Backup completed successfully.
        </div>
      )}
      {triggerError && (
        <p className="text-[13px] font-semibold text-danger bg-danger-bg px-3 py-2 rounded-lg">
          {triggerError}
        </p>
      )}

      {/* Last backup summary */}
      {latestSuccess && (
        <GlassCard className="p-5">
          <p className="text-[12px] font-bold text-secondary-text uppercase tracking-wide mb-2">
            Last successful backup
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
            <div>
              <p className="text-[11px] font-bold text-secondary-text">Date</p>
              <p className="font-semibold text-navy-900">
                {new Date(latestSuccess.started_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-secondary-text">Size</p>
              <p className="font-semibold text-navy-900">
                {latestSuccess.file_size_human ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-secondary-text">Duration</p>
              <p className="font-semibold text-navy-900">
                {latestSuccess.duration_seconds != null
                  ? `${latestSuccess.duration_seconds}s`
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-secondary-text">Triggered by</p>
              <p className="font-semibold text-navy-900 capitalize">
                {latestSuccess.triggered_by}
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Backup history */}
      <GlassCard className="overflow-hidden">
        <div className="px-5 py-3 border-b border-divider">
          <p className="text-[13px] font-bold text-navy-900">Backup history</p>
        </div>
        {isLoading && (
          <p className="p-5 text-[13px] text-secondary-text">Loading…</p>
        )}
        {error && (
          <p className="p-5 text-[13px] font-semibold text-danger">
            {error instanceof Error ? error.message : 'Failed to load'}
          </p>
        )}
        {!isLoading && (data?.items ?? []).length === 0 && (
          <p className="p-5 text-[13px] text-secondary-text">
            No backups yet. Click "Run backup now" to create one.
          </p>
        )}
        <div className="divide-y divide-divider">
          {(data?.items ?? []).map((run) => (
            <div
              key={run.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
            >
              <div className="flex items-center gap-2.5">
                {statusIcon(run.status)}
                <div>
                  <p className="text-[12.5px] font-semibold text-navy-900">
                    {new Date(run.started_at).toLocaleString()}
                  </p>
                  <p className="text-[11.5px] text-secondary-text">
                    {run.file_size_human ?? '—'} ·{' '}
                    {run.duration_seconds != null ? `${run.duration_seconds}s` : ''} ·{' '}
                    <span className="capitalize">{run.triggered_by}</span>
                  </p>
                  {run.error_message && (
                    <p className="text-[11.5px] text-danger mt-0.5">{run.error_message}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill label={run.status} tone={statusTone(run.status)} />
                {run.status === 'success' && (
                  <button
                    type="button"
                    onClick={() => setRestoreTarget(run)}
                    className="inline-flex items-center gap-1 text-[11.5px] font-bold text-danger border border-danger/30 px-2.5 py-1.5 rounded-lg hover:bg-danger-bg"
                  >
                    <RotateCcw size={11} />
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="rounded-xl border border-divider bg-canvas px-4 py-3 text-[12px] text-secondary-text space-y-1">
        <p className="font-bold text-navy-900">Storage info</p>
        <p>
          Backups are stored locally at the path configured in{' '}
          <code className="font-mono">BACKUP_DIR</code> (default:{' '}
          <code className="font-mono">/tmp/berana_backups</code>). Set{' '}
          <code className="font-mono">BACKUP_STORAGE=s3</code> and configure S3 credentials to
          enable durable cloud storage.
        </p>
        <p>
          Scheduled daily backups run at 02:00 UTC via Celery Beat. Start the Celery worker with{' '}
          <code className="font-mono">celery -A app.core.celery_app worker -B</code>.
        </p>
      </div>

      {restoreTarget && (
        <RestoreModal backup={restoreTarget} onClose={() => setRestoreTarget(null)} />
      )}
    </div>
  )
}

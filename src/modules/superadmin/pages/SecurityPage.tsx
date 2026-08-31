import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Shield, Ban, RotateCcw, AlertTriangle, Users, User } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatusPill } from '../../../shared/components/StatusPill'
import { Button } from '../../../shared/components/Button'
import {
  listAdminsWithStatus,
  banPlatformAdmin,
  unbanPlatformAdmin,
  listUserReports,
  reviewUserReport,
  banUser,
  unbanUser,
  listUserBans,
} from '../api/serviceRequestApi'
import type { SuspendedAdmin, UserReport, UserBan } from '../types'

const inputClass =
  'w-full rounded-lg border border-divider bg-white px-3 py-2.5 text-[13px] text-navy-900 outline-none focus:border-lemon-500'

type Tab = 'admins' | 'reports' | 'bans'

// ── Admin row ────────────────────────────────────────────────────────────────

function AdminRow({ admin }: { admin: SuspendedAdmin }) {
  const qc = useQueryClient()
  const [banReason, setBanReason] = useState('')
  const [unbanReason, setUnbanReason] = useState('')
  const [showBanForm, setShowBanForm] = useState(false)
  const [showUnbanForm, setShowUnbanForm] = useState(false)
  const [err, setErr] = useState('')

  const banMutation = useMutation({
    mutationFn: () => banPlatformAdmin(admin.id, banReason),
    onSuccess: () => {
      setShowBanForm(false)
      setBanReason('')
      qc.invalidateQueries({ queryKey: ['super-admin', 'security-admins'] })
    },
    onError: (e: Error) => setErr(e.message),
  })

  const unbanMutation = useMutation({
    mutationFn: () => unbanPlatformAdmin(admin.id, unbanReason),
    onSuccess: () => {
      setShowUnbanForm(false)
      setUnbanReason('')
      qc.invalidateQueries({ queryKey: ['super-admin', 'security-admins'] })
    },
    onError: (e: Error) => setErr(e.message),
  })

  return (
    <div className="p-4 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <User size={15} className="text-secondary-text" />
          <div>
            <p className="text-[13px] font-semibold text-navy-900">{admin.email}</p>
            <p className="text-[11.5px] text-secondary-text">
              {admin.role} · Joined {new Date(admin.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {admin.is_suspended ? (
            <StatusPill label="Suspended" tone="danger" />
          ) : (
            <StatusPill label="Active" tone="success" />
          )}
          {!admin.is_suspended && (
            <button
              type="button"
              onClick={() => { setShowBanForm(true); setShowUnbanForm(false); setErr('') }}
              className="text-[11.5px] font-bold text-danger border border-danger/30 px-2.5 py-1.5 rounded-lg hover:bg-danger-bg"
            >
              <Ban size={12} className="inline mr-1" />
              Suspend
            </button>
          )}
          {admin.is_suspended && (
            <button
              type="button"
              onClick={() => { setShowUnbanForm(true); setShowBanForm(false); setErr('') }}
              className="text-[11.5px] font-bold text-lemon-700 border border-lemon-500/30 px-2.5 py-1.5 rounded-lg hover:bg-lemon-50"
            >
              <RotateCcw size={12} className="inline mr-1" />
              Reinstate
            </button>
          )}
        </div>
      </div>
      {admin.is_suspended && admin.suspension_reason && (
        <p className="text-[12px] text-danger ml-7">Reason: {admin.suspension_reason}</p>
      )}
      {err && <p className="text-[12px] font-semibold text-danger ml-7">{err}</p>}
      {showBanForm && (
        <div className="ml-7 space-y-2">
          <textarea
            rows={2}
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="Reason for suspension (required)"
            className={inputClass + ' resize-none'}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="danger"
              disabled={!banReason.trim() || banMutation.isPending}
              onClick={() => banMutation.mutate()}
            >
              {banMutation.isPending ? 'Suspending…' : 'Confirm suspend'}
            </Button>
            <button type="button" onClick={() => setShowBanForm(false)} className="text-[12px] text-secondary-text">
              Cancel
            </button>
          </div>
        </div>
      )}
      {showUnbanForm && (
        <div className="ml-7 space-y-2">
          <textarea
            rows={2}
            value={unbanReason}
            onChange={(e) => setUnbanReason(e.target.value)}
            placeholder="Reason for reinstatement (required)"
            className={inputClass + ' resize-none'}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={!unbanReason.trim() || unbanMutation.isPending}
              onClick={() => unbanMutation.mutate()}
            >
              {unbanMutation.isPending ? 'Reinstating…' : 'Confirm reinstate'}
            </Button>
            <button type="button" onClick={() => setShowUnbanForm(false)} className="text-[12px] text-secondary-text">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Report row ───────────────────────────────────────────────────────────────

function ReportRow({ report }: { report: UserReport }) {
  const qc = useQueryClient()
  const [banReason, setBanReason] = useState('')
  const [showBanForm, setShowBanForm] = useState(false)
  const [err, setErr] = useState('')

  const dismissMutation = useMutation({
    mutationFn: () => reviewUserReport(report.id, { status: 'dismissed', notes: null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-admin', 'security-reports'] }),
    onError: (e: Error) => setErr(e.message),
  })

  const banMutation = useMutation({
    mutationFn: () =>
      banUser(report.reported_user_id, {
        reason: banReason,
        ban_scope: 'full_account',
        report_id: report.id,
      }),
    onSuccess: () => {
      setShowBanForm(false)
      qc.invalidateQueries({ queryKey: ['super-admin', 'security-reports'] })
      qc.invalidateQueries({ queryKey: ['super-admin', 'security-bans'] })
    },
    onError: (e: Error) => setErr(e.message),
  })

  const statusTone = (s: string) => {
    if (s === 'open') return 'warning' as const
    if (s === 'banned') return 'danger' as const
    if (s === 'dismissed') return 'neutral' as const
    return 'info' as const
  }

  return (
    <div className="p-4 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-navy-900">
            {report.reported_user_display_name ?? report.reported_user_id}
            {report.reported_user_email && (
              <span className="text-secondary-text font-normal ml-1">
                ({report.reported_user_email})
              </span>
            )}
          </p>
          <p className="text-[11.5px] text-secondary-text">
            Tenant: {report.tenant_name ?? report.tenant_id} ·{' '}
            {new Date(report.created_at).toLocaleString()}
          </p>
          <p className="text-[12px] text-navy-900 mt-1">
            <span className="font-bold">Reason: </span>{report.reason}
          </p>
          {report.description && (
            <p className="text-[12px] text-secondary-text mt-0.5">{report.description}</p>
          )}
        </div>
        <StatusPill label={report.status} tone={statusTone(report.status)} />
      </div>
      {err && <p className="text-[12px] font-semibold text-danger">{err}</p>}
      {report.status === 'open' && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setShowBanForm(true); setErr('') }}
            className="text-[11.5px] font-bold text-danger border border-danger/30 px-2.5 py-1.5 rounded-lg hover:bg-danger-bg"
          >
            <Ban size={12} className="inline mr-1" />
            Ban user
          </button>
          <button
            type="button"
            disabled={dismissMutation.isPending}
            onClick={() => dismissMutation.mutate()}
            className="text-[11.5px] font-bold text-secondary-text border border-divider px-2.5 py-1.5 rounded-lg hover:bg-canvas"
          >
            Dismiss
          </button>
        </div>
      )}
      {showBanForm && (
        <div className="space-y-2">
          <textarea
            rows={2}
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="Reason for ban (required)"
            className={inputClass + ' resize-none'}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="danger"
              disabled={!banReason.trim() || banMutation.isPending}
              onClick={() => banMutation.mutate()}
            >
              {banMutation.isPending ? 'Banning…' : 'Confirm ban'}
            </Button>
            <button type="button" onClick={() => setShowBanForm(false)} className="text-[12px] text-secondary-text">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Ban row ──────────────────────────────────────────────────────────────────

function BanRow({ ban }: { ban: UserBan }) {
  const qc = useQueryClient()
  const [unbanReason, setUnbanReason] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [err, setErr] = useState('')

  const unbanMutation = useMutation({
    mutationFn: () => unbanUser(ban.user_id, unbanReason),
    onSuccess: () => {
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ['super-admin', 'security-bans'] })
    },
    onError: (e: Error) => setErr(e.message),
  })

  return (
    <div className="p-4 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-navy-900">
            {ban.user_display_name ?? ban.user_id}
            {ban.user_email && (
              <span className="text-secondary-text font-normal ml-1">({ban.user_email})</span>
            )}
          </p>
          <p className="text-[11.5px] text-secondary-text">
            Tenant: {ban.tenant_name ?? ban.tenant_id} ·{' '}
            Banned {new Date(ban.created_at).toLocaleString()}
          </p>
          <p className="text-[12px] text-navy-900 mt-1">
            <span className="font-bold">Reason: </span>{ban.reason}
          </p>
        </div>
        <StatusPill label={ban.is_active ? 'Banned' : 'Unbanned'} tone={ban.is_active ? 'danger' : 'neutral'} />
      </div>
      {err && <p className="text-[12px] font-semibold text-danger">{err}</p>}
      {ban.is_active && !showForm && (
        <button
          type="button"
          onClick={() => { setShowForm(true); setErr('') }}
          className="text-[11.5px] font-bold text-lemon-700 border border-lemon-500/30 px-2.5 py-1.5 rounded-lg hover:bg-lemon-50"
        >
          <RotateCcw size={12} className="inline mr-1" />
          Unban
        </button>
      )}
      {showForm && (
        <div className="space-y-2">
          <textarea
            rows={2}
            value={unbanReason}
            onChange={(e) => setUnbanReason(e.target.value)}
            placeholder="Reason for unbanning (required)"
            className={inputClass + ' resize-none'}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={!unbanReason.trim() || unbanMutation.isPending}
              onClick={() => unbanMutation.mutate()}
            >
              {unbanMutation.isPending ? 'Unbanning…' : 'Confirm unban'}
            </Button>
            <button type="button" onClick={() => setShowForm(false)} className="text-[12px] text-secondary-text">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export function SecurityPage() {
  const [tab, setTab] = useState<Tab>('reports')
  const [reportStatusFilter, setReportStatusFilter] = useState('open')

  const adminsQuery = useQuery({
    queryKey: ['super-admin', 'security-admins'],
    queryFn: listAdminsWithStatus,
    enabled: tab === 'admins',
  })

  const reportsQuery = useQuery({
    queryKey: ['super-admin', 'security-reports', reportStatusFilter],
    queryFn: () => listUserReports({ status: reportStatusFilter || undefined }),
    enabled: tab === 'reports',
  })

  const bansQuery = useQuery({
    queryKey: ['super-admin', 'security-bans'],
    queryFn: () => listUserBans({ active_only: true }),
    enabled: tab === 'bans',
  })

  const tabs: { id: Tab; label: string }[] = [
    { id: 'reports', label: 'User Reports' },
    { id: 'bans', label: 'Active Bans' },
    { id: 'admins', label: 'Admin Accounts' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-navy-900 flex items-center gap-2">
          <Shield size={22} />
          Security Center
        </h1>
        <p className="text-[13.5px] text-secondary-text mt-1">
          Manage user misconduct reports, bans, and super admin account suspensions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-divider">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-[13px] font-bold border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-navy-900 text-navy-900'
                : 'border-transparent text-secondary-text hover:text-navy-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Admin Accounts tab */}
      {tab === 'admins' && (
        <GlassCard className="overflow-hidden">
          <div className="px-5 py-3 border-b border-divider flex items-center gap-2">
            <Users size={15} className="text-secondary-text" />
            <p className="text-[13px] font-bold text-navy-900">Super Admin Accounts</p>
          </div>
          {adminsQuery.isLoading && (
            <p className="p-5 text-[13px] text-secondary-text">Loading…</p>
          )}
          {adminsQuery.error && (
            <p className="p-5 text-[13px] font-semibold text-danger">
              {adminsQuery.error instanceof Error ? adminsQuery.error.message : 'Failed to load'}
            </p>
          )}
          <div className="divide-y divide-divider">
            {(adminsQuery.data ?? []).map((admin) => (
              <AdminRow key={admin.id} admin={admin} />
            ))}
          </div>
        </GlassCard>
      )}

      {/* Reports tab */}
      {tab === 'reports' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {['open', 'reviewed', 'dismissed', 'banned', ''].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setReportStatusFilter(s)}
                className={`px-3 py-1.5 text-[12px] font-bold rounded-lg border transition-colors ${
                  reportStatusFilter === s
                    ? 'bg-navy-900 text-white border-navy-900'
                    : 'border-divider text-navy-900 hover:bg-canvas'
                }`}
              >
                {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <GlassCard className="overflow-hidden">
            {reportsQuery.isLoading && (
              <p className="p-5 text-[13px] text-secondary-text">Loading reports…</p>
            )}
            {reportsQuery.error && (
              <p className="p-5 text-[13px] font-semibold text-danger">
                {reportsQuery.error instanceof Error ? reportsQuery.error.message : 'Failed to load'}
              </p>
            )}
            {!reportsQuery.isLoading &&
              (reportsQuery.data?.items ?? []).length === 0 && (
                <p className="p-5 text-[13px] text-secondary-text flex items-center gap-2">
                  <AlertTriangle size={14} />
                  No {reportStatusFilter || ''} reports found.
                </p>
              )}
            <div className="divide-y divide-divider">
              {(reportsQuery.data?.items ?? []).map((r) => (
                <ReportRow key={r.id} report={r} />
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Bans tab */}
      {tab === 'bans' && (
        <GlassCard className="overflow-hidden">
          {bansQuery.isLoading && (
            <p className="p-5 text-[13px] text-secondary-text">Loading bans…</p>
          )}
          {bansQuery.error && (
            <p className="p-5 text-[13px] font-semibold text-danger">
              {bansQuery.error instanceof Error ? bansQuery.error.message : 'Failed to load'}
            </p>
          )}
          {!bansQuery.isLoading && (bansQuery.data?.items ?? []).length === 0 && (
            <p className="p-5 text-[13px] text-secondary-text">No active user bans.</p>
          )}
          <div className="divide-y divide-divider">
            {(bansQuery.data?.items ?? []).map((b) => (
              <BanRow key={b.id} ban={b} />
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}

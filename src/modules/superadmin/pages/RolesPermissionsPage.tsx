import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatusPill } from '../../../shared/components/StatusPill'
import { invitePlatformAdmin, listPlatformAdmins } from '../api/serviceRequestApi'

const inputClass =
  'w-full rounded-lg border border-divider bg-white px-3 py-2.5 text-[13px] text-navy-900 outline-none focus:border-lemon-500'

export function RolesPermissionsPage() {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['super-admin', 'platform-admins'],
    queryFn: listPlatformAdmins,
  })

  const invite = useMutation({
    mutationFn: () => invitePlatformAdmin(email.trim()),
    onSuccess: () => {
      setEmail('')
      setErrorMsg('')
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'platform-admins'] })
    },
    onError: (err: Error) => setErrorMsg(err.message),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-navy-900">Roles &amp; permissions</h1>
        <p className="text-[13.5px] text-secondary-text mt-1">
          Platform super-admin accounts.
        </p>
      </div>

      <GlassCard className="p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            className={inputClass}
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="button"
            disabled={!email.trim() || invite.isPending}
            onClick={() => invite.mutate()}
            className="rounded-lg bg-navy-900 px-4 py-2.5 text-[12.5px] font-bold text-white disabled:opacity-50"
          >
            {invite.isPending ? 'Inviting…' : 'Invite admin'}
          </button>
        </div>
        {errorMsg && (
          <p className="mt-3 text-[12.5px] font-semibold text-danger">{errorMsg}</p>
        )}
      </GlassCard>

      <GlassCard className="overflow-hidden">
        {isLoading && <p className="p-5 text-[13px] text-secondary-text">Loading admins…</p>}
        {error && (
          <p className="p-5 text-[13px] font-semibold text-danger">
            {error instanceof Error ? error.message : 'Failed to load'}
          </p>
        )}
        {!isLoading && data.length === 0 && (
          <p className="p-5 text-[13px] text-secondary-text">No platform admins found.</p>
        )}
        <ul className="divide-y divide-divider">
          {data.map((admin) => (
            <li key={admin.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="text-[14px] font-extrabold text-navy-900">{admin.email}</p>
                <p className="text-[12px] text-secondary-text mt-0.5">
                  Joined {new Date(admin.created_at).toLocaleString()}
                </p>
              </div>
              <StatusPill label={admin.role} tone="info" />
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  )
}

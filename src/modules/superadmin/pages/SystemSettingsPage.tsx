import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { listSettings, updateSetting } from '../api/serviceRequestApi'

const inputClass =
  'w-full rounded-lg border border-divider bg-white px-3 py-2.5 text-[13px] text-navy-900 outline-none focus:border-lemon-500'

export function SystemSettingsPage() {
  const queryClient = useQueryClient()
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['super-admin', 'settings'],
    queryFn: listSettings,
  })
  const [draftOverrides, setDraftOverrides] = useState<Record<string, string>>({})

  const save = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => updateSetting(key, value),
    onSuccess: (_result, variables) => {
      setDraftOverrides((prev) => {
        const next = { ...prev }
        delete next[variables.key]
        return next
      })
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'settings'] })
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-navy-900">System settings</h1>
        <p className="text-[13.5px] text-secondary-text mt-1">
          Edit platform configuration values.
        </p>
      </div>

      <GlassCard className="overflow-hidden">
        {isLoading && <p className="p-5 text-[13px] text-secondary-text">Loading settings…</p>}
        {error && (
          <p className="p-5 text-[13px] font-semibold text-danger">
            {error instanceof Error ? error.message : 'Failed to load'}
          </p>
        )}
        {!isLoading && data.length === 0 && (
          <p className="p-5 text-[13px] text-secondary-text">No settings configured yet.</p>
        )}
        <div className="divide-y divide-divider">
          {data.map((item) => {
            const value = draftOverrides[item.key] ?? item.value
            return (
              <div
                key={item.id}
                className="grid gap-3 p-4 md:grid-cols-[1.2fr_1.6fr_auto] md:items-center"
              >
                <div>
                  <p className="text-[13px] font-extrabold text-navy-900">{item.key}</p>
                  <p className="text-[11.5px] text-secondary-text">{item.description || '—'}</p>
                </div>
                <input
                  className={inputClass}
                  value={value}
                  onChange={(e) =>
                    setDraftOverrides((prev) => ({ ...prev, [item.key]: e.target.value }))
                  }
                />
                <button
                  type="button"
                  disabled={save.isPending}
                  onClick={() => save.mutate({ key: item.key, value })}
                  className="rounded-lg bg-navy-900 px-4 py-2.5 text-[12.5px] font-bold text-white"
                >
                  Save
                </button>
              </div>
            )
          })}
        </div>
      </GlassCard>
    </div>
  )
}

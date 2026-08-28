import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import {
  createSiteContent,
  listSiteContent,
  updateSiteContent,
  upsertAnnouncement,
} from '../api/serviceRequestApi'

const inputClass =
  'w-full rounded-lg border border-divider bg-white px-3 py-2.5 text-[13px] text-navy-900 outline-none focus:border-lemon-500'

export function LandingContentPage() {
  const queryClient = useQueryClient()
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['super-admin', 'site-content'],
    queryFn: listSiteContent,
  })
  const [draft, setDraft] = useState({ key: '', value: '' })
  const announcement = data.find((b) => b.key === 'announcement_banner')
  const [announcementValueOverride, setAnnouncementValueOverride] = useState<string | null>(null)

  const announcementValue = announcementValueOverride ?? announcement?.value ?? ''
  const announcementActive = announcement?.is_active ?? false

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['super-admin', 'site-content'] })
    // Landing page reads this key — drop the cache so activate/deactivate shows immediately.
    queryClient.invalidateQueries({ queryKey: ['public', 'site-content'] })
  }

  const create = useMutation({
    mutationFn: createSiteContent,
    onSuccess: () => {
      setDraft({ key: '', value: '' })
      invalidateAll()
    },
  })

  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateSiteContent>[1] }) =>
      updateSiteContent(id, body),
    onSuccess: invalidateAll,
  })

  const announce = useMutation({
    mutationFn: (body: { value: string; is_active: boolean }) => upsertAnnouncement(body),
    onSuccess: () => {
      setAnnouncementValueOverride(null)
      invalidateAll()
    },
  })

  const blocks = data.filter((b) => b.key !== 'announcement_banner')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-navy-900">Landing page content</h1>
        <p className="text-[13.5px] text-secondary-text mt-1">
          The announcement banner section below is what appears on the public landing page.
          Other content blocks are stored for future use and are not shown on the site yet.
        </p>
      </div>

      <GlassCard className="p-5 space-y-3">
        <h2 className="text-[14px] font-extrabold text-navy-900">Announcement banner</h2>
        <p className="text-[12px] text-secondary-text">
          Key: <code className="font-semibold">announcement_banner</code>
        </p>
        <textarea
          className={inputClass}
          rows={3}
          placeholder="Banner message shown on the marketing landing page"
          value={announcementValue}
          onChange={(e) => setAnnouncementValueOverride(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!announcementValue.trim() || announce.isPending}
            onClick={() =>
              announce.mutate({
                value: announcementValue,
                is_active: !announcementActive,
              })
            }
            className={`rounded-lg px-3 py-2 text-[12px] font-bold disabled:opacity-50 ${
              announcementActive ? 'bg-leaf-50 text-leaf-700' : 'bg-danger-bg text-danger'
            }`}
          >
            {announce.isPending
              ? 'Saving…'
              : announcementActive
                ? 'Active — click to deactivate'
                : 'Inactive — click to activate'}
          </button>
          <button
            type="button"
            disabled={!announcementValue.trim() || announce.isPending}
            onClick={() =>
              announce.mutate({
                value: announcementValue,
                is_active: announcement ? announcementActive : true,
              })
            }
            className="rounded-lg bg-navy-900 px-4 py-2.5 text-[12.5px] font-bold text-white disabled:opacity-50"
          >
            {announce.isPending ? 'Saving…' : 'Save text'}
          </button>
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <div className="grid md:grid-cols-[1fr_1.5fr_auto] gap-3">
          <input
            className={inputClass}
            placeholder="content_key"
            value={draft.key}
            onChange={(e) => setDraft({ ...draft, key: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Value"
            value={draft.value}
            onChange={(e) => setDraft({ ...draft, value: e.target.value })}
          />
          <button
            type="button"
            onClick={() =>
              create.mutate({ key: draft.key, value: draft.value, is_active: true })
            }
            className="rounded-lg bg-navy-900 px-4 py-2.5 text-[12.5px] font-bold text-white"
          >
            Add
          </button>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        {isLoading && <p className="p-5 text-[13px] text-secondary-text">Loading content…</p>}
        {error && (
          <p className="p-5 text-[13px] font-semibold text-danger">
            {error instanceof Error ? error.message : 'Failed to load'}
          </p>
        )}
        <div className="divide-y divide-divider">
          {blocks.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 p-4 md:grid-cols-[1fr_1.6fr_auto] md:items-center"
            >
              <div>
                <p className="text-[13px] font-extrabold text-navy-900">{item.key}</p>
                <p className="text-[11.5px] text-secondary-text">
                  Updated {new Date(item.updated_at).toLocaleString()}
                </p>
              </div>
              <input
                className={inputClass}
                defaultValue={item.value}
                onBlur={(e) =>
                  patch.mutate({ id: item.id, body: { value: e.target.value } })
                }
              />
              <button
                type="button"
                disabled={patch.isPending}
                onClick={() =>
                  patch.mutate({ id: item.id, body: { is_active: !item.is_active } })
                }
                className={`rounded-lg px-3 py-2 text-[12px] font-bold disabled:opacity-50 ${
                  item.is_active ? 'bg-leaf-50 text-leaf-700' : 'bg-danger-bg text-danger'
                }`}
              >
                {item.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
          ))}
          {!isLoading && blocks.length === 0 && (
            <p className="p-5 text-[13px] text-secondary-text">No extra content blocks yet.</p>
          )}
        </div>
      </GlassCard>
    </div>
  )
}

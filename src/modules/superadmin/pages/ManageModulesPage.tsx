import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { createModule, listModules, updateModule } from '../api/serviceRequestApi'

export function ManageModulesPage() {
  const queryClient = useQueryClient()
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['super-admin', 'modules'],
    queryFn: listModules,
  })
  const [draft, setDraft] = useState({
    key: '',
    display_name: '',
    description: '',
    annual_price: 0,
    currency: 'USD',
  })
  const save = useMutation({
    mutationFn: createModule,
    onSuccess: () => {
      setDraft({ key: '', display_name: '', description: '', annual_price: 0, currency: 'USD' })
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'modules'] })
    },
  })
  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateModule>[1] }) =>
      updateModule(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin', 'modules'] }),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-navy-900">Manage modules</h1>
        <p className="text-[13.5px] text-secondary-text mt-1">
          Edit module descriptions, annual prices, and availability for new requests.
        </p>
      </div>

      <GlassCard className="p-5">
        <div className="grid md:grid-cols-[1fr_1fr_120px_90px_auto] gap-3">
          <input className={inputClass} placeholder="module_key" value={draft.key} onChange={(e) => setDraft({ ...draft, key: e.target.value })} />
          <input className={inputClass} placeholder="Display name" value={draft.display_name} onChange={(e) => setDraft({ ...draft, display_name: e.target.value })} />
          <input className={inputClass} type="number" min={0} placeholder="Price" value={draft.annual_price} onChange={(e) => setDraft({ ...draft, annual_price: Number(e.target.value) })} />
          <input className={inputClass} placeholder="USD" value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })} />
          <button
            type="button"
            onClick={() => save.mutate({ ...draft, is_active: true, is_core: false })}
            className="rounded-lg bg-navy-900 px-4 py-2.5 text-[12.5px] font-bold text-white"
          >
            Add
          </button>
        </div>
        <textarea className={`${inputClass} mt-3`} rows={2} placeholder="Short description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
      </GlassCard>

      <GlassCard className="overflow-hidden">
        {isLoading && <p className="p-5 text-[13px] text-secondary-text">Loading modules...</p>}
        {error && <p className="p-5 text-[13px] font-semibold text-danger">{error instanceof Error ? error.message : 'Failed to load'}</p>}
        <div className="divide-y divide-divider">
          {data.map((item) => (
            <div key={item.id} className="grid gap-3 p-4 md:grid-cols-[1.2fr_1.6fr_120px_110px_auto] md:items-center">
              <div>
                <p className="text-[13px] font-extrabold text-navy-900">{item.display_name}</p>
                <p className="text-[11.5px] text-secondary-text">{item.key}</p>
              </div>
              <input className={inputClass} defaultValue={item.description} onBlur={(e) => patch.mutate({ id: item.id, body: { description: e.target.value } })} />
              <input className={inputClass} type="number" min={0} defaultValue={Number(item.annual_price)} onBlur={(e) => patch.mutate({ id: item.id, body: { annual_price: Number(e.target.value) } })} />
              <span className="text-[12px] font-bold text-secondary-text">{item.currency} / year</span>
              <button
                type="button"
                onClick={() => patch.mutate({ id: item.id, body: { is_active: !item.is_active } })}
                className={`rounded-lg px-3 py-2 text-[12px] font-bold ${item.is_active ? 'bg-leaf-50 text-leaf-700' : 'bg-danger-bg text-danger'}`}
              >
                {item.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-divider bg-white px-3 py-2.5 text-[13px] text-navy-900 outline-none focus:border-lemon-500'

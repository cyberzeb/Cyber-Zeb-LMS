import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Loader2, Lock, Plus } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { Button } from '../../../shared/components/Button'
import { createModule, listModules, updateModule } from '../api/serviceRequestApi'
import type { ModuleCatalogItem } from '../types'

/**
 * Invoice estimates add up the prices of the requested modules, so the whole
 * catalog is priced in one currency. Changing it here updates every module.
 */
const CURRENCIES = [
  { value: 'ETB', label: 'ETB — Ethiopian Birr' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
]

const EMPTY_DRAFT = { key: '', display_name: '', description: '', annual_price: '' }

type ModulePatch = Parameters<typeof updateModule>[1]

/** The currency most modules use — the catalog's currency. */
function catalogCurrencyOf(items: ModuleCatalogItem[]): string {
  const counts = new Map<string, number>()
  for (const item of items) counts.set(item.currency, (counts.get(item.currency) ?? 0) + 1)
  let best = 'USD'
  let bestCount = 0
  for (const [currency, count] of counts) {
    if (count > bestCount) {
      best = currency
      bestCount = count
    }
  }
  return best
}

export function ManageModulesPage() {
  const queryClient = useQueryClient()
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['super-admin', 'modules'],
    queryFn: listModules,
  })
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [addError, setAddError] = useState('')
  const [rowError, setRowError] = useState('')
  const [notice, setNotice] = useState('')

  const catalogCurrency = catalogCurrencyOf(data)
  const mixedCurrencies = new Set(data.map((m) => m.currency)).size > 1
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['super-admin', 'modules'] })

  const save = useMutation({
    mutationFn: createModule,
    onSuccess: (item) => {
      setDraft(EMPTY_DRAFT)
      setNotice(`${item.display_name} added.`)
      invalidate()
    },
    onError: (e: Error) => setAddError(e.message),
  })

  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ModulePatch }) => updateModule(id, body),
    onSuccess: () => {
      setRowError('')
      invalidate()
    },
    onError: (e: Error) => setRowError(e.message),
  })

  const changeCurrency = useMutation({
    mutationFn: async (currency: string) => {
      // One at a time: concurrent writes can be lost on the SQLite deployments.
      for (const item of data.filter((m) => m.currency !== currency)) {
        await updateModule(item.id, { currency })
      }
      return currency
    },
    onSuccess: (currency) => {
      setRowError('')
      setNotice(`All module prices are now in ${currency}.`)
    },
    onError: (e: Error) => setRowError(e.message),
    // Refresh even after a partial failure so the page shows what was saved.
    onSettled: invalidate,
  })

  function handleAdd() {
    setAddError('')
    setNotice('')
    const key = draft.key.trim()
    const price = Number(draft.annual_price || 0)
    if (!/^[a-z0-9_]{2,80}$/.test(key)) {
      setAddError('Module key must be 2–80 characters: lowercase letters, numbers or underscores.')
      return
    }
    if (!draft.display_name.trim()) {
      setAddError('Display name is required.')
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      setAddError('Price must be zero or more.')
      return
    }
    save.mutate({
      key,
      display_name: draft.display_name.trim(),
      description: draft.description.trim(),
      annual_price: price,
      currency: catalogCurrency,
      is_active: true,
      is_core: false,
    })
  }

  /** Save one field, and only when it actually changed. */
  function saveField(item: ModuleCatalogItem, body: ModulePatch) {
    setNotice('')
    const changed = Object.entries(body).some(([field, value]) => {
      const current = item[field as keyof ModuleCatalogItem]
      return field === 'annual_price' ? Number(current) !== value : current !== value
    })
    if (changed) patch.mutate({ id: item.id, body })
  }

  const catalogOptions = CURRENCIES.some((c) => c.value === catalogCurrency)
    ? CURRENCIES
    : [{ value: catalogCurrency, label: catalogCurrency }, ...CURRENCIES]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-extrabold text-navy-900">Manage modules</h1>
          <p className="text-[13.5px] text-secondary-text mt-1">
            Edit module descriptions, annual prices, and availability for new requests.
          </p>
        </div>
        <label className="flex items-center gap-2.5">
          <span className="whitespace-nowrap text-[12px] font-bold text-secondary-text">Pricing currency</span>
          <select
            className={`${inputClass} w-auto min-w-[190px] cursor-pointer`}
            value={catalogCurrency}
            disabled={isLoading || !data.length || changeCurrency.isPending}
            onChange={(e) => {
              setNotice('')
              changeCurrency.mutate(e.target.value)
            }}
          >
            {catalogOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {changeCurrency.isPending ? (
            <Loader2 size={15} className="animate-spin text-secondary-text" />
          ) : null}
        </label>
      </div>

      {mixedCurrencies && !changeCurrency.isPending ? (
        <p className="rounded-lg bg-warning-bg px-3.5 py-2.5 text-[12.5px] font-semibold text-warning">
          Some modules are priced in a different currency, so invoice estimates would be wrong.
          Pick the pricing currency above to put every module in one currency.
        </p>
      ) : null}
      {rowError ? (
        <p className="rounded-lg bg-danger-bg px-3.5 py-2.5 text-[12.5px] font-semibold text-danger">
          {rowError}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-lg bg-success-bg px-3.5 py-2.5 text-[12.5px] font-semibold text-success">
          {notice}
        </p>
      ) : null}

      <GlassCard className="p-5">
        <p className="mb-3 text-[13px] font-extrabold text-navy-900">Add a module</p>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_160px_auto]">
          <input
            className={inputClass}
            placeholder="module_key"
            value={draft.key}
            onChange={(e) => setDraft({ ...draft, key: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Display name"
            value={draft.display_name}
            onChange={(e) => setDraft({ ...draft, display_name: e.target.value })}
          />
          <div className="relative">
            <input
              className={`${inputClass} pr-14`}
              type="number"
              min={0}
              placeholder="Annual price"
              value={draft.annual_price}
              onChange={(e) => setDraft({ ...draft, annual_price: e.target.value })}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11.5px] font-bold text-secondary-text">
              {catalogCurrency}
            </span>
          </div>
          <Button type="button" onClick={handleAdd} disabled={save.isPending} className="justify-center">
            {save.isPending ? (
              <Loader2 size={14} className="mr-1.5 animate-spin" />
            ) : (
              <Plus size={14} className="mr-1.5" />
            )}
            Add
          </Button>
        </div>
        <textarea
          className={`${inputClass} mt-3`}
          rows={2}
          placeholder="Short description"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
        {addError ? (
          <p className="mt-3 rounded-lg bg-danger-bg px-3 py-2 text-[12.5px] font-semibold text-danger">
            {addError}
          </p>
        ) : null}
      </GlassCard>

      <GlassCard className="overflow-hidden">
        {isLoading && <p className="p-5 text-[13px] text-secondary-text">Loading modules...</p>}
        {error && (
          <p className="p-5 text-[13px] font-semibold text-danger">
            {error instanceof Error ? error.message : 'Failed to load modules'}
          </p>
        )}
        <div className="divide-y divide-divider">
          {data.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 p-4 md:grid-cols-[1.2fr_1.6fr_170px_auto] md:items-center"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[13px] font-extrabold text-navy-900">
                  {item.display_name}
                  {item.is_core ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-secondary-text">
                      <Lock size={9} /> Core
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-[11.5px] text-secondary-text">{item.key}</p>
              </div>
              <input
                className={inputClass}
                defaultValue={item.description}
                aria-label={`${item.display_name} description`}
                onBlur={(e) => saveField(item, { description: e.target.value })}
              />
              <div className="relative">
                <input
                  // Remount when the saved price changes so the field shows it.
                  key={`${item.id}-${item.annual_price}`}
                  className={`${inputClass} pr-[4.5rem]`}
                  type="number"
                  min={0}
                  defaultValue={Number(item.annual_price)}
                  aria-label={`${item.display_name} annual price`}
                  onBlur={(e) => {
                    const value = Number(e.target.value)
                    if (!Number.isFinite(value) || value < 0 || e.target.value === '') {
                      e.target.value = String(Number(item.annual_price))
                      setRowError('Price must be zero or more.')
                      return
                    }
                    saveField(item, { annual_price: value })
                  }}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-secondary-text">
                  {item.currency}/yr
                </span>
              </div>
              <button
                type="button"
                disabled={item.is_core || patch.isPending}
                title={item.is_core ? 'Core modules are always available' : undefined}
                onClick={() => saveField(item, { is_active: !item.is_active })}
                className={`rounded-lg px-3 py-2 text-[12px] font-bold transition-opacity disabled:cursor-not-allowed ${
                  item.is_core ? 'opacity-70' : 'cursor-pointer'
                } ${item.is_active ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'}`}
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

/**
 * Shown when someone opens a part of the workspace their institution did not
 * subscribe to. It explains what the module is and offers to request it, which
 * lands in the Super Admin console's Add-On Requests queue.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Lock, Loader2, CheckCircle2, X } from 'lucide-react'

import { apiClient, apiErrorMessage, activeTenantCode } from '../api/client'
import { MODULE_CATALOG, type ModuleKey } from '../constants/modules'
import { readPortalSession } from '../storage/session'
import { readPersonById } from '../storage/readers'

interface Props {
  moduleKey: ModuleKey
  moduleLabel: string
  onClose: () => void
}

export function ModuleUpsellDialog({ moduleKey, moduleLabel, onClose }: Props) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const description = MODULE_CATALOG.find((m) => m.key === moduleKey)?.description
  const person = (() => {
    const session = readPortalSession()
    return session?.personId ? readPersonById(session.personId) : null
  })()

  async function requestModule() {
    setError(null)
    setSending(true)
    try {
      await apiClient.post(
        '/addon-module-requests',
        {
          tenant_lookup: activeTenantCode(),
          contact_name: person?.name || 'Institution Admin',
          email: person?.email || '',
          requested_modules: [moduleKey],
          message: `Requested from the workspace: ${moduleLabel}`,
        },
        { headers: { 'Idempotency-Key': crypto.randomUUID() } },
      )
      setSent(true)
    } catch (err) {
      setError(apiErrorMessage(err) ?? 'Could not send the request. Please try again.')
    } finally {
      setSending(false)
    }
  }

  // Portalled to <body>: rendered inside the sticky sidebar, the dialog would be
  // trapped in its stacking context and the page content would paint over it.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/40 dark:bg-black/60 backdrop-blur-sm p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="module-upsell-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/80 dark:border-divider bg-white dark:bg-[#0a121e] p-6 text-start shadow-[0_24px_70px_-12px_rgba(27,35,64,0.45)] dark:shadow-[0_24px_70px_-12px_rgba(0,0,0,0.65)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lemon-500/15 text-lemon-700 dark:text-lemon-500">
              {sent ? <CheckCircle2 size={19} /> : <Lock size={18} />}
            </span>
            <h2 id="module-upsell-title" className="text-[16px] font-extrabold text-navy-900">
              {sent ? 'Request sent' : moduleLabel}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-secondary-text hover:text-navy-900 cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {sent ? (
          <p className="mt-4 text-[13.5px] text-secondary-text leading-relaxed">
            Cyber-Zeb has your request for <strong>{moduleLabel}</strong>. They will send a
            quote, and the module appears here once it is activated.
          </p>
        ) : (
          <>
            <p className="mt-4 text-[13.5px] text-secondary-text leading-relaxed">
              {description ? `${description} ` : ''}
              This module is not part of your institution&rsquo;s subscription yet.
            </p>
            {error ? (
              <p className="mt-4 rounded-lg bg-danger-bg px-3.5 py-2.5 text-[13px] font-semibold text-danger">
                {error}
              </p>
            ) : null}
          </>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-[13px] font-bold text-secondary-text hover:text-navy-900 cursor-pointer"
          >
            {sent ? 'Done' : 'Not now'}
          </button>
          {sent ? null : (
            <button
              type="button"
              onClick={() => void requestModule()}
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-xl bg-lemon-500 px-5 py-2.5 text-[13px] font-bold text-[#020810] hover:bg-lemon-400 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : null}
              {sending ? 'Sending…' : 'Request this module'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

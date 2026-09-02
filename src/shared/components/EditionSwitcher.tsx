import { useState } from 'react'
import { Building2, Check, ChevronUp } from 'lucide-react'
import { useOrganizationConfig } from '../config/useOrganizationConfig'
import { setActiveEdition } from '../config/tenant'
import type { BeranaEdition } from '../config/editions/types'

const EDITIONS: { edition: BeranaEdition; label: string; hint: string }[] = [
  { edition: 'university', label: 'University Edition', hint: 'Berana University' },
  { edition: 'corporate', label: 'Corporate Edition', hint: 'Horizon Bank' },
  { edition: 'training_organization', label: 'Training Edition', hint: 'Apex Training Institute' },
]

/**
 * Demo/preview control for switching the active edition at runtime.
 * In production the edition is resolved from the tenant subdomain; this switcher
 * is a convenience for demos and QA. Hidden when `VITE_HIDE_EDITION_SWITCHER=1`.
 */
export function EditionSwitcher() {
  const [open, setOpen] = useState(false)
  const org = useOrganizationConfig()

  if (import.meta.env.VITE_HIDE_EDITION_SWITCHER === '1') return null

  const current = EDITIONS.find((e) => e.edition === org.edition) ?? EDITIONS[0]

  return (
    <div className="fixed bottom-4 right-4 z-[9999] text-left">
      {open && (
        <div className="mb-2 w-64 rounded-xl border border-divider bg-white shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-divider">
            <p className="text-[11px] uppercase tracking-wider font-bold text-secondary-text">
              Switch edition
            </p>
            <p className="text-[10.5px] text-secondary-text mt-0.5">
              Preview each tenant type. Resets demo view only.
            </p>
          </div>
          <ul>
            {EDITIONS.map((e) => (
              <li key={e.edition}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveEdition(e.edition)
                    setOpen(false)
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-canvas transition-colors cursor-pointer"
                >
                  <span>
                    <span className="block text-[13px] font-bold text-navy-900">{e.label}</span>
                    <span className="block text-[11px] text-secondary-text">{e.hint}</span>
                  </span>
                  {e.edition === org.edition ? (
                    <Check size={16} className="text-success shrink-0" />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-navy-900 text-white pl-3 pr-3.5 py-2 shadow-lg hover:bg-navy-800 transition-colors cursor-pointer"
        title="Switch edition (demo)"
      >
        <Building2 size={15} className="text-lemon-500" />
        <span className="text-[12px] font-bold">{current.label.replace(' Edition', '')}</span>
        <ChevronUp
          size={14}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
    </div>
  )
}

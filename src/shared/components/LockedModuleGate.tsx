/**
 * Stops a locked module's page from rendering when it is opened directly (by
 * URL, bookmark or an in-page link) rather than through the sidebar, which
 * already shows it locked. The API refuses its data either way; this replaces a
 * half-empty page with an explanation and a way to request the module.
 */
import { useState, type ReactNode } from 'react'
import { Lock } from 'lucide-react'

import { useTenantModules } from '../hooks/useTenantModules'
import { useLanguage } from '../i18n/LanguageProvider'
import type { NavSection } from '../layout/Sidebar'
import type { ModuleKey } from '../constants/modules'
import { ModuleUpsellDialog } from './ModuleUpsellDialog'

interface Props {
  path: string
  sections: NavSection[]
  children: ReactNode
}

/** The nav entry that owns this path: the longest `to` it equals or sits under. */
function owningItem(path: string, sections: NavSection[]) {
  let best: NavSection['items'][number] | null = null
  for (const section of sections) {
    for (const item of section.items) {
      if (!item.to) continue
      const matches = path === item.to || path.startsWith(`${item.to}/`)
      if (matches && (!best || item.to.length > (best.to?.length ?? 0))) best = item
    }
  }
  return best
}

export function LockedModuleGate({ path, sections, children }: Props) {
  const { tx } = useLanguage()
  const { isLocked, labels } = useTenantModules()
  const [requesting, setRequesting] = useState(false)

  const item = owningItem(path, sections)
  if (!item?.module || !isLocked(item.module)) return <>{children}</>

  const moduleKey = item.module as ModuleKey
  const label = labels[moduleKey] ?? tx(item.label)

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lemon-500/15 text-lemon-700 dark:text-lemon-500">
          <Lock size={24} />
        </span>
        <h1 className="mt-5 text-[20px] font-extrabold text-navy-900">{label}</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-secondary-text">
          This module is not part of your institution&rsquo;s subscription yet. Request it and
          Cyber-Zeb will send a quote; it appears here once activated.
        </p>
        <button
          type="button"
          onClick={() => setRequesting(true)}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-lemon-500 px-5 py-2.5 text-[13px] font-bold text-[#020810] hover:bg-lemon-400 transition-colors cursor-pointer"
        >
          Request this module
        </button>
      </div>
      {requesting ? (
        <ModuleUpsellDialog
          moduleKey={moduleKey}
          moduleLabel={label}
          onClose={() => setRequesting(false)}
        />
      ) : null}
    </div>
  )
}

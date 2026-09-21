/**
 * Read-only view of the Institution Master Data a registering institution
 * submitted, in the order the collection guide lists its ten groups.
 *
 * It renders whatever the API returned rather than a fixed field list, so a new
 * field added to the guide shows up here without another change.
 */
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import {
  MASTER_DATA_FIELD_LABELS,
  MASTER_DATA_SECTIONS,
} from '../../marketing/masterData'

interface Props {
  masterData: Record<string, unknown> | null
  institutionRef?: string | null
}

function formatValue(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.length ? value.join(', ') : null
  if (typeof value === 'string') {
    // Enum values arrive as snake_case ("semi_annual"); show them as words.
    return /^[a-z0-9]+(_[a-z0-9]+)+$/.test(value) ? value.replace(/_/g, ' ') : value
  }
  return String(value)
}

function fieldLabel(key: string): string {
  return (
    MASTER_DATA_FIELD_LABELS[key] ??
    key.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())
  )
}

export function MasterDataPanel({ masterData, institutionRef }: Props) {
  const [open, setOpen] = useState(true)

  if (!masterData) {
    return (
      <div className="rounded-xl bg-canvas p-4 text-[13px] text-secondary-text">
        <p className="font-bold text-navy-900 mb-1">Institution master data</p>
        <p>
          This request was submitted without a master data record — either before the
          registration page existed, or as a short enquiry.
        </p>
      </div>
    )
  }

  const sections = MASTER_DATA_SECTIONS.map((section) => {
    const raw = masterData[section.key] as Record<string, unknown> | undefined
    const entries = raw
      ? Object.entries(raw)
          .map(([key, value]) => [key, formatValue(value)] as const)
          .filter((entry): entry is readonly [string, string] => entry[1] !== null)
      : []
    return { ...section, entries }
  }).filter((section) => section.entries.length > 0)

  return (
    <section className="rounded-xl border border-divider overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 bg-canvas px-4 py-3 text-start cursor-pointer"
        aria-expanded={open}
      >
        <span>
          <span className="block text-[13px] font-bold text-navy-900">
            Institution master data
          </span>
          {institutionRef ? (
            <span className="block text-[11.5px] text-secondary-text">
              Reference {institutionRef}
            </span>
          ) : null}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-secondary-text transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div className="divide-y divide-divider">
          {sections.map((section) => (
            <div key={section.key} className="px-4 py-3">
              <h3 className="text-[12px] font-bold text-navy-900 mb-2">{section.label}</h3>
              <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {section.entries.map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between gap-3 text-[12.5px]">
                    <dt className="text-secondary-text shrink-0">{fieldLabel(key)}</dt>
                    <dd className="text-navy-900 font-medium text-end break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

/** Small form controls used by the certificate designer panels. */
import type { ReactNode } from 'react'

import { THEME_COLOR_KEYS, resolveColor, type ColorRef, type ThemeColors } from '../templateModel'
import { inputClass } from './styles'

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wide text-secondary-text">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-secondary-text">{hint}</span> : null}
    </div>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-b border-divider px-4 py-4 last:border-b-0">
      <h3 className="text-[12px] font-extrabold text-navy-900">{title}</h3>
      {children}
    </section>
  )
}

export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-full border px-2.5 py-1 text-[11.5px] font-bold transition-colors cursor-pointer ${
            value === o.value
              ? 'border-lemon-500 bg-lemon-500/15 text-lemon-700 dark:text-lemon-500'
              : 'border-divider text-navy-700 dark:text-navy-200 hover:border-lemon-500/50'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: ReactNode; title?: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex rounded-lg border border-divider p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          aria-label={o.title}
          onClick={() => onChange(o.value)}
          className={`flex flex-1 items-center justify-center rounded-md px-2 py-1.5 text-[11.5px] font-bold transition-colors cursor-pointer ${
            value === o.value ? 'bg-lemon-500 text-[#020810]' : 'text-secondary-text hover:text-navy-900'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[12.5px] font-semibold text-navy-900">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer ${checked ? 'bg-lemon-500' : 'bg-navy-200 dark:bg-navy-700'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10.5px] font-bold uppercase tracking-wide text-secondary-text">{label}</span>
      <span className="relative">
        <input
          type="number"
          className={`${inputClass} ${suffix ? 'pr-8' : ''}`}
          value={Number.isFinite(value) ? Math.round(value * 10) / 10 : 0}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (!Number.isFinite(n)) return
            onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n)))
          }}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10.5px] font-bold text-secondary-text">
            {suffix}
          </span>
        ) : null}
      </span>
    </label>
  )
}

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = '',
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  suffix?: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex justify-between text-[10.5px] font-bold uppercase tracking-wide text-secondary-text">
        {label}
        <span className="normal-case text-navy-900">
          {Math.round(value * 10) / 10}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-lemon-500)] cursor-pointer"
      />
    </label>
  )
}

const THEME_LABELS: Record<keyof ThemeColors, string> = {
  background: 'Paper',
  primary: 'Primary',
  accent: 'Accent',
  text: 'Text',
  muted: 'Muted',
}

/**
 * Theme swatches follow palette changes; a custom colour stays fixed. "None"
 * is offered for fills that can be transparent.
 */
export function ColorPicker({
  label,
  value,
  colors,
  onChange,
  allowNone,
}: {
  label: string
  value: ColorRef
  colors: ThemeColors
  onChange: (v: ColorRef) => void
  allowNone?: boolean
}) {
  const isCustom = value.startsWith('#')
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10.5px] font-bold uppercase tracking-wide text-secondary-text">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {allowNone ? (
          <button
            type="button"
            title="None"
            aria-label="No colour"
            onClick={() => onChange('none')}
            className={`h-7 w-7 rounded-md border bg-[linear-gradient(135deg,transparent_45%,#E5484D_45%,#E5484D_55%,transparent_55%)] cursor-pointer ${
              value === 'none' ? 'ring-2 ring-lemon-500 ring-offset-1 ring-offset-transparent border-transparent' : 'border-divider'
            }`}
          />
        ) : null}
        {THEME_COLOR_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            title={`${THEME_LABELS[key]} (theme)`}
            aria-label={`${THEME_LABELS[key]} colour`}
            onClick={() => onChange(key)}
            className={`h-7 w-7 rounded-md border cursor-pointer ${
              value === key ? 'ring-2 ring-lemon-500 ring-offset-1 ring-offset-transparent border-transparent' : 'border-divider'
            }`}
            style={{ background: colors[key] }}
          />
        ))}
        <label
          title="Custom colour"
          className={`relative h-7 w-7 cursor-pointer overflow-hidden rounded-md border ${
            isCustom ? 'ring-2 ring-lemon-500 ring-offset-1 ring-offset-transparent border-transparent' : 'border-divider'
          }`}
          style={{
            background: isCustom
              ? value
              : 'conic-gradient(#ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, #ef4444)',
          }}
        >
          <input
            type="color"
            aria-label="Custom colour"
            value={isCustom ? value : resolveColor(value, colors).startsWith('#') ? resolveColor(value, colors) : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  )
}

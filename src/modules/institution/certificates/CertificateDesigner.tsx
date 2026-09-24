/**
 * Full-screen certificate template designer: grouped controls on the left, a
 * live preview on the right. Start from any preset, then change anything.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronDown,
  Download,
  ImagePlus,
  Loader2,
  Palette,
  PenLine,
  Plus,
  Save,
  Sparkles,
  Stamp,
  Trash2,
  Type,
  LayoutTemplate,
  ShieldCheck,
  X,
} from 'lucide-react'

import { Button } from '../../../shared/components/Button'
import { CertificateArt } from './CertificateArt'
import { downloadCertificatePdf } from './certificatePdf'
import {
  FONT_STACKS,
  PAGE_SIZE,
  PLACEHOLDERS,
  PRESET_TEMPLATES,
  newId,
  sampleCertificateData,
  type CertificateTemplateDesign,
  type FontKey,
  type FrameStyle,
  type PatternStyle,
  type SealStyle,
} from './templateModel'

interface Props {
  initial: CertificateTemplateDesign
  institutionName: string
  onSave: (template: CertificateTemplateDesign) => void
  onClose: () => void
}

type TextField = keyof CertificateTemplateDesign['text']

const FRAMES: { value: FrameStyle; label: string }[] = [
  { value: 'classic', label: 'Classic' },
  { value: 'double', label: 'Double gold' },
  { value: 'ornate', label: 'Ornate corners' },
  { value: 'band', label: 'Header band' },
  { value: 'modern', label: 'Modern edge' },
  { value: 'geometric', label: 'Geometric' },
  { value: 'none', label: 'None' },
]

const PATTERNS: { value: PatternStyle; label: string }[] = [
  { value: 'guilloche', label: 'Guilloche' },
  { value: 'waves', label: 'Waves' },
  { value: 'radial', label: 'Sunburst' },
  { value: 'dots', label: 'Dots' },
  { value: 'diagonal', label: 'Pinstripe' },
  { value: 'grid', label: 'Blueprint' },
  { value: 'none', label: 'None' },
]

const SEALS: { value: SealStyle; label: string }[] = [
  { value: 'rosette', label: 'Rosette' },
  { value: 'ribbon', label: 'Ribbon' },
  { value: 'stamp', label: 'Stamp' },
  { value: 'star', label: 'Star' },
  { value: 'none', label: 'None' },
]

const PALETTES: { name: string; colors: CertificateTemplateDesign['colors'] }[] = [
  { name: 'Ivory & gold', colors: { background: '#FFFDF7', primary: '#1B2340', accent: '#B8913A', text: '#1B2340', muted: '#5B6478' } },
  { name: 'Berana lime', colors: { background: '#FFFFFF', primary: '#0F1B3D', accent: '#A3CF3F', text: '#0F1B3D', muted: '#5B6478' } },
  { name: 'Emerald', colors: { background: '#F6FBF7', primary: '#0B4F3C', accent: '#C8A04A', text: '#12352A', muted: '#4E6B60' } },
  { name: 'Burgundy', colors: { background: '#FFFBF5', primary: '#6B1530', accent: '#C9A23F', text: '#3A0C1A', muted: '#7A5A63' } },
  { name: 'Ocean', colors: { background: '#F4F9FD', primary: '#0B3C5D', accent: '#1FA2C8', text: '#0B2A40', muted: '#5A7385' } },
  { name: 'Midnight', colors: { background: '#0E1A33', primary: '#7DD3FC', accent: '#A3E635', text: '#E6F0FF', muted: '#9FB3D1' } },
  { name: 'Sunset', colors: { background: '#FFF8F1', primary: '#7C2D12', accent: '#F97316', text: '#431407', muted: '#8A5A44' } },
  { name: 'Mono', colors: { background: '#FFFFFF', primary: '#111111', accent: '#E4572E', text: '#111111', muted: '#6B6B6B' } },
]

const COLOR_FIELDS: { key: keyof CertificateTemplateDesign['colors']; label: string }[] = [
  { key: 'background', label: 'Paper' },
  { key: 'primary', label: 'Primary' },
  { key: 'accent', label: 'Accent' },
  { key: 'text', label: 'Text' },
  { key: 'muted', label: 'Muted' },
]

const inputClass =
  'w-full rounded-lg border border-divider bg-white px-3 py-2 text-[13px] text-navy-900 outline-none focus:border-lemon-500/60 focus:ring-2 focus:ring-lemon-500/20'

/** Read an image file, shrink it to fit, and return a PNG data URL. */
async function imageToDataUrl(file: File, maxW: number, maxH: number): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Images must be smaller than 5 MB.')
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('That image could not be read.'))
      image.src = url
    })
    const ratio = Math.min(1, maxW / img.width, maxH / img.height)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * ratio)
    canvas.height = Math.round(img.height * ratio)
    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function CertificateDesigner({ initial, institutionName, onSave, onClose }: Props) {
  const [t, setT] = useState<CertificateTemplateDesign>(() => structuredClone(initial))
  const [open, setOpen] = useState<string>('style')
  const [focusedField, setFocusedField] = useState<TextField>('body')
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const fieldRefs = useRef<Partial<Record<TextField, HTMLInputElement | HTMLTextAreaElement | null>>>({})
  const sample = sampleCertificateData(institutionName)
  const dirty = JSON.stringify(t) !== JSON.stringify(initial)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const patch = (p: Partial<CertificateTemplateDesign>) => setT((cur) => ({ ...cur, ...p }))
  const patchText = (field: TextField, value: string) =>
    setT((cur) => ({ ...cur, text: { ...cur.text, [field]: value } }))

  function applyPreset(preset: CertificateTemplateDesign) {
    // Keep identity and the admin's own content; take the look.
    setT((cur) => ({
      ...structuredClone(preset),
      id: cur.id,
      name: cur.name,
      description: cur.description,
      builtIn: cur.builtIn,
      isDefault: cur.isDefault,
      logo: cur.logo,
      monogram: cur.monogram,
      signatories: cur.signatories,
    }))
  }

  function insertPlaceholder(token: string) {
    const field = focusedField
    const el = fieldRefs.current[field]
    const current = t.text[field]
    const start = el?.selectionStart ?? current.length
    const end = el?.selectionEnd ?? current.length
    const next = current.slice(0, start) + token + current.slice(end)
    patchText(field, next)
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + token.length, start + token.length)
    })
  }

  async function handleImage(file: File | undefined, apply: (url: string) => void, maxW: number, maxH: number) {
    if (!file) return
    setError('')
    try {
      apply(await imageToDataUrl(file, maxW, maxH))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not use that image.')
    }
  }

  function handleSave() {
    if (!t.name.trim()) {
      setError('Give the template a name.')
      setOpen('details')
      return
    }
    if (!t.text.title.trim()) {
      setError('The certificate needs a title.')
      setOpen('text')
      return
    }
    onSave({ ...t, name: t.name.trim(), builtIn: false })
  }

  async function handleTestDownload() {
    setDownloading(true)
    setError('')
    try {
      await downloadCertificatePdf(t, sample)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the PDF.')
    } finally {
      setDownloading(false)
    }
  }

  const { width, height } = PAGE_SIZE[t.orientation]

  return createPortal(
    <div className="fixed inset-0 z-[90] flex flex-col bg-canvas" role="dialog" aria-modal="true" aria-label="Certificate designer">
      {/* Header */}
      <header className="flex flex-wrap items-center gap-3 border-b border-divider bg-white dark:bg-[#0a121e] px-4 py-3 md:px-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lemon-500/15 text-lemon-700 dark:text-lemon-500">
          <Sparkles size={17} />
        </span>
        <input
          value={t.name}
          onChange={(e) => patch({ name: e.target.value })}
          className="min-w-0 flex-1 bg-transparent text-[16px] font-extrabold text-navy-900 outline-none placeholder:text-secondary-text"
          placeholder="Template name"
          aria-label="Template name"
        />
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => void handleTestDownload()} disabled={downloading}>
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Test PDF
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <Save size={14} />
            {dirty ? 'Save template' : 'Save'}
          </Button>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-secondary-text hover:text-navy-900 cursor-pointer">
            <X size={18} />
          </button>
        </div>
      </header>

      {error ? (
        <p className="border-b border-danger/20 bg-danger-bg px-6 py-2 text-[12.5px] font-semibold text-danger">{error}</p>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Controls */}
        <aside className="app-scroll w-full shrink-0 overflow-y-auto border-b border-divider bg-white dark:bg-[#0a121e] lg:w-[380px] lg:border-b-0 lg:border-r max-h-[45vh] lg:max-h-none">
          <Group id="presets" title="Start from a design" icon={<LayoutTemplate size={15} />} open={open} setOpen={setOpen}>
            <div className="grid grid-cols-2 gap-2.5">
              {PRESET_TEMPLATES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="group overflow-hidden rounded-lg border border-divider text-left transition hover:border-lemon-500 cursor-pointer"
                  title={p.description}
                >
                  <div className="bg-canvas p-1.5">
                    <CertificateArt template={{ ...p, orientation: 'landscape' }} data={sample} uid={`preset-${p.id}`} className="h-auto w-full rounded shadow-sm" />
                  </div>
                  <p className="truncate px-2 py-1.5 text-[11.5px] font-bold text-navy-900">{p.name}</p>
                </button>
              ))}
            </div>
            <p className="text-[11.5px] text-secondary-text">
              Applying a design keeps your name, logo and signatories.
            </p>
          </Group>

          <Group id="style" title="Colours" icon={<Palette size={15} />} open={open} setOpen={setOpen}>
            <div className="grid grid-cols-4 gap-2">
              {PALETTES.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => patch({ colors: { ...p.colors } })}
                  title={p.name}
                  className="flex h-9 overflow-hidden rounded-lg border border-divider hover:ring-2 hover:ring-lemon-500/40 cursor-pointer"
                >
                  <span className="flex-1" style={{ background: p.colors.background }} />
                  <span className="flex-1" style={{ background: p.colors.primary }} />
                  <span className="flex-1" style={{ background: p.colors.accent }} />
                </button>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {COLOR_FIELDS.map((c) => (
                <label key={c.key} className="flex flex-col items-center gap-1 text-[10.5px] font-bold text-secondary-text">
                  <input
                    type="color"
                    value={t.colors[c.key]}
                    onChange={(e) => patch({ colors: { ...t.colors, [c.key]: e.target.value } })}
                    className="h-9 w-full cursor-pointer rounded-lg border border-divider bg-transparent p-0.5"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </Group>

          <Group id="decor" title="Frame, pattern & seal" icon={<Stamp size={15} />} open={open} setOpen={setOpen}>
            <Field label="Frame">
              <Chips options={FRAMES} value={t.frame} onChange={(v) => patch({ frame: v })} />
            </Field>
            <Field label="Background pattern">
              <Chips options={PATTERNS} value={t.pattern} onChange={(v) => patch({ pattern: v })} />
            </Field>
            {t.pattern !== 'none' ? (
              <Field label={`Pattern strength — ${t.patternOpacity}%`}>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={t.patternOpacity}
                  onChange={(e) => patch({ patternOpacity: Number(e.target.value) })}
                  className="w-full accent-[var(--color-lemon-500)]"
                />
              </Field>
            ) : null}
            <Toggle label="Soft corner glow" checked={t.gradient} onChange={(v) => patch({ gradient: v })} />
            <Field label="Seal">
              <Chips options={SEALS} value={t.seal} onChange={(v) => patch({ seal: v })} />
            </Field>
            {t.seal !== 'none' ? (
              <Field label="Seal text">
                <input className={inputClass} maxLength={18} value={t.sealText} onChange={(e) => patch({ sealText: e.target.value })} />
              </Field>
            ) : null}
          </Group>

          <Group id="layout" title="Layout & typography" icon={<Type size={15} />} open={open} setOpen={setOpen}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Orientation">
                <Segmented
                  value={t.orientation}
                  options={[
                    { value: 'landscape', label: 'Landscape' },
                    { value: 'portrait', label: 'Portrait' },
                  ]}
                  onChange={(v) => patch({ orientation: v })}
                />
              </Field>
              <Field label="Alignment">
                <Segmented
                  value={t.align}
                  options={[
                    { value: 'center', label: 'Centred' },
                    { value: 'left', label: 'Left' },
                  ]}
                  onChange={(v) => patch({ align: v })}
                />
              </Field>
            </div>
            {(['heading', 'name', 'body'] as const).map((key) => (
              <Field key={key} label={key === 'heading' ? 'Title font' : key === 'name' ? 'Recipient name font' : 'Body font'}>
                <select
                  className={`${inputClass} cursor-pointer`}
                  value={t.fonts[key]}
                  onChange={(e) => patch({ fonts: { ...t.fonts, [key]: e.target.value as FontKey } })}
                  style={{ fontFamily: FONT_STACKS[t.fonts[key]].stack }}
                >
                  {(Object.keys(FONT_STACKS) as FontKey[]).map((fk) => (
                    <option key={fk} value={fk} style={{ fontFamily: FONT_STACKS[fk].stack }}>
                      {FONT_STACKS[fk].label}
                    </option>
                  ))}
                </select>
              </Field>
            ))}
            <Field label="Recipient name style">
              <Segmented
                value={t.nameStyle}
                options={[
                  { value: 'underline', label: 'Underlined' },
                  { value: 'caps', label: 'CAPITALS' },
                  { value: 'plain', label: 'Plain' },
                ]}
                onChange={(v) => patch({ nameStyle: v })}
              />
            </Field>
          </Group>

          <Group id="text" title="Wording" icon={<PenLine size={15} />} open={open} setOpen={setOpen}>
            <div className="rounded-lg bg-canvas p-2.5">
              <p className="mb-1.5 text-[11px] font-bold text-secondary-text">
                Insert into <span className="text-navy-900">{focusedField}</span>:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PLACEHOLDERS.map((p) => (
                  <button
                    key={p.token}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertPlaceholder(p.token)}
                    className="rounded-md border border-divider bg-white dark:bg-[#0a121e] px-2 py-1 text-[11px] font-semibold text-navy-900 hover:border-lemon-500 cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            {(
              [
                ['eyebrow', 'Small heading'],
                ['title', 'Title'],
                ['subtitle', 'Line above the name'],
                ['preamble', 'Line after the name (optional)'],
                ['body', 'Main text'],
                ['footer', 'Footer note (optional)'],
              ] as [TextField, string][]
            ).map(([field, label]) => (
              <Field key={field} label={label}>
                {field === 'body' ? (
                  <textarea
                    ref={(el) => {
                      fieldRefs.current[field] = el
                    }}
                    rows={3}
                    className={inputClass}
                    value={t.text[field]}
                    onFocus={() => setFocusedField(field)}
                    onChange={(e) => patchText(field, e.target.value)}
                  />
                ) : (
                  <input
                    ref={(el) => {
                      fieldRefs.current[field] = el
                    }}
                    className={inputClass}
                    value={t.text[field]}
                    onFocus={() => setFocusedField(field)}
                    onChange={(e) => patchText(field, e.target.value)}
                  />
                )}
              </Field>
            ))}
          </Group>

          <Group id="brand" title="Logo & signatures" icon={<ImagePlus size={15} />} open={open} setOpen={setOpen}>
            <Toggle label="Show logo" checked={t.showLogo} onChange={(v) => patch({ showLogo: v })} />
            {t.showLogo ? (
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-divider bg-canvas">
                  {t.logo ? (
                    <img src={t.logo} alt="Logo" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-[16px] font-extrabold text-navy-900">{(t.monogram || 'B').slice(0, 3).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-divider px-3 py-1.5 text-[12px] font-bold text-navy-900 hover:border-lemon-500">
                    <ImagePlus size={13} /> {t.logo ? 'Replace logo' : 'Upload logo'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => void handleImage(e.target.files?.[0], (url) => patch({ logo: url }), 320, 320)} />
                  </label>
                  {t.logo ? (
                    <button type="button" onClick={() => patch({ logo: undefined })} className="w-fit text-[11.5px] font-semibold text-danger cursor-pointer">
                      Remove logo, use monogram
                    </button>
                  ) : (
                    <input className={inputClass} maxLength={3} placeholder="Monogram, e.g. BU" value={t.monogram} onChange={(e) => patch({ monogram: e.target.value })} />
                  )}
                </div>
              </div>
            ) : null}

            <div className="space-y-2.5 pt-1">
              <p className="text-[12px] font-bold text-navy-900">Signatories ({t.signatories.length}/3)</p>
              {t.signatories.map((s, i) => (
                <div key={s.id} className="space-y-2 rounded-lg border border-divider p-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className={inputClass}
                      placeholder="Name"
                      value={s.name}
                      onChange={(e) => patch({ signatories: t.signatories.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
                    />
                    <input
                      className={inputClass}
                      placeholder="Title"
                      value={s.title}
                      onChange={(e) => patch({ signatories: t.signatories.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11.5px] font-bold text-navy-700 dark:text-navy-200 hover:text-navy-900">
                      <PenLine size={12} /> {s.signatureImage ? 'Replace signature image' : 'Add signature image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          void handleImage(
                            e.target.files?.[0],
                            (url) => patch({ signatories: t.signatories.map((x, j) => (j === i ? { ...x, signatureImage: url } : x)) }),
                            480,
                            140,
                          )
                        }
                      />
                    </label>
                    <div className="flex items-center gap-2">
                      {s.signatureImage ? (
                        <button type="button" className="text-[11.5px] font-semibold text-secondary-text hover:text-navy-900 cursor-pointer" onClick={() => patch({ signatories: t.signatories.map((x, j) => (j === i ? { ...x, signatureImage: undefined } : x)) })}>
                          Clear image
                        </button>
                      ) : null}
                      <button type="button" aria-label="Remove signatory" className="rounded p-1 text-danger hover:bg-danger-bg cursor-pointer" onClick={() => patch({ signatories: t.signatories.filter((_, j) => j !== i) })}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {t.signatories.length < 3 ? (
                <button
                  type="button"
                  onClick={() => patch({ signatories: [...t.signatories, { id: newId('sig'), name: '', title: '' }] })}
                  className="inline-flex items-center gap-1.5 text-[12px] font-bold text-lemon-700 dark:text-lemon-500 cursor-pointer"
                >
                  <Plus size={13} /> Add signatory
                </button>
              ) : null}
            </div>
          </Group>

          <Group id="details" title="Verification & details" icon={<ShieldCheck size={15} />} open={open} setOpen={setOpen}>
            <Toggle label="QR code that links to the public verification page" checked={t.show.qr} onChange={(v) => patch({ show: { ...t.show, qr: v } })} />
            <Toggle label="Certificate ID" checked={t.show.certificateId} onChange={(v) => patch({ show: { ...t.show, certificateId: v } })} />
            <Toggle label="Issue date" checked={t.show.issueDate} onChange={(v) => patch({ show: { ...t.show, issueDate: v } })} />
            <Toggle label="Expiry date (when set)" checked={t.show.expiration} onChange={(v) => patch({ show: { ...t.show, expiration: v } })} />
            <Toggle label="Use as the default template" checked={Boolean(t.isDefault)} onChange={(v) => patch({ isDefault: v })} />
            <Field label="Description (shown in the gallery)">
              <input className={inputClass} value={t.description ?? ''} onChange={(e) => patch({ description: e.target.value })} />
            </Field>
          </Group>
        </aside>

        {/* Preview */}
        <section className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-auto p-4 md:p-8">
          <div
            className="w-full shadow-[0_30px_80px_-20px_rgba(15,27,61,0.45)] ring-1 ring-black/5"
            style={{ maxWidth: t.orientation === 'landscape' ? 1000 : 620, aspectRatio: `${width} / ${height}` }}
          >
            <CertificateArt template={t} data={sample} uid="designer" className="block h-full w-full" />
          </div>
          <p className="mt-4 text-[12px] text-secondary-text">
            Preview with sample data. Placeholders are filled from each certificate when issued.
          </p>
        </section>
      </div>
    </div>,
    document.body,
  )
}

/* ── Small controls ───────────────────────────────────────────────────────── */

function Group({
  id,
  title,
  icon,
  open,
  setOpen,
  children,
}: {
  id: string
  title: string
  icon: ReactNode
  open: string
  setOpen: (id: string) => void
  children: ReactNode
}) {
  const isOpen = open === id
  return (
    <div className="border-b border-divider">
      <button
        type="button"
        onClick={() => setOpen(isOpen ? '' : id)}
        className="flex w-full items-center gap-2.5 px-4 py-3.5 text-left text-[13px] font-extrabold text-navy-900 hover:bg-canvas cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="text-lemon-700 dark:text-lemon-500">{icon}</span>
        <span className="flex-1">{title}</span>
        <ChevronDown size={15} className={`text-secondary-text transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen ? <div className="space-y-3.5 px-4 pb-5">{children}</div> : null}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11.5px] font-bold text-secondary-text">{label}</span>
      {children}
    </div>
  )
}

function Chips<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
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

function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-lg border border-divider p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-md px-2 py-1.5 text-[11.5px] font-bold transition-colors cursor-pointer ${
            value === o.value ? 'bg-lemon-500 text-[#020810]' : 'text-secondary-text hover:text-navy-900'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-[12.5px] font-semibold text-navy-900">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer ${checked ? 'bg-lemon-500' : 'bg-navy-200 dark:bg-navy-700'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
    </label>
  )
}

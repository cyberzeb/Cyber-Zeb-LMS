/**
 * Free-form certificate designer.
 *
 * Every part of a certificate is an element that can be selected on the page,
 * dragged, resized, rotated, restyled, hidden, locked, reordered or deleted —
 * and new text, fields, images, signatures, seals, QR codes, lines and boxes can
 * be added. Undo/redo and keyboard shortcuts work throughout.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  Braces,
  Download,
  Eye,
  EyeOff,
  Heading1,
  ImageIcon,
  Layers,
  Loader2,
  Lock,
  Minus,
  MousePointerClick,
  Palette,
  PenLine,
  Plus,
  QrCode,
  Redo2,
  Save,
  Sparkles,
  Square,
  Stamp,
  Type,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

import { Button } from '../../../shared/components/Button'
import { CertificateArt } from './CertificateArt'
import { downloadCertificatePdf } from './certificatePdf'
import { moveElement, reflowForPage } from './elementGeometry'
import { PRESET_TEMPLATES, emptyTemplate } from './presets'
import {
  PAGE_SIZE,
  PLACEHOLDERS,
  makeElement,
  makeText,
  newId,
  sampleCertificateData,
  type CertElement,
  type CertificateTemplateDesign,
  type ElementType,
  type FrameStyle,
  type Orientation,
  type PatternStyle,
} from './templateModel'
import { DesignerCanvas, type Box } from './designer/DesignerCanvas'
import { Inspector, type ArrangeAction } from './designer/Inspector'
import { Chips, Field, Section, Segmented, Slider, Toggle } from './designer/controls'
import { inputClass } from './designer/styles'

interface Props {
  initial: CertificateTemplateDesign
  institutionName: string
  onSave: (template: CertificateTemplateDesign) => void
  onClose: () => void
}

type Panel = 'add' | 'layers' | 'page'

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

const ELEMENT_ICON: Record<ElementType, ReactNode> = {
  text: <Type size={14} />,
  image: <ImageIcon size={14} />,
  signature: <PenLine size={14} />,
  seal: <Stamp size={14} />,
  qr: <QrCode size={14} />,
  line: <Minus size={14} />,
  box: <Square size={14} />,
}

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2]

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
}

export function CertificateDesigner({ initial, institutionName, onSave, onClose }: Props) {
  const [design, setDesign] = useState<CertificateTemplateDesign>(() => structuredClone(initial))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panel, setPanel] = useState<Panel>('add')
  const [past, setPast] = useState<CertificateTemplateDesign[]>([])
  const [future, setFuture] = useState<CertificateTemplateDesign[]>([])
  const [preview, setPreview] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const lastEdit = useRef<{ key: string; at: number } | null>(null)
  const boxes = useRef<Record<string, Box>>({})
  const textRef = useRef<HTMLTextAreaElement | null>(null)
  // Latest design for callbacks that must not re-subscribe on every edit.
  const designRef = useRef(design)
  useLayoutEffect(() => {
    designRef.current = design
  }, [design])

  // Sample data with an expiry date, so every element is visible while designing.
  const sample = useMemo(() => {
    const d = sampleCertificateData(institutionName)
    const expiry = new Date()
    expiry.setFullYear(expiry.getFullYear() + 2)
    return { ...d, expirationDate: expiry.toISOString().slice(0, 10) }
  }, [institutionName])

  const selected = design.elements.find((e) => e.id === selectedId) ?? null
  const dirty = JSON.stringify(design) !== JSON.stringify(initial)
  const { width: W, height: H } = PAGE_SIZE[design.orientation]

  /* ── History ──────────────────────────────────────────────────────────── */

  const snapshot = useCallback(() => {
    setPast((p) => [...p.slice(-80), designRef.current])
    setFuture([])
    lastEdit.current = null
  }, [])

  /** Apply a change. Rapid edits with the same key (typing) are one undo step. */
  const commit = useCallback((next: CertificateTemplateDesign, key?: string) => {
    const now = Date.now()
    const coalesce = key && lastEdit.current?.key === key && now - lastEdit.current.at < 1200
    if (!coalesce) {
      setPast((p) => [...p.slice(-80), designRef.current])
      setFuture([])
    }
    lastEdit.current = key ? { key, at: now } : null
    setDesign(next)
  }, [])

  const undo = useCallback(() => {
    if (!past.length) return
    setFuture([designRef.current, ...future])
    setDesign(past[past.length - 1])
    setPast(past.slice(0, -1))
    lastEdit.current = null
  }, [past, future])

  const redo = useCallback(() => {
    if (!future.length) return
    setPast([...past, designRef.current])
    setDesign(future[0])
    setFuture(future.slice(1))
    lastEdit.current = null
  }, [past, future])

  const replaceElement = useCallback(
    (el: CertElement, key?: string) => {
      const d = designRef.current
      commit({ ...d, elements: d.elements.map((e) => (e.id === el.id ? el : e)) }, key)
    },
    [commit],
  )

  /** Live update during a drag; the drag start already recorded the undo step. */
  const liveChange = useCallback((el: CertElement) => {
    setDesign((d) => ({ ...d, elements: d.elements.map((e) => (e.id === el.id ? el : e)) }))
  }, [])

  /* ── Element actions ──────────────────────────────────────────────────── */

  const addElement = useCallback(
    (el: CertElement) => {
      const d = designRef.current
      commit({ ...d, elements: [...d.elements, el] })
      setSelectedId(el.id)
    },
    [commit],
  )

  function addOfType(type: ElementType) {
    const cx = W / 2
    const cy = H / 2
    const el = makeElement(type, cx, cy)
    // Top-left anchored elements: centre them on the page.
    if (el.type === 'image' || el.type === 'box') Object.assign(el, { x: cx - el.w / 2, y: cy - el.h / 2 })
    if (el.type === 'qr') Object.assign(el, { x: cx - el.size / 2, y: cy - el.size / 2 })
    if (el.type === 'line') Object.assign(el, { x: cx - el.width / 2 })
    addElement(el)
  }

  const arrange = useCallback(
    (action: ArrangeAction, id = selectedId) => {
      const d = designRef.current
      const idx = d.elements.findIndex((e) => e.id === id)
      if (idx < 0) return
      const el = d.elements[idx]
      const list = [...d.elements]
      if (action === 'delete') {
        list.splice(idx, 1)
        commit({ ...d, elements: list })
        setSelectedId(null)
        return
      }
      if (action === 'duplicate') {
        const copy = { ...structuredClone(el), id: newId('el'), name: `${el.name} copy`, locked: false }
        list.splice(idx + 1, 0, moveElement(copy, 16, 16))
        commit({ ...d, elements: list })
        setSelectedId(copy.id)
        return
      }
      if (action === 'centerX' || action === 'centerY') {
        const b = boxes.current[el.id]
        if (!b) return
        const dx = action === 'centerX' ? W / 2 - (b.x + b.w / 2) : 0
        const dy = action === 'centerY' ? H / 2 - (b.y + b.h / 2) : 0
        replaceElement(moveElement(el, dx, dy))
        return
      }
      list.splice(idx, 1)
      const target =
        action === 'front' ? list.length : action === 'back' ? 0 : action === 'forward' ? Math.min(list.length, idx + 1) : Math.max(0, idx - 1)
      list.splice(target, 0, el)
      commit({ ...d, elements: list })
    },
    [H, W, commit, replaceElement, selectedId],
  )

  /* ── Page actions ─────────────────────────────────────────────────────── */

  function setPage(patch: Partial<CertificateTemplateDesign>, key?: string) {
    commit({ ...designRef.current, ...patch }, key)
  }

  function changeOrientation(orientation: Orientation) {
    const d = designRef.current
    if (orientation === d.orientation) return
    const from = PAGE_SIZE[d.orientation]
    const to = PAGE_SIZE[orientation]
    commit({
      ...d,
      orientation,
      elements: d.elements.map((e) => reflowForPage(e, to.width / from.width, to.height / from.height)),
    })
  }

  function applyPreset(preset: CertificateTemplateDesign, lookOnly: boolean) {
    const d = designRef.current
    if (lookOnly) {
      commit({ ...d, colors: { ...preset.colors }, frame: preset.frame, pattern: preset.pattern, patternOpacity: preset.patternOpacity, gradient: preset.gradient })
      return
    }
    if (d.elements.length && !window.confirm('Replace the whole layout with this design? You can undo this.')) return
    const copy = structuredClone(preset)
    commit({ ...copy, id: d.id, name: d.name, description: d.description, builtIn: d.builtIn, isDefault: d.isDefault, elements: copy.elements.map((e) => ({ ...e, id: newId('el') })) })
    setSelectedId(null)
  }

  /* ── Keyboard ─────────────────────────────────────────────────────────── */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
        return
      }
      if (isTyping(e.target)) return
      if (e.key === 'Escape') {
        setSelectedId(null)
        return
      }
      if (!selectedId) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        arrange('delete')
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        arrange('duplicate')
      } else if (e.key.startsWith('Arrow')) {
        e.preventDefault()
        const el = designRef.current.elements.find((x) => x.id === selectedId)
        if (!el || el.locked) return
        const step = e.shiftKey ? 10 : 1
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
        replaceElement(moveElement(el, dx, dy), `nudge:${el.id}`)
      }
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [arrange, redo, replaceElement, selectedId, undo])

  /* ── Save / close ─────────────────────────────────────────────────────── */

  function requestClose() {
    if (dirty && !window.confirm('Close the designer? Your unsaved changes will be lost.')) return
    onClose()
  }

  function handleSave() {
    if (!design.name.trim()) {
      setError('Give the template a name.')
      setPanel('page')
      return
    }
    if (!design.elements.some((e) => !e.hidden)) {
      setError('The certificate is empty. Add at least one element.')
      return
    }
    setError('')
    onSave({ ...design, name: design.name.trim() })
  }

  async function handleTestDownload() {
    setDownloading(true)
    setError('')
    try {
      await downloadCertificatePdf(design, sample)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the PDF.')
    } finally {
      setDownloading(false)
    }
  }

  const onEditText = useCallback((id: string) => {
    setSelectedId(id)
    requestAnimationFrame(() => textRef.current?.focus())
  }, [])
  const onMeasure = useCallback((b: Record<string, Box>) => {
    boxes.current = b
  }, [])

  const maxWidth = (design.orientation === 'landscape' ? 960 : 640) * zoom

  return createPortal(
    <div className="fixed inset-0 z-[90] flex flex-col bg-canvas" role="dialog" aria-modal="true" aria-label="Certificate designer">
      {/* Header */}
      <header className="flex flex-wrap items-center gap-2 border-b border-divider bg-white dark:bg-[#0a121e] px-3 py-2.5 md:px-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lemon-500/15 text-lemon-700 dark:text-lemon-500">
          <Sparkles size={16} />
        </span>
        <input
          value={design.name}
          onChange={(e) => setPage({ name: e.target.value }, 'name')}
          className="min-w-[160px] flex-1 bg-transparent text-[15px] font-extrabold text-navy-900 outline-none"
          placeholder="Template name"
          aria-label="Template name"
        />
        <div className="flex items-center gap-1 rounded-lg border border-divider p-0.5">
          <ToolButton label="Undo (Ctrl+Z)" onClick={undo} disabled={!past.length}>
            <Undo2 size={15} />
          </ToolButton>
          <ToolButton label="Redo (Ctrl+Y)" onClick={redo} disabled={!future.length}>
            <Redo2 size={15} />
          </ToolButton>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-divider p-0.5">
          <ToolButton label="Zoom out" onClick={() => setZoom((z) => ZOOMS[Math.max(0, ZOOMS.indexOf(z) - 1)])} disabled={zoom === ZOOMS[0]}>
            <ZoomOut size={15} />
          </ToolButton>
          <button type="button" onClick={() => setZoom(1)} className="w-12 text-center text-[11.5px] font-bold text-navy-900 cursor-pointer" title="Fit">
            {Math.round(zoom * 100)}%
          </button>
          <ToolButton label="Zoom in" onClick={() => setZoom((z) => ZOOMS[Math.min(ZOOMS.length - 1, ZOOMS.indexOf(z) + 1)])} disabled={zoom === ZOOMS[ZOOMS.length - 1]}>
            <ZoomIn size={15} />
          </ToolButton>
        </div>
        <ToolButton label={preview ? 'Back to editing' : 'Preview without guides'} onClick={() => setPreview((p) => !p)} active={preview}>
          {preview ? <EyeOff size={15} /> : <Eye size={15} />}
        </ToolButton>
        <Button variant="secondary" onClick={() => void handleTestDownload()} disabled={downloading}>
          {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Test PDF
        </Button>
        <Button variant="ghost" onClick={requestClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          <Save size={14} />
          Save template
        </Button>
        <button type="button" onClick={requestClose} aria-label="Close" className="rounded-lg p-1.5 text-secondary-text hover:text-navy-900 cursor-pointer">
          <X size={18} />
        </button>
      </header>

      {error ? <p className="border-b border-danger/20 bg-danger-bg px-6 py-2 text-[12.5px] font-semibold text-danger">{error}</p> : null}

      <div className="flex min-h-0 flex-1">
        {/* Left: add / layers / page */}
        <aside className="flex w-[300px] shrink-0 flex-col border-r border-divider bg-white dark:bg-[#0a121e]">
          <div className="grid grid-cols-3 gap-1 border-b border-divider p-2">
            <PanelTab active={panel === 'add'} onClick={() => setPanel('add')} icon={<Plus size={14} />} label="Add" />
            <PanelTab active={panel === 'layers'} onClick={() => setPanel('layers')} icon={<Layers size={14} />} label={`Layers (${design.elements.length})`} />
            <PanelTab active={panel === 'page'} onClick={() => setPanel('page')} icon={<Palette size={14} />} label="Page" />
          </div>
          <div className="app-scroll min-h-0 flex-1 overflow-y-auto">
            {panel === 'add' ? (
              <>
                <Section title="Add to the certificate">
                  <div className="grid grid-cols-2 gap-2">
                    <AddButton icon={<Heading1 size={16} />} label="Heading" onClick={() => addElement(makeText({ name: 'Heading', x: W / 2, y: H / 2, text: 'Heading', fontSize: 40, bold: true, color: 'primary', width: W - 200, fit: true }))} />
                    <AddButton icon={<Type size={16} />} label="Paragraph" onClick={() => addElement(makeText({ name: 'Paragraph', x: W / 2, y: H / 2, text: 'Write something here. Use fields like {{course_title}}.', fontSize: 17, width: 600 }))} />
                    <AddButton icon={<ImageIcon size={16} />} label="Image / logo" onClick={() => addOfType('image')} />
                    <AddButton icon={<PenLine size={16} />} label="Signature" onClick={() => addOfType('signature')} />
                    <AddButton icon={<Stamp size={16} />} label="Seal" onClick={() => addOfType('seal')} />
                    <AddButton icon={<QrCode size={16} />} label="QR code" onClick={() => addOfType('qr')} />
                    <AddButton icon={<Minus size={16} />} label="Line" onClick={() => addOfType('line')} />
                    <AddButton icon={<Square size={16} />} label="Box" onClick={() => addOfType('box')} />
                  </div>
                </Section>
                <Section title="Add a field">
                  <p className="text-[11.5px] text-secondary-text">Filled in from each certificate when it is issued.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PLACEHOLDERS.map((p) => (
                      <button
                        key={p.token}
                        type="button"
                        onClick={() => addElement(makeText({ name: p.label, x: W / 2, y: H / 2, text: p.token, fontSize: 22, width: 500, fit: true, hideIfBlank: true }))}
                        className="inline-flex items-center gap-1 rounded-md border border-divider px-2 py-1 text-[11.5px] font-semibold text-navy-900 hover:border-lemon-500 cursor-pointer"
                      >
                        <Braces size={11} /> {p.label}
                      </button>
                    ))}
                  </div>
                </Section>
                <Section title="How to edit">
                  <ul className="space-y-1.5 text-[11.5px] text-secondary-text">
                    <li className="flex gap-2"><MousePointerClick size={13} className="mt-0.5 shrink-0" /> Click anything on the certificate to select it, then drag to move.</li>
                    <li>• Corner square: resize. Side bar: width. Top circle: rotate.</li>
                    <li>• Double-click text to edit its words.</li>
                    <li>• Arrow keys nudge (Shift = 10). Shift while dragging keeps a straight line; Alt turns off snapping.</li>
                    <li>• Ctrl+Z undo, Ctrl+Y redo, Ctrl+D duplicate, Delete removes.</li>
                  </ul>
                </Section>
              </>
            ) : null}

            {panel === 'layers' ? (
              <div className="p-2">
                <p className="px-2 pb-2 text-[11px] text-secondary-text">Top of the list is drawn on top.</p>
                {[...design.elements].reverse().map((el) => (
                  <div
                    key={el.id}
                    className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 ${el.id === selectedId ? 'bg-lemon-500/15' : 'hover:bg-canvas'}`}
                  >
                    <button type="button" onClick={() => setSelectedId(el.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer">
                      <span className="text-secondary-text">{ELEMENT_ICON[el.type]}</span>
                      <span className={`truncate text-[12.5px] font-semibold ${el.hidden ? 'text-secondary-text line-through' : 'text-navy-900'}`}>{el.name}</span>
                    </button>
                    <button type="button" title={el.hidden ? 'Show' : 'Hide'} aria-label={el.hidden ? `Show ${el.name}` : `Hide ${el.name}`} onClick={() => replaceElement({ ...el, hidden: !el.hidden })} className={`rounded p-1 cursor-pointer ${el.hidden ? 'text-navy-900' : 'text-secondary-text opacity-0 group-hover:opacity-100'}`}>
                      {el.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button type="button" title={el.locked ? 'Unlock' : 'Lock'} aria-label={el.locked ? `Unlock ${el.name}` : `Lock ${el.name}`} onClick={() => replaceElement({ ...el, locked: !el.locked })} className={`rounded p-1 cursor-pointer ${el.locked ? 'text-navy-900' : 'text-secondary-text opacity-0 group-hover:opacity-100'}`}>
                      <Lock size={13} />
                    </button>
                  </div>
                ))}
                {!design.elements.length ? <p className="px-2 py-6 text-center text-[12px] text-secondary-text">Nothing here yet. Use Add.</p> : null}
              </div>
            ) : null}

            {panel === 'page' ? (
              <>
                <Section title="Template">
                  <Field label="Description (shown in the gallery)">
                    <input className={inputClass} value={design.description ?? ''} onChange={(e) => setPage({ description: e.target.value }, 'description')} />
                  </Field>
                  <Toggle label="Use as the default template" checked={Boolean(design.isDefault)} onChange={(v) => setPage({ isDefault: v })} />
                </Section>
                <Section title="Paper">
                  <Segmented<Orientation>
                    value={design.orientation}
                    options={[
                      { value: 'landscape', label: 'Landscape' },
                      { value: 'portrait', label: 'Portrait' },
                    ]}
                    onChange={changeOrientation}
                  />
                </Section>
                <Section title="Colours">
                  <div className="grid grid-cols-4 gap-2">
                    {PALETTES.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setPage({ colors: { ...p.colors } })}
                        title={p.name}
                        aria-label={`${p.name} palette`}
                        className="flex h-8 overflow-hidden rounded-lg border border-divider hover:ring-2 hover:ring-lemon-500/40 cursor-pointer"
                      >
                        <span className="flex-1" style={{ background: p.colors.background }} />
                        <span className="flex-1" style={{ background: p.colors.primary }} />
                        <span className="flex-1" style={{ background: p.colors.accent }} />
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-secondary-text">Elements using theme colours follow the palette; custom colours stay fixed.</p>
                  {(['background', 'primary', 'accent', 'text', 'muted'] as const).map((key) => (
                    <label key={key} className="flex items-center justify-between gap-3 text-[12.5px] font-semibold text-navy-900">
                      {{ background: 'Paper', primary: 'Primary', accent: 'Accent', text: 'Text', muted: 'Muted' }[key]}
                      <input
                        type="color"
                        value={design.colors[key]}
                        onChange={(e) => setPage({ colors: { ...design.colors, [key]: e.target.value } }, `color:${key}`)}
                        className="h-8 w-14 cursor-pointer rounded-md border border-divider bg-transparent p-0.5"
                      />
                    </label>
                  ))}
                </Section>
                <Section title="Frame & background">
                  <Field label="Frame">
                    <Chips options={FRAMES} value={design.frame} onChange={(v) => setPage({ frame: v })} />
                  </Field>
                  <Field label="Pattern">
                    <Chips options={PATTERNS} value={design.pattern} onChange={(v) => setPage({ pattern: v })} />
                  </Field>
                  {design.pattern !== 'none' ? (
                    <Slider label="Pattern strength" value={design.patternOpacity} min={5} max={100} suffix="%" onChange={(v) => setPage({ patternOpacity: v }, 'patternOpacity')} />
                  ) : null}
                  <Toggle label="Soft corner glow" checked={design.gradient} onChange={(v) => setPage({ gradient: v })} />
                </Section>
                <Section title="Start from a design">
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_TEMPLATES.map((p) => (
                      <div key={p.id} className="overflow-hidden rounded-lg border border-divider">
                        <div className="bg-canvas p-1">
                          <CertificateArt template={p} data={sample} uid={`preset-${p.id}`} className="h-auto w-full rounded-sm" />
                        </div>
                        <p className="truncate px-1.5 pt-1 text-[11px] font-bold text-navy-900">{p.name}</p>
                        <div className="flex gap-1 p-1.5">
                          <button type="button" onClick={() => applyPreset(p, false)} className="flex-1 rounded-md bg-lemon-500 px-1 py-1 text-[10.5px] font-bold text-[#020810] cursor-pointer" title="Replace the layout and look">
                            Use
                          </button>
                          <button type="button" onClick={() => applyPreset(p, true)} className="flex-1 rounded-md border border-divider px-1 py-1 text-[10.5px] font-bold text-navy-900 cursor-pointer" title="Keep your layout, take the colours, frame and pattern">
                            Look only
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (design.elements.length && !window.confirm('Start from an empty page? You can undo this.')) return
                      const blank = emptyTemplate(design.orientation)
                      commit({ ...design, frame: blank.frame, pattern: blank.pattern, gradient: false, elements: blank.elements })
                      setSelectedId(null)
                    }}
                    className="w-full rounded-lg border border-dashed border-divider py-2 text-[12px] font-bold text-navy-900 hover:border-lemon-500 cursor-pointer"
                  >
                    Start from an empty page
                  </button>
                </Section>
              </>
            ) : null}
          </div>
        </aside>

        {/* Canvas */}
        <main className="app-scroll min-w-0 flex-1 overflow-auto p-6 md:p-10">
          <div className="mx-auto shadow-[0_30px_80px_-20px_rgba(15,27,61,0.45)] ring-1 ring-black/5" style={{ width: `min(100%, ${maxWidth}px)`, minWidth: zoom > 1 ? maxWidth : undefined }}>
            <DesignerCanvas
              design={design}
              data={sample}
              selectedId={selectedId}
              preview={preview}
              onSelect={setSelectedId}
              onSnapshot={snapshot}
              onElementChange={liveChange}
              onEditText={onEditText}
              onMeasure={onMeasure}
            />
          </div>
          <p className="mt-3 text-center text-[11.5px] text-secondary-text">
            Sample data shown. Fields such as {'{{student_name}}'} are filled from each certificate.
          </p>
        </main>

        {/* Right: inspector */}
        <aside className="app-scroll w-[300px] shrink-0 overflow-y-auto border-l border-divider bg-white dark:bg-[#0a121e]">
          {selected ? (
            <Inspector
              key={selected.id}
              element={selected}
              colors={design.colors}
              onChange={(el, field) => replaceElement(el, `${el.id}:${field}`)}
              onAction={(a) => arrange(a)}
              textRef={textRef}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lemon-500/15 text-lemon-700 dark:text-lemon-500">
                <MousePointerClick size={22} />
              </span>
              <p className="text-[13px] font-bold text-navy-900">Select something to edit it</p>
              <p className="text-[12px] text-secondary-text">
                Click any text, logo, signature, seal or line on the certificate — or pick it from Layers.
              </p>
              <p className="text-[12px] text-secondary-text">
                Colours, frame and background are under <strong>Page</strong>.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>,
    document.body,
  )
}

function ToolButton({ label, onClick, disabled, active, children }: { label: string; onClick: () => void; disabled?: boolean; active?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer ${
        active ? 'bg-lemon-500/15 text-lemon-700 dark:text-lemon-500' : 'text-navy-900 hover:bg-canvas'
      }`}
    >
      {children}
    </button>
  )
}

function PanelTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11.5px] font-bold transition-colors cursor-pointer ${
        active ? 'bg-lemon-500/15 text-lemon-700 dark:text-lemon-500' : 'text-secondary-text hover:text-navy-900'
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  )
}

function AddButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-xl border border-divider px-2 py-3 text-[11.5px] font-bold text-navy-900 transition-colors hover:border-lemon-500 hover:bg-lemon-500/5 cursor-pointer"
    >
      <span className="text-lemon-700 dark:text-lemon-500">{icon}</span>
      {label}
    </button>
  )
}

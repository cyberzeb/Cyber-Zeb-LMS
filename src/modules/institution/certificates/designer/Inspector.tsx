/** Properties of the selected element. Every visible part of it is editable here. */
import { useRef, useState, type ReactNode } from 'react'
import {
  AlignCenter,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  Bold,
  Copy,
  Eye,
  EyeOff,
  ImagePlus,
  Italic,
  Lock,
  Trash2,
  Unlock,
} from 'lucide-react'

import {
  FONT_STACKS,
  PLACEHOLDERS,
  type CertElement,
  type FontKey,
  type SealStyle,
  type TextAlign,
  type ThemeColors,
} from '../templateModel'
import { Chips, ColorPicker, Field, NumberField, Section, Segmented, Slider, Toggle } from './controls'
import { imageToDataUrl } from './imageUpload'
import { inputClass } from './styles'

export type ArrangeAction =
  | 'front'
  | 'back'
  | 'forward'
  | 'backward'
  | 'duplicate'
  | 'delete'
  | 'centerX'
  | 'centerY'

interface Props {
  element: CertElement
  colors: ThemeColors
  /** `field` groups rapid edits (typing) into one undo step. */
  onChange: (el: CertElement, field: string) => void
  onAction: (action: ArrangeAction) => void
  textRef: React.RefObject<HTMLTextAreaElement | null>
}

const SEALS: { value: SealStyle; label: string }[] = [
  { value: 'rosette', label: 'Rosette' },
  { value: 'ribbon', label: 'Ribbon' },
  { value: 'stamp', label: 'Stamp' },
  { value: 'star', label: 'Star' },
]

const TYPE_LABEL: Record<CertElement['type'], string> = {
  text: 'Text',
  image: 'Image / logo',
  signature: 'Signature',
  seal: 'Seal',
  qr: 'QR code',
  line: 'Line',
  box: 'Box',
}

function FontSelect({ value, onChange }: { value: FontKey; onChange: (v: FontKey) => void }) {
  return (
    <select
      className={`${inputClass} cursor-pointer`}
      value={value}
      onChange={(e) => onChange(e.target.value as FontKey)}
      style={{ fontFamily: FONT_STACKS[value].stack }}
      aria-label="Font"
    >
      {(Object.keys(FONT_STACKS) as FontKey[]).map((k) => (
        <option key={k} value={k} style={{ fontFamily: FONT_STACKS[k].stack }}>
          {FONT_STACKS[k].label}
        </option>
      ))}
    </select>
  )
}

function IconButton({ label, onClick, children, danger, active }: { label: string; onClick: () => void; children: ReactNode; danger?: boolean; active?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex h-8 flex-1 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
        danger
          ? 'border-danger/30 text-danger hover:bg-danger-bg'
          : active
            ? 'border-lemon-500 bg-lemon-500/15 text-lemon-700 dark:text-lemon-500'
            : 'border-divider text-navy-900 hover:border-lemon-500/60'
      }`}
    >
      {children}
    </button>
  )
}

function ImagePicker({
  label,
  value,
  onPick,
  onClear,
  maxW,
  maxH,
}: {
  label: string
  value?: string
  onPick: (url: string) => void
  onClear: () => void
  maxW: number
  maxH: number
}) {
  const [error, setError] = useState('')
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-divider px-3 py-1.5 text-[12px] font-bold text-navy-900 hover:border-lemon-500">
          <ImagePlus size={13} /> {value ? `Replace ${label}` : `Upload ${label}`}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              setError('')
              try {
                onPick(await imageToDataUrl(file, maxW, maxH))
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not use that image.')
              }
            }}
          />
        </label>
        {value ? (
          <button type="button" onClick={onClear} className="text-[11.5px] font-semibold text-danger cursor-pointer">
            Remove
          </button>
        ) : null}
      </div>
      {error ? <p className="text-[11.5px] font-semibold text-danger">{error}</p> : null}
    </div>
  )
}

export function Inspector({ element: el, colors, onChange, onAction, textRef }: Props) {
  const set = <K extends string>(field: K, patch: Partial<CertElement>) => onChange({ ...el, ...patch } as CertElement, field)
  const lastFocus = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  function insertToken(token: string, field: 'text' | 'signer' | 'title') {
    const target = field === 'text' ? textRef.current : lastFocus.current
    const current = String((el as unknown as Record<string, unknown>)[field] ?? '')
    const start = target?.selectionStart ?? current.length
    const end = target?.selectionEnd ?? current.length
    set(field, { [field]: current.slice(0, start) + token + current.slice(end) } as Partial<CertElement>)
    requestAnimationFrame(() => {
      target?.focus()
      target?.setSelectionRange(start + token.length, start + token.length)
    })
  }

  return (
    <div>
      <div className="border-b border-divider px-4 py-3">
        <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-lemon-700 dark:text-lemon-500">
          {TYPE_LABEL[el.type]}
        </p>
        <input
          className="mt-1 w-full bg-transparent text-[14px] font-extrabold text-navy-900 outline-none"
          value={el.name}
          onChange={(e) => set('name', { name: e.target.value })}
          aria-label="Layer name"
        />
      </div>

      {el.type === 'text' ? (
        <Section title="Text">
          <textarea
            ref={textRef}
            rows={3}
            className={inputClass}
            value={el.text}
            onChange={(e) => set('text', { text: e.target.value })}
            aria-label="Text"
          />
          <div className="flex flex-wrap gap-1">
            {PLACEHOLDERS.map((p) => (
              <button
                key={p.token}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertToken(p.token, 'text')}
                className="rounded-md border border-divider px-1.5 py-0.5 text-[10.5px] font-semibold text-navy-900 hover:border-lemon-500 cursor-pointer"
                title={`Insert ${p.token}`}
              >
                + {p.label}
              </button>
            ))}
          </div>
          <Field label="Font">
            <FontSelect value={el.font} onChange={(v) => set('font', { font: v })} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Size" value={el.fontSize} min={6} max={200} onChange={(v) => set('fontSize', { fontSize: v })} suffix="pt" />
            <NumberField label="Box width" value={el.width} min={40} max={1600} onChange={(v) => set('width', { width: v })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Segmented
              value={`${el.bold ? 'b' : ''}${el.italic ? 'i' : ''}` || 'n'}
              options={[
                { value: 'n', label: 'Aa', title: 'Regular' },
                { value: 'b', label: <Bold size={13} />, title: 'Bold' },
                { value: 'i', label: <Italic size={13} />, title: 'Italic' },
                { value: 'bi', label: <><Bold size={12} /><Italic size={12} /></>, title: 'Bold italic' },
              ]}
              onChange={(v) => set('style', { bold: v.includes('b'), italic: v.includes('i') })}
            />
            <Segmented<TextAlign>
              value={el.align}
              options={[
                { value: 'start', label: <AlignLeft size={13} />, title: 'Align left' },
                { value: 'middle', label: <AlignCenter size={13} />, title: 'Centre' },
                { value: 'end', label: <AlignRight size={13} />, title: 'Align right' },
              ]}
              onChange={(v) => set('align', { align: v })}
            />
          </div>
          <ColorPicker label="Colour" value={el.color} colors={colors} onChange={(v) => set('color', { color: v })} />
          <Slider label="Letter spacing" value={el.letterSpacing} min={-2} max={20} step={0.5} onChange={(v) => set('letterSpacing', { letterSpacing: v })} />
          {!el.fit ? (
            <>
              <Slider label="Line height" value={el.lineHeight} min={0.9} max={2.5} step={0.05} onChange={(v) => set('lineHeight', { lineHeight: v })} />
              <NumberField label="Max lines" value={el.maxLines} min={1} max={20} onChange={(v) => set('maxLines', { maxLines: Math.round(v) })} />
            </>
          ) : null}
          <Toggle label="One line, shrink to fit the box" checked={el.fit} onChange={(v) => set('fit', { fit: v })} />
          <Toggle label="CAPITAL LETTERS" checked={el.uppercase} onChange={(v) => set('uppercase', { uppercase: v })} />
          <Toggle label="Hide when a field is empty" checked={el.hideIfBlank} onChange={(v) => set('hideIfBlank', { hideIfBlank: v })} />
        </Section>
      ) : null}

      {el.type === 'image' ? (
        <Section title="Image">
          <ImagePicker label="image" value={el.src} maxW={600} maxH={600} onPick={(src) => set('src', { src })} onClear={() => set('src', { src: undefined })} />
          {!el.src ? (
            <>
              <Field label="Monogram (shown without an image)">
                <input className={inputClass} maxLength={3} value={el.monogram} onChange={(e) => set('monogram', { monogram: e.target.value })} />
              </Field>
              <ColorPicker label="Tile colour" value={el.fill} colors={colors} onChange={(v) => set('fill', { fill: v })} />
              <ColorPicker label="Letter colour" value={el.textColor} colors={colors} onChange={(v) => set('textColor', { textColor: v })} />
            </>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Width" value={el.w} min={8} max={1600} onChange={(v) => set('w', { w: v })} />
            <NumberField label="Height" value={el.h} min={8} max={1600} onChange={(v) => set('h', { h: v })} />
          </div>
          <Slider label="Corner rounding" value={el.radius} min={0} max={Math.min(el.w, el.h) / 2} onChange={(v) => set('radius', { radius: v })} />
        </Section>
      ) : null}

      {el.type === 'signature' ? (
        <Section title="Signature">
          <Field label="Name" hint="Placeholders work here too, e.g. {{instructor_name}}.">
            <input className={inputClass} value={el.signer} onFocus={(e) => (lastFocus.current = e.currentTarget)} onChange={(e) => set('signer', { signer: e.target.value })} />
          </Field>
          <Field label="Title / role">
            <input className={inputClass} value={el.title} onFocus={(e) => (lastFocus.current = e.currentTarget)} onChange={(e) => set('title', { title: e.target.value })} />
          </Field>
          <ImagePicker label="signature image" value={el.image} maxW={480} maxH={140} onPick={(image) => set('image', { image })} onClear={() => set('image', { image: undefined })} />
          <p className="text-[11px] text-secondary-text">Without an image, the name is written in a handwritten style.</p>
          <NumberField label="Line width" value={el.width} min={60} max={800} onChange={(v) => set('width', { width: v })} />
          <Field label="Font">
            <FontSelect value={el.font} onChange={(v) => set('font', { font: v })} />
          </Field>
          <ColorPicker label="Name colour" value={el.color} colors={colors} onChange={(v) => set('color', { color: v })} />
        </Section>
      ) : null}

      {el.type === 'seal' ? (
        <Section title="Seal">
          <Chips options={SEALS} value={el.style} onChange={(v) => set('style', { style: v })} />
          <Field label="Seal text">
            <input className={inputClass} maxLength={18} value={el.text} onChange={(e) => set('text', { text: e.target.value })} />
          </Field>
          <NumberField label="Radius" value={el.r} min={14} max={300} onChange={(v) => set('r', { r: v })} />
          <ColorPicker label="Main colour" value={el.color} colors={colors} onChange={(v) => set('color', { color: v })} />
          <ColorPicker label="Ring colour" value={el.ring} colors={colors} onChange={(v) => set('ring', { ring: v })} />
        </Section>
      ) : null}

      {el.type === 'qr' ? (
        <Section title="QR code">
          <p className="text-[11.5px] text-secondary-text">Links to the public page that confirms the certificate is genuine.</p>
          <NumberField label="Size" value={el.size} min={40} max={400} onChange={(v) => set('size', { size: v })} />
          <ColorPicker label="Code colour" value={el.color} colors={colors} onChange={(v) => set('color', { color: v })} />
          <Toggle label='"Scan to verify" label' checked={el.showLabel} onChange={(v) => set('showLabel', { showLabel: v })} />
          <Toggle label="Certificate ID under the code" checked={el.showId} onChange={(v) => set('showId', { showId: v })} />
          <ColorPicker label="Label colour" value={el.labelColor} colors={colors} onChange={(v) => set('labelColor', { labelColor: v })} />
        </Section>
      ) : null}

      {el.type === 'line' ? (
        <Section title="Line">
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Length" value={el.width} min={10} max={1600} onChange={(v) => set('width', { width: v })} />
            <NumberField label="Thickness" value={el.thickness} min={0.5} max={40} step={0.5} onChange={(v) => set('thickness', { thickness: v })} />
          </div>
          <ColorPicker label="Colour" value={el.color} colors={colors} onChange={(v) => set('color', { color: v })} />
          <Toggle label="Dashed" checked={el.dashed} onChange={(v) => set('dashed', { dashed: v })} />
        </Section>
      ) : null}

      {el.type === 'box' ? (
        <Section title="Box">
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Width" value={el.w} min={8} max={1600} onChange={(v) => set('w', { w: v })} />
            <NumberField label="Height" value={el.h} min={8} max={1600} onChange={(v) => set('h', { h: v })} />
          </div>
          <ColorPicker label="Fill" value={el.fill} colors={colors} allowNone onChange={(v) => set('fill', { fill: v })} />
          <ColorPicker label="Border" value={el.stroke} colors={colors} onChange={(v) => set('stroke', { stroke: v })} />
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Border width" value={el.strokeWidth} min={0} max={40} step={0.5} onChange={(v) => set('strokeWidth', { strokeWidth: v })} />
            <NumberField label="Rounding" value={el.radius} min={0} max={400} onChange={(v) => set('radius', { radius: v })} />
          </div>
        </Section>
      ) : null}

      <Section title="Position & arrangement">
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X" value={el.x} onChange={(v) => set('x', { x: v })} />
          <NumberField label="Y" value={el.y} onChange={(v) => set('y', { y: v })} />
        </div>
        <Slider label="Rotation" value={el.rotation ?? 0} min={-180} max={180} suffix="°" onChange={(v) => set('rotation', { rotation: v })} />
        <Slider label="Opacity" value={el.opacity ?? 100} min={5} max={100} suffix="%" onChange={(v) => set('opacity', { opacity: v })} />
        <div className="flex gap-1.5">
          <IconButton label="Centre horizontally on the page" onClick={() => onAction('centerX')}>
            <AlignCenterHorizontal size={14} />
          </IconButton>
          <IconButton label="Centre vertically on the page" onClick={() => onAction('centerY')}>
            <AlignCenterVertical size={14} />
          </IconButton>
          <IconButton label="Bring to front" onClick={() => onAction('front')}>
            <ArrowUpToLine size={14} />
          </IconButton>
          <IconButton label="Bring forward" onClick={() => onAction('forward')}>
            <ArrowUp size={14} />
          </IconButton>
          <IconButton label="Send backward" onClick={() => onAction('backward')}>
            <ArrowDown size={14} />
          </IconButton>
          <IconButton label="Send to back" onClick={() => onAction('back')}>
            <ArrowDownToLine size={14} />
          </IconButton>
        </div>
        <div className="flex gap-1.5">
          <IconButton label={el.hidden ? 'Show' : 'Hide'} active={el.hidden} onClick={() => set('hidden', { hidden: !el.hidden })}>
            {el.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </IconButton>
          <IconButton label={el.locked ? 'Unlock' : 'Lock position'} active={el.locked} onClick={() => set('locked', { locked: !el.locked })}>
            {el.locked ? <Lock size={14} /> : <Unlock size={14} />}
          </IconButton>
          <IconButton label="Duplicate (Ctrl+D)" onClick={() => onAction('duplicate')}>
            <Copy size={14} />
          </IconButton>
          <IconButton label="Delete (Del)" danger onClick={() => onAction('delete')}>
            <Trash2 size={14} />
          </IconButton>
        </div>
      </Section>
    </div>
  )
}

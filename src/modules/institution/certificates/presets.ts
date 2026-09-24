/**
 * Built-in designs, and conversion from the first template format.
 *
 * The first format described a fixed layout (title, name, body, signatories …).
 * `legacyToDesign` lays that out as free-form elements at the same positions,
 * so the presets are written compactly and any template saved in the old format
 * still opens — now fully editable.
 */
import {
  PAGE_SIZE,
  makeText,
  newId,
  type CertElement,
  type CertificateTemplateDesign,
  type FontKey,
  type FrameStyle,
  type Orientation,
  type PatternStyle,
  type SealStyle,
  type ThemeColors,
} from './templateModel'

interface LegacyTemplate {
  id: string
  name: string
  description?: string
  builtIn?: boolean
  isDefault?: boolean
  updatedAt?: string
  orientation: Orientation
  align: 'center' | 'left'
  colors: ThemeColors
  frame: FrameStyle
  pattern: PatternStyle
  patternOpacity: number
  gradient: boolean
  seal: SealStyle | 'none'
  sealText: string
  logo?: string
  monogram: string
  showLogo: boolean
  fonts: { heading: FontKey; name: FontKey; body: FontKey }
  nameStyle: 'plain' | 'underline' | 'caps'
  text: { eyebrow: string; title: string; subtitle: string; preamble: string; body: string; footer: string }
  signatories: { id: string; name: string; title: string; signatureImage?: string }[]
  show: { qr: boolean; certificateId: boolean; issueDate: boolean; expiration: boolean }
}

/** Where corner items sit so they clear each frame's ornaments. */
const FRAME_INSET: Record<FrameStyle, number> = {
  none: 48,
  classic: 72,
  double: 84,
  ornate: 100,
  modern: 64,
  band: 64,
  geometric: 96,
}

function legacyToDesign(t: LegacyTemplate): CertificateTemplateDesign {
  const { width: w, height: h } = PAGE_SIZE[t.orientation]
  const portrait = t.orientation === 'portrait'
  const left = t.align === 'left'
  const margin = t.frame === 'modern' ? 110 : 96
  const x = left ? margin : w / 2
  const align = left ? ('start' as const) : ('middle' as const)
  const textWidth = w - margin * 2
  const onBand = t.frame === 'band'
  const inset = FRAME_INSET[t.frame]

  const Y = portrait
    ? { logo: 0.1, eyebrow: 0.2, title: 0.26, subtitle: 0.32, name: 0.4, body: 0.46, dates: 0.62, sig: 0.76 }
    : { logo: 0.085, eyebrow: 0.24, title: 0.315, subtitle: 0.385, name: 0.475, body: 0.55, dates: 0.7, sig: 0.83 }
  if (onBand) Y.logo = portrait ? 0.05 : 0.025

  const els: CertElement[] = []
  const logoSize = portrait ? 78 : 70
  if (t.showLogo) {
    els.push({
      id: newId('el'),
      type: 'image',
      name: 'Logo',
      x: left ? margin : w / 2 - logoSize / 2,
      y: h * Y.logo,
      src: t.logo,
      monogram: t.monogram || 'B',
      w: logoSize,
      h: logoSize,
      radius: logoSize * 0.22,
      fill: onBand ? 'accent' : 'primary',
      textColor: onBand ? 'primary' : 'background',
    })
  }
  if (t.text.eyebrow) {
    els.push(makeText({ name: 'Small heading', x, y: h * Y.eyebrow, text: t.text.eyebrow, width: textWidth, font: t.fonts.body, fontSize: portrait ? 15 : 16, bold: true, color: 'accent', align, letterSpacing: 4, uppercase: true, fit: true }))
  }
  els.push(makeText({ name: 'Title', x, y: h * Y.title, text: t.text.title, width: textWidth, font: t.fonts.heading, fontSize: portrait ? 38 : 46, bold: true, color: 'primary', align, fit: true }))
  if (t.text.subtitle) {
    els.push(makeText({ name: 'Presented to', x, y: h * Y.subtitle, text: t.text.subtitle, width: textWidth, font: t.fonts.body, fontSize: portrait ? 17 : 19, italic: true, color: 'muted', align, fit: true }))
  }
  els.push(
    makeText({
      name: 'Student name',
      x,
      y: h * Y.name,
      text: '{{student_name}}',
      width: textWidth,
      font: t.fonts.name,
      fontSize: portrait ? 54 : 62,
      bold: t.fonts.name !== 'script',
      color: 'text',
      align,
      uppercase: t.nameStyle === 'caps',
      letterSpacing: t.nameStyle === 'caps' ? 3 : 0,
      fit: true,
    }),
  )
  if (t.nameStyle === 'underline') {
    const lineW = left ? Math.min(textWidth * 0.6, 520) : Math.min(textWidth * 0.68, 600)
    els.push({ id: newId('el'), type: 'line', name: 'Name underline', x: left ? margin : w / 2 - lineW / 2, y: h * Y.name + 16, width: lineW, thickness: 1.5, color: 'accent', dashed: false })
  }
  const body = [t.text.preamble, t.text.body].filter(Boolean).join('\n')
  if (body) {
    els.push(makeText({ name: 'Main text', x, y: h * Y.body, text: body, width: textWidth * (left ? 0.8 : 0.78), font: t.fonts.body, fontSize: portrait ? 16 : 17, color: 'text', align, lineHeight: 1.55, maxLines: 5 }))
  }
  if (t.show.issueDate) {
    els.push(makeText({ name: 'Issue date', x, y: h * Y.dates, text: 'Issued {{issue_date}}', width: textWidth, font: t.fonts.body, fontSize: 14, bold: true, color: 'muted', align, letterSpacing: 1, fit: true, hideIfBlank: true }))
  }
  if (t.show.expiration) {
    els.push(makeText({ name: 'Expiry date', x, y: h * Y.dates + 22, text: 'Valid until {{expiration_date}}', width: textWidth, font: t.fonts.body, fontSize: 13, color: 'muted', align, letterSpacing: 1, fit: true, hideIfBlank: true }))
  }

  const sigs = t.signatories.slice(0, 3)
  const sigSpan = left ? textWidth * 0.62 : textWidth * 0.72
  const sigStart = left ? margin : (w - sigSpan) / 2
  const sigW = sigs.length ? Math.min(220, sigSpan / sigs.length - 24) : 0
  sigs.forEach((s, i) => {
    els.push({
      id: newId('el'),
      type: 'signature',
      name: `Signature ${i + 1}`,
      x: sigStart + (sigSpan / sigs.length) * (i + 0.5),
      y: h * Y.sig,
      signer: s.name,
      title: s.title,
      image: s.signatureImage,
      width: sigW,
      font: t.fonts.body,
      color: 'text',
    })
  })

  const qrSize = portrait ? 96 : 92
  const qrX = w - inset - qrSize
  const qrY = h - (onBand ? 60 : inset) - qrSize - 14
  if (t.seal !== 'none') {
    const r = portrait ? 50 : 46
    els.push({
      id: newId('el'),
      type: 'seal',
      name: 'Seal',
      x: left ? w - margin - r - (t.show.qr ? qrSize + 40 : 0) : inset + r,
      y: h - (onBand ? 62 : inset) - r - 8 - (t.seal === 'ribbon' ? r * 0.8 : 0),
      style: t.seal,
      text: t.sealText,
      r,
      color: 'primary',
      ring: 'accent',
    })
  }
  const onBandLabel = onBand ? 'background' : 'muted'
  if (t.show.qr) {
    els.push({ id: newId('el'), type: 'qr', name: 'QR code', x: qrX, y: qrY, size: qrSize, color: 'primary', showLabel: true, showId: t.show.certificateId, labelColor: onBandLabel })
  } else if (t.show.certificateId) {
    els.push(makeText({ name: 'Certificate ID', x: w - inset, y: h - (onBand ? 38 : inset), text: 'ID {{certificate_id}}', width: 300, font: 'mono', fontSize: 11, color: onBandLabel, align: 'end', fit: true }))
  }
  if (t.text.footer) {
    els.push(makeText({ name: 'Footer', x: w / 2, y: h - (onBand ? 38 : 42), text: t.text.footer, width: w - 200, font: t.fonts.body, fontSize: 11, color: onBandLabel, fit: true }))
  }

  return {
    id: t.id,
    name: t.name,
    description: t.description,
    builtIn: t.builtIn,
    isDefault: t.isDefault,
    updatedAt: t.updatedAt,
    version: 2,
    orientation: t.orientation,
    colors: { ...t.colors },
    frame: t.frame,
    pattern: t.pattern,
    patternOpacity: t.patternOpacity,
    gradient: t.gradient,
    elements: els,
  }
}

const BASE_TEXT = {
  eyebrow: '{{institution_name}}',
  title: 'Certificate of Completion',
  subtitle: 'This is proudly presented to',
  preamble: '',
  body: 'for successfully completing {{course_code}} — {{course_title}}, offered by the Department of {{department}}.',
  footer: '',
}

const BASE: Omit<LegacyTemplate, 'id' | 'name'> = {
  orientation: 'landscape',
  align: 'center',
  colors: { background: '#FFFDF7', primary: '#1B2340', accent: '#B8913A', text: '#1B2340', muted: '#5B6478' },
  frame: 'classic',
  pattern: 'guilloche',
  patternOpacity: 35,
  gradient: false,
  seal: 'rosette',
  sealText: 'OFFICIAL',
  monogram: 'B',
  showLogo: true,
  fonts: { heading: 'serif', name: 'script', body: 'serif' },
  nameStyle: 'underline',
  text: BASE_TEXT,
  signatories: [
    { id: 'sig-1', name: 'Dr. Hana Tesfaye', title: 'President' },
    { id: 'sig-2', name: '{{instructor_name}}', title: 'Course Instructor' },
  ],
  show: { qr: true, certificateId: true, issueDate: true, expiration: true },
}

/**
 * Ready-made designs. The two original ids are kept so certificates issued
 * before the designer existed still render with a sensible design.
 */
const LEGACY_PRESETS: LegacyTemplate[] = [
  { ...BASE, id: 'tpl-standard', name: 'Standard Completion Certificate', description: 'Ivory paper, gold accents and a guilloche security pattern.', builtIn: true, isDefault: true },
  {
    ...BASE,
    id: 'tpl-professional',
    name: 'Professional Certificate',
    description: 'Deep navy band with a crisp modern layout.',
    builtIn: true,
    colors: { background: '#FFFFFF', primary: '#0F1B3D', accent: '#A3CF3F', text: '#0F1B3D', muted: '#5B6478' },
    frame: 'band',
    pattern: 'dots',
    patternOpacity: 25,
    seal: 'ribbon',
    sealText: 'CERTIFIED',
    fonts: { heading: 'sans', name: 'display', body: 'sans' },
    nameStyle: 'caps',
    text: { ...BASE_TEXT, title: 'Professional Certificate', subtitle: 'Awarded to' },
  },
  {
    ...BASE,
    id: 'tpl-emerald',
    name: 'Emerald Academic',
    description: 'Ornate corners on a mint wash — traditional and warm.',
    builtIn: true,
    colors: { background: '#F6FBF7', primary: '#0B4F3C', accent: '#C8A04A', text: '#12352A', muted: '#4E6B60' },
    frame: 'ornate',
    pattern: 'waves',
    patternOpacity: 30,
    gradient: true,
    seal: 'stamp',
    sealText: 'EXCELLENCE',
    fonts: { heading: 'display', name: 'script', body: 'serif' },
    text: { ...BASE_TEXT, title: 'Certificate of Achievement' },
  },
  {
    ...BASE,
    id: 'tpl-royal',
    name: 'Royal Honours',
    description: 'Burgundy and gold with a star seal, for distinctions.',
    builtIn: true,
    colors: { background: '#FFFBF5', primary: '#6B1530', accent: '#C9A23F', text: '#3A0C1A', muted: '#7A5A63' },
    frame: 'double',
    pattern: 'radial',
    patternOpacity: 30,
    seal: 'star',
    sealText: 'HONOURS',
    fonts: { heading: 'display', name: 'script', body: 'display' },
    text: {
      ...BASE_TEXT,
      title: 'Certificate of Distinction',
      subtitle: 'With great honour, this recognises',
      body: 'for outstanding performance in {{course_title}} ({{course_code}}).',
    },
  },
  {
    ...BASE,
    id: 'tpl-minimal',
    name: 'Minimal Mono',
    description: 'Quiet, left-aligned and modern. No ornament.',
    builtIn: true,
    align: 'left',
    colors: { background: '#FFFFFF', primary: '#111111', accent: '#E4572E', text: '#111111', muted: '#6B6B6B' },
    frame: 'modern',
    pattern: 'none',
    patternOpacity: 0,
    seal: 'none',
    fonts: { heading: 'sans', name: 'sans', body: 'sans' },
    nameStyle: 'plain',
    text: { ...BASE_TEXT, eyebrow: 'Certificate', title: '{{course_title}}', subtitle: 'Completed by' },
  },
  {
    ...BASE,
    id: 'tpl-tech',
    name: 'Tech Blueprint',
    description: 'Blueprint grid and geometric frame for technical courses.',
    builtIn: true,
    colors: { background: '#0E1A33', primary: '#7DD3FC', accent: '#A3E635', text: '#E6F0FF', muted: '#9FB3D1' },
    frame: 'geometric',
    pattern: 'grid',
    patternOpacity: 45,
    gradient: true,
    seal: 'stamp',
    sealText: 'VERIFIED',
    fonts: { heading: 'mono', name: 'sans', body: 'sans' },
    nameStyle: 'caps',
    text: { ...BASE_TEXT, title: 'Certificate of Completion', subtitle: 'Issued to' },
  },
]

export const PRESET_TEMPLATES: CertificateTemplateDesign[] = LEGACY_PRESETS.map(legacyToDesign)

/** Accept any stored template — current or first format — as a current one. */
export function normalizeTemplate(raw: unknown): CertificateTemplateDesign {
  const t = raw as Partial<CertificateTemplateDesign> & Partial<LegacyTemplate>
  if (t.version === 2 && Array.isArray(t.elements)) return t as CertificateTemplateDesign
  return legacyToDesign({ ...BASE, ...(t as LegacyTemplate) })
}

/** A new template: the standard layout, ready to be changed. */
export function blankTemplate(): CertificateTemplateDesign {
  return {
    ...structuredClone(PRESET_TEMPLATES[0]),
    id: newId('tpl'),
    name: 'Untitled template',
    description: '',
    builtIn: false,
    isDefault: false,
  }
}

/** An empty page with just a title and the student's name. */
export function emptyTemplate(orientation: Orientation = 'landscape'): CertificateTemplateDesign {
  const { width: w, height: h } = PAGE_SIZE[orientation]
  return {
    id: newId('tpl'),
    name: 'Untitled template',
    description: '',
    version: 2,
    orientation,
    colors: { ...PRESET_TEMPLATES[0].colors },
    frame: 'none',
    pattern: 'none',
    patternOpacity: 30,
    gradient: false,
    elements: [
      makeText({ name: 'Title', x: w / 2, y: h * 0.3, text: 'Certificate', width: w - 200, fontSize: 48, bold: true, color: 'primary', fit: true }),
      makeText({ name: 'Student name', x: w / 2, y: h * 0.48, text: '{{student_name}}', width: w - 200, font: 'script', fontSize: 60, fit: true }),
    ],
  }
}

export function duplicateTemplate(source: CertificateTemplateDesign): CertificateTemplateDesign {
  const copy = structuredClone(source)
  return {
    ...copy,
    id: newId('tpl'),
    name: `${source.name} (copy)`,
    builtIn: false,
    isDefault: false,
    elements: copy.elements.map((e) => ({ ...e, id: newId('el') })),
  }
}

/** The template a certificate should render with, falling back to the default. */
export function resolveTemplate(
  templates: CertificateTemplateDesign[],
  templateId?: string,
): CertificateTemplateDesign {
  return (
    templates.find((t) => t.id === templateId) ??
    templates.find((t) => t.isDefault) ??
    templates[0] ??
    PRESET_TEMPLATES[0]
  )
}

/**
 * Stored templates plus any built-in preset the institution has not saved its
 * own version of, so the gallery is never empty and old certificates render.
 */
export function mergeWithPresets(stored: CertificateTemplateDesign[]): CertificateTemplateDesign[] {
  const storedIds = new Set(stored.map((t) => t.id))
  const storedHasDefault = stored.some((t) => t.isDefault)
  const presets = PRESET_TEMPLATES.filter((p) => !storedIds.has(p.id)).map((p) =>
    storedHasDefault ? { ...p, isDefault: false } : p,
  )
  const merged = [...stored, ...presets]
  if (!merged.some((t) => t.isDefault)) {
    return merged.map((t, i) => (i === 0 ? { ...t, isDefault: true } : t))
  }
  return merged
}

/**
 * Certificate templates.
 *
 * A template is plain JSON (stored in the `certificate-templates` collection):
 * a page (size, colours, frame, background pattern) plus a list of free-form
 * elements — text, images, signatures, a seal, a QR code, lines and boxes — each
 * with its own position, size and style. Text may contain {{placeholders}} that
 * are filled from each certificate.
 *
 * One renderer (`CertificateArt`) draws it for the designer, the gallery and the
 * downloaded PDF, so what the admin designs is exactly what the learner gets.
 */

export type Orientation = 'landscape' | 'portrait'

/** A4 at 96 dpi. */
export const PAGE_SIZE = {
  landscape: { width: 1123, height: 794 },
  portrait: { width: 794, height: 1123 },
} as const

export type FrameStyle = 'none' | 'classic' | 'double' | 'ornate' | 'modern' | 'band' | 'geometric'
export type PatternStyle = 'none' | 'guilloche' | 'dots' | 'diagonal' | 'waves' | 'grid' | 'radial'
export type SealStyle = 'rosette' | 'ribbon' | 'stamp' | 'star'
export type FontKey = 'serif' | 'sans' | 'script' | 'display' | 'mono'
export type TextAlign = 'start' | 'middle' | 'end'

export interface ThemeColors {
  background: string
  primary: string
  accent: string
  text: string
  muted: string
}

/** A theme colour name (follows palette changes) or a fixed '#rrggbb'. */
export type ColorRef = keyof ThemeColors | string

interface ElementBase {
  id: string
  /** Shown in the layers list. */
  name: string
  x: number
  y: number
  rotation?: number
  /** 0–100. */
  opacity?: number
  hidden?: boolean
  locked?: boolean
}

export interface TextElement extends ElementBase {
  type: 'text'
  text: string
  /** Wrap width; also the width a single line shrinks to fit. */
  width: number
  font: FontKey
  fontSize: number
  bold: boolean
  italic: boolean
  color: ColorRef
  /** x is the left edge, centre or right edge of the text. */
  align: TextAlign
  letterSpacing: number
  uppercase: boolean
  lineHeight: number
  /** Single line that shrinks to fit the width (good for names). */
  fit: boolean
  maxLines: number
  /** Hide when a placeholder in it has no value, e.g. an expiry date. */
  hideIfBlank: boolean
}

export interface ImageElement extends ElementBase {
  type: 'image'
  /** Data URL. Without one, a monogram tile is drawn. */
  src?: string
  monogram: string
  w: number
  h: number
  radius: number
  fill: ColorRef
  textColor: ColorRef
}

export interface SignatureElement extends ElementBase {
  type: 'signature'
  signer: string
  title: string
  image?: string
  width: number
  font: FontKey
  color: ColorRef
}

export interface SealElement extends ElementBase {
  type: 'seal'
  style: SealStyle
  text: string
  r: number
  color: ColorRef
  ring: ColorRef
}

export interface QrElement extends ElementBase {
  type: 'qr'
  size: number
  color: ColorRef
  showLabel: boolean
  showId: boolean
  labelColor: ColorRef
}

export interface LineElement extends ElementBase {
  type: 'line'
  width: number
  thickness: number
  color: ColorRef
  dashed: boolean
}

export interface BoxElement extends ElementBase {
  type: 'box'
  w: number
  h: number
  /** 'none' for no fill. */
  fill: ColorRef
  stroke: ColorRef
  strokeWidth: number
  radius: number
}

export type CertElement =
  | TextElement
  | ImageElement
  | SignatureElement
  | SealElement
  | QrElement
  | LineElement
  | BoxElement

export type ElementType = CertElement['type']

export interface CertificateTemplateDesign {
  id: string
  name: string
  description?: string
  /** Built-in templates cannot be deleted, only reset. */
  builtIn?: boolean
  isDefault?: boolean
  updatedAt?: string
  version: 2

  orientation: Orientation
  colors: ThemeColors
  frame: FrameStyle
  pattern: PatternStyle
  /** 0–100: how visible the background pattern is. */
  patternOpacity: number
  /** Soft glow from the top-left corner. */
  gradient: boolean
  /** Drawn in order: later elements sit on top. */
  elements: CertElement[]
}

/** The values placeholders resolve to. */
export interface CertificateData {
  studentName: string
  courseTitle: string
  courseCode: string
  institutionName: string
  instructorName: string
  department: string
  issueDate?: string
  completionDate?: string
  expirationDate?: string
  certificateId: string
  verifyUrl: string
}

export const PLACEHOLDERS: { token: string; label: string }[] = [
  { token: '{{student_name}}', label: 'Student name' },
  { token: '{{course_title}}', label: 'Course title' },
  { token: '{{course_code}}', label: 'Course code' },
  { token: '{{institution_name}}', label: 'Institution' },
  { token: '{{instructor_name}}', label: 'Instructor' },
  { token: '{{department}}', label: 'Department' },
  { token: '{{issue_date}}', label: 'Issue date' },
  { token: '{{completion_date}}', label: 'Completion date' },
  { token: '{{expiration_date}}', label: 'Expiry date' },
  { token: '{{certificate_id}}', label: 'Certificate ID' },
]

export const FONT_STACKS: Record<FontKey, { label: string; stack: string }> = {
  serif: { label: 'Classic serif', stack: "Georgia, 'Times New Roman', Times, serif" },
  sans: { label: 'Clean sans', stack: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  script: {
    label: 'Handwritten script',
    stack: "'Brush Script MT', 'Segoe Script', 'Lucida Handwriting', cursive",
  },
  display: { label: 'Elegant display', stack: "'Palatino Linotype', Palatino, 'Book Antiqua', serif" },
  mono: { label: 'Technical mono', stack: "'Courier New', Courier, monospace" },
}

export const THEME_COLOR_KEYS: (keyof ThemeColors)[] = ['background', 'primary', 'accent', 'text', 'muted']

export function resolveColor(ref: ColorRef, colors: ThemeColors): string {
  if (ref === 'none') return 'none'
  return (colors as unknown as Record<string, string>)[ref] ?? ref
}

export function formatCertDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function placeholderValues(data: CertificateData): Record<string, string> {
  return {
    student_name: data.studentName,
    course_title: data.courseTitle,
    course_code: data.courseCode,
    institution_name: data.institutionName,
    instructor_name: data.instructorName,
    department: data.department,
    issue_date: formatCertDate(data.issueDate),
    completion_date: formatCertDate(data.completionDate ?? data.issueDate),
    expiration_date: formatCertDate(data.expirationDate),
    certificate_id: data.certificateId,
  }
}

/**
 * Replace {{tokens}} with the certificate's values. `blank` is true when a known
 * token had no value, so an element can hide itself (e.g. "Valid until …").
 */
export function resolveText(text: string, data: CertificateData): { text: string; blank: boolean } {
  const values = placeholderValues(data)
  let blank = false
  const out = text.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (match, key: string) => {
    if (!(key in values)) return match
    if (!values[key]) blank = true
    return values[key]
  })
  return { text: out, blank }
}

export function fillPlaceholders(text: string, data: CertificateData): string {
  return resolveText(text, data).text
}

export function verifyUrlFor(certificateId: string): string {
  return `${window.location.origin}/verify/${encodeURIComponent(certificateId)}`
}

export function sampleCertificateData(institutionName: string): CertificateData {
  return {
    studentName: 'Selam Girma',
    courseTitle: 'Introduction to Programming',
    courseCode: 'CS-101',
    institutionName: institutionName || 'Berana University',
    instructorName: 'Dr. Aaron Selassie',
    department: 'Computer Science',
    issueDate: new Date().toISOString().slice(0, 10),
    completionDate: new Date().toISOString().slice(0, 10),
    expirationDate: undefined,
    certificateId: 'BER-CERT-2026-7K3M-Q9TD',
    verifyUrl: `${window.location.origin}/verify/BER-CERT-2026-7K3M-Q9TD`,
  }
}

let seq = 0
export function newId(prefix: string): string {
  seq += 1
  return `${prefix}-${Date.now().toString(36)}${seq.toString(36)}`
}

/* ── Element factories (used by the designer's "Add" panel) ─────────────── */

export function makeText(partial: Partial<TextElement> = {}): TextElement {
  return {
    id: newId('el'),
    type: 'text',
    name: 'Text',
    x: 0,
    y: 0,
    text: 'New text',
    width: 500,
    font: 'serif',
    fontSize: 24,
    bold: false,
    italic: false,
    color: 'text',
    align: 'middle',
    letterSpacing: 0,
    uppercase: false,
    lineHeight: 1.4,
    fit: false,
    maxLines: 6,
    hideIfBlank: false,
    ...partial,
  }
}

export function makeElement(type: ElementType, x: number, y: number): CertElement {
  const base = { id: newId('el'), x, y }
  switch (type) {
    case 'text':
      return makeText({ x, y })
    case 'image':
      return { ...base, type, name: 'Image', monogram: 'B', w: 90, h: 90, radius: 14, fill: 'primary', textColor: 'background' }
    case 'signature':
      return { ...base, type, name: 'Signature', signer: 'Name Surname', title: 'Title', width: 200, font: 'serif', color: 'text' }
    case 'seal':
      return { ...base, type, name: 'Seal', style: 'rosette', text: 'OFFICIAL', r: 46, color: 'primary', ring: 'accent' }
    case 'qr':
      return { ...base, type, name: 'QR code', size: 92, color: 'primary', showLabel: true, showId: true, labelColor: 'muted' }
    case 'line':
      return { ...base, type, name: 'Line', width: 300, thickness: 2, color: 'accent', dashed: false }
    case 'box':
      return { ...base, type, name: 'Box', w: 240, h: 120, fill: 'none', stroke: 'accent', strokeWidth: 2, radius: 12 }
  }
}

/**
 * Certificate templates.
 *
 * A template is plain JSON (stored in the `certificate-templates` collection) that
 * describes a design: page, colours, frame, background pattern, seal, fonts, text
 * with {{placeholders}}, signatories and a verification QR code. One renderer
 * (`CertificateArt`) turns it into SVG for the designer preview, the gallery
 * thumbnails and the downloaded PDF, so what the admin designs is exactly what
 * the learner downloads.
 */

export type Orientation = 'landscape' | 'portrait'

/** A4 at 96 dpi. */
export const PAGE_SIZE = {
  landscape: { width: 1123, height: 794 },
  portrait: { width: 794, height: 1123 },
} as const
export type FrameStyle = 'none' | 'classic' | 'double' | 'ornate' | 'modern' | 'band' | 'geometric'
export type PatternStyle = 'none' | 'guilloche' | 'dots' | 'diagonal' | 'waves' | 'grid' | 'radial'
export type SealStyle = 'none' | 'rosette' | 'ribbon' | 'stamp' | 'star'
export type FontKey = 'serif' | 'sans' | 'script' | 'display' | 'mono'
export type Align = 'center' | 'left'
export type NameStyle = 'plain' | 'underline' | 'caps'

export interface Signatory {
  id: string
  name: string
  title: string
  /** PNG/JPEG data URL of a handwritten signature, optional. */
  signatureImage?: string
}

export interface CertificateTemplateDesign {
  id: string
  name: string
  description?: string
  /** Built-in templates cannot be deleted, only duplicated. */
  builtIn?: boolean
  isDefault?: boolean
  updatedAt?: string

  orientation: Orientation
  align: Align

  colors: {
    background: string
    primary: string
    accent: string
    text: string
    muted: string
  }

  frame: FrameStyle
  pattern: PatternStyle
  /** 0–100: how visible the background pattern is. */
  patternOpacity: number
  /** Soft gradient wash from the top-left corner. */
  gradient: boolean

  seal: SealStyle
  sealText: string

  logo?: string
  /** Shown as a monogram when there is no logo image. */
  monogram: string
  showLogo: boolean

  fonts: {
    heading: FontKey
    name: FontKey
    body: FontKey
  }
  nameStyle: NameStyle

  text: {
    eyebrow: string
    title: string
    subtitle: string
    preamble: string
    body: string
    footer: string
  }

  signatories: Signatory[]

  show: {
    qr: boolean
    certificateId: boolean
    issueDate: boolean
    expiration: boolean
  }
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
  { token: '{{expiration_date}}', label: 'Expiration date' },
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

export function formatCertDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Replace {{tokens}} with the certificate's values. Unknown tokens are left as-is. */
export function fillPlaceholders(text: string, data: CertificateData): string {
  const values: Record<string, string> = {
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
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (match, key: string) => values[key] ?? match)
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
    certificateId: 'BER-CERT-2026-00001',
    verifyUrl: `${window.location.origin}/verify/BER-CERT-2026-00001`,
  }
}

let seq = 0
export function newId(prefix: string): string {
  seq += 1
  return `${prefix}-${Date.now().toString(36)}${seq.toString(36)}`
}

const BASE_TEXT = {
  eyebrow: '{{institution_name}}',
  title: 'Certificate of Completion',
  subtitle: 'This is proudly presented to',
  preamble: '',
  body: 'for successfully completing {{course_code}} — {{course_title}}, offered by the Department of {{department}}.',
  footer: '',
}

const BASE: Omit<CertificateTemplateDesign, 'id' | 'name'> = {
  orientation: 'landscape',
  align: 'center',
  colors: {
    background: '#FFFDF7',
    primary: '#1B2340',
    accent: '#B8913A',
    text: '#1B2340',
    muted: '#5B6478',
  },
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
 * Ready-made designs. The two original template ids are kept so certificates
 * issued before the designer existed still render with a sensible design.
 */
export const PRESET_TEMPLATES: CertificateTemplateDesign[] = [
  {
    ...BASE,
    id: 'tpl-standard',
    name: 'Standard Completion Certificate',
    description: 'Ivory paper, gold accents and a guilloche security pattern.',
    builtIn: true,
    isDefault: true,
  },
  {
    ...BASE,
    id: 'tpl-professional',
    name: 'Professional Certificate',
    description: 'Deep navy band with a crisp modern layout.',
    builtIn: true,
    colors: {
      background: '#FFFFFF',
      primary: '#0F1B3D',
      accent: '#A3CF3F',
      text: '#0F1B3D',
      muted: '#5B6478',
    },
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
    colors: {
      background: '#F6FBF7',
      primary: '#0B4F3C',
      accent: '#C8A04A',
      text: '#12352A',
      muted: '#4E6B60',
    },
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
    colors: {
      background: '#FFFBF5',
      primary: '#6B1530',
      accent: '#C9A23F',
      text: '#3A0C1A',
      muted: '#7A5A63',
    },
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
    colors: {
      background: '#FFFFFF',
      primary: '#111111',
      accent: '#E4572E',
      text: '#111111',
      muted: '#6B6B6B',
    },
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
    colors: {
      background: '#0E1A33',
      primary: '#7DD3FC',
      accent: '#A3E635',
      text: '#E6F0FF',
      muted: '#9FB3D1',
    },
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

export function duplicateTemplate(source: CertificateTemplateDesign): CertificateTemplateDesign {
  return {
    ...structuredClone(source),
    id: newId('tpl'),
    name: `${source.name} (copy)`,
    builtIn: false,
    isDefault: false,
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

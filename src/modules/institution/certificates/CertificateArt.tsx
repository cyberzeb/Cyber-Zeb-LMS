/**
 * Renders a certificate template to SVG. Pure and synchronous (no web fonts, no
 * network), so the same markup drives the designer, gallery thumbnails and the
 * rasterised PDF.
 */
import QRCode from 'qrcode'
import type { ReactNode } from 'react'

import {
  FONT_STACKS,
  PAGE_SIZE,
  resolveColor,
  resolveText,
  type CertElement,
  type CertificateData,
  type CertificateTemplateDesign,
  type FontKey,
  type SealStyle,
  type ThemeColors,
} from './templateModel'
import { rotationTransform } from './elementGeometry'

interface Props {
  template: CertificateTemplateDesign
  data: CertificateData
  /** Makes SVG ids unique when several certificates share a page. */
  uid?: string
  className?: string
}

/* ── Geometry helpers ─────────────────────────────────────────────────────── */

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const n = parseInt(full, 16)
  if (Number.isNaN(n)) return `rgba(0,0,0,${alpha})`
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

function isDark(hex: string): boolean {
  const clean = hex.replace('#', '')
  const n = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16)
  if (Number.isNaN(n)) return false
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 110
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

/** Spirograph (hypotrochoid) — the classic banknote guilloche rosette. */
function guillochePath(cx: number, cy: number, R: number, r: number, d: number, scale: number): string {
  const pts: string[] = []
  const steps = 1400
  const turns = r / gcd(Math.round(R), Math.round(r))
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2 * turns
    const x = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t)
    const y = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t)
    pts.push(`${(cx + x * scale).toFixed(1)},${(cy + y * scale).toFixed(1)}`)
  }
  return `M${pts.join('L')}Z`
}

function starPoints(cx: number, cy: number, outer: number, inner: number, points: number, rot = -90): string {
  const pts: string[] = []
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = ((rot + (i * 180) / points) * Math.PI) / 180
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

/** Approximate glyph width per font, as a fraction of the font size. */
function widthFactor(font: FontKey, uppercase: boolean, bold: boolean): number {
  const base = { serif: 0.5, sans: 0.52, script: 0.4, display: 0.5, mono: 0.6 }[font]
  return base * (uppercase ? 1.25 : 1) * (bold ? 1.06 : 1)
}

/** Greedy word wrap by estimated glyph width (no font metrics in SVG-as-image). */
function wrap(text: string, fontSize: number, maxWidth: number, factor: number): string[] {
  const maxChars = Math.max(4, Math.floor(maxWidth / (fontSize * factor)))
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    let line = ''
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word
      if (next.length > maxChars && line) {
        lines.push(line)
        line = word
      } else {
        line = next
      }
    }
    if (line) lines.push(line)
  }
  return lines
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

function Pattern({ t, w, h, id }: { t: CertificateTemplateDesign; w: number; h: number; id: string }) {
  const opacity = Math.max(0, Math.min(100, t.patternOpacity)) / 100
  const stroke = hexToRgba(t.colors.accent, 0.55)
  if (t.pattern === 'none' || opacity === 0) return null

  let content: ReactNode = null
  if (t.pattern === 'guilloche') {
    const scale = Math.min(w, h) / 260
    content = (
      <g fill="none" stroke={stroke} strokeWidth={0.6}>
        <path d={guillochePath(w / 2, h / 2, 96, 36, 58, scale)} />
        <path d={guillochePath(w / 2, h / 2, 96, 28, 44, scale * 0.95)} />
        <path d={guillochePath(w / 2, h / 2, 90, 20, 36, scale * 0.8)} />
      </g>
    )
  } else if (t.pattern === 'dots') {
    content = (
      <>
        <defs>
          <pattern id={`${id}-dots`} width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="11" cy="11" r="1.6" fill={stroke} />
          </pattern>
        </defs>
        <rect width={w} height={h} fill={`url(#${id}-dots)`} />
      </>
    )
  } else if (t.pattern === 'diagonal') {
    content = (
      <>
        <defs>
          <pattern id={`${id}-diag`} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="16" stroke={stroke} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={w} height={h} fill={`url(#${id}-diag)`} />
      </>
    )
  } else if (t.pattern === 'grid') {
    content = (
      <>
        <defs>
          <pattern id={`${id}-grid-s`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke={stroke} strokeWidth="0.5" />
          </pattern>
          <pattern id={`${id}-grid`} width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill={`url(#${id}-grid-s)`} />
            <path d="M100 0H0V100" fill="none" stroke={stroke} strokeWidth="1.2" />
          </pattern>
        </defs>
        <rect width={w} height={h} fill={`url(#${id}-grid)`} />
      </>
    )
  } else if (t.pattern === 'waves') {
    const lines = []
    for (let i = 0; i < 26; i++) {
      const y0 = (h / 26) * i + 10
      let d = `M0 ${y0}`
      for (let x = 0; x <= w; x += 40) d += ` Q${x + 20} ${y0 + (i % 2 ? 12 : -12)} ${x + 40} ${y0}`
      lines.push(<path key={i} d={d} fill="none" stroke={stroke} strokeWidth="0.7" />)
    }
    content = <g>{lines}</g>
  } else if (t.pattern === 'radial') {
    const len = Math.hypot(w, h)
    content = (
      <g>
        {Array.from({ length: 120 }, (_, i) => {
          const a = (i / 120) * Math.PI * 2
          return <line key={i} x1={w / 2} y1={h / 2} x2={w / 2 + Math.cos(a) * len} y2={h / 2 + Math.sin(a) * len} stroke={stroke} strokeWidth="0.6" />
        })}
      </g>
    )
  }
  return <g opacity={opacity}>{content}</g>
}

function Frame({ t, w, h }: { t: CertificateTemplateDesign; w: number; h: number }) {
  const { primary, accent } = t.colors
  const m = 28
  switch (t.frame) {
    case 'none':
      return null
    case 'classic':
      return (
        <g fill="none">
          <rect x={m} y={m} width={w - m * 2} height={h - m * 2} stroke={primary} strokeWidth={4} />
          <rect x={m + 12} y={m + 12} width={w - (m + 12) * 2} height={h - (m + 12) * 2} stroke={accent} strokeWidth={1.5} />
        </g>
      )
    case 'double':
      return (
        <g fill="none">
          <rect x={m} y={m} width={w - m * 2} height={h - m * 2} stroke={accent} strokeWidth={10} />
          <rect x={m + 16} y={m + 16} width={w - (m + 16) * 2} height={h - (m + 16) * 2} stroke={primary} strokeWidth={2} />
          <rect x={m + 22} y={m + 22} width={w - (m + 22) * 2} height={h - (m + 22) * 2} stroke={accent} strokeWidth={0.8} />
        </g>
      )
    case 'ornate': {
      const corners = [
        [m, m, 0],
        [w - m, m, 90],
        [w - m, h - m, 180],
        [m, h - m, 270],
      ] as const
      return (
        <g>
          <rect x={m} y={m} width={w - m * 2} height={h - m * 2} fill="none" stroke={primary} strokeWidth={2} />
          <rect x={m + 10} y={m + 10} width={w - (m + 10) * 2} height={h - (m + 10) * 2} fill="none" stroke={accent} strokeWidth={1} strokeDasharray="2 5" />
          {corners.map(([x, y, rot]) => (
            <g key={rot} transform={`translate(${x} ${y}) rotate(${rot})`}>
              <path d="M0 70 Q0 0 70 0" fill="none" stroke={accent} strokeWidth={3} />
              <path d="M12 58 Q12 12 58 12" fill="none" stroke={primary} strokeWidth={1.2} />
              <polygon points="0,0 16,6 6,16" fill={accent} />
              <circle cx={34} cy={34} r={5} fill={primary} />
              <circle cx={34} cy={34} r={10} fill="none" stroke={accent} strokeWidth={1} />
            </g>
          ))}
        </g>
      )
    }
    case 'modern':
      return (
        <g>
          <rect x={0} y={0} width={18} height={h} fill={accent} />
          <rect x={m + 10} y={m} width={w - m * 2 - 10} height={h - m * 2} fill="none" stroke={hexToRgba(primary, 0.18)} strokeWidth={1} />
        </g>
      )
    case 'band':
      return (
        <g>
          <rect x={0} y={0} width={w} height={h * 0.13} fill={primary} />
          <rect x={0} y={h * 0.13} width={w} height={5} fill={accent} />
          <rect x={0} y={h - 22} width={w} height={22} fill={primary} />
          <rect x={0} y={h - 27} width={w} height={5} fill={accent} />
        </g>
      )
    case 'geometric': {
      const s = Math.min(w, h) * 0.2
      return (
        <g>
          <polygon points={`0,0 ${s},0 0,${s}`} fill={primary} opacity={0.9} />
          <polygon points={`0,0 ${s * 0.6},0 0,${s * 0.6}`} fill={accent} />
          <polygon points={`${w},${h} ${w - s},${h} ${w},${h - s}`} fill={primary} opacity={0.9} />
          <polygon points={`${w},${h} ${w - s * 0.6},${h} ${w},${h - s * 0.6}`} fill={accent} />
          <rect x={m} y={m} width={w - m * 2} height={h - m * 2} fill="none" stroke={hexToRgba(primary, 0.5)} strokeWidth={1} />
        </g>
      )
    }
  }
}

/** Paper, glow, pattern and frame — everything that is not an element. */
export function PageBackground({ template: t, uid }: { template: CertificateTemplateDesign; uid: string }) {
  const { width: w, height: h } = PAGE_SIZE[t.orientation]
  return (
    <g pointerEvents="none">
      <defs>
        <radialGradient id={`${uid}-wash`} cx="0" cy="0" r="1.2">
          <stop offset="0" stopColor={t.colors.accent} stopOpacity="0.22" />
          <stop offset="0.6" stopColor={t.colors.accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={w} height={h} fill={t.colors.background} />
      {t.gradient ? <rect width={w} height={h} fill={`url(#${uid}-wash)`} /> : null}
      <Pattern t={t} w={w} h={h} id={uid} />
      <Frame t={t} w={w} h={h} />
    </g>
  )
}

/* ── Elements ─────────────────────────────────────────────────────────────── */

function SealArt({
  style,
  text,
  cx,
  cy,
  r,
  color,
  ring,
  paper,
  id,
}: {
  style: SealStyle
  text: string
  cx: number
  cy: number
  r: number
  color: string
  ring: string
  paper: string
  id: string
}) {
  const label = (text || '').toUpperCase().slice(0, 18)
  const ringPath = `M ${cx - r * 0.72} ${cy} A ${r * 0.72} ${r * 0.72} 0 1 1 ${cx + r * 0.72} ${cy} A ${r * 0.72} ${r * 0.72} 0 1 1 ${cx - r * 0.72} ${cy}`
  if (style === 'rosette') {
    return (
      <g>
        <polygon points={starPoints(cx, cy, r, r * 0.88, 32)} fill={ring} />
        <circle cx={cx} cy={cy} r={r * 0.86} fill={color} />
        <circle cx={cx} cy={cy} r={r * 0.56} fill="none" stroke={ring} strokeWidth={1.5} />
        <defs>
          <path id={`${id}-ring`} d={ringPath} />
        </defs>
        <text fontFamily={FONT_STACKS.sans.stack} fontSize={r * 0.2} fontWeight={700} letterSpacing={2} fill={paper}>
          <textPath href={`#${id}-ring`} startOffset="25%" textAnchor="middle">
            {label}
          </textPath>
        </text>
        <polygon points={starPoints(cx, cy, r * 0.3, r * 0.13, 5)} fill={ring} />
      </g>
    )
  }
  if (style === 'ribbon') {
    return (
      <g>
        <polygon points={`${cx - r * 0.5},${cy + r * 0.4} ${cx - r * 0.85},${cy + r * 1.7} ${cx - r * 0.45},${cy + r * 1.45} ${cx - r * 0.2},${cy + r * 1.8} ${cx},${cy + r * 0.5}`} fill={color} />
        <polygon points={`${cx + r * 0.5},${cy + r * 0.4} ${cx + r * 0.85},${cy + r * 1.7} ${cx + r * 0.45},${cy + r * 1.45} ${cx + r * 0.2},${cy + r * 1.8} ${cx},${cy + r * 0.5}`} fill={ring} />
        <circle cx={cx} cy={cy} r={r} fill={ring} />
        <circle cx={cx} cy={cy} r={r * 0.86} fill="none" stroke={paper} strokeWidth={1.5} strokeDasharray="3 3" />
        <text x={cx} y={cy + r * 0.12} textAnchor="middle" fontFamily={FONT_STACKS.sans.stack} fontSize={r * 0.26} fontWeight={800} fill={paper} letterSpacing={1}>
          {label}
        </text>
      </g>
    )
  }
  if (style === 'stamp') {
    return (
      <g transform={`rotate(-14 ${cx} ${cy})`} opacity={0.9}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={ring} strokeWidth={3} />
        <circle cx={cx} cy={cy} r={r * 0.84} fill="none" stroke={ring} strokeWidth={1} />
        <defs>
          <path id={`${id}-ring`} d={ringPath} />
        </defs>
        <text fontFamily={FONT_STACKS.mono.stack} fontSize={r * 0.19} fontWeight={700} letterSpacing={3} fill={ring}>
          <textPath href={`#${id}-ring`} startOffset="25%" textAnchor="middle">
            {`★ ${label} ★`}
          </textPath>
        </text>
        <polygon points={starPoints(cx, cy, r * 0.28, r * 0.12, 5)} fill={ring} />
      </g>
    )
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={color} />
      <circle cx={cx} cy={cy} r={r * 0.9} fill="none" stroke={ring} strokeWidth={2} />
      <polygon points={starPoints(cx, cy, r * 0.72, r * 0.3, 5)} fill={ring} />
      <text x={cx} y={cy + r * 1.35} textAnchor="middle" fontFamily={FONT_STACKS.sans.stack} fontSize={r * 0.22} fontWeight={800} letterSpacing={2} fill={color}>
        {label}
      </text>
    </g>
  )
}

function Qr({ text, x, y, size, color, bg }: { text: string; x: number; y: number; size: number; color: string; bg: string }) {
  let qr: ReturnType<typeof QRCode.create>
  try {
    qr = QRCode.create(text, { errorCorrectionLevel: 'M' })
  } catch {
    return null
  }
  const n = qr.modules.size
  const cell = size / (n + 2)
  let d = ''
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (qr.modules.get(row, col)) d += `M${(col + 1) * cell} ${(row + 1) * cell}h${cell}v${cell}h${-cell}z`
    }
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={size} height={size} rx={6} fill={bg} />
      <path d={d} fill={color} shapeRendering="crispEdges" />
    </g>
  )
}

/** A standalone scannable QR code, e.g. for the verification panel. */
export function QrCodeSvg({ text, size = 96, className }: { text: string; size?: number; className?: string }) {
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className={className} role="img" aria-label="QR code">
      <Qr text={text} x={0} y={0} size={size} color="#0F1B3D" bg="#FFFFFF" />
    </svg>
  )
}

/** Draw one element (without its rotation/opacity wrapper). */
function ElementBody({ el, colors, data, uid }: { el: CertElement; colors: ThemeColors; data: CertificateData; uid: string }) {
  const c = (ref: string) => resolveColor(ref, colors)
  switch (el.type) {
    case 'text': {
      const resolved = resolveText(el.text, data)
      if (el.hideIfBlank && resolved.blank) return null
      const content = el.uppercase ? resolved.text.toUpperCase() : resolved.text
      if (!content.trim()) return null
      const factor = widthFactor(el.font, el.uppercase, el.bold) + el.letterSpacing / Math.max(el.fontSize, 1)
      let size = el.fontSize
      let lines: string[]
      if (el.fit) {
        const single = content.replace(/\s*\n\s*/g, ' ')
        const needed = single.length * size * factor
        if (needed > el.width) size = Math.max(8, el.width / (single.length * factor))
        lines = [single]
      } else {
        lines = wrap(content, size, el.width, factor).slice(0, Math.max(1, el.maxLines))
      }
      return (
        <text
          textAnchor={el.align}
          fontFamily={FONT_STACKS[el.font].stack}
          fontSize={size}
          fontWeight={el.bold ? 700 : 400}
          fontStyle={el.italic ? 'italic' : 'normal'}
          letterSpacing={el.letterSpacing}
          fill={c(el.color)}
        >
          {lines.map((line, i) => (
            <tspan key={i} x={el.x} y={el.y + i * size * el.lineHeight}>
              {line}
            </tspan>
          ))}
        </text>
      )
    }
    case 'image': {
      const clipId = `${uid}-${el.id}-clip`
      if (el.src) {
        return (
          <g>
            <defs>
              <clipPath id={clipId}>
                <rect x={el.x} y={el.y} width={el.w} height={el.h} rx={el.radius} />
              </clipPath>
            </defs>
            <image href={el.src} x={el.x} y={el.y} width={el.w} height={el.h} preserveAspectRatio="xMidYMid meet" clipPath={`url(#${clipId})`} />
          </g>
        )
      }
      const mono = (el.monogram || 'B').slice(0, 3).toUpperCase()
      const side = Math.min(el.w, el.h)
      return (
        <g>
          <rect x={el.x} y={el.y} width={el.w} height={el.h} rx={el.radius} fill={c(el.fill)} />
          <text x={el.x + el.w / 2} y={el.y + el.h / 2 + side * (mono.length > 2 ? 0.11 : 0.15)} textAnchor="middle" fontFamily={FONT_STACKS.serif.stack} fontWeight={700} fontSize={side * (mono.length > 2 ? 0.32 : 0.44)} fill={c(el.textColor)}>
            {mono}
          </text>
        </g>
      )
    }
    case 'signature': {
      const signer = resolveText(el.signer, data).text
      const title = resolveText(el.title, data).text
      const half = el.width / 2
      return (
        <g>
          {el.image ? (
            <image href={el.image} x={el.x - half} y={el.y - 58} width={el.width} height={54} preserveAspectRatio="xMidYMax meet" />
          ) : (
            <text x={el.x} y={el.y - 10} textAnchor="middle" fontFamily={FONT_STACKS.script.stack} fontSize={26} fill={c('primary')} opacity={0.85}>
              {signer}
            </text>
          )}
          <line x1={el.x - half} x2={el.x + half} y1={el.y} y2={el.y} stroke={c('muted')} strokeWidth={1} />
          <text x={el.x} y={el.y + 20} textAnchor="middle" fontFamily={FONT_STACKS[el.font].stack} fontSize={14} fontWeight={700} fill={c(el.color)}>
            {signer}
          </text>
          <text x={el.x} y={el.y + 38} textAnchor="middle" fontFamily={FONT_STACKS[el.font].stack} fontSize={12} fill={c('muted')}>
            {title}
          </text>
        </g>
      )
    }
    case 'seal':
      return <SealArt style={el.style} text={el.text} cx={el.x} cy={el.y} r={el.r} color={c(el.color)} ring={c(el.ring)} paper={colors.background} id={`${uid}-${el.id}`} />
    case 'qr':
      return (
        <g>
          <Qr text={data.verifyUrl} x={el.x} y={el.y} size={el.size} color={c(el.color)} bg={isDark(colors.background) ? '#FFFFFF' : hexToRgba('#FFFFFF', 0.9)} />
          {el.showLabel ? (
            <text x={el.x + el.size / 2} y={el.y + el.size + 14} textAnchor="middle" fontFamily={FONT_STACKS.sans.stack} fontSize={9} fontWeight={700} letterSpacing={1} fill={c(el.labelColor)}>
              SCAN TO VERIFY
            </text>
          ) : null}
          {el.showId ? (
            <text x={el.x + el.size / 2} y={el.y + el.size + (el.showLabel ? 27 : 14)} textAnchor="middle" fontFamily={FONT_STACKS.mono.stack} fontSize={9} fill={c(el.labelColor)}>
              {data.certificateId}
            </text>
          ) : null}
        </g>
      )
    case 'line':
      return (
        <line
          x1={el.x}
          x2={el.x + el.width}
          y1={el.y}
          y2={el.y}
          stroke={c(el.color)}
          strokeWidth={el.thickness}
          strokeDasharray={el.dashed ? `${el.thickness * 4} ${el.thickness * 3}` : undefined}
          strokeLinecap="round"
        />
      )
    case 'box':
      return (
        <rect
          x={el.x}
          y={el.y}
          width={el.w}
          height={el.h}
          rx={el.radius}
          fill={c(el.fill)}
          stroke={el.strokeWidth > 0 ? c(el.stroke) : 'none'}
          strokeWidth={el.strokeWidth}
        />
      )
  }
}

/** One element with its rotation and opacity applied. */
export function ElementView({
  el,
  colors,
  data,
  uid,
  children,
}: {
  el: CertElement
  colors: ThemeColors
  data: CertificateData
  uid: string
  /** Designer-only overlay drawn in the element's rotated space. */
  children?: ReactNode
}) {
  return (
    <g transform={rotationTransform(el)} opacity={el.opacity === undefined ? undefined : el.opacity / 100}>
      <g data-el={el.id}>
        <ElementBody el={el} colors={colors} data={data} uid={uid} />
      </g>
      {children}
    </g>
  )
}

/* ── Certificate ──────────────────────────────────────────────────────────── */

export function CertificateArt({ template: t, data, uid = 'c', className }: Props) {
  const { width: w, height: h } = PAGE_SIZE[t.orientation]
  const id = `${uid}-${t.id}`.replace(/[^a-zA-Z0-9_-]/g, '')
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      className={className}
      role="img"
      aria-label={`${t.name} — ${data.studentName}`}
    >
      <PageBackground template={t} uid={id} />
      {t.elements
        .filter((el) => !el.hidden)
        .map((el) => (
          <ElementView key={el.id} el={el} colors={t.colors} data={data} uid={id} />
        ))}
    </svg>
  )
}

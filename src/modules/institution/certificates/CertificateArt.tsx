/**
 * Renders a certificate template to SVG. Pure and synchronous (no web fonts, no
 * network), so the same markup drives the live designer preview, gallery
 * thumbnails and the rasterised PDF.
 */
import QRCode from 'qrcode'
import type { ReactNode } from 'react'

import {
  FONT_STACKS,
  PAGE_SIZE,
  fillPlaceholders,
  formatCertDate,
  type CertificateData,
  type CertificateTemplateDesign,
} from './templateModel'

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

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
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

/** Greedy word wrap by estimated glyph width (no font metrics in SVG-as-image). */
function wrap(text: string, fontSize: number, maxWidth: number, widthFactor = 0.52): string[] {
  const maxChars = Math.max(10, Math.floor(maxWidth / (fontSize * widthFactor)))
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

function fitSize(text: string, maxWidth: number, preferred: number, factor: number, min = 18): number {
  const needed = text.length * preferred * factor
  if (needed <= maxWidth) return preferred
  return Math.max(min, Math.floor(maxWidth / (text.length * factor)))
}

/* ── Pieces ───────────────────────────────────────────────────────────────── */

function Pattern({ t, w, h, id }: { t: CertificateTemplateDesign; w: number; h: number; id: string }) {
  const opacity = Math.max(0, Math.min(100, t.patternOpacity)) / 100
  const stroke = hexToRgba(t.colors.accent, 0.55)
  if (t.pattern === 'none' || opacity === 0) return null

  let content: ReactNode = null
  if (t.pattern === 'guilloche') {
    const cx = w / 2
    const cy = h / 2
    const scale = Math.min(w, h) / 260
    content = (
      <g fill="none" stroke={stroke} strokeWidth={0.6}>
        <path d={guillochePath(cx, cy, 96, 36, 58, scale)} />
        <path d={guillochePath(cx, cy, 96, 28, 44, scale * 0.95)} />
        <path d={guillochePath(cx, cy, 90, 20, 36, scale * 0.8)} />
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
      for (let x = 0; x <= w; x += 40) {
        d += ` Q${x + 20} ${y0 + (i % 2 ? 12 : -12)} ${x + 40} ${y0}`
      }
      lines.push(<path key={i} d={d} fill="none" stroke={stroke} strokeWidth="0.7" />)
    }
    content = <g>{lines}</g>
  } else if (t.pattern === 'radial') {
    const rays = []
    const cx = w / 2
    const cy = h / 2
    const len = Math.hypot(w, h)
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * Math.PI * 2
      rays.push(
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={cx + Math.cos(a) * len}
          y2={cy + Math.sin(a) * len}
          stroke={stroke}
          strokeWidth="0.6"
        />,
      )
    }
    content = <g>{rays}</g>
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

function Seal({ t, cx, cy, r, id }: { t: CertificateTemplateDesign; cx: number; cy: number; r: number; id: string }) {
  if (t.seal === 'none') return null
  const { primary, accent, background } = t.colors
  const label = (t.sealText || '').toUpperCase().slice(0, 18)
  const ringPath = `M ${cx - r * 0.72} ${cy} A ${r * 0.72} ${r * 0.72} 0 1 1 ${cx + r * 0.72} ${cy} A ${r * 0.72} ${r * 0.72} 0 1 1 ${cx - r * 0.72} ${cy}`
  const ringText = (
    <>
      <defs>
        <path id={`${id}-ring`} d={ringPath} />
      </defs>
      <text fontFamily={FONT_STACKS.sans.stack} fontSize={r * 0.2} fontWeight={700} letterSpacing={2} fill={background}>
        <textPath href={`#${id}-ring`} startOffset="25%" textAnchor="middle">
          {label}
        </textPath>
      </text>
    </>
  )
  if (t.seal === 'rosette') {
    return (
      <g>
        <polygon points={starPoints(cx, cy, r, r * 0.88, 32)} fill={accent} />
        <circle cx={cx} cy={cy} r={r * 0.86} fill={primary} />
        <circle cx={cx} cy={cy} r={r * 0.56} fill="none" stroke={accent} strokeWidth={1.5} />
        {ringText}
        <polygon points={starPoints(cx, cy, r * 0.3, r * 0.13, 5)} fill={accent} />
      </g>
    )
  }
  if (t.seal === 'ribbon') {
    return (
      <g>
        <polygon points={`${cx - r * 0.5},${cy + r * 0.4} ${cx - r * 0.85},${cy + r * 1.7} ${cx - r * 0.45},${cy + r * 1.45} ${cx - r * 0.2},${cy + r * 1.8} ${cx},${cy + r * 0.5}`} fill={primary} />
        <polygon points={`${cx + r * 0.5},${cy + r * 0.4} ${cx + r * 0.85},${cy + r * 1.7} ${cx + r * 0.45},${cy + r * 1.45} ${cx + r * 0.2},${cy + r * 1.8} ${cx},${cy + r * 0.5}`} fill={accent} />
        <circle cx={cx} cy={cy} r={r} fill={accent} />
        <circle cx={cx} cy={cy} r={r * 0.86} fill="none" stroke={background} strokeWidth={1.5} strokeDasharray="3 3" />
        <text x={cx} y={cy + r * 0.12} textAnchor="middle" fontFamily={FONT_STACKS.sans.stack} fontSize={r * 0.26} fontWeight={800} fill={background} letterSpacing={1}>
          {label}
        </text>
      </g>
    )
  }
  if (t.seal === 'stamp') {
    return (
      <g transform={`rotate(-14 ${cx} ${cy})`} opacity={0.9}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={accent} strokeWidth={3} />
        <circle cx={cx} cy={cy} r={r * 0.84} fill="none" stroke={accent} strokeWidth={1} />
        <defs>
          <path id={`${id}-ring`} d={ringPath} />
        </defs>
        <text fontFamily={FONT_STACKS.mono.stack} fontSize={r * 0.19} fontWeight={700} letterSpacing={3} fill={accent}>
          <textPath href={`#${id}-ring`} startOffset="25%" textAnchor="middle">
            {`★ ${label} ★`}
          </textPath>
        </text>
        <polygon points={starPoints(cx, cy, r * 0.28, r * 0.12, 5)} fill={accent} />
      </g>
    )
  }
  // star
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={primary} />
      <circle cx={cx} cy={cy} r={r * 0.9} fill="none" stroke={accent} strokeWidth={2} />
      <polygon points={starPoints(cx, cy, r * 0.72, r * 0.3, 5)} fill={accent} />
      <text x={cx} y={cy + r * 1.35} textAnchor="middle" fontFamily={FONT_STACKS.sans.stack} fontSize={r * 0.22} fontWeight={800} letterSpacing={2} fill={primary}>
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

/* ── Certificate ──────────────────────────────────────────────────────────── */

export function CertificateArt({ template: t, data, uid = 'c', className }: Props) {
  const { width: w, height: h } = PAGE_SIZE[t.orientation]
  const portrait = t.orientation === 'portrait'
  const id = `${uid}-${t.id}`.replace(/[^a-zA-Z0-9_-]/g, '')
  const left = t.align === 'left'
  const margin = t.frame === 'modern' ? 110 : 96
  const x = left ? margin : w / 2
  const anchor = left ? 'start' : 'middle'
  const textWidth = w - margin * 2
  const onBand = t.frame === 'band'

  const f = (key: keyof CertificateTemplateDesign['fonts']) => FONT_STACKS[t.fonts[key]].stack
  const fill = (s: string) => fillPlaceholders(s, data)

  // Vertical rhythm as fractions of the page height.
  const Y = portrait
    ? { logo: 0.1, eyebrow: 0.2, title: 0.26, subtitle: 0.32, name: 0.4, body: 0.46, dates: 0.62, sig: 0.76 }
    : { logo: 0.085, eyebrow: 0.24, title: 0.315, subtitle: 0.385, name: 0.475, body: 0.55, dates: 0.7, sig: 0.83 }
  if (onBand) Object.assign(Y, { logo: portrait ? 0.05 : 0.025 })

  const eyebrow = fill(t.text.eyebrow)
  const title = fill(t.text.title)
  const subtitle = fill(t.text.subtitle)
  const preamble = fill(t.text.preamble)
  const body = fill(t.text.body)
  const footer = fill(t.text.footer)

  const nameText = t.nameStyle === 'caps' ? data.studentName.toUpperCase() : data.studentName
  const nameFactor = t.fonts.name === 'script' ? 0.42 : t.nameStyle === 'caps' ? 0.68 : 0.55
  const nameSize = fitSize(nameText, textWidth, portrait ? 54 : 62, nameFactor, 26)
  const titleSize = fitSize(title, textWidth, portrait ? 38 : 46, 0.56, 22)
  const bodySize = portrait ? 16 : 17
  const bodyLines = wrap([preamble, body].filter(Boolean).join('\n'), bodySize, left ? textWidth * 0.8 : textWidth * 0.78)

  const dateParts: string[] = []
  if (t.show.issueDate && data.issueDate) dateParts.push(`Issued ${formatCertDate(data.issueDate)}`)
  if (t.show.expiration && data.expirationDate) dateParts.push(`Valid until ${formatCertDate(data.expirationDate)}`)

  const sigs = t.signatories.slice(0, 3)
  const sigSpan = left ? textWidth * 0.62 : textWidth * 0.72
  const sigStart = left ? margin : (w - sigSpan) / 2
  const sigW = sigs.length ? Math.min(220, sigSpan / sigs.length - 24) : 0

  // How far corner items (QR, seal, ID) sit from the edge, clear of the frame.
  const inset = { none: 48, classic: 72, double: 84, ornate: 100, modern: 64, band: 64, geometric: 96 }[t.frame]
  const qrSize = portrait ? 96 : 92
  const qrX = w - inset - qrSize
  const qrY = h - (onBand ? 60 : inset) - qrSize - 14
  const sealR = portrait ? 50 : 46
  const sealX = left ? w - margin - sealR - (t.show.qr ? qrSize + 40 : 0) : inset + sealR
  const sealY = h - (onBand ? 62 : inset) - sealR - 8 - (t.seal === 'ribbon' ? sealR * 0.8 : 0)

  const logoSize = portrait ? 78 : 70
  const logoX = left ? margin : w / 2 - logoSize / 2
  const logoY = h * Y.logo
  const logoOnDark = onBand
  const monogram = (t.monogram || data.institutionName.charAt(0) || 'B').slice(0, 3).toUpperCase()

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      className={className}
      role="img"
      aria-label={`${title} — ${data.studentName}`}
    >
      <defs>
        <radialGradient id={`${id}-wash`} cx="0" cy="0" r="1.2">
          <stop offset="0" stopColor={t.colors.accent} stopOpacity="0.22" />
          <stop offset="0.6" stopColor={t.colors.accent} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-logo`}>
          <rect x={logoX} y={logoY} width={logoSize} height={logoSize} rx={logoSize * 0.22} />
        </clipPath>
      </defs>

      <rect width={w} height={h} fill={t.colors.background} />
      {t.gradient ? <rect width={w} height={h} fill={`url(#${id}-wash)`} /> : null}
      <Pattern t={t} w={w} h={h} id={id} />
      <Frame t={t} w={w} h={h} />

      {t.showLogo ? (
        t.logo ? (
          <g>
            {logoOnDark ? <rect x={logoX - 4} y={logoY - 4} width={logoSize + 8} height={logoSize + 8} rx={logoSize * 0.25} fill="#FFFFFF" /> : null}
            <image href={t.logo} x={logoX} y={logoY} width={logoSize} height={logoSize} preserveAspectRatio="xMidYMid meet" clipPath={`url(#${id}-logo)`} />
          </g>
        ) : (
          <g>
            <rect x={logoX} y={logoY} width={logoSize} height={logoSize} rx={logoSize * 0.22} fill={logoOnDark ? t.colors.accent : t.colors.primary} />
            <text x={logoX + logoSize / 2} y={logoY + logoSize * 0.64} textAnchor="middle" fontFamily={f('heading')} fontWeight={700} fontSize={logoSize * (monogram.length > 2 ? 0.32 : 0.44)} fill={logoOnDark ? t.colors.primary : t.colors.background}>
              {monogram}
            </text>
          </g>
        )
      ) : null}

      {eyebrow ? (
        <text x={x} y={h * Y.eyebrow} textAnchor={anchor} fontFamily={f('body')} fontSize={portrait ? 15 : 16} fontWeight={700} letterSpacing={4} fill={t.colors.accent}>
          {eyebrow.toUpperCase()}
        </text>
      ) : null}

      <text x={x} y={h * Y.title} textAnchor={anchor} fontFamily={f('heading')} fontSize={titleSize} fontWeight={700} fill={t.colors.primary}>
        {title}
      </text>

      {subtitle ? (
        <text x={x} y={h * Y.subtitle} textAnchor={anchor} fontFamily={f('body')} fontSize={portrait ? 17 : 19} fontStyle="italic" fill={t.colors.muted}>
          {subtitle}
        </text>
      ) : null}

      <text x={x} y={h * Y.name} textAnchor={anchor} fontFamily={f('name')} fontSize={nameSize} fontWeight={t.fonts.name === 'script' ? 400 : 700} letterSpacing={t.nameStyle === 'caps' ? 3 : 0} fill={t.colors.text}>
        {nameText}
      </text>
      {t.nameStyle === 'underline' ? (
        <line
          x1={left ? margin : w / 2 - Math.min(textWidth * 0.34, 300)}
          x2={left ? margin + Math.min(textWidth * 0.6, 520) : w / 2 + Math.min(textWidth * 0.34, 300)}
          y1={h * Y.name + 16}
          y2={h * Y.name + 16}
          stroke={t.colors.accent}
          strokeWidth={1.5}
        />
      ) : null}

      <text textAnchor={anchor} fontFamily={f('body')} fontSize={bodySize} fill={t.colors.text}>
        {bodyLines.slice(0, 5).map((line, i) => (
          <tspan key={i} x={x} y={h * Y.body + i * bodySize * 1.55}>
            {line}
          </tspan>
        ))}
      </text>

      {dateParts.length ? (
        <text x={x} y={h * Y.dates} textAnchor={anchor} fontFamily={f('body')} fontSize={14} fontWeight={600} letterSpacing={1} fill={t.colors.muted}>
          {dateParts.join('   •   ')}
        </text>
      ) : null}

      {sigs.map((s, i) => {
        const cx = sigStart + (sigSpan / sigs.length) * (i + 0.5)
        const lineY = h * Y.sig
        return (
          <g key={s.id}>
            {s.signatureImage ? (
              <image href={s.signatureImage} x={cx - sigW / 2} y={lineY - 58} width={sigW} height={54} preserveAspectRatio="xMidYMax meet" />
            ) : (
              <text x={cx} y={lineY - 10} textAnchor="middle" fontFamily={FONT_STACKS.script.stack} fontSize={26} fill={t.colors.primary} opacity={0.85}>
                {fill(s.name)}
              </text>
            )}
            <line x1={cx - sigW / 2} x2={cx + sigW / 2} y1={lineY} y2={lineY} stroke={t.colors.muted} strokeWidth={1} />
            <text x={cx} y={lineY + 20} textAnchor="middle" fontFamily={f('body')} fontSize={14} fontWeight={700} fill={t.colors.text}>
              {fill(s.name)}
            </text>
            <text x={cx} y={lineY + 38} textAnchor="middle" fontFamily={f('body')} fontSize={12} fill={t.colors.muted}>
              {fill(s.title)}
            </text>
          </g>
        )
      })}

      <Seal t={t} cx={sealX} cy={sealY} r={sealR} id={id} />

      {t.show.qr ? (
        <g>
          <Qr text={data.verifyUrl} x={qrX} y={qrY} size={qrSize} color={t.colors.primary === t.colors.background ? '#000' : t.colors.primary} bg={isDark(t.colors.background) ? '#FFFFFF' : hexToRgba('#FFFFFF', 0.9)} />
          <text x={qrX + qrSize / 2} y={qrY + qrSize + 14} textAnchor="middle" fontFamily={FONT_STACKS.sans.stack} fontSize={9} fontWeight={700} letterSpacing={1} fill={onBand ? t.colors.background : t.colors.muted}>
            SCAN TO VERIFY
          </text>
        </g>
      ) : null}

      {t.show.certificateId ? (
        t.show.qr ? (
          <text x={qrX + qrSize / 2} y={qrY + qrSize + 27} textAnchor="middle" fontFamily={FONT_STACKS.mono.stack} fontSize={9} fill={onBand ? t.colors.background : t.colors.muted}>
            {data.certificateId}
          </text>
        ) : (
          <text x={w - inset} y={h - (onBand ? 38 : inset)} textAnchor="end" fontFamily={FONT_STACKS.mono.stack} fontSize={11} fill={onBand ? t.colors.background : t.colors.muted}>
            {`ID ${data.certificateId}`}
          </text>
        )
      ) : null}

      {footer ? (
        <text x={w / 2} y={h - (onBand ? 38 : 42)} textAnchor="middle" fontFamily={f('body')} fontSize={11} fill={onBand ? t.colors.background : t.colors.muted}>
          {footer}
        </text>
      ) : null}
    </svg>
  )
}

function isDark(hex: string): boolean {
  const clean = hex.replace('#', '')
  const n = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16)
  if (Number.isNaN(n)) return false
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return 0.299 * r + 0.587 * g + 0.114 * b < 110
}

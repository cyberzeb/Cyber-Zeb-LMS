interface SparklineProps {
  data: number[]
  color?: string
  fillColor?: string
  height?: number
  className?: string
}

function buildPoints(data: number[], width: number, height: number, padding = 2) {
  if (data.length === 0) return []

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const innerW = width - padding * 2
  const innerH = height - padding * 2
  const step = data.length > 1 ? innerW / (data.length - 1) : 0

  return data.map((value, index) => ({
    x: padding + index * step,
    y: padding + innerH - ((value - min) / range) * innerH,
  }))
}

function toPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return ''
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
}

function toAreaPath(points: { x: number; y: number }[], height: number) {
  if (points.length === 0) return ''
  const line = toPath(points)
  const last = points[points.length - 1]
  const first = points[0]
  return `${line} L ${last.x.toFixed(2)} ${height} L ${first.x.toFixed(2)} ${height} Z`
}

export function Sparkline({
  data,
  color = '#1976D2',
  fillColor,
  height = 28,
  className = '',
}: SparklineProps) {
  if (data.length < 2) return null

  const width = 100
  const points = buildPoints(data, width, height)
  const linePath = toPath(points)
  const areaPath = toAreaPath(points, height)
  const fill = fillColor ?? `${color}33`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={`block w-full ${className}`}
      style={{ height }}
      aria-hidden
    >
      <path d={areaPath} fill={fill} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

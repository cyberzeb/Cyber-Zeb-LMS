import { GlassCard } from '../../../shared/layout/GlassCard'
import type { TrendPoint } from '../types'

interface TrendLineChartProps {
  title: string
  subtitle?: string
  data: TrendPoint[]
  color?: string
  unit?: string
  compact?: boolean
}

function buildChartGeometry(data: TrendPoint[], width: number, height: number) {
  if (data.length === 0) return null

  const padding = { top: 12, right: 10, bottom: 28, left: 38 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom
  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = data.length > 1 ? chartW / (data.length - 1) : 0

  const points = data.map((point, index) => ({
    ...point,
    x: padding.left + index * step,
    y: padding.top + chartH - ((point.value - min) / range) * chartH,
  }))

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')

  const baseline = padding.top + chartH
  const first = points[0]
  const last = points[points.length - 1]
  const areaPath =
    points.length === 1
      ? `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} L ${first.x.toFixed(2)} ${baseline} Z`
      : `${linePath} L ${last.x.toFixed(2)} ${baseline} L ${first.x.toFixed(2)} ${baseline} Z`

  const yTicks = [min, min + range / 2, max].map((value) => ({
    value: Math.round(value),
    y: padding.top + chartH - ((value - min) / range) * chartH,
  }))

  return { points, linePath, areaPath, yTicks, padding, baseline }
}

export function TrendLineChart({
  title,
  subtitle,
  data,
  color = '#1976D2',
  unit = '',
  compact = false,
}: TrendLineChartProps) {
  const width = 560
  const height = compact ? 260 : 220
  const geometry = buildChartGeometry(data, width, height)

  return (
    <GlassCard className="p-5 flex flex-col w-full h-full">
      <div className={compact ? 'mb-2' : 'mb-3'}>
        <h3 className={`font-bold text-navy-900 ${compact ? 'text-[13px]' : 'text-[15px]'}`}>{title}</h3>
        {subtitle && (
          <p className={`text-secondary-text mt-0.5 ${compact ? 'text-[10.5px]' : 'text-[11.5px] mt-1'}`}>
            {subtitle}
          </p>
        )}
      </div>

      {!geometry ? (
        <div
          className={`w-full flex-1 flex items-center justify-center rounded-xl border border-dashed border-divider bg-navy-50/40 text-secondary-text text-[12.5px] font-medium ${compact ? 'min-h-[260px]' : 'min-h-[220px]'}`}
        >
          No trend data yet
        </div>
      ) : (
      <div className={`w-full flex-1 ${compact ? 'min-h-[260px]' : 'min-h-[220px]'}`}>
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full" aria-hidden>
          {geometry.yTicks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={geometry.padding.left}
                y1={tick.y}
                x2={width - geometry.padding.right}
                y2={tick.y}
                stroke="#E2E8F0"
                strokeWidth="1"
              />
              <text x={geometry.padding.left - 6} y={tick.y + 4} textAnchor="end" className="fill-secondary-text" fontSize="9">
                {tick.value}
                {unit}
              </text>
            </g>
          ))}

          <path d={geometry.areaPath} fill={`${color}18`} />
          <path
            d={geometry.linePath}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {geometry.points.map((point) => (
            <g key={point.label}>
              <circle cx={point.x} cy={point.y} r="3.5" fill="white" stroke={color} strokeWidth="2" />
              <text x={point.x} y={geometry.baseline + 16} textAnchor="middle" className="fill-secondary-text" fontSize="9">
                {point.label}
              </text>
            </g>
          ))}

          <line
            x1={geometry.padding.left}
            y1={geometry.baseline}
            x2={width - geometry.padding.right}
            y2={geometry.baseline}
            stroke="#E2E8F0"
            strokeWidth="1"
          />
        </svg>
      </div>
      )}
    </GlassCard>
  )
}

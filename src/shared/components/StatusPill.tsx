export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface StatusPillProps {
  label: string
  tone?: StatusTone
  dot?: boolean
}

const toneClasses: Record<StatusTone, { pill: string; dot: string }> = {
  success: { pill: 'bg-lemon-50 text-lemon-900 ring-1 ring-lemon-500/25', dot: 'bg-lemon-500' },
  warning: { pill: 'bg-warning-bg text-[#8A6D00] ring-1 ring-warning/30', dot: 'bg-warning' },
  danger: { pill: 'bg-danger-bg text-danger ring-1 ring-danger/25', dot: 'bg-danger' },
  info: { pill: 'bg-info-bg text-info ring-1 ring-info/25', dot: 'bg-info' },
  neutral: { pill: 'bg-navy-50 text-navy-500 ring-1 ring-navy-900/10', dot: 'bg-navy-500' },
}

export function StatusPill({ label, tone = 'neutral', dot = true }: StatusPillProps) {
  const classes = toneClasses[tone]
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${classes.pill}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${classes.dot}`} />}
      {label}
    </span>
  )
}

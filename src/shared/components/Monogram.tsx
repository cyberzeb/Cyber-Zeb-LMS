interface MonogramProps {
  label: string
  size?: 'sm' | 'md'
  className?: string
}

const sizeClasses = {
  sm: 'w-9 h-9 text-[12px] rounded-lg',
  md: 'w-11 h-11 text-[13.5px] rounded-xl',
}

function getInitials(label: string): string {
  const cleaned = label.replace(/[^a-zA-Z0-9\s]/g, ' ').trim()
  const words = cleaned.split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export function Monogram({ label, size = 'md', className = '' }: MonogramProps) {
  return (
    <div
      className={`shrink-0 flex items-center justify-center font-extrabold tracking-tight bg-gradient-to-br from-navy-700 to-navy-900 text-lemon-500 shadow-sm ${sizeClasses[size]} ${className}`}
    >
      {getInitials(label)}
    </div>
  )
}

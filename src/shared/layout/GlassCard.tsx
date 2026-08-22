import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
}

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div
      className={`bg-white dark:bg-[#0a121e] border border-divider rounded-xl shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </div>
  )
}

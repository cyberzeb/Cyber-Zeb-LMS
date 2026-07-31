import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
}

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div
      className={`
        bg-white/60 backdrop-blur-md
        border border-white/60
        shadow-[0_8px_28px_rgba(27,35,64,0.07)]
        rounded-2xl
        ${className}
      `}
    >
      {children}
    </div>
  )
}
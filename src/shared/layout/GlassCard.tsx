import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
}

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div
      className={`
        relative isolate
        bg-white/75 backdrop-blur-xl
        border border-white/70
        ring-1 ring-navy-900/[0.04]
        shadow-[0_1px_2px_rgba(27,35,64,0.04),0_14px_36px_-12px_rgba(27,35,64,0.16)]
        rounded-2xl
        before:absolute before:inset-x-0 before:top-0 before:h-px before:rounded-t-2xl
        before:bg-gradient-to-r before:from-transparent before:via-white/90 before:to-transparent
        before:pointer-events-none
        ${className}
      `}
    >
      {children}
    </div>
  )
}
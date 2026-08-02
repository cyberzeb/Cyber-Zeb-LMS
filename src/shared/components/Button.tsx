import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-lemon-500 to-lemon-700 text-navy-900 border border-lemon-700/30 font-bold shadow-[0_2px_10px_rgba(168,212,0,0.35)] hover:shadow-[0_4px_16px_rgba(168,212,0,0.45)] hover:brightness-[1.03]',
  secondary:
    'bg-white/80 text-navy-900 border border-divider hover:border-navy-200 hover:bg-white font-semibold shadow-sm',
  ghost:
    'bg-transparent text-lemon-700 hover:text-lemon-900 hover:bg-lemon-50 border border-transparent font-bold',
  danger:
    'bg-danger-bg text-danger border border-danger/25 hover:bg-danger/10 font-semibold',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[12px]',
  md: 'px-4 py-2 text-[12.5px]',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-lg cursor-pointer transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

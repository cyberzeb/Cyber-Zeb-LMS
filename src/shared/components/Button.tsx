import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline-green' | 'outline-blue' | 'outline-purple'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-lemon-500 text-navy-900 border border-lemon-500 font-semibold hover:bg-lemon-200',
  secondary:
    'bg-white text-navy-900 border border-divider hover:border-navy-200 hover:bg-navy-50 font-medium',
  ghost:
    'bg-transparent text-navy-700 hover:text-navy-900 hover:bg-navy-50 border border-transparent font-medium',
  danger:
    'bg-danger-bg text-danger border border-danger/25 hover:bg-danger/10 font-medium',
  'outline-green':
    'bg-white text-navy-900 border border-lemon-500/50 hover:bg-lemon-50 font-medium',
  'outline-blue':
    'bg-white text-navy-900 border border-info/40 hover:bg-info-bg font-medium',
  'outline-purple':
    'bg-white text-navy-900 border border-[#A78BFA]/50 hover:bg-[#F5F3FF] font-medium',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[12px]',
  md: 'px-3.5 py-2 text-[12.5px]',
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
      className={`inline-flex items-center gap-1.5 rounded-lg cursor-pointer transition-colors duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

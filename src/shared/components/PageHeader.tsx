import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <span className="mt-1 w-1.5 h-9 rounded-full bg-gradient-to-b from-lemon-500 to-navy-900 shadow-sm" />
        <div>
          <h1 className="text-[24px] font-extrabold text-navy-900 leading-tight tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] text-secondary-text mt-1 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  )
}

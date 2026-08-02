import type { ReactNode } from 'react'
import { GlassCard } from '../../../../shared/layout/GlassCard'

interface SettingsSectionProps {
  icon: string
  title: string
  description?: string
  children: ReactNode
}

export function SettingsSection({ icon, title, description, children }: SettingsSectionProps) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-start gap-3 mb-5 pb-5 border-b border-divider/50">
        <div className="w-9 h-9 rounded-lg bg-navy-50 flex items-center justify-center text-base shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-extrabold text-[15px] text-navy-900 leading-tight">{title}</h3>
          {description && (
            <p className="text-[12px] text-secondary-text mt-1 leading-snug">{description}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </GlassCard>
  )
}

import { Construction } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { PageHeader } from '../../../shared/components/PageHeader'
import type { CorporatePlaceholderPageProps } from '../types'

export function CorporatePlaceholderPage({
  title,
  subtitle,
  phase = 'a future phase',
}: CorporatePlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} />
      <GlassCard className="p-10 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-navy-50 flex items-center justify-center mb-4">
          <Construction size={22} className="text-navy-400" />
        </div>
        <h2 className="text-[16px] font-bold text-navy-900">Coming soon</h2>
        <p className="text-[13px] text-secondary-text mt-2 max-w-md mx-auto">
          {title} will be available in {phase}. The shared LMS engine is ready — this screen
          will connect when the module is enabled for your organization.
        </p>
      </GlassCard>
    </div>
  )
}

import { Cloud, Globe, UserRound } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import type { SsoProvider } from '../types'

interface IdentityStatusCardProps {
  providers: SsoProvider[]
  onConfigure?: () => void
}

export function IdentityStatusCard({ providers, onConfigure }: IdentityStatusCardProps) {
  const getProviderIcon = (name: string) => {
    if (name.toLowerCase().includes('microsoft') || name.toLowerCase().includes('entra'))
      return <Cloud size={17} />
    if (name.toLowerCase().includes('google')) return <Globe size={17} />
    return <UserRound size={17} />
  }

  return (
    <GlassCard className="p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-extrabold text-[17px] text-navy-900 leading-none">Identity &amp; SSO</h3>
          <button
            onClick={onConfigure}
            className="text-lemon-700 hover:text-lemon-900 font-bold text-[12.5px] transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            Configure
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {providers.map((prov) => {
            const isConfigured = prov.status === 'connected' || prov.status === 'enabled'
            return (
              <div
                key={prov.id}
                className="flex items-center justify-between pb-3 border-b border-divider/40 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center shrink-0">
                    {getProviderIcon(prov.name)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-navy-900 text-[14px] truncate leading-tight">
                      {prov.name}
                    </h4>
                    <p className="text-[11.5px] text-secondary-text mt-1 truncate leading-none">
                      {prov.subtitle}
                    </p>
                  </div>
                </div>

                <span
                  className={`shrink-0 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                    isConfigured
                      ? 'bg-lemon-500/15 text-lemon-700'
                      : 'bg-navy-50 text-secondary-text'
                  }`}
                >
                  {prov.status.replace('-', ' ')}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </GlassCard>
  )
}

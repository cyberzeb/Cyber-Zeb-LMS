import { GlassCard } from '../../../shared/layout/GlassCard'
import type { SetupStep } from '../types'

interface SetupProgressCardProps {
  steps: SetupStep[]
  percent: number
}

export function SetupProgressCard({ steps, percent }: SetupProgressCardProps) {
  return (
    <GlassCard className="p-6 h-full flex flex-col justify-between">
      <div>
        <h3 className="font-extrabold text-[17px] text-navy-900 leading-none mb-4">Institution Setup</h3>

        {/* Progress bar */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex-1 h-2 rounded-full bg-navy-50 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-lemon-500 to-lemon-700 rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-[14px] font-extrabold text-navy-900 leading-none">{percent}%</span>
        </div>

        {/* Steps list */}
        <div className="flex flex-col gap-4">
          {steps.map((step) => (
            <div key={step.id} className="flex items-start gap-3 pb-3 border-b border-divider/40 last:border-0 last:pb-0">
              {step.done ? (
                <div className="w-5 h-5 rounded-full bg-lemon-500 flex items-center justify-center text-[10px] text-navy-900 shrink-0 font-extrabold">
                  ✓
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-secondary-text/40 flex items-center justify-center shrink-0" />
              )}
              <div className="min-w-0">
                <h4 className={`text-[13.5px] font-bold leading-tight ${step.done ? 'text-navy-900' : 'text-secondary-text'}`}>
                  {step.title}
                </h4>
                <p className="text-[11px] text-secondary-text mt-1 leading-none">
                  {step.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}

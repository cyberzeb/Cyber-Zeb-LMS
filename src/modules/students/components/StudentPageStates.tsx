import { GlassCard } from '../../../shared/layout/GlassCard'

export function StudentPageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lemon-500" />
    </div>
  )
}

export function StudentPageError({ message }: { message: string }) {
  return (
    <GlassCard className="p-5 border-danger/30 bg-danger-bg text-danger text-[13.5px] font-medium">
      {message}
    </GlassCard>
  )
}

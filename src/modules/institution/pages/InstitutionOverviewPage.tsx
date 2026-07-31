import { useInstitutionOverview } from '../hooks/useInstitution'
import { StatBlock } from '../../../shared/components/StatBlock'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { OrgStructureTree } from '../components/OrgStructureTree'
import { AuditFeedCard } from '../components/AuditFeedCard'
import { SetupProgressCard } from '../components/SetupProgressCard'
import { IdentityStatusCard } from '../components/IdentityStatusCard'

export function InstitutionOverviewPage() {
  const { data, isLoading, isError } = useInstitutionOverview()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lemon-500" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-4 bg-danger-bg text-danger rounded-xl border border-danger/30 text-center font-medium">
        Failed to load institution overview data. Please try again.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* 4 StatBlocks horizontally across the top */}
      <GlassCard className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-divider/40">
        <StatBlock
          label="Campuses"
          value={`${data.statTotals.activeCampusCount}/${data.statTotals.campusCount}`}
          sub="Active campuses"
          icon="🏢"
        />
        <StatBlock
          label="Total Users"
          value={data.statTotals.totalUsers.toLocaleString()}
          sub={`${data.statTotals.pendingInvitations} pending invites`}
          icon="👤"
        />
        <StatBlock
          label="SSO Integrations"
          value={`${data.statTotals.activeIntegrations}/${data.statTotals.totalIntegrations}`}
          sub="Connected providers"
          icon="🔑"
        />
        <StatBlock
          label="Setup Progress"
          value={`${data.statTotals.setupProgressPercent}%`}
          sub="Setup completion"
          icon="⚙️"
        />
      </GlassCard>

      {/* 2-column Grid below */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
        {/* Left Column: Organization Structure & Audit Logs */}
        <div className="flex flex-col gap-6 md:gap-8">
          <OrgStructureTree
            campuses={data.campuses}
            onAddCampus={() => console.log('Add Campus')}
          />
          <AuditFeedCard
            entries={data.auditLogEntries}
            onViewFullLog={() => console.log('View full audit log')}
          />
        </div>

        {/* Right Column: Setup Progress & Identity/SSO */}
        <div className="flex flex-col gap-6 md:gap-8">
          <SetupProgressCard
            steps={data.setupSteps}
            percent={data.statTotals.setupProgressPercent}
          />
          <IdentityStatusCard
            providers={data.ssoProviders}
            onConfigure={() => console.log('Configure Identity Providers')}
          />
        </div>
      </div>
    </div>
  )
}

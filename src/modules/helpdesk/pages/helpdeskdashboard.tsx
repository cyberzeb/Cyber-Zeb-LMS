import { useMemo } from 'react'
import { Headset, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { getSessionPerson } from '../../../shared/storage/session'
import { readHelpDeskTickets } from '../../../shared/storage/readers'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

export function HelpDeskDashboardPage() {
  const { t } = useLanguage()
  const person = getSessionPerson()

  const stats = useMemo(() => {
    const tickets = readHelpDeskTickets()
    return {
      open: tickets.filter((t) => t.status === 'open').length,
      inReview: tickets.filter((t) => t.status === 'in-review').length,
      high: tickets.filter((t) => t.priority === 'high' && t.status !== 'resolved').length,
    }
  }, [])

  if (!person) return null

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title={t('common.welcome', { name: person.name.split(' ')[0] })}
        subtitle="Help desk agent workspace — manage support tickets from the institution."
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatBlock
          label="Open tickets"
          value={stats.open}
          sub="Awaiting response"
          icon={<MessageCircle size={17} />}
          iconBg="bg-warning-bg text-warning"
        />
        <StatBlock
          label="In review"
          value={stats.inReview}
          sub="Assigned to agents"
          icon={<Headset size={17} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="High priority"
          value={stats.high}
          sub="Needs attention"
          icon={<MessageCircle size={17} />}
          iconBg="bg-danger-bg text-danger"
        />
      </div>

      <GlassCard className="p-5">
        <h3 className="text-[15px] font-bold text-navy-900">Ticket queue</h3>
        <p className="mt-2 text-[13px] text-secondary-text">
          Staff use the general operations portal; help desk agents use this dedicated ticket UI.
        </p>
        <Link
          to="/help-desk/tickets"
          className="inline-flex mt-4 text-[13px] font-semibold text-navy-700 hover:text-navy-900"
        >
          Open ticket board →
        </Link>
      </GlassCard>
    </div>
  )
}

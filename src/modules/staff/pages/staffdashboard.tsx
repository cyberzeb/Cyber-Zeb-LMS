import { useMemo } from 'react'
import { Briefcase, ClipboardCheck, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { Monogram } from '../../../shared/components/Monogram'
import { getSessionPerson } from '../../../shared/storage/session'
import { readPeople } from '../../../shared/storage/readers'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

export function StaffDashboardPage() {
  const { t } = useLanguage()
  const person = getSessionPerson()

  const { pendingSubmissions, mySubmissions } = useMemo(() => {
    const people = readPeople()
    const pending = people.filter((p) => p.verificationStatus === 'pending')
    const mine = pending.filter((p) => p.submittedByName === person?.name)
    return { pendingSubmissions: pending.length, mySubmissions: mine }
  }, [person?.name])

  if (!person) return null

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title={t('common.welcome', { name: person.name.split(' ')[0] })}
        subtitle={`${person.department} · Staff operations portal`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock
          label="Your office"
          value={person.department}
          sub={person.isDepartmentHead ? 'Office head' : 'Staff member'}
          icon={<Briefcase size={17} />}
          iconBg="bg-navy-50 text-navy-600"
        />
        <StatBlock
          label="Pending verifications"
          value={pendingSubmissions}
          sub="Institution-wide"
          icon={<ClipboardCheck size={17} />}
          iconBg="bg-warning-bg text-warning"
        />
        <StatBlock
          label="Your submissions"
          value={mySubmissions.length}
          sub="Awaiting admin review"
          icon={<UserPlus size={17} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Status"
          value={person.status === 'active' ? 'Active' : person.status}
          sub={`Last active ${person.lastActive}`}
          icon={<Briefcase size={17} />}
          iconBg="bg-success-bg text-success"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <GlassCard className="p-5">
          <h3 className="text-[15px] font-bold text-navy-900">Quick actions</h3>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              to="/staff/submit-people"
              className="quick-action-tile"
            >
              <UserPlus size={18} className="text-navy-600" />
              <div>
                <div className="text-[13px] font-semibold text-navy-900">Submit a new person</div>
                <div className="text-[12px] text-secondary-text">Students, instructors or guardians for admin verification</div>
              </div>
            </Link>
            <Link
              to="/staff/submissions"
              className="quick-action-tile"
            >
              <ClipboardCheck size={18} className="text-navy-600" />
              <div>
                <div className="text-[13px] font-semibold text-navy-900">Track your submissions</div>
                <div className="text-[12px] text-secondary-text">See verification status for people you added</div>
              </div>
            </Link>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="text-[15px] font-bold text-navy-900">Your recent submissions</h3>
          {mySubmissions.length === 0 ? (
            <p className="mt-3 text-[13px] text-secondary-text">No pending submissions from you yet.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {mySubmissions.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-navy-50/50">
                  <Monogram label={p.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-navy-900 truncate">{p.name}</div>
                    <div className="text-[11px] text-secondary-text">{p.role} · {p.submittedAt}</div>
                  </div>
                  <StatusPill label="Pending" tone="warning" />
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { GraduationCap, Headset, HeartHandshake, Shield, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Monogram } from '../components/Monogram'
import { GlassCard } from '../layout/GlassCard'
import { readPeople } from '../storage/readers'
import { writePortalSession, type PortalSession } from '../storage/session'
import type { PersonRole } from '../../modules/institution/types'

interface PortalUserPickerProps {
  role: PersonRole
  portalLabel: string
  adminSetupHref?: string
}

function roleIcon(role: PersonRole) {
  if (role === 'Student') return <GraduationCap size={28} />
  if (role === 'Guardian') return <HeartHandshake size={28} />
  if (role === 'HelpDesk') return <Headset size={28} />
  if (role === 'Staff') return <UserRound size={28} />
  return <UserRound size={28} />
}

export function PortalUserPicker({ role, portalLabel, adminSetupHref = '/admin/people' }: PortalUserPickerProps) {
  const people = useMemo(() => readPeople().filter((p) => p.role === role && p.status !== 'suspended'), [role])
  const [selectedId, setSelectedId] = useState(people[0]?.id ?? '')

  const handleContinue = () => {
    if (!selectedId) return
    const session: PortalSession = { personId: selectedId, role }
    writePortalSession(session)
    window.location.reload()
  }

  if (people.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <GlassCard className="max-w-lg w-full p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-navy-50 text-navy-600 flex items-center justify-center mx-auto mb-4">
            {roleIcon(role)}
          </div>
          <h2 className="text-[20px] font-bold text-navy-900">No {role === 'HelpDesk' ? 'help desk agent' : role.toLowerCase()} accounts yet</h2>
          <p className="mt-2 text-[13px] text-secondary-text leading-relaxed">
            The {portalLabel} reads from the same local data as Institution Admin. Add accounts in
            admin first, then return here to sign in.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={adminSetupHref}>
              <Button variant="primary">
                <Shield size={15} />
                Go to Admin — People
              </Button>
            </Link>
            <Link to="/">
              <Button variant="secondary">Back to home</Button>
            </Link>
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <GlassCard className="max-w-lg w-full p-8">
        <h2 className="text-[20px] font-bold text-navy-900">Select {portalLabel} account</h2>
        <p className="mt-1 text-[13px] text-secondary-text">
          Choose who you are signing in as. Data is stored locally in your browser.
        </p>

        <div className="mt-5 space-y-2 max-h-64 overflow-y-auto app-scroll">
          {people.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => setSelectedId(person.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                selectedId === person.id
                  ? 'border-lemon-500 bg-lemon-50/60'
                  : 'border-divider hover:border-navy-200'
              }`}
            >
              <Monogram label={person.name} size="md" />
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-navy-900 truncate">{person.name}</div>
                <div className="text-[12px] text-secondary-text truncate">{person.email}</div>
                <div className="text-[11px] text-navy-600 mt-0.5">{person.department}</div>
              </div>
            </button>
          ))}
        </div>

        <Button variant="primary" className="w-full mt-5" disabled={!selectedId} onClick={handleContinue}>
          Continue to {portalLabel}
        </Button>
      </GlassCard>
    </div>
  )
}

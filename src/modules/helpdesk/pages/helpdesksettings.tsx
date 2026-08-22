import { useMemo, useState } from 'react'
import { Bell, Headset, Lock, UserRound } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { Monogram } from '../../../shared/components/Monogram'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useLocalStorageState } from '../../../shared/hooks/useLocalStorageState'
import { STORAGE_KEYS } from '../../../shared/storage/keys'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { SettingsSection } from '../../institution/components/settings/SettingsSection'
import { SettingField } from '../../institution/components/settings/SettingField'
import { ToggleRow } from '../../institution/components/settings/ToggleRow'
import { getSessionPerson } from '../../../shared/storage/session'

const SEC = 17

interface HelpDeskSettingsState {
  profile: {
    displayName: string
    email: string
  }
  notifications: {
    newTickets: boolean
    escalations: boolean
  }
}

const defaultSettings = (person?: { name: string; email: string }): HelpDeskSettingsState => ({
  profile: {
    displayName: person?.name ?? '',
    email: person?.email ?? '',
  },
  notifications: {
    newTickets: true,
    escalations: true,
  },
})

export function HelpDeskSettingsPage() {
  const { notify } = useToast()
  const sessionPerson = getSessionPerson()
  const [stored, setStored] = useLocalStorageState<HelpDeskSettingsState>(
    STORAGE_KEYS.helpDeskSettings,
    defaultSettings(sessionPerson ?? undefined),
  )
  const [draft, setDraft] = useState(stored)

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(stored), [draft, stored])

  if (!sessionPerson) return null

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Settings"
        subtitle="Help desk preferences stored in your browser."
        actions={
          <>
            <Button variant="secondary" onClick={() => setDraft(stored)} disabled={!isDirty}>
              Reset
            </Button>
            <Button variant="primary" onClick={() => { setStored(draft); notify('Help desk settings saved locally.', 'success') }} disabled={!isDirty}>
              Save changes
            </Button>
          </>
        }
      />

      <GlassCard className="p-5 flex items-center gap-4">
        <Monogram label={sessionPerson.name} size="md" />
        <div>
          <div className="text-[15px] font-bold text-navy-900">{sessionPerson.name}</div>
          <div className="text-[12px] text-secondary-text flex items-center gap-1.5 mt-0.5">
            <Headset size={SEC} />
            {sessionPerson.department}
          </div>
        </div>
      </GlassCard>

      <SettingsSection icon={<UserRound size={SEC} />} title="Profile" description="Your help desk agent profile.">
        <SettingField
          label="Display name"
          value={draft.profile.displayName}
          onChange={(v) => setDraft((s) => ({ ...s, profile: { ...s.profile, displayName: v } }))}
        />
        <SettingField
          label="Email"
          value={draft.profile.email}
          onChange={(v) => setDraft((s) => ({ ...s, profile: { ...s.profile, email: v } }))}
        />
      </SettingsSection>

      <SettingsSection icon={<Bell size={SEC} />} title="Notifications" description="Ticket alert preferences.">
        <ToggleRow
          label="New tickets"
          description="When a new support ticket is submitted"
          enabled={draft.notifications.newTickets}
          onToggle={() =>
            setDraft((s) => ({
              ...s,
              notifications: { ...s.notifications, newTickets: !s.notifications.newTickets },
            }))
          }
        />
        <ToggleRow
          label="Escalations"
          description="High-priority tickets needing attention"
          enabled={draft.notifications.escalations}
          onToggle={() =>
            setDraft((s) => ({
              ...s,
              notifications: { ...s.notifications, escalations: !s.notifications.escalations },
            }))
          }
        />
      </SettingsSection>

      <SettingsSection icon={<Lock size={SEC} />} title="Security" description="How your session is stored locally.">
        <p className="text-[13px] text-secondary-text">
          Session is stored in localStorage under <code className="text-navy-700">berana:session</code>.
        </p>
      </SettingsSection>
    </div>
  )
}

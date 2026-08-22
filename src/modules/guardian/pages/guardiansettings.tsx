import { useMemo, useState } from 'react'
import { Bell, HeartHandshake, Lock, UserRound } from 'lucide-react'
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

interface GuardianSettingsState {
  profile: {
    displayName: string
    email: string
    phone: string
  }
  notifications: {
    progressUpdates: boolean
    announcements: boolean
  }
}

const defaultSettings = (person?: { name: string; email: string }): GuardianSettingsState => ({
  profile: {
    displayName: person?.name ?? '',
    email: person?.email ?? '',
    phone: '',
  },
  notifications: {
    progressUpdates: true,
    announcements: true,
  },
})

export function GuardianSettingsPage() {
  const { notify } = useToast()
  const sessionPerson = getSessionPerson()
  const [stored, setStored] = useLocalStorageState<GuardianSettingsState>(
    STORAGE_KEYS.guardianSettings,
    defaultSettings(sessionPerson ?? undefined),
  )
  const [draft, setDraft] = useState(stored)

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(stored), [draft, stored])

  if (!sessionPerson) return null

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Settings"
        subtitle="Guardian portal preferences stored in your browser."
        actions={
          <>
            <Button variant="secondary" onClick={() => setDraft(stored)} disabled={!isDirty}>
              Reset
            </Button>
            <Button variant="primary" onClick={() => { setStored(draft); notify('Guardian settings saved locally.', 'success') }} disabled={!isDirty}>
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
            <HeartHandshake size={SEC} />
            Linked to {sessionPerson.department}
          </div>
        </div>
      </GlassCard>

      <SettingsSection icon={<UserRound size={SEC} />} title="Profile" description="Your guardian profile details.">
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
        <SettingField
          label="Phone"
          value={draft.profile.phone}
          onChange={(v) => setDraft((s) => ({ ...s, profile: { ...s.profile, phone: v } }))}
        />
      </SettingsSection>

      <SettingsSection icon={<Bell size={SEC} />} title="Notifications" description="Choose what you want to be notified about.">
        <ToggleRow
          label="Progress updates"
          description="When your student's grades or attendance change"
          enabled={draft.notifications.progressUpdates}
          onToggle={() =>
            setDraft((s) => ({
              ...s,
              notifications: { ...s.notifications, progressUpdates: !s.notifications.progressUpdates },
            }))
          }
        />
        <ToggleRow
          label="Announcements"
          description="Guardian-targeted campus news"
          enabled={draft.notifications.announcements}
          onToggle={() =>
            setDraft((s) => ({
              ...s,
              notifications: { ...s.notifications, announcements: !s.notifications.announcements },
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

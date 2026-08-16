import { useMemo, useState } from 'react'
import { Bell, BookOpen, Building2, CalendarDays, GraduationCap, Lock, Mail, UserRound } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { Monogram } from '../../../shared/components/Monogram'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useLocalStorageState } from '../../../shared/hooks/useLocalStorageState'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { SettingsSection } from '../../institution/components/settings/SettingsSection'
import { SettingField } from '../../institution/components/settings/SettingField'
import { ToggleRow } from '../../institution/components/settings/ToggleRow'
import { InstructorPageError, InstructorPageLoading } from '../components/InstructorPageStates'
import { useInstructorDashboard } from '../hooks/useInstructorDashboard'
import { getSessionPerson } from '../../../shared/storage/session'

const SEC = 17

interface InstructorSettingsState {
  profile: {
    displayName: string
    email: string
    phone: string
    timezone: string
    officeHours: string
  }
  notifications: {
    submissions: boolean
    forum: boolean
    announcements: boolean
    liveClasses: boolean
  }
  security: {
    twoFactor: boolean
  }
}

const defaultSettings = (person?: { name: string; email: string }): InstructorSettingsState => ({
  profile: {
    displayName: person?.name ?? '',
    email: person?.email ?? '',
    phone: '',
    timezone: '(GMT+3) East Africa Time',
    officeHours: 'Not set',
  },
  notifications: {
    submissions: true,
    forum: true,
    announcements: true,
    liveClasses: true,
  },
  security: {
    twoFactor: false,
  },
})

export function InstructorSettingsPage() {
  const { notify } = useToast()
  const { data, isLoading, isError } = useInstructorDashboard()
  const sessionPerson = getSessionPerson()
  const [stored, setStored] = useLocalStorageState<InstructorSettingsState>(
    'berana:instructor-settings',
    defaultSettings(sessionPerson ?? undefined),
  )
  const [draft, setDraft] = useState(stored)

  const hasChanges = useMemo(() => JSON.stringify(draft) !== JSON.stringify(stored), [draft, stored])

  const notifCount = useMemo(
    () => Object.values(draft.notifications).filter(Boolean).length,
    [draft.notifications],
  )

  if (isLoading) return <InstructorPageLoading />
  if (isError || !data) return <InstructorPageError message="Failed to load settings." />

  const save = () => {
    setStored(draft)
    notify('Settings saved successfully.', 'success')
  }

  const reset = () => setDraft(stored)

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Settings"
        subtitle="Manage your instructor profile, notifications, and account security."
        actions={
          hasChanges ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={reset}>
                Cancel
              </Button>
              <Button variant="primary" onClick={save}>
                Save changes
              </Button>
            </div>
          ) : undefined
        }
      />

      <GlassCard className="relative overflow-hidden p-0">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900" />
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-lemon-500/10 blur-3xl" />
        <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
          <Monogram
            label={data.instructorName}
            size="md"
            className="w-16 h-16 text-[18px] rounded-2xl ring-4 ring-lemon-500/30"
          />
          <div className="flex-1 min-w-0 text-white">
            <h2 className="text-[22px] font-bold leading-tight">{data.instructorName}</h2>
            <p className="mt-1 text-[13px] text-navy-200 flex items-center gap-2">
              <Mail size={14} />
              {draft.profile.email}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[11.5px]">
                <Building2 size={12} />
                {data.department}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[11.5px]">
                <GraduationCap size={12} />
                {data.title}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[11.5px]">
                <CalendarDays size={12} />
                {data.term}
              </span>
            </div>
          </div>
          <div className="shrink-0 flex flex-col gap-2">
            <StatusPill label="Active instructor" tone="success" />
            <span className="text-[11px] text-navy-300 text-center">{data.kpis.activeCourses} courses</span>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-info-bg text-info flex items-center justify-center">
            <Bell size={18} />
          </div>
          <div>
            <div className="text-[11px] text-secondary-text">Notifications on</div>
            <div className="text-[18px] font-bold text-navy-900">{notifCount}/4</div>
          </div>
        </GlassCard>
        <GlassCard className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-lemon-100 text-lemon-800 flex items-center justify-center">
            <BookOpen size={18} />
          </div>
          <div>
            <div className="text-[11px] text-secondary-text">Active courses</div>
            <div className="text-[18px] font-bold text-navy-900">{data.kpis.activeCourses}</div>
          </div>
        </GlassCard>
        <GlassCard className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-600 flex items-center justify-center">
            <Lock size={18} />
          </div>
          <div>
            <div className="text-[11px] text-secondary-text">Two-factor auth</div>
            <div className="text-[18px] font-bold text-navy-900">{draft.security.twoFactor ? 'On' : 'Off'}</div>
          </div>
        </GlassCard>
      </div>

      <SettingsSection
        icon={<UserRound size={SEC} />}
        title="Profile"
        description="Your teaching profile visible to students and admin."
      >
        <SettingField
          label="Display name"
          value={draft.profile.displayName}
          onChange={(displayName) => setDraft((d) => ({ ...d, profile: { ...d.profile, displayName } }))}
        />
        <SettingField
          label="Email"
          value={draft.profile.email}
          onChange={(email) => setDraft((d) => ({ ...d, profile: { ...d.profile, email } }))}
        />
        <SettingField
          label="Phone"
          value={draft.profile.phone}
          onChange={(phone) => setDraft((d) => ({ ...d, profile: { ...d.profile, phone } }))}
        />
        <SettingField
          label="Office hours"
          value={draft.profile.officeHours}
          onChange={(officeHours) => setDraft((d) => ({ ...d, profile: { ...d.profile, officeHours } }))}
        />
        <SettingField
          label="Timezone"
          value={draft.profile.timezone}
          type="select"
          options={['(GMT+3) East Africa Time', '(GMT+0) UTC', '(GMT-5) Eastern Time']}
          onChange={(timezone) => setDraft((d) => ({ ...d, profile: { ...d.profile, timezone } }))}
        />
      </SettingsSection>

      <SettingsSection
        icon={<Bell size={SEC} />}
        title="Notifications"
        description="Choose what you want to be notified about."
      >
        <ToggleRow
          label="New submissions"
          description="Alert when students submit assignments"
          enabled={draft.notifications.submissions}
          onToggle={() =>
            setDraft((d) => ({
              ...d,
              notifications: { ...d.notifications, submissions: !d.notifications.submissions },
            }))
          }
        />
        <ToggleRow
          label="Forum activity"
          description="Notify on new threads and replies"
          enabled={draft.notifications.forum}
          onToggle={() =>
            setDraft((d) => ({
              ...d,
              notifications: { ...d.notifications, forum: !d.notifications.forum },
            }))
          }
        />
        <ToggleRow
          label="Announcement reminders"
          description="Reminders for scheduled posts"
          enabled={draft.notifications.announcements}
          onToggle={() =>
            setDraft((d) => ({
              ...d,
              notifications: { ...d.notifications, announcements: !d.notifications.announcements },
            }))
          }
        />
        <ToggleRow
          label="Live class reminders"
          description="15 minutes before sessions start"
          enabled={draft.notifications.liveClasses}
          onToggle={() =>
            setDraft((d) => ({
              ...d,
              notifications: { ...d.notifications, liveClasses: !d.notifications.liveClasses },
            }))
          }
        />
      </SettingsSection>

      <SettingsSection
        icon={<Lock size={SEC} />}
        title="Security"
        description="Protect your instructor account."
      >
        <ToggleRow
          label="Two-factor authentication"
          description="Add an extra layer of account security"
          enabled={draft.security.twoFactor}
          onToggle={() =>
            setDraft((d) => ({
              ...d,
              security: { ...d.security, twoFactor: !d.security.twoFactor },
            }))
          }
        />
        <div className="pt-2">
          <Button variant="secondary" size="sm">
            Change password
          </Button>
        </div>
      </SettingsSection>
    </div>
  )
}

export default InstructorSettingsPage

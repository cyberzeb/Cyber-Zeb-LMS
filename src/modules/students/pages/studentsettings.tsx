import { useMemo, useState } from 'react'
import { Bell, BookOpen, Building2, CalendarDays, GraduationCap, Lock, Mail, Moon, UserRound } from 'lucide-react'
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
import { StudentPageError, StudentPageLoading } from '../components/StudentPageStates'
import { useStudentDashboard } from '../hooks/useStudentDashboard'
import { getSessionPerson } from '../../../shared/storage/session'
import { useTheme } from '../../../shared/context/ThemeContext'

const SEC = 17

interface StudentSettingsState {
  profile: {
    displayName: string
    email: string
    phone: string
    timezone: string
  }
  notifications: {
    assignments: boolean
    grades: boolean
    announcements: boolean
    liveClasses: boolean
  }
  security: {
    twoFactor: boolean
  }
}

const defaultSettings = (person?: { name: string; email: string }): StudentSettingsState => ({
  profile: {
    displayName: person?.name ?? '',
    email: person?.email ?? '',
    phone: '',
    timezone: '(GMT+3) East Africa Time',
  },
  notifications: {
    assignments: true,
    grades: true,
    announcements: true,
    liveClasses: true,
  },
  security: {
    twoFactor: false,
  },
})

export function StudentSettingsPage() {
  const { notify } = useToast()
  const { data, isLoading, isError } = useStudentDashboard()
  const sessionPerson = getSessionPerson()
  const { isDark, toggleTheme } = useTheme()
  const [stored, setStored] = useLocalStorageState<StudentSettingsState>(
    'berana:student-settings',
    defaultSettings(sessionPerson ?? undefined),
  )
  const [draft, setDraft] = useState<StudentSettingsState>(stored)

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(stored),
    [draft, stored],
  )

  if (isLoading) return <StudentPageLoading />
  if (isError || !data) return <StudentPageError message="Failed to load settings." />

  const mergedProfile = {
    ...draft.profile,
    displayName: data.studentName,
  }

  const handleSave = () => {
    setStored(draft)
    notify('Your settings have been saved.')
  }

  const handleReset = () => setDraft(stored)

  const notifCount = Object.values(draft.notifications).filter(Boolean).length

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Settings"
        subtitle="Manage your profile, notifications, and account security."
        actions={
          <>
            <Button variant="secondary" onClick={handleReset} disabled={!isDirty}>
              Reset
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={!isDirty}>
              Save changes
            </Button>
          </>
        }
      />

      <GlassCard className="relative overflow-hidden p-0">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900" />
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-lemon-500/10 blur-3xl" />
        <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
          <Monogram
            label={data.studentName}
            size="md"
            className="w-16 h-16 text-[18px] rounded-2xl ring-4 ring-lemon-500/30"
          />
          <div className="flex-1 min-w-0 text-white">
            <h2 className="text-[22px] font-bold leading-tight">{data.studentName}</h2>
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
                {data.program}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[11.5px]">
                <CalendarDays size={12} />
                {data.term}
              </span>
            </div>
          </div>
          <div className="shrink-0 flex flex-col gap-2">
            <StatusPill label="Active student" tone="success" />
            <span className="text-[11px] text-navy-300 text-center">GPA {data.kpis.gpa.toFixed(2)}</span>
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
        description="Your personal information visible to instructors."
      >
        <SettingField label="Display name" value={mergedProfile.displayName} onChange={() => {}} />
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
          label="Assignment reminders"
          description="Due dates and submission confirmations"
          enabled={draft.notifications.assignments}
          onToggle={() =>
            setDraft((d) => ({
              ...d,
              notifications: { ...d.notifications, assignments: !d.notifications.assignments },
            }))
          }
        />
        <ToggleRow
          label="Grade updates"
          description="New grades and instructor feedback"
          enabled={draft.notifications.grades}
          onToggle={() =>
            setDraft((d) => ({
              ...d,
              notifications: { ...d.notifications, grades: !d.notifications.grades },
            }))
          }
        />
        <ToggleRow
          label="Announcements"
          description="Campus and course announcements"
          enabled={draft.notifications.announcements}
          onToggle={() =>
            setDraft((d) => ({
              ...d,
              notifications: { ...d.notifications, announcements: !d.notifications.announcements },
            }))
          }
        />
        <ToggleRow
          label="Live class alerts"
          description="Reminders before virtual sessions start"
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
        icon={<Moon size={SEC} />}
        title="Appearance"
        description="Customize how the student portal looks for you."
      >
        <ToggleRow
          label="Dark mode"
          description="Switch to a darker colour scheme that is easier on the eyes."
          enabled={isDark}
          onToggle={toggleTheme}
        />
      </SettingsSection>

      <SettingsSection
        icon={<Lock size={SEC} />}
        title="Security"
        description="Protect your account with additional security options."
      >
        <ToggleRow
          label="Two-factor authentication"
          description="Require a verification code when signing in"
          enabled={draft.security.twoFactor}
          onToggle={() =>
            setDraft((d) => ({
              ...d,
              security: { twoFactor: !d.security.twoFactor },
            }))
          }
        />
        <Button variant="secondary">Change password</Button>
      </SettingsSection>
    </div>
  )
}

export default StudentSettingsPage

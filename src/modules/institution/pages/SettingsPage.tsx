import { useMemo, useState } from 'react'
import {
  Building2,
  Palette,
  GraduationCap,
  Blocks,
  Plug,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useLocalStorageState } from '../../../shared/hooks/useLocalStorageState'
import { SettingsSection } from '../components/settings/SettingsSection'
import { SettingField } from '../components/settings/SettingField'
import { ToggleRow } from '../components/settings/ToggleRow'

const SEC = 17

interface ToggleState {
  [key: string]: boolean
}

interface SettingsState {
  general: {
    name: string
    timezone: string
    language: string
    currency: string
  }
  branding: {
    domain: string
    sender: string
    primary: string
  }
  academic: {
    grading: string
    attendance: string
    completion: string
  }
  modules: ToggleState
  integrations: ToggleState
}

const defaultSettings: SettingsState = {
  general: {
    name: 'Berana University',
    timezone: '(GMT+3) East Africa Time',
    language: 'English',
    currency: 'ETB — Ethiopian Birr',
  },
  branding: {
    domain: 'learn.berana.edu',
    sender: 'no-reply@berana.edu',
    primary: 'Lemon / Navy',
  },
  academic: {
    grading: 'Letter Grade (A–F)',
    attendance: '75% minimum',
    completion: 'All modules + passing grade',
  },
  modules: {
    virtualClassroom: true,
    attendance: true,
    assessments: true,
    payments: false,
    certificates: true,
    parentPortal: false,
  },
  integrations: {
    zoom: true,
    googleSso: true,
    microsoftSso: false,
    stripe: false,
    emailSms: true,
  },
}

export function SettingsPage() {
  const { notify } = useToast()
  const [stored, setStored] = useLocalStorageState<SettingsState>(
    'berana:settings',
    defaultSettings,
  )
  const [draft, setDraft] = useState<SettingsState>(stored)

  const { general, branding, academic, modules, integrations } = draft

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(stored),
    [draft, stored],
  )

  const setGeneral = (patch: Partial<SettingsState['general']>) =>
    setDraft((d) => ({ ...d, general: { ...d.general, ...patch } }))
  const setBranding = (patch: Partial<SettingsState['branding']>) =>
    setDraft((d) => ({ ...d, branding: { ...d.branding, ...patch } }))
  const setAcademic = (patch: Partial<SettingsState['academic']>) =>
    setDraft((d) => ({ ...d, academic: { ...d.academic, ...patch } }))
  const toggleModule = (key: string) =>
    setDraft((d) => ({ ...d, modules: { ...d.modules, [key]: !d.modules[key] } }))
  const toggleIntegration = (key: string) =>
    setDraft((d) => ({
      ...d,
      integrations: { ...d.integrations, [key]: !d.integrations[key] },
    }))

  const handleSave = () => {
    setStored(draft)
    notify('Settings saved successfully.')
  }

  const handleDiscard = () => {
    setDraft(stored)
    notify('Changes discarded.', 'info')
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Institution Settings"
        subtitle="Configure your institution profile, branding, identity, academic defaults and modules."
        actions={
          <>
            <Button variant="secondary" onClick={handleDiscard} disabled={!isDirty}>
              Discard
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={!isDirty}>
              {isDirty ? 'Save Changes' : 'Saved'}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
        <SettingsSection
          icon={<Building2 size={SEC} />}
          title="General"
          description="Core identity and localization for your institution."
        >
          <SettingField
            label="Institution Name"
            value={general.name}
            onChange={(v) => setGeneral({ name: v })}
          />
          <SettingField
            label="Timezone"
            type="select"
            value={general.timezone}
            options={[
              '(GMT+3) East Africa Time',
              '(GMT+0) Greenwich Mean Time',
              '(GMT+1) Central European Time',
              '(GMT-5) Eastern Time',
            ]}
            onChange={(v) => setGeneral({ timezone: v })}
          />
          <div className="grid grid-cols-2 gap-4">
            <SettingField
              label="Default Language"
              type="select"
              value={general.language}
              options={['English', 'Amharic', 'French', 'Arabic']}
              onChange={(v) => setGeneral({ language: v })}
            />
            <SettingField
              label="Currency"
              type="select"
              value={general.currency}
              options={[
                'ETB — Ethiopian Birr',
                'USD — US Dollar',
                'EUR — Euro',
                'KES — Kenyan Shilling',
              ]}
              onChange={(v) => setGeneral({ currency: v })}
            />
          </div>
        </SettingsSection>

        <SettingsSection
          icon={<Palette size={SEC} />}
          title="Branding & Domain"
          description="How Berana appears to your learners and staff."
        >
          <SettingField
            label="Custom Domain"
            value={branding.domain}
            hint="Learners access the portal at this address."
            onChange={(v) => setBranding({ domain: v })}
          />
          <SettingField
            label="Email Sender Address"
            value={branding.sender}
            onChange={(v) => setBranding({ sender: v })}
          />
          <SettingField
            label="Theme Palette"
            type="select"
            value={branding.primary}
            options={['Lemon / Navy', 'Blue / Slate', 'Emerald / Charcoal']}
            onChange={(v) => setBranding({ primary: v })}
          />
        </SettingsSection>

        <SettingsSection
          icon={<GraduationCap size={SEC} />}
          title="Academic Defaults"
          description="Grading, attendance and completion rules applied to new courses."
        >
          <SettingField
            label="Grading Scheme"
            type="select"
            value={academic.grading}
            options={['Letter Grade (A–F)', 'Percentage (0–100)', 'Pass / Fail', 'GPA (4.0)']}
            onChange={(v) => setAcademic({ grading: v })}
          />
          <SettingField
            label="Minimum Attendance"
            type="select"
            value={academic.attendance}
            options={['60% minimum', '70% minimum', '75% minimum', '80% minimum']}
            onChange={(v) => setAcademic({ attendance: v })}
          />
          <SettingField
            label="Completion Rule"
            type="select"
            value={academic.completion}
            options={[
              'All modules + passing grade',
              'All modules viewed',
              'Final assessment passed',
            ]}
            onChange={(v) => setAcademic({ completion: v })}
          />
        </SettingsSection>

        <SettingsSection
          icon={<Blocks size={SEC} />}
          title="Modules"
          description="Enable only the features your institution needs."
        >
          <ToggleRow
            label="Virtual Classroom"
            description="Zoom-powered live sessions and recordings."
            enabled={modules.virtualClassroom}
            onToggle={() => toggleModule('virtualClassroom')}
          />
          <ToggleRow
            label="Attendance Tracking"
            description="Session attendance, rules and alerts."
            enabled={modules.attendance}
            onToggle={() => toggleModule('attendance')}
          />
          <ToggleRow
            label="Assignments & Assessments"
            description="Quizzes, exams, rubrics and grading."
            enabled={modules.assessments}
            onToggle={() => toggleModule('assessments')}
          />
          <ToggleRow
            label="Payments & Billing"
            description="Invoices, checkout and reconciliation."
            enabled={modules.payments}
            onToggle={() => toggleModule('payments')}
          />
          <ToggleRow
            label="Certificates"
            description="Verifiable credentials and QR verification."
            enabled={modules.certificates}
            onToggle={() => toggleModule('certificates')}
          />
          <ToggleRow
            label="Parent / Guardian Portal"
            description="Controlled visibility for linked learners."
            enabled={modules.parentPortal}
            onToggle={() => toggleModule('parentPortal')}
          />
        </SettingsSection>

        <SettingsSection
          icon={<Plug size={SEC} />}
          title="Integrations"
          description="Connect Berana with external identity and service providers."
        >
          <ToggleRow
            label="Zoom"
            description="OAuth connection for live class scheduling."
            enabled={integrations.zoom}
            onToggle={() => toggleIntegration('zoom')}
          />
          <ToggleRow
            label="Google SSO"
            description="Sign-in with Google Workspace accounts."
            enabled={integrations.googleSso}
            onToggle={() => toggleIntegration('googleSso')}
          />
          <ToggleRow
            label="Microsoft SSO"
            description="Azure AD / Microsoft Entra sign-in."
            enabled={integrations.microsoftSso}
            onToggle={() => toggleIntegration('microsoftSso')}
          />
          <ToggleRow
            label="Stripe Payments"
            description="Card checkout and payment webhooks."
            enabled={integrations.stripe}
            onToggle={() => toggleIntegration('stripe')}
          />
          <ToggleRow
            label="Email / SMS Gateway"
            description="Transactional notifications and alerts."
            enabled={integrations.emailSms}
            onToggle={() => toggleIntegration('emailSms')}
          />
        </SettingsSection>

        <SettingsSection
          icon={<AlertTriangle size={SEC} />}
          title="Danger Zone"
          description="Irreversible and high-impact institution actions."
        >
          <div className="flex items-center justify-between gap-4 py-1">
            <div>
              <div className="text-[13px] font-semibold text-navy-900">Export All Data</div>
              <div className="text-[11.5px] text-secondary-text mt-0.5">
                Download a full archive of institution records.
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => notify('Preparing your data export…', 'info')}
            >
              Export
            </Button>
          </div>
          <div className="flex items-center justify-between gap-4 py-1">
            <div>
              <div className="text-[13px] font-semibold text-navy-900">Deactivate Institution</div>
              <div className="text-[11.5px] text-secondary-text mt-0.5">
                Suspend all access. This can only be undone by a platform admin.
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => notify('Deactivation requires platform-admin approval.', 'error')}
            >
              Deactivate
            </Button>
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}

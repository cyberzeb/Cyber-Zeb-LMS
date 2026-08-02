import { useState } from 'react'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SettingsSection } from '../components/settings/SettingsSection'
import { SettingField } from '../components/settings/SettingField'
import { ToggleRow } from '../components/settings/ToggleRow'

interface ToggleState {
  [key: string]: boolean
}

const initialModules: ToggleState = {
  virtualClassroom: true,
  attendance: true,
  assessments: true,
  payments: false,
  certificates: true,
  parentPortal: false,
}

const initialIntegrations: ToggleState = {
  zoom: true,
  googleSso: true,
  microsoftSso: false,
  stripe: false,
  emailSms: true,
}

export function SettingsPage() {
  const [general, setGeneral] = useState({
    name: 'Berana University',
    timezone: '(GMT+3) East Africa Time',
    language: 'English',
    currency: 'ETB — Ethiopian Birr',
  })
  const [branding, setBranding] = useState({
    domain: 'learn.berana.edu',
    sender: 'no-reply@berana.edu',
    primary: 'Lemon / Navy',
  })
  const [academic, setAcademic] = useState({
    grading: 'Letter Grade (A–F)',
    attendance: '75% minimum',
    completion: 'All modules + passing grade',
  })
  const [modules, setModules] = useState<ToggleState>(initialModules)
  const [integrations, setIntegrations] = useState<ToggleState>(initialIntegrations)

  const toggleModule = (key: string) =>
    setModules((prev) => ({ ...prev, [key]: !prev[key] }))
  const toggleIntegration = (key: string) =>
    setIntegrations((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Institution Settings"
        subtitle="Configure your institution profile, branding, identity, academic defaults and modules."
        actions={
          <>
            <Button variant="secondary">Discard</Button>
            <Button variant="primary">Save Changes</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
        <SettingsSection
          icon="🏛️"
          title="General"
          description="Core identity and localization for your institution."
        >
          <SettingField
            label="Institution Name"
            value={general.name}
            onChange={(v) => setGeneral({ ...general, name: v })}
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
            onChange={(v) => setGeneral({ ...general, timezone: v })}
          />
          <div className="grid grid-cols-2 gap-4">
            <SettingField
              label="Default Language"
              type="select"
              value={general.language}
              options={['English', 'Amharic', 'French', 'Arabic']}
              onChange={(v) => setGeneral({ ...general, language: v })}
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
              onChange={(v) => setGeneral({ ...general, currency: v })}
            />
          </div>
        </SettingsSection>

        <SettingsSection
          icon="🎨"
          title="Branding & Domain"
          description="How Berana appears to your learners and staff."
        >
          <SettingField
            label="Custom Domain"
            value={branding.domain}
            hint="Learners access the portal at this address."
            onChange={(v) => setBranding({ ...branding, domain: v })}
          />
          <SettingField
            label="Email Sender Address"
            value={branding.sender}
            onChange={(v) => setBranding({ ...branding, sender: v })}
          />
          <SettingField
            label="Theme Palette"
            type="select"
            value={branding.primary}
            options={['Lemon / Navy', 'Blue / Slate', 'Emerald / Charcoal']}
            onChange={(v) => setBranding({ ...branding, primary: v })}
          />
        </SettingsSection>

        <SettingsSection
          icon="🎓"
          title="Academic Defaults"
          description="Grading, attendance and completion rules applied to new courses."
        >
          <SettingField
            label="Grading Scheme"
            type="select"
            value={academic.grading}
            options={['Letter Grade (A–F)', 'Percentage (0–100)', 'Pass / Fail', 'GPA (4.0)']}
            onChange={(v) => setAcademic({ ...academic, grading: v })}
          />
          <SettingField
            label="Minimum Attendance"
            type="select"
            value={academic.attendance}
            options={['60% minimum', '70% minimum', '75% minimum', '80% minimum']}
            onChange={(v) => setAcademic({ ...academic, attendance: v })}
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
            onChange={(v) => setAcademic({ ...academic, completion: v })}
          />
        </SettingsSection>

        <SettingsSection
          icon="🧩"
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
          icon="🔌"
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
          icon="⚠️"
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
            <Button variant="secondary" size="sm">
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
            <Button variant="danger" size="sm">
              Deactivate
            </Button>
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}

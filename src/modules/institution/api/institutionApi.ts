import type { InstitutionOverviewData } from '../types'

export async function getInstitutionOverview(): Promise<InstitutionOverviewData> {
  // Simulate 400ms delay
  await new Promise((resolve) => setTimeout(resolve, 400))

  return {
    statTotals: {
      campusCount: 4,
      activeCampusCount: 3,
      totalUsers: 2450,
      pendingInvitations: 38,
      activeIntegrations: 2,
      totalIntegrations: 3,
      setupProgressPercent: 71,
    },
    campuses: [
      { id: 'c1', name: 'Main Campus — Addis Ababa', status: 'active', deptCount: 6 },
      { id: 'c2', name: 'Bole Campus', status: 'active', deptCount: 4 },
      { id: 'c3', name: 'Adama Campus', status: 'active', deptCount: 3 },
      { id: 'c4', name: 'Hawassa Campus', status: 'pending', deptCount: 0 },
    ],
    setupSteps: [
      { id: 's1', title: 'Institution Profile', subtitle: 'Basic identity details', done: true },
      { id: 's2', title: 'Organizational Structure', subtitle: 'Configure campuses & departments', done: true },
      { id: 's3', title: 'Branding Guidelines', subtitle: 'Add logo & custom theme colors', done: true },
      { id: 's4', title: 'Identity & SSO Integration', subtitle: 'Connect active directory', done: true },
      { id: 's5', title: 'Roles & Permissions', subtitle: 'Define base user groups', done: true },
      { id: 's6', title: 'User Data Import', subtitle: 'Upload faculty & students via CSV', done: false },
      { id: 's7', title: 'Integration Testing', subtitle: 'Verify platform communication', done: false },
    ],
    ssoProviders: [
      { id: 'sp1', name: 'Microsoft Entra ID', subtitle: 'Azure Active Directory provider', status: 'connected' },
      { id: 'sp2', name: 'Local Accounts', subtitle: 'Standard email/password login', status: 'enabled' },
      { id: 'sp3', name: 'Google Workspace', subtitle: 'Google Cloud Identity provider', status: 'not-configured' },
    ],
    auditLogEntries: [
      { id: 'a1', type: 'warn', text: 'Role permission changed for Registrar Administrator', timestamp: '10 minutes ago' },
      { id: 'a2', type: 'info', text: 'Bulk user import initiated (340 records)', timestamp: '2 hours ago' },
      { id: 'a3', type: 'ok', text: 'Integration connected: Microsoft Entra ID', timestamp: '1 day ago' },
    ],
  }
}

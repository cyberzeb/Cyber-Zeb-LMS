import type { PersonRole } from '../../modules/institution/types'

export type LoginRole = PersonRole | 'SuperAdmin'

/** Every role that can sign in, with its display label. */
export const ROLE_LABELS: Record<LoginRole, string> = {
  Admin: 'Institution Admin',
  Registrar: 'Registrar',
  FinanceOfficer: 'Finance Officer',
  Instructor: 'Instructor',
  TeachingAssistant: 'Teaching Assistant',
  Student: 'Student',
  Guardian: 'Parent / Guardian',
  Staff: 'Staff',
  HelpDesk: 'Help Desk',
  Manager: 'Manager',
  SuperAdmin: 'Super Admin',
}

/**
 * University Edition: the seven institution roles, in the order the login
 * screen lists them. Super Admin is the platform operator, not an institution role.
 */
export const UNIVERSITY_ROLES: PersonRole[] = [
  'Admin',
  'Registrar',
  'FinanceOfficer',
  'Instructor',
  'TeachingAssistant',
  'Student',
  'Guardian',
]

/** Roles offered on the login screen. Other editions' roles are detected from the email. */
export const LOGIN_ROLES: { value: LoginRole; label: string }[] = [
  ...UNIVERSITY_ROLES.map((value) => ({ value, label: ROLE_LABELS[value] })),
  { value: 'SuperAdmin', label: ROLE_LABELS.SuperAdmin },
]

const ALL_LOGIN_ROLES = Object.keys(ROLE_LABELS) as LoginRole[]

export const ROLE_HOME: Record<LoginRole, string> = {
  // University: the three office roles share the admin portal, each with its own menu.
  Admin: '/admin',
  Registrar: '/admin',
  FinanceOfficer: '/admin',
  // Teaching assistants use the instructor portal with a reduced menu.
  Instructor: '/instructor',
  TeachingAssistant: '/instructor',
  Student: '/student',
  Guardian: '/guardian',
  // Corporate / Training editions.
  Staff: '/staff',
  HelpDesk: '/help-desk',
  Manager: '/manager',
  SuperAdmin: '/super-admin',
}

export function portalPathForRole(role: LoginRole): string {
  return ROLE_HOME[role] ?? '/'
}

export function isLoginRole(value: string | null): value is LoginRole {
  return value !== null && (ALL_LOGIN_ROLES as string[]).includes(value)
}

/** Roles that may enter each portal. */
export const PORTAL_ROLES: Record<string, PersonRole[]> = {
  '/admin': ['Admin', 'Registrar', 'FinanceOfficer'],
  '/instructor': ['Instructor', 'TeachingAssistant'],
  '/student': ['Student'],
  '/guardian': ['Guardian'],
  '/staff': ['Staff'],
  '/help-desk': ['HelpDesk'],
  '/manager': ['Manager'],
}

/** True when this session role may use the given portal. */
export function canUsePortal(portal: string, role: string | undefined): boolean {
  if (!role) return false
  const allowed = PORTAL_ROLES[portal]
  return allowed ? (allowed as string[]).includes(role) : false
}

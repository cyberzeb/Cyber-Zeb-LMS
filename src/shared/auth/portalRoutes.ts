import type { PersonRole } from '../../modules/institution/types'

export type LoginRole = PersonRole | 'Admin'

export const LOGIN_ROLES: { value: LoginRole; label: string }[] = [
  { value: 'Student', label: 'Student' },
  { value: 'Instructor', label: 'Instructor' },
  { value: 'Staff', label: 'Staff' },
  { value: 'Guardian', label: 'Guardian' },
  { value: 'HelpDesk', label: 'Help Desk' },
  { value: 'Admin', label: 'Institution Admin' },
]

export const ROLE_HOME: Record<LoginRole, string> = {
  Student: '/student',
  Instructor: '/instructor',
  Staff: '/staff',
  Guardian: '/guardian',
  HelpDesk: '/help-desk',
  Admin: '/admin',
}

export function portalPathForRole(role: LoginRole): string {
  return ROLE_HOME[role] ?? '/'
}

export function isLoginRole(value: string | null): value is LoginRole {
  return LOGIN_ROLES.some((r) => r.value === value)
}

import type { PersonRole } from '../../modules/institution/types'
import { isCorporateEdition } from '../config/edition'
import { getTerminology } from '../config/terminology'

export type LoginRole = PersonRole | 'Admin'

const UNIVERSITY_LOGIN_ROLES: { value: LoginRole; label: string }[] = [
  { value: 'Student', label: 'Student' },
  { value: 'Instructor', label: 'Instructor' },
  { value: 'Staff', label: 'Staff' },
  { value: 'Guardian', label: 'Guardian' },
  { value: 'HelpDesk', label: 'Help Desk' },
  { value: 'Admin', label: 'Institution Admin' },
]

export const LOGIN_ROLES = UNIVERSITY_LOGIN_ROLES

export function getLoginRoles(): { value: LoginRole; label: string }[] {
  if (!isCorporateEdition()) return UNIVERSITY_LOGIN_ROLES

  const t = getTerminology()
  return [
    { value: 'Student', label: t.employee },
    { value: 'Instructor', label: t.trainer },
    { value: 'Staff', label: 'Staff' },
    { value: 'HelpDesk', label: 'Help Desk' },
    { value: 'Admin', label: t.adminRole },
  ]
}

export const ROLE_HOME: Record<LoginRole, string> = {
  Student: '/student',
  Instructor: '/instructor',
  Staff: '/staff',
  Guardian: '/guardian',
  HelpDesk: '/help-desk',
  Admin: '/admin',
}

export function portalPathForRole(role: LoginRole): string {
  if (role === 'Student' && isCorporateEdition()) return '/employee'
  return ROLE_HOME[role] ?? '/'
}

export function isLoginRole(value: string | null): value is LoginRole {
  return UNIVERSITY_LOGIN_ROLES.some((r) => r.value === value)
    || (isCorporateEdition() && getLoginRoles().some((r) => r.value === value))
}

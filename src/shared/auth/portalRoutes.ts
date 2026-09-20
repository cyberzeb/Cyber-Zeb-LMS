import type { PersonRole } from '../../modules/institution/types'

export type LoginRole = PersonRole | 'Admin' | 'SuperAdmin'

export const LOGIN_ROLES: { value: LoginRole; label: string }[] = [
  { value: 'Student', label: 'Student' },
  { value: 'Instructor', label: 'Instructor' },
  { value: 'Registrar', label: 'Registrar' },
  { value: 'HeadOfDepartment', label: 'Head of Department' },
  { value: 'Staff', label: 'Staff' },
  { value: 'Guardian', label: 'Guardian' },
  { value: 'HelpDesk', label: 'Help Desk' },
  { value: 'Admin', label: 'Institution Admin' },
  { value: 'SuperAdmin', label: 'Super Admin' },
]

export const ROLE_HOME: Record<LoginRole, string> = {
  Student: '/student',
  Instructor: '/instructor',
  // The registrar works in the admin portal; heads of department in the staff portal.
  Registrar: '/admin',
  HeadOfDepartment: '/staff',
  Staff: '/staff',
  Guardian: '/guardian',
  HelpDesk: '/help-desk',
  Admin: '/admin',
  SuperAdmin: '/super-admin',
}

export function portalPathForRole(role: LoginRole): string {
  return ROLE_HOME[role] ?? '/'
}

export function isLoginRole(value: string | null): value is LoginRole {
  return LOGIN_ROLES.some((r) => r.value === value)
}

/**
 * Roles that share a portal (University Edition, spec section 4).
 * The admin portal serves institution admins and registrars; the staff portal
 * serves department staff and heads of department.
 */
export const PORTAL_ROLES: Record<string, PersonRole[]> = {
  '/admin': ['Admin', 'Registrar'],
  '/staff': ['Staff', 'HeadOfDepartment'],
  '/instructor': ['Instructor'],
  '/student': ['Student'],
  '/guardian': ['Guardian'],
  '/help-desk': ['HelpDesk'],
}

/** True when this session role may use the given portal. */
export function canUsePortal(portal: string, role: string | undefined): boolean {
  if (!role) return false
  const allowed = PORTAL_ROLES[portal]
  return allowed ? (allowed as string[]).includes(role) : false
}

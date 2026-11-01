/**
 * University Edition permission matrix (frontend side).
 *
 * The backend enforces the same rules (backend/app/modules/lms_store/policy.py);
 * this file decides which menus and buttons each role sees so nobody is shown
 * an action the server would refuse.
 */
import type { PersonRole } from '../../modules/institution/types'
import { readPortalSession } from '../storage/session'

export type AdminPortalRole = 'Admin' | 'Registrar' | 'FinanceOfficer'

/**
 * Admin-portal pages each office role may open. `'*'` means every page.
 * Paths are matched exactly or as a prefix followed by `/`.
 */
const ADMIN_PAGES: Record<AdminPortalRole, '*' | string[]> = {
  Admin: '*',
  Registrar: [
    '/admin',
    '/admin/institution/overview',
    '/admin/institution/dashboard',
    '/admin/institution/academic-calendar',
    '/admin/institution/departments',
    '/admin/institution/programs',
    '/admin/courses',
    '/admin/course-offerings',
    '/admin/enrollments',
    '/admin/transcripts',
    '/admin/students',
    '/admin/instructors',
    '/admin/teaching-assistants',
    '/admin/guardians',
    '/admin/certificates',
    '/admin/attendance',
    '/admin/announcements',
    '/admin/discussion-forum',
    '/admin/calendar',
    '/admin/academic-reports',
  ],
  FinanceOfficer: [
    '/admin',
    '/admin/institution/overview',
    '/admin/institution/dashboard',
    '/admin/payments',
    '/admin/announcements',
    '/admin/calendar',
  ],
}

export function isAdminPortalRole(role: string | undefined): role is AdminPortalRole {
  return role === 'Admin' || role === 'Registrar' || role === 'FinanceOfficer'
}

/**
 * Pages of the shared admin build that the University admin portal never opens:
 * other editions' pages (staff submissions, corporate managers), and quizzes and
 * exams, which instructors create for their own sections.
 */
const NON_UNIVERSITY_PAGES = ['/admin/staff', '/admin/verify-people', '/admin/managers', '/admin/quizzes-exams']

/** True when an office role may open this University admin-portal path. */
export function canOpenAdminPage(role: string | undefined, path: string): boolean {
  if (!isAdminPortalRole(role)) return false
  if (NON_UNIVERSITY_PAGES.some((page) => path === page || path.startsWith(`${page}/`))) return false
  const pages = ADMIN_PAGES[role]
  if (pages === '*') return true
  return pages.some((page) => path === page || (page !== '/admin' && path.startsWith(`${page}/`)))
}

/** Header subtitle shown under the user's name in the admin portal. */
export const ADMIN_ROLE_TITLES: Record<AdminPortalRole, string> = {
  Admin: 'Institution Admin',
  Registrar: 'Registrar',
  FinanceOfficer: 'Finance Officer',
}

/* ── Instructor portal ───────────────────────────────────── */

/** Instructor-portal pages a teaching assistant does not get. */
const ASSISTANT_HIDDEN_PAGES = ['/instructor/quizzes', '/instructor/certificates']

export function canOpenInstructorPage(role: string | undefined, path: string): boolean {
  if (role !== 'TeachingAssistant') return role === 'Instructor'
  return !ASSISTANT_HIDDEN_PAGES.some((page) => path === page || path.startsWith(`${page}/`))
}

export interface TeachingPermissions {
  role: PersonRole | undefined
  isAssistant: boolean
  /** Create and edit courses, assignments, quizzes, live classes, library items. */
  canAuthor: boolean
  /** Publish announcements to students. */
  canAnnounce: boolean
  /** Grade submissions and take attendance (instructors and assistants). */
  canGrade: boolean
}

/** What the signed-in teaching user may do in the instructor portal. */
export function useTeachingPermissions(): TeachingPermissions {
  const role = readPortalSession()?.role
  const isAssistant = role === 'TeachingAssistant'
  return {
    role,
    isAssistant,
    canAuthor: !isAssistant,
    canAnnounce: !isAssistant,
    canGrade: true,
  }
}

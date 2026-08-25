/** Maps frontend STORAGE_KEYS to backend collection keys. */
export const STORAGE_TO_API_KEY: Record<string, string> = {
  'berana:people': 'people',
  'berana:campuses': 'campuses',
  'berana:colleges': 'colleges',
  'berana:departments': 'departments',
  'berana:programs': 'programs',
  'berana:courses': 'courses',
  'berana:enrollments': 'enrollments',
  'berana:certificates': 'certificates',
  'berana:attendances': 'attendances',
  'berana:lesson-progress': 'lesson-progress',
  'berana:lesson-responses': 'lesson-responses',
  'berana:settings': 'settings',
  'berana:selectedCampus': 'selectedCampus',
  'berana:reports': 'reports',
  'berana:student-settings': 'student-settings',
  'berana:instructor-settings': 'instructor-settings',
  'berana:staff-settings': 'staff-settings',
  'berana:guardian-settings': 'guardian-settings',
  'berana:help-desk-settings': 'help-desk-settings',
  'berana:announcements': 'announcements',
  'berana:forum-chats': 'forum-chats',
  'berana:forum-messages': 'forum-messages',
  'berana:forum-read-state': 'forum-read-state',
  'berana:live-sessions': 'live-sessions',
  'berana:assignments': 'assignments',
  'berana:quizzes': 'quizzes',
  'berana:question-bank': 'question-bank',
  'berana:student-submissions': 'student-submissions',
  'berana:payments': 'payments',
  'berana:help-desk-tickets': 'help-desk-tickets',
  'berana:integrations': 'integrations',
}

export function toApiKey(storageKey: string): string {
  return STORAGE_TO_API_KEY[storageKey] ?? storageKey.replace(/^berana:/, '')
}

export const AUTH_TOKEN_KEY = 'berana_token'
export const SESSION_COOKIE_KEY = 'berana_session'
/** @deprecated Legacy localStorage key — migrated to cookies on read. */
export const LEGACY_AUTH_TOKEN_KEY = 'berana:access-token'
export const DEFAULT_TENANT_CODE = 'berana'

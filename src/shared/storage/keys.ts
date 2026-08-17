/** Bump to reset all Berana localStorage (fresh demo). */
export const STORAGE_VERSION = 4

export const STORAGE_KEYS = {
  version: 'berana:storage-version',
  session: 'berana:session',
  people: 'berana:people',
  campuses: 'berana:campuses',
  colleges: 'berana:colleges',
  departments: 'berana:departments',
  programs: 'berana:programs',
  courses: 'berana:courses',
  enrollments: 'berana:enrollments',
  lessonProgress: 'berana:lesson-progress',
  lessonResponses: 'berana:lesson-responses',
  settings: 'berana:settings',
  selectedCampus: 'berana:selectedCampus',
  reports: 'berana:reports',
  lmsActivity: 'berana:lms-activity',
  studentSettings: 'berana:student-settings',
  instructorSettings: 'berana:instructor-settings',
  announcements: 'berana:announcements',
  forumChats: 'berana:forum-chats',
  forumMessages: 'berana:forum-messages',
  forumReadState: 'berana:forum-read-state',
} as const

export const STORAGE_EVENTS = {
  peopleUpdated: 'berana:people-updated',
  coursesUpdated: 'berana:courses-updated',
  enrollmentsUpdated: 'berana:enrollments-updated',
  lessonProgressUpdated: 'berana:lesson-progress-updated',
  lessonResponsesUpdated: 'berana:lesson-responses-updated',
  orgUpdated: 'berana:org-updated',
  announcementsUpdated: 'berana:announcements-updated',
  forumUpdated: 'berana:forum-updated',
} as const

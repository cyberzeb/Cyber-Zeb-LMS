export type AnnouncementTargetRole = 'Student' | 'Instructor' | 'Staff' | 'Admin' | 'Guardian' | 'Manager'

export type AnnouncementPriority = 'normal' | 'important'

export type AnnouncementAuthorRole = 'admin' | 'instructor'

/** @deprecated Legacy single-select audience — migrated to targetRoles on read */
export type AnnouncementAudience =
  | 'all'
  | 'students_and_instructors'
  | 'students'
  | 'instructors'
  | 'staff'
  | 'admins'
  | 'guardians'
  | 'course'
  | 'specific_students'

export type InstructorAnnouncementAudience = 'all_my_students' | 'selected_students' | 'course'

export interface AnnouncementRecord {
  id: string
  title: string
  body: string
  authorId: string
  authorName: string
  authorRole: AnnouncementAuthorRole
  targetRoles: AnnouncementTargetRole[]
  instructorAudience?: InstructorAnnouncementAudience
  courseId?: string
  courseCode?: string
  courseTitle?: string
  targetPersonIds?: string[]
  targetPersonNames?: string[]
  priority: AnnouncementPriority
  postedAt: string
  createdAt: string
  views: number
  viewedBy: string[]
  /** @deprecated Migrated to targetRoles */
  audience?: AnnouncementAudience
}

export interface AnnouncementFormInput {
  title: string
  body: string
  priority: AnnouncementPriority
  targetRoles: AnnouncementTargetRole[]
  instructorAudience?: InstructorAnnouncementAudience
  courseEnabled: boolean
  courseId?: string
  specificStudentsEnabled: boolean
  targetPersonIds: string[]
}

export interface AnnouncementPersonOption {
  id: string
  name: string
  email: string
  department?: string
}

export const ALL_ANNOUNCEMENT_TARGET_ROLES: AnnouncementTargetRole[] = [
  'Student',
  'Instructor',
  'Staff',
  'Admin',
  'Guardian',
]

export const ANNOUNCEMENT_TARGET_ROLE_LABELS: Record<AnnouncementTargetRole, string> = {
  Student: 'Students',
  Instructor: 'Instructors',
  Staff: 'Staff',
  Admin: 'Administrators',
  Guardian: 'Guardians',
  Manager: 'Managers',
}

/** Who an announcement can target in each edition, with the edition's own words. */
export function announcementRolesFor(edition: string): { role: AnnouncementTargetRole; label: string }[] {
  if (edition === 'corporate') {
    return [
      { role: 'Student', label: 'Employees' },
      { role: 'Instructor', label: 'Trainers' },
      { role: 'Manager', label: 'Managers' },
      { role: 'Staff', label: 'HR & staff' },
      { role: 'Admin', label: 'Administrators' },
    ]
  }
  if (edition === 'training_organization') {
    return [
      { role: 'Student', label: 'Learners' },
      { role: 'Instructor', label: 'Trainers' },
      { role: 'Staff', label: 'Staff' },
      { role: 'Admin', label: 'Administrators' },
    ]
  }
  return ALL_ANNOUNCEMENT_TARGET_ROLES.map((role) => ({ role, label: ANNOUNCEMENT_TARGET_ROLE_LABELS[role] }))
}

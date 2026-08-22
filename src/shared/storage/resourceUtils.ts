import type {
  CourseRecord,
  CourseResource as InstitutionResource,
  CourseResourceType,
} from '../../modules/institution/types'
import type { CourseResource as StudentResource, ResourceKind } from '../../modules/students/types'
import type { CourseResource as InstructorResource } from '../../modules/instructors/types'

export interface AdminLibraryResource {
  id: string
  title: string
  courseId: string
  courseCode: string
  courseTitle: string
  instructor: string
  kind: ResourceKind
  type: CourseResourceType
  size: string
  updatedAt: string
  url: string
  courseStatus: string
}

function institutionResourceTypeToKind(type: CourseResourceType, title: string): ResourceKind {
  const lower = title.toLowerCase()
  if (type === 'video') return 'Video'
  if (type === 'slides') return 'Lecture Notes'
  if (lower.includes('syllabus')) return 'Syllabus'
  if (type === 'link') return 'Reading'
  if (type === 'worksheet') return 'Reading'
  if (type === 'document') return lower.includes('reading') ? 'Reading' : 'Lecture Notes'
  return 'Reading'
}

function formatResourceSize(resource: InstitutionResource): string {
  if (resource.fileName) {
    const ext = resource.fileName.split('.').pop()?.toUpperCase()
    return ext ? `${ext} file` : resource.fileName
  }
  if (resource.type === 'video') return 'Video'
  if (resource.type === 'link') return 'Link'
  return 'File'
}

function formatUpdatedAt(course: CourseRecord): string {
  const date = course.reviewedAt ?? course.submittedAt
  if (!date) return 'Recently added'
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function flattenCourseResources(courses: CourseRecord[]) {
  const rows: Array<{ course: CourseRecord; resource: InstitutionResource }> = []
  for (const course of courses) {
    for (const resource of course.resources ?? []) {
      rows.push({ course, resource })
    }
  }
  return rows
}

export function toStudentResources(courses: CourseRecord[]): StudentResource[] {
  return flattenCourseResources(courses).map(({ course, resource }) => ({
    id: `${course.id}-${resource.id}`,
    title: resource.title,
    course: course.code,
    kind: institutionResourceTypeToKind(resource.type, resource.title),
    size: formatResourceSize(resource),
    updatedAt: formatUpdatedAt(course),
    href: resource.url || '#',
  }))
}

export function toInstructorResources(courses: CourseRecord[]): InstructorResource[] {
  return flattenCourseResources(courses).map(({ course, resource }) => ({
    id: `${course.id}-${resource.id}`,
    title: resource.title,
    course: course.code,
    kind: institutionResourceTypeToKind(resource.type, resource.title),
    size: formatResourceSize(resource),
    updatedAt: formatUpdatedAt(course),
    downloads: 0,
  }))
}

export function toAdminLibraryResources(courses: CourseRecord[]): AdminLibraryResource[] {
  return flattenCourseResources(courses).map(({ course, resource }) => ({
    id: `${course.id}-${resource.id}`,
    title: resource.title,
    courseId: course.id,
    courseCode: course.code,
    courseTitle: course.title,
    instructor: course.instructor,
    kind: institutionResourceTypeToKind(resource.type, resource.title),
    type: resource.type,
    size: formatResourceSize(resource),
    updatedAt: formatUpdatedAt(course),
    url: resource.url || '#',
    courseStatus: course.status,
  }))
}

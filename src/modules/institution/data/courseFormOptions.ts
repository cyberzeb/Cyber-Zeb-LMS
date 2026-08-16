import { createId } from '../../../shared/hooks/useLocalStorageState'
import type {
  CourseCreateInput,
  CourseDeliveryMode,
  CourseLessonType,
  CourseRecord,
  CourseResourceType,
  CourseVisibility,
} from '../types'
import { UNASSIGNED_DEPARTMENT, courseLevelOptions } from './courseSeedData'

export const courseDeliveryModeOptions: CourseDeliveryMode[] = [
  'Self-paced',
  'Instructor-led',
  'Hybrid',
  'Live cohort',
]

export const courseLanguageOptions = [
  'English',
  'Amharic',
  'French',
  'Arabic',
  'Spanish',
]

export const courseResourceTypeOptions: CourseResourceType[] = [
  'document',
  'video',
  'link',
  'slides',
  'worksheet',
  'other',
]

export const courseLessonTypeOptions: CourseLessonType[] = [
  'video',
  'reading',
  'quiz',
  'assignment',
  'live-session',
]

export const courseVisibilityOptions: CourseVisibility[] = ['public', 'private', 'restricted']

export function createEmptyCourseForm(): CourseCreateInput {
  return {
    title: '',
    code: '',
    level: courseLevelOptions[0],
    status: 'draft',
    shortDescription: '',
    description: '',
    credits: 3,
    durationWeeks: 12,
    deliveryMode: 'Instructor-led',
    language: 'English',
    prerequisites: '',
    learningOutcomes: '',
    tags: [],
    modules: [],
    videos: [],
    resources: [],
    thumbnailUrl: '',
    syllabusUrl: '',
    maxEnrollment: 120,
    allowSelfEnrollment: false,
    certificateEnabled: true,
    discussionForumEnabled: true,
    gradingPolicy: '',
    visibility: 'private',
    startDate: '',
    endDate: '',
    department: UNASSIGNED_DEPARTMENT,
    instructorId: '',
  }
}

export function computeCourseProgress(input: Pick<
  CourseCreateInput | CourseRecord,
  | 'title'
  | 'code'
  | 'description'
  | 'modules'
  | 'videos'
  | 'resources'
  | 'learningOutcomes'
  | 'thumbnailUrl'
  | 'syllabusUrl'
>): number {
  let score = 0
  if (input.title.trim()) score += 15
  if (input.code.trim()) score += 10
  if (input.description?.trim()) score += 10
  if (input.learningOutcomes?.trim()) score += 10
  if (input.thumbnailUrl?.trim()) score += 5
  if (input.syllabusUrl?.trim()) score += 5
  if ((input.modules?.length ?? 0) > 0) score += 20
  if ((input.videos?.length ?? 0) > 0) score += 15
  if ((input.resources?.length ?? 0) > 0) score += 10
  const lessonCount = (input.modules ?? []).reduce((sum, m) => sum + m.lessons.length, 0)
  if (lessonCount > 0) score += Math.min(15, lessonCount * 3)
  return Math.min(100, score)
}

export function createEmptyModule() {
  return {
    id: createId('mod'),
    title: '',
    description: '',
    lessons: [],
  }
}

export function createEmptyLesson() {
  return {
    id: createId('les'),
    title: '',
    type: 'video' as CourseLessonType,
    durationMinutes: 15,
    description: '',
  }
}

export function createEmptyVideo() {
  return {
    id: createId('vid'),
    title: '',
    url: '',
    durationMinutes: 10,
    moduleId: '',
    description: '',
  }
}

export function createEmptyResource() {
  return {
    id: createId('res'),
    title: '',
    type: 'document' as CourseResourceType,
    url: '',
    fileName: '',
    description: '',
  }
}

export function courseRecordToFormInput(course: CourseRecord): CourseCreateInput {
  return {
    title: course.title,
    code: course.code,
    level: course.level,
    status: course.status,
    shortDescription: course.shortDescription ?? '',
    description: course.description ?? '',
    credits: course.credits ?? 3,
    durationWeeks: course.durationWeeks ?? 12,
    deliveryMode: course.deliveryMode ?? 'Instructor-led',
    language: course.language ?? 'English',
    prerequisites: course.prerequisites ?? '',
    learningOutcomes: course.learningOutcomes ?? '',
    tags: course.tags ?? [],
    modules: course.modules ?? [],
    videos: course.videos ?? [],
    resources: course.resources ?? [],
    thumbnailUrl: course.thumbnailUrl ?? '',
    syllabusUrl: course.syllabusUrl ?? '',
    maxEnrollment: course.maxEnrollment ?? 120,
    allowSelfEnrollment: course.allowSelfEnrollment ?? false,
    certificateEnabled: course.certificateEnabled ?? true,
    discussionForumEnabled: course.discussionForumEnabled ?? true,
    gradingPolicy: course.gradingPolicy ?? '',
    visibility: course.visibility ?? 'private',
    startDate: course.startDate ?? '',
    endDate: course.endDate ?? '',
    department: course.department,
    instructorId: course.instructorId ?? '',
  }
}

export function courseInputToRecordFields(
  input: CourseCreateInput,
): Omit<CourseRecord, 'id' | 'instructor' | 'department' | 'icon' | 'enrolledCount'> {
  const modules = input.modules ?? []
  return {
    title: input.title.trim(),
    code: input.code.trim().toUpperCase(),
    level: input.level,
    status: input.status ?? 'draft',
    moduleCount: modules.length,
    progressPercent: computeCourseProgress(input),
    shortDescription: input.shortDescription?.trim() || undefined,
    description: input.description?.trim() || undefined,
    credits: input.credits,
    durationWeeks: input.durationWeeks,
    deliveryMode: input.deliveryMode,
    language: input.language,
    prerequisites: input.prerequisites?.trim() || undefined,
    learningOutcomes: input.learningOutcomes?.trim() || undefined,
    tags: input.tags ?? [],
    modules,
    videos: input.videos ?? [],
    resources: input.resources ?? [],
    thumbnailUrl: input.thumbnailUrl?.trim() || undefined,
    syllabusUrl: input.syllabusUrl?.trim() || undefined,
    maxEnrollment: input.maxEnrollment,
    allowSelfEnrollment: input.allowSelfEnrollment,
    certificateEnabled: input.certificateEnabled,
    discussionForumEnabled: input.discussionForumEnabled,
    gradingPolicy: input.gradingPolicy?.trim() || undefined,
    visibility: input.visibility,
    startDate: input.startDate || undefined,
    endDate: input.endDate || undefined,
  }
}

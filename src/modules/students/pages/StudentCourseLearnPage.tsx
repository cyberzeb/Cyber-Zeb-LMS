import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  ClipboardList,
  MonitorPlay,
  PlayCircle,
  Video,
} from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { STORAGE_EVENTS } from '../../../shared/storage/keys'
import { readCourses, readEnrollments, readPersonById } from '../../../shared/storage/readers'
import { readPortalSession } from '../../../shared/storage/session'
import type { CourseLesson, CourseRecord } from '../../institution/types'
import { LessonQuestions } from '../components/LessonQuestions'
import {
  findLesson,
  findNextLessonAfter,
  findPrevLessonBefore,
  getCompletedLessonIds,
  getEnrollmentProgressPercent,
  getFirstLessonId,
  isLessonComplete,
  markLessonComplete,
} from '../utils/studentLearningProgress'

const lessonTypeIcon = {
  reading: BookOpen,
  video: Video,
  quiz: ClipboardList,
  assignment: ClipboardList,
  'live-session': MonitorPlay,
} as const

function lessonVideoForLesson(course: CourseRecord, moduleId: string, lessonTitle: string) {
  const moduleVideos = (course.videos ?? []).filter((v) => v.moduleId === moduleId)
  if (moduleVideos.length === 0) return undefined

  const normalizedTitle = lessonTitle.toLowerCase()
  const byTitle = moduleVideos.find(
    (v) =>
      v.title.toLowerCase() === normalizedTitle ||
      normalizedTitle.includes(v.title.toLowerCase()) ||
      v.title.toLowerCase().includes(normalizedTitle),
  )
  return byTitle ?? moduleVideos[0]
}

function renderLessonBody(
  course: CourseRecord,
  lesson: CourseLesson,
  moduleId: string,
  studentId: string,
  courseId: string,
) {
  if (lesson.type === 'video') {
    const video = lessonVideoForLesson(course, moduleId, lesson.title)
    if (video?.url && video.url.includes('embed')) {
      return (
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-navy-900/5 border border-divider">
          <iframe
            title={video.title}
            src={video.url}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }
    return (
      <GlassCard className="p-8 text-center">
        <PlayCircle size={40} className="mx-auto text-navy-300 mb-3" />
        <p className="text-[14px] font-semibold text-navy-900">Video lesson</p>
        <p className="text-[12.5px] text-secondary-text mt-2 max-w-md mx-auto">
          {lesson.description ?? 'Watch the lecture recording for this topic.'}
        </p>
      </GlassCard>
    )
  }

  if (lesson.type === 'quiz' || lesson.type === 'assignment') {
    return (
      <div className="flex flex-col gap-4">
        {lesson.description ? (
          <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-navy-800">
            {lesson.description}
          </div>
        ) : null}
        {lesson.questions && lesson.questions.length > 0 ? (
          <LessonQuestions
            studentId={studentId}
            courseId={courseId}
            lessonId={lesson.id}
            questions={lesson.questions}
          />
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-navy-800">
        {lesson.description ?? 'No content provided for this lesson yet.'}
      </div>
      {lesson.questions && lesson.questions.length > 0 ? (
        <LessonQuestions
          studentId={studentId}
          courseId={courseId}
          lessonId={lesson.id}
          questions={lesson.questions}
        />
      ) : null}
    </div>
  )
}

interface LessonFooterProps {
  lessonComplete: boolean
  hasNext: boolean
  hasPrev: boolean
  onMarkCompleteAndNext: () => void
  onNext: () => void
  onPrev: () => void
  onBackToCourses: () => void
  courseComplete: boolean
}

function LessonFooter({
  lessonComplete,
  hasNext,
  hasPrev,
  onMarkCompleteAndNext,
  onNext,
  onPrev,
  onBackToCourses,
  courseComplete,
}: LessonFooterProps) {
  return (
    <div className="mt-8 pt-6 border-t border-divider">
      {lessonComplete ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5 rounded-xl bg-success-bg border border-success/20 px-4 py-3">
            <CheckCircle2 size={20} className="text-success shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-navy-900">Lesson completed</p>
              <p className="text-[12px] text-secondary-text">
                {courseComplete
                  ? 'You finished all lessons in this course.'
                  : 'Great work — continue to the next lesson when you are ready.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {hasPrev ? (
              <Button variant="secondary" size="sm" onClick={onPrev}>
                <ArrowLeft size={14} className="inline mr-1.5" />
                Previous lesson
              </Button>
            ) : null}
            {hasNext ? (
              <Button size="sm" onClick={onNext}>
                Next lesson
                <ArrowRight size={14} className="inline ml-1.5" />
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={onBackToCourses}>
                Back to courses
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl bg-navy-50/80 border border-divider px-4 py-4">
          <div>
            <p className="text-[13px] font-semibold text-navy-900">Finished this lesson?</p>
            <p className="text-[12px] text-secondary-text mt-0.5">
              Complete &amp; continue saves your progress. Use Next to move on without marking complete.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            {hasPrev ? (
              <Button variant="ghost" size="sm" onClick={onPrev}>
                Previous
              </Button>
            ) : null}
            {hasNext ? (
              <>
                <Button variant="secondary" size="sm" onClick={onNext}>
                  Next
                  <ArrowRight size={14} className="inline ml-1.5" />
                </Button>
                <Button size="sm" onClick={onMarkCompleteAndNext}>
                  Complete &amp; continue
                  <ArrowRight size={14} className="inline ml-1.5" />
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={onMarkCompleteAndNext}>
                Mark as completed
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function StudentCourseLearnPage() {
  const { courseId, lessonId: lessonIdParam } = useParams<{ courseId: string; lessonId?: string }>()
  const navigate = useNavigate()
  const { notify } = useToast()

  const personId = readPortalSession()?.personId ?? null
  const person = personId ? readPersonById(personId) : null

  const contentRef = useRef<HTMLDivElement>(null)
  const activeLessonRef = useRef<HTMLButtonElement>(null)
  const [progressTick, setProgressTick] = useState(0)

  const course = useMemo(() => {
    if (!courseId) return undefined
    return readCourses().find((c) => c.id === courseId)
  }, [courseId])

  const enrollment = useMemo(() => {
    if (!personId || !courseId) return undefined
    return readEnrollments().find(
      (e) => e.studentId === personId && e.courseId === courseId && e.status === 'active',
    )
  }, [personId, courseId])

  const completedIds = useMemo(() => {
    if (!personId || !courseId) return []
    return getCompletedLessonIds(personId, courseId)
  }, [personId, courseId, progressTick])

  useEffect(() => {
    const onProgress = () => setProgressTick((t) => t + 1)
    window.addEventListener(STORAGE_EVENTS.lessonProgressUpdated, onProgress)
    window.addEventListener(STORAGE_EVENTS.enrollmentsUpdated, onProgress)
    return () => {
      window.removeEventListener(STORAGE_EVENTS.lessonProgressUpdated, onProgress)
      window.removeEventListener(STORAGE_EVENTS.enrollmentsUpdated, onProgress)
    }
  }, [])

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'auto' })
    const frame = window.requestAnimationFrame(() => {
      activeLessonRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [lessonIdParam])

  const goToLesson = useCallback(
    (id: string) => {
      if (!course) return
      navigate(`/student/courses/${course.id}/learn/${id}`)
    },
    [course, navigate],
  )

  const goToCoursesList = useCallback(() => {
    navigate('/student/courses', { replace: true })
  }, [navigate])

  if (!person || !personId) {
    return (
      <GlassCard className="p-10 text-center">
        <p className="text-[14px] font-semibold text-navy-900">Select a student account to continue.</p>
      </GlassCard>
    )
  }

  const studentId = personId

  if (!course || !enrollment) {
    return (
      <GlassCard className="p-10 text-center max-w-lg mx-auto">
        <BookOpen size={32} className="mx-auto text-navy-300 mb-3" />
        <p className="text-[14px] font-semibold text-navy-900">Course not available</p>
        <p className="text-[12.5px] text-secondary-text mt-2">
          You must be enrolled in this course before you can access learning content.
        </p>
        <Button className="mt-5" variant="secondary" onClick={goToCoursesList}>
          Back to My Courses
        </Button>
      </GlassCard>
    )
  }

  const lessonIds = (course.modules ?? []).flatMap((m) => m.lessons.map((l) => l.id))
  const firstLessonId = getFirstLessonId(course)

  if (lessonIds.length === 0) {
    return (
      <GlassCard className="p-10 text-center max-w-lg mx-auto">
        <BookOpen size={32} className="mx-auto text-navy-300 mb-3" />
        <p className="text-[14px] font-semibold text-navy-900">No lessons yet</p>
        <p className="text-[12.5px] text-secondary-text mt-2">
          This course does not have learning content yet. Ask your instructor or admin to add modules.
        </p>
        <Button className="mt-5" variant="secondary" onClick={goToCoursesList}>
          Back to My Courses
        </Button>
      </GlassCard>
    )
  }

  if (!lessonIdParam && firstLessonId) {
    return <Navigate to={`/student/courses/${course.id}/learn/${firstLessonId}`} replace />
  }

  if (lessonIdParam && !findLesson(course, lessonIdParam) && firstLessonId) {
    return <Navigate to={`/student/courses/${course.id}/learn/${firstLessonId}`} replace />
  }

  const resolvedLessonId = lessonIdParam ?? firstLessonId ?? lessonIds[0]
  const progress = getEnrollmentProgressPercent(studentId, course)
  const activeLesson = findLesson(course, resolvedLessonId)
  const lessonComplete = isLessonComplete(studentId, course.id, resolvedLessonId)
  const nextLessonId = findNextLessonAfter(course, resolvedLessonId)
  const prevLessonId = findPrevLessonBefore(course, resolvedLessonId)

  const handleMarkComplete = (andContinue: boolean) => {
    if (!activeLesson) return

    const wasComplete = lessonComplete
    markLessonComplete(studentId, course, resolvedLessonId)

    if (!wasComplete) {
      notify('Lesson marked as completed.', 'success')
    }

    if (andContinue && nextLessonId) {
      goToLesson(nextLessonId)
    } else if (andContinue && !nextLessonId) {
      notify('Course completed — well done!', 'success')
    } else {
      setProgressTick((t) => t + 1)
    }
  }

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={goToCoursesList}>
          <ArrowLeft size={14} className="inline mr-1.5" />
          My Courses
        </Button>
        {progress >= 100 ? (
          <StatusPill label="Completed" tone="success" />
        ) : (
          <StatusPill label={`${progress}% complete`} tone="info" />
        )}
      </div>

      <PageHeader
        title={course.title}
        subtitle={`${course.code} · ${course.instructor} · ${(course.modules ?? []).length} modules`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">
        <GlassCard className="p-0 overflow-hidden lg:sticky lg:top-4">
          <div className="px-4 py-3 border-b border-divider bg-navy-50/50">
            <p className="text-[11px] font-bold uppercase tracking-wider text-secondary-text">
              Course content
            </p>
          </div>
          <div className="max-h-[60vh] overflow-y-auto app-scroll p-2">
            {(course.modules ?? []).map((mod, modIndex) => (
              <div key={mod.id} className="mb-3 last:mb-0">
                <p className="px-2 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-navy-600">
                  Module {modIndex + 1}: {mod.title}
                </p>
                <ul className="flex flex-col gap-1">
                  {mod.lessons.map((lesson) => {
                    const Icon = lessonTypeIcon[lesson.type]
                    const done = completedIds.includes(lesson.id)
                    const active = lesson.id === resolvedLessonId
                    return (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          ref={active ? activeLessonRef : undefined}
                          onClick={() => goToLesson(lesson.id)}
                          aria-current={active ? 'true' : undefined}
                          className={`relative w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                            active
                              ? 'bg-gradient-to-r from-lemon-100 to-lemon-50 border-2 border-lemon-500 shadow-md shadow-lemon-500/15 ring-2 ring-lemon-500/25 scale-[1.02] z-[1]'
                              : 'bg-transparent border-2 border-transparent hover:bg-navy-50/90 opacity-80 hover:opacity-100'
                          }`}
                        >
                          {active ? (
                            <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-lemon-500" aria-hidden />
                          ) : null}
                          {done ? (
                            <CheckCircle2
                              size={16}
                              className={`shrink-0 mt-0.5 ${active ? 'text-success' : 'text-success/80'}`}
                            />
                          ) : active ? (
                            <span className="flex h-4 w-4 shrink-0 mt-0.5 items-center justify-center rounded-full bg-lemon-500">
                              <span className="h-1.5 w-1.5 rounded-full bg-navy-900 animate-pulse" />
                            </span>
                          ) : (
                            <Circle size={16} className="text-navy-300 shrink-0 mt-0.5" />
                          )}
                          <span className="min-w-0 flex-1 pl-0.5">
                            {active ? (
                              <span className="inline-block mb-1 rounded-full bg-lemon-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-navy-900">
                                Current lesson
                              </span>
                            ) : null}
                            <span
                              className={`flex items-center gap-1.5 leading-snug ${
                                active
                                  ? 'text-[13px] font-extrabold text-navy-900'
                                  : 'text-[12.5px] font-medium text-navy-700'
                              }`}
                            >
                              <Icon
                                size={13}
                                className={`shrink-0 ${active ? 'text-lemon-700' : 'text-navy-400'}`}
                              />
                              {lesson.title}
                            </span>
                            <span
                              className={`text-[10.5px] mt-0.5 block ${
                                active ? 'font-semibold text-navy-700' : 'text-secondary-text'
                              }`}
                            >
                              {lesson.durationMinutes} min · {lesson.type}
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-0 min-h-[420px] flex flex-col overflow-hidden">
          {activeLesson ? (
            <>
              <div className="px-5 md:px-6 pt-5 md:pt-6 pb-3 border-b border-divider">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text mb-1">
                  {activeLesson.module.title}
                </p>
                <h2 className="text-[18px] font-extrabold text-navy-900">{activeLesson.lesson.title}</h2>
                <p className="text-[12px] text-secondary-text mt-1">
                  {activeLesson.lesson.durationMinutes} minutes · {activeLesson.lesson.type}
                </p>
              </div>

              <div ref={contentRef} className="flex-1 overflow-y-auto app-scroll px-5 md:px-6 py-5">
                {renderLessonBody(
                  course,
                  activeLesson.lesson,
                  activeLesson.module.id,
                  studentId,
                  course.id,
                )}

                <LessonFooter
                  lessonComplete={lessonComplete}
                  hasNext={Boolean(nextLessonId)}
                  hasPrev={Boolean(prevLessonId)}
                  courseComplete={progress >= 100 || (!nextLessonId && lessonComplete)}
                  onMarkCompleteAndNext={() => handleMarkComplete(true)}
                  onNext={() => nextLessonId && goToLesson(nextLessonId)}
                  onPrev={() => prevLessonId && goToLesson(prevLessonId)}
                  onBackToCourses={goToCoursesList}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <BookOpen size={36} className="text-navy-300 mb-3" />
              <p className="text-[14px] font-semibold text-navy-900">Loading lesson…</p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}

export default StudentCourseLearnPage

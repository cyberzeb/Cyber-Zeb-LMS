import {
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  Lock,
  MapPin,
  MessageSquareText,
  MonitorPlay,
  PlayCircle,
  UploadCloud,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../shared/components/Button'
import { Monogram } from '../../../shared/components/Monogram'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import type { AssignmentItem, GradeItem, QuizItem, ScheduleItem } from '../types'

interface AssessmentCardsProps {
  quizzes: QuizItem[]
  assignments: AssignmentItem[]
  schedule: ScheduleItem[]
  grades: GradeItem[]
}

const quizStatusTone: Record<string, 'info' | 'neutral' | 'success' | 'warning'> = {
  Open: 'info',
  Locked: 'neutral',
  Completed: 'success',
}

const quizAccent: Record<string, string> = {
  Open: 'border-l-lemon-500 bg-gradient-to-r from-lemon-50/80 to-card-end',
  Locked: 'border-l-navy-300 bg-gradient-to-r from-navy-50/50 to-card-end opacity-90',
  Completed: 'border-l-success bg-gradient-to-r from-success-bg/80 to-card-end',
}

const assignmentStatusTone: Record<string, 'info' | 'neutral' | 'success' | 'warning'> = {
  'Ready to submit': 'success',
  Submitted: 'info',
  Graded: 'success',
}

const assignmentAccent: Record<string, string> = {
  'Ready to submit': 'border-l-lemon-500 from-lemon-50/70',
  Submitted: 'border-l-info from-info-bg/60',
  Graded: 'border-l-success from-success-bg/60',
}

export function QuizAndAssessmentCard({
  quizzes,
  onStartQuiz,
}: Pick<AssessmentCardsProps, 'quizzes'> & {
  onStartQuiz?: (quizId: string) => void
}) {
  if (quizzes.length === 0) {
    return (
      <GlassCard className="p-10 text-center">
        <PlayCircle size={32} className="mx-auto text-navy-300 mb-3" />
        <p className="text-[14px] font-semibold text-navy-900">No quizzes in this view</p>
        <p className="text-[12.5px] text-secondary-text mt-1">Try another filter or check back later.</p>
      </GlassCard>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {quizzes.map((quiz) => {
        const isLocked = quiz.status === 'Locked'
        const isOpen = quiz.status === 'Open'
        const isCompleted = quiz.status === 'Completed'

        return (
          <GlassCard
            key={quiz.id}
            className={`p-0 overflow-hidden border-l-4 hover:shadow-md transition-shadow ${quizAccent[quiz.status] ?? 'border-l-navy-200'}`}
          >
            <div className="p-5 flex flex-col h-full">
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <Monogram label={quiz.title} size="md" />
                  {isLocked ? (
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-navy-800 text-white flex items-center justify-center">
                      <Lock size={10} />
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill label={quiz.status} tone={quizStatusTone[quiz.status] ?? 'neutral'} />
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text">
                      {quiz.course}
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-[15px] font-bold text-navy-900 leading-snug">{quiz.title}</h3>
                </div>

                {isCompleted && quiz.score ? (
                  <div className="shrink-0 w-14 h-14 rounded-full bg-success-bg border-2 border-success/30 flex flex-col items-center justify-center">
                    <span className="text-[15px] font-extrabold text-success leading-none">{quiz.score}</span>
                    <span className="text-[8px] font-semibold uppercase text-success/80 mt-0.5">Score</span>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                <div className="rounded-lg soft-surface px-2.5 py-2 text-center">
                  <CalendarDays size={12} className="mx-auto text-navy-400 mb-1" />
                  <span className="font-semibold text-navy-800 block truncate">{quiz.dueAt.replace('Due ', '')}</span>
                  <span className="text-secondary-text">Due</span>
                </div>
                <div className="rounded-lg soft-surface px-2.5 py-2 text-center">
                  <Clock3 size={12} className="mx-auto text-navy-400 mb-1" />
                  <span className="font-semibold text-navy-800 block">{quiz.duration}</span>
                  <span className="text-secondary-text">Time</span>
                </div>
                <div className="rounded-lg soft-surface px-2.5 py-2 text-center">
                  <BadgeCheck size={12} className="mx-auto text-navy-400 mb-1" />
                  <span className="font-semibold text-navy-800 block">{quiz.questions}</span>
                  <span className="text-secondary-text">Items</span>
                </div>
              </div>

              <div className="mt-auto pt-4">
                <Button
                  type="button"
                  variant={isOpen ? 'primary' : 'secondary'}
                  size="sm"
                  className="w-full"
                  disabled={isLocked}
                  onClick={() => {
                    if (isOpen || isCompleted) onStartQuiz?.(quiz.id)
                  }}
                >
                  {isOpen ? (
                    <>
                      <PlayCircle size={14} />
                      Start quiz
                    </>
                  ) : isCompleted ? (
                    <>
                      Review attempt
                      <ChevronRight size={13} />
                    </>
                  ) : (
                    <>
                      <Lock size={13} />
                      Locked
                    </>
                  )}
                </Button>
              </div>
            </div>
          </GlassCard>
        )
      })}
    </div>
  )
}

export function AssignmentDropboxCard({
  assignments,
  onSubmitAssignment,
}: Pick<AssessmentCardsProps, 'assignments'> & {
  onSubmitAssignment?: (assignmentId: string, fileName: string) => void
}) {
  const [uploads, setUploads] = useState<Record<string, string>>({})

  if (assignments.length === 0) {
    return (
      <GlassCard className="p-10 text-center">
        <FileText size={32} className="mx-auto text-navy-300 mb-3" />
        <p className="text-[14px] font-semibold text-navy-900">No assignments in this view</p>
        <p className="text-[12.5px] text-secondary-text mt-1">Try another filter or check back later.</p>
      </GlassCard>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {assignments.map((assignment) => {
        const selectedFile = uploads[assignment.id]
        const isReady = assignment.status === 'Ready to submit'
        const isGraded = assignment.status === 'Graded'
        const gradient = assignmentAccent[assignment.status] ?? 'from-navy-50/50'

        return (
          <GlassCard
            key={assignment.id}
            className={`p-0 overflow-hidden border-l-4 hover:shadow-md transition-shadow bg-gradient-to-r ${gradient} to-card-end`}
          >
            <div className="p-5 md:p-6">
              <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill label={assignment.status} tone={assignmentStatusTone[assignment.status] ?? 'neutral'} />
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text">
                      {assignment.course}
                    </span>
                  </div>

                  <h3 className="mt-2 text-[17px] font-bold text-navy-900 leading-snug">{assignment.title}</h3>

                  <p className="mt-2 text-[12.5px] leading-relaxed text-secondary-text">{assignment.brief}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full soft-surface px-3 py-1 text-[11px] font-semibold text-navy-700">
                      <Clock3 size={11} />
                      {assignment.dueAt}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 text-white px-3 py-1 text-[11px] font-semibold">
                      {assignment.acceptedFormats.join(' · ')}
                    </span>
                  </div>

                  {assignment.feedback ? (
                    <div className="mt-3 flex items-start gap-2 rounded-xl bg-info-bg/80 border border-info/20 px-4 py-3">
                      <MessageSquareText size={14} className="text-info shrink-0 mt-0.5" />
                      <p className="text-[12px] leading-relaxed text-navy-800">{assignment.feedback}</p>
                    </div>
                  ) : null}
                </div>

                <div className="w-full lg:w-[280px] shrink-0 rounded-xl border border-dashed border-navy-200 soft-surface p-4 flex flex-col gap-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-secondary-text">
                    Secure upload
                  </div>

                  <label
                    className={`flex flex-col items-center justify-center gap-2 rounded-lg px-4 py-6 text-center cursor-pointer transition upload-dropzone ${
                      isReady ? 'upload-dropzone-active hover:border-lemon-500' : 'upload-dropzone-idle hover:border-navy-300'
                    }`}
                  >
                    <UploadCloud size={22} className={isReady ? 'text-lemon-700' : 'text-navy-400'} />
                    <span className="text-[12px] font-semibold text-navy-800">
                      {selectedFile ?? 'Drop file or click to browse'}
                    </span>
                    <span className="text-[10.5px] text-secondary-text">Max 25 MB per file</span>
                    <input
                      type="file"
                      className="hidden"
                      disabled={!isReady}
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) {
                          setUploads((current) => ({ ...current, [assignment.id]: file.name }))
                        }
                      }}
                    />
                  </label>

                  <Button
                    type="button"
                    variant={selectedFile && isReady ? 'primary' : 'secondary'}
                    size="sm"
                    className="w-full"
                    disabled={isGraded && !selectedFile}
                    onClick={() => {
                      if (selectedFile && isReady) {
                        onSubmitAssignment?.(assignment.id, selectedFile)
                        setUploads((current) => {
                          const next = { ...current }
                          delete next[assignment.id]
                          return next
                        })
                        return
                      }
                      if (isGraded) return
                    }}
                  >
                    {isGraded
                      ? 'Graded'
                      : assignment.status === 'Submitted'
                        ? 'Submitted'
                        : selectedFile
                          ? 'Submit to dropbox'
                          : isReady
                            ? 'Choose file first'
                            : 'View submission'}
                    <ChevronRight size={13} />
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>
        )
      })}
    </div>
  )
}

export function ScheduleCalendarCard({ schedule }: Pick<AssessmentCardsProps, 'schedule'>) {
  const typeIcon: Record<string, typeof CalendarDays> = {
    'Live class': MonitorPlay,
    Exam: FileText,
    'Office hour': UserRound,
    Deadline: Clock3,
  }

  const typeTone: Record<string, string> = {
    'Live class': 'border-l-lemon-500 from-lemon-50/70',
    Exam: 'border-l-danger from-danger-bg/50',
    'Office hour': 'border-l-navy-500 from-navy-50',
    Deadline: 'border-l-info from-info-bg/50',
  }

  if (schedule.length === 0) {
    return (
      <GlassCard className="p-10 text-center">
        <CalendarDays size={32} className="mx-auto text-navy-300 mb-3" />
        <p className="text-[14px] font-semibold text-navy-900">Nothing scheduled</p>
        <p className="text-[12.5px] text-secondary-text mt-1">Try another filter or check back later.</p>
      </GlassCard>
    )
  }

  return (
    <div className="relative flex flex-col gap-0">
      <div className="absolute left-[23px] top-4 bottom-4 w-px bg-divider hidden md:block" aria-hidden />

      <div className="flex flex-col gap-4">
        {schedule.map((item, index) => {
          const Icon = typeIcon[item.type] ?? CalendarDays
          const accent = typeTone[item.type] ?? 'border-l-navy-300 from-navy-50/50'

          return (
            <GlassCard
              key={item.id}
              className={`schedule-card p-0 overflow-hidden border-l-4 bg-gradient-to-r ${accent} schedule-card-end md:ml-2`}
            >
              <div className="p-5 flex gap-4">
                <div className="relative shrink-0 hidden md:flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white z-10 ${item.accent}`}
                  >
                    <Icon size={18} />
                  </div>
                  {index < schedule.length - 1 ? (
                    <span className="text-[10px] font-bold text-secondary-text mt-2 uppercase tracking-wider">
                      {item.startAt.split(' ')[0]}
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill label={item.type} tone="neutral" />
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text">
                      {item.course}
                    </span>
                  </div>

                  <h3 className="mt-1.5 text-[16px] font-bold text-navy-900 leading-snug">{item.title}</h3>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="schedule-meta-chip">
                      <CalendarDays size={12} className="text-navy-500" />
                      {item.startAt}
                    </span>
                    <span className="schedule-meta-chip">
                      <MapPin size={12} className="text-navy-500" />
                      {item.location}
                    </span>
                  </div>
                </div>

                <Button type="button" variant="secondary" size="sm" className="shrink-0 self-start hidden sm:inline-flex">
                  Details
                  <ChevronRight size={13} />
                </Button>
              </div>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}

export function GradesFeedbackCard({ grades }: Pick<AssessmentCardsProps, 'grades'>) {
  const gradeRingColor = (letter: string) => {
    if (letter.startsWith('A')) return 'border-success bg-success-bg text-success'
    if (letter.startsWith('B')) return 'border-info bg-info-bg text-info'
    return 'border-warning bg-warning-bg text-warning'
  }

  if (grades.length === 0) {
    return (
      <GlassCard className="p-10 text-center">
        <BadgeCheck size={32} className="mx-auto text-navy-300 mb-3" />
        <p className="text-[14px] font-semibold text-navy-900">No grades yet</p>
        <p className="text-[12.5px] text-secondary-text mt-1">Grades will appear here once instructors post them.</p>
      </GlassCard>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {grades.map((grade) => (
        <GlassCard key={grade.id} className="p-0 overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div
                className={`shrink-0 w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center ${gradeRingColor(grade.grade)}`}
              >
                <span className="text-[18px] font-extrabold leading-none">{grade.grade}</span>
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-bold text-navy-900 leading-snug line-clamp-2">{grade.course}</h3>
                <p className="mt-1 text-[12px] text-secondary-text">
                  {grade.instructor} · {grade.updatedAt}
                </p>

                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <div className="text-[26px] font-bold text-navy-900 leading-none">{grade.percent}%</div>
                    <div className="text-[10.5px] font-semibold uppercase tracking-wide text-secondary-text mt-1">
                      Course score
                    </div>
                  </div>
                  <StatusPill
                    label={grade.percent >= 90 ? 'Excellent' : grade.percent >= 80 ? 'Strong' : 'On track'}
                    tone={grade.percent >= 90 ? 'success' : grade.percent >= 80 ? 'info' : 'warning'}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10.5px] font-semibold uppercase tracking-wide text-secondary-text">
                  Progress
                </span>
                <span className="text-[11px] font-bold text-navy-900">{grade.progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-navy-50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-lemon-500 to-lemon-700"
                  style={{ width: `${grade.progress}%` }}
                />
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-xl nested-panel px-4 py-3">
              <MessageSquareText size={14} className="text-navy-500 shrink-0 mt-0.5" />
              <p className="text-[12px] leading-relaxed text-navy-800">{grade.feedback}</p>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  )
}

export function AssessmentCards({ quizzes, assignments, schedule, grades }: AssessmentCardsProps) {
  return (
    <div className="grid gap-6 md:gap-8">
      <QuizAndAssessmentCard quizzes={quizzes} />
      <AssignmentDropboxCard assignments={assignments} />
      <ScheduleCalendarCard schedule={schedule} />
      <GradesFeedbackCard grades={grades} />
    </div>
  )
}

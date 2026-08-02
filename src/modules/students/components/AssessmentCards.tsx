import { BadgeCheck, CalendarDays, ChevronRight, ClipboardList, FileUp, MessageSquareText, UploadCloud, Clock3, Video, GraduationCap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { LmsSectionCard } from './LmsSectionCard'
import type { AssignmentItem, GradeItem, QuizItem, ScheduleItem } from '../types'

interface AssessmentCardsProps {
  quizzes: QuizItem[]
  assignments: AssignmentItem[]
  schedule: ScheduleItem[]
  grades: GradeItem[]
}

const statusStyles: Record<string, string> = {
  Open: 'bg-info-bg text-info',
  Locked: 'bg-navy-50 text-navy-500',
  Completed: 'bg-lemon-50 text-lemon-900',
  'Ready to submit': 'bg-lemon-50 text-lemon-900',
  Submitted: 'bg-info-bg text-info',
  'Awaiting review': 'bg-warning-bg text-navy-700',
}

export function QuizAndAssessmentCard({ quizzes }: Pick<AssessmentCardsProps, 'quizzes'>) {
  return (
    <LmsSectionCard
      eyebrow="Quizzes and assessments"
      title="Assessment hub"
      description="Track open quizzes, locked assessments, and completed attempts from one place."
    >
      <div className="flex flex-col gap-3">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="rounded-2xl border border-divider/70 bg-white/80 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${statusStyles[quiz.status]}`}>
                  <ClipboardList size={12} />
                  {quiz.status}
                </div>
                <h3 className="mt-2 text-[14px] font-bold text-navy-900">{quiz.title}</h3>
                <p className="mt-1 text-[12px] text-secondary-text">{quiz.course}</p>
              </div>

              <button
                type="button"
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold ${quiz.status === 'Open' ? 'bg-navy-900 text-white' : 'bg-navy-50 text-navy-600'}`}
              >
                {quiz.status === 'Open' ? 'Start quiz' : 'View details'}
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 text-[11.5px] text-secondary-text sm:grid-cols-3">
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-navy-50 px-3 py-2">
                <CalendarDays size={12} />
                {quiz.dueAt}
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-navy-50 px-3 py-2">
                <Clock3 size={12} />
                {quiz.duration}
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-navy-50 px-3 py-2">
                <BadgeCheck size={12} />
                {quiz.questions} questions {quiz.score ? `· ${quiz.score}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </LmsSectionCard>
  )
}

export function AssignmentDropboxCard({ assignments }: Pick<AssessmentCardsProps, 'assignments'>) {
  const [uploads, setUploads] = useState<Record<string, string>>({})

  return (
    <LmsSectionCard
      eyebrow="Assignment dropboxes"
      title="Secure upload space"
      description="Upload completed homework, essays, and projects directly to instructors."
      className="h-full"
    >
      <div className="flex flex-col gap-3">
        {assignments.map((assignment) => {
          const selectedFile = uploads[assignment.id]

          return (
            <div key={assignment.id} className="rounded-2xl border border-divider/70 bg-white/80 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${statusStyles[assignment.status]}`}>
                    <FileUp size={12} />
                    {assignment.status}
                  </div>
                  <h3 className="mt-2 text-[14px] font-bold text-navy-900">{assignment.title}</h3>
                  <p className="mt-1 text-[12px] text-secondary-text">{assignment.course} · {assignment.dueAt}</p>
                </div>

                <div className="rounded-full bg-navy-50 px-3 py-1.5 text-[11px] font-semibold text-navy-700">
                  {assignment.acceptedFormats.join(' / ')}
                </div>
              </div>

              <p className="mt-3 text-[12.5px] leading-6 text-secondary-text">{assignment.brief}</p>

              {assignment.feedback && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-info-bg px-3 py-2 text-[11.5px] text-info">
                  <MessageSquareText size={12} />
                  {assignment.feedback}
                </div>
              )}

              <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-navy-200 bg-navy-50 px-4 py-2 text-[11.5px] font-semibold text-navy-700 transition hover:border-lemon-500 hover:bg-lemon-50">
                  <UploadCloud size={14} />
                  {selectedFile ?? 'Choose file to upload'}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]

                      if (file) {
                        setUploads((currentUploads) => ({
                          ...currentUploads,
                          [assignment.id]: file.name,
                        }))
                      }
                    }}
                  />
                </label>

                <button
                  type="button"
                  className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[11.5px] font-bold transition ${selectedFile ? 'bg-lemon-500 text-navy-900 hover:bg-lemon-200' : 'bg-navy-900 text-white'}`}
                >
                  {selectedFile ? 'Ready to submit' : 'Submit to dropbox'}
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </LmsSectionCard>
  )
}

export function ScheduleCalendarCard({ schedule }: Pick<AssessmentCardsProps, 'schedule'>) {
  return (
    <LmsSectionCard
      eyebrow="Schedules and calendars"
      title="Built-in planner"
      description="Stay ahead of due dates, exams, and virtual class meetings."
    >
      <div className="flex flex-col gap-3">
        {schedule.map((item) => (
          <div key={item.id} className="flex gap-3 rounded-2xl border border-divider/70 bg-white/80 p-4">
            <div className={`mt-1 h-3.5 w-3.5 rounded-full ${item.accent}`} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-[14px] font-bold text-navy-900">{item.title}</h3>
                  <p className="mt-1 text-[12px] text-secondary-text">{item.course}</p>
                </div>

                <div className="rounded-full bg-navy-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-navy-700">
                  {item.type}
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-[11.5px] text-secondary-text sm:grid-cols-2">
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-navy-50 px-3 py-2">
                  <CalendarDays size={12} />
                  {item.startAt}
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-navy-50 px-3 py-2">
                  <Video size={12} />
                  {item.location}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </LmsSectionCard>
  )
}

export function GradesFeedbackCard({ grades }: Pick<AssessmentCardsProps, 'grades'>) {
  const average = useMemo(() => Math.round(grades.reduce((sum, item) => sum + item.percent, 0) / grades.length), [grades])

  return (
    <LmsSectionCard
      eyebrow="Grades and feedback"
      title="Personal gradebook"
      description="Monitor performance, instructor comments, and course progress in real time."
    >
      <div className="mb-4 flex items-center justify-between rounded-2xl bg-navy-50 px-4 py-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary-text">Average performance</div>
          <div className="mt-1 text-[24px] font-extrabold text-navy-900">{average}%</div>
        </div>
        <div className="rounded-full bg-lemon-500 px-3 py-1.5 text-[11px] font-bold text-navy-900">
          Good standing
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {grades.map((grade) => (
          <div key={grade.id} className="rounded-2xl border border-divider/70 bg-white/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-lemon-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-lemon-900">
                  <GraduationCap size={12} />
                  {grade.grade}
                </div>
                <h3 className="mt-2 text-[14px] font-bold text-navy-900">{grade.course}</h3>
                <p className="mt-1 text-[12px] text-secondary-text">{grade.instructor} · {grade.updatedAt}</p>
              </div>

              <div className="text-right">
                <div className="text-[22px] font-extrabold text-navy-900">{grade.percent}%</div>
                <div className="text-[11px] text-secondary-text">overall progress</div>
              </div>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-navy-50">
              <div className="h-full rounded-full bg-gradient-to-r from-lemon-500 to-lemon-700" style={{ width: `${grade.progress}%` }} />
            </div>

            <p className="mt-3 text-[12.5px] leading-6 text-secondary-text">{grade.feedback}</p>
          </div>
        ))}
      </div>
    </LmsSectionCard>
  )
}

export function AssessmentCards({ quizzes, assignments, schedule, grades }: AssessmentCardsProps) {
  return (
    <div className="grid gap-6">
      <QuizAndAssessmentCard quizzes={quizzes} />
      <AssignmentDropboxCard assignments={assignments} />
      <ScheduleCalendarCard schedule={schedule} />
      <GradesFeedbackCard grades={grades} />
    </div>
  )
}
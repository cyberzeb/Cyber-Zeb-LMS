import { useMemo, useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp, GraduationCap, Layers } from 'lucide-react'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import type { GradeComponent, GradeItem, SemesterGrades } from '../types'

interface StudentGradebookProps {
  gradeHistory: SemesterGrades[]
}

const categoryLabel: Record<GradeComponent['category'], string> = {
  assignment: 'Assignment',
  quiz: 'Quiz',
  midterm: 'Midterm',
  final: 'Final',
  participation: 'Participation',
  project: 'Project',
}

function gradeRingColor(letter: string) {
  if (letter.startsWith('A')) return 'border-success bg-success-bg text-success'
  if (letter.startsWith('B')) return 'border-info bg-info-bg text-info'
  return 'border-warning bg-warning-bg text-warning'
}

function CourseGradeCard({ grade, defaultExpanded }: { grade: GradeItem; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false)
  const weightedScore = grade.components.reduce(
    (sum, c) => sum + (c.score / c.maxScore) * c.weight,
    0,
  )

  return (
    <GlassCard className="p-0 overflow-hidden hover:shadow-md transition-shadow">
      <button
        type="button"
        className="w-full text-left p-5 flex items-start gap-4"
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          className={`shrink-0 w-14 h-14 rounded-full border-2 flex items-center justify-center ${gradeRingColor(grade.grade)}`}
        >
          <span className="text-[18px] font-extrabold leading-none">{grade.grade}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text">
              {grade.courseCode}
            </span>
            <span className="text-[11px] text-secondary-text">{grade.credits} credits</span>
          </div>
          <h3 className="mt-1 text-[15px] font-bold text-navy-900 leading-snug">{grade.course}</h3>
          <p className="mt-1 text-[12px] text-secondary-text">
            {grade.instructor} · {grade.updatedAt}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-[22px] font-bold text-navy-900">{grade.percent}%</span>
            <StatusPill
              label={grade.percent >= 90 ? 'Excellent' : grade.percent >= 80 ? 'Strong' : 'On track'}
              tone={grade.percent >= 90 ? 'success' : grade.percent >= 80 ? 'info' : 'warning'}
            />
          </div>
        </div>

        <span className="shrink-0 text-secondary-text mt-1">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {expanded ? (
        <div className="px-5 pb-5 border-t border-divider pt-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-secondary-text mb-3">
            Grade breakdown
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-[12px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-secondary-text border-b border-divider">
                  <th className="py-2 pr-3 font-semibold">Component</th>
                  <th className="py-2 px-2 font-semibold">Type</th>
                  <th className="py-2 px-2 font-semibold text-right">Weight</th>
                  <th className="py-2 px-2 font-semibold text-right">Score</th>
                  <th className="py-2 pl-2 font-semibold text-right">Graded</th>
                </tr>
              </thead>
              <tbody>
                {grade.components.map((component) => (
                  <tr key={component.id} className="border-b border-divider last:border-0">
                    <td className="py-2.5 pr-3 font-semibold text-navy-900">{component.label}</td>
                    <td className="py-2.5 px-2 text-secondary-text">{categoryLabel[component.category]}</td>
                    <td className="py-2.5 px-2 text-right text-navy-800">{component.weight}%</td>
                    <td className="py-2.5 px-2 text-right font-bold text-navy-900">
                      {component.score}/{component.maxScore}
                    </td>
                    <td className="py-2.5 pl-2 text-right text-secondary-text">{component.gradedAt ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="text-[11px] font-semibold text-navy-800">
                  <td className="pt-3 pr-3" colSpan={2}>
                    Weighted total
                  </td>
                  <td className="pt-3 px-2 text-right">100%</td>
                  <td className="pt-3 px-2 text-right">{Math.round(weightedScore)}%</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-4 rounded-xl bg-navy-50/80 border border-divider px-4 py-3 text-[12px] leading-relaxed text-navy-800">
            <span className="font-semibold text-navy-900">Instructor feedback: </span>
            {grade.feedback}
          </div>
        </div>
      ) : null}
    </GlassCard>
  )
}

const TERM_SORT_ORDER = ['Fall 2026', 'Spring 2026', 'Fall 2025', 'Spring 2025']

export function StudentGradebook({ gradeHistory }: StudentGradebookProps) {
  const sorted = useMemo(
    () =>
      [...gradeHistory].sort(
        (a, b) => TERM_SORT_ORDER.indexOf(a.term) - TERM_SORT_ORDER.indexOf(b.term),
      ),
    [gradeHistory],
  )

  const [activeTerm, setActiveTerm] = useState(() => sorted[0]?.term ?? '')

  const semester = sorted.find((s) => s.term === activeTerm) ?? sorted[0]
  const tabLabels = sorted.map((s) => s.term)

  if (!semester) {
    return (
      <GlassCard className="p-10 text-center">
        <GraduationCap size={32} className="mx-auto text-navy-300 mb-3" />
        <p className="text-[14px] font-semibold text-navy-900">No grade records yet</p>
      </GlassCard>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <FilterTabs tabs={tabLabels} active={activeTerm} onChange={setActiveTerm} />
        <p className="text-[12px] text-secondary-text">
          {semester.status === 'current' ? 'Current semester — grades update as assessments are graded.' : 'Completed semester transcript.'}
        </p>
      </div>

      <GlassCard
        className={`p-0 overflow-hidden ${
          semester.status === 'current' ? 'border-lemon-500/40' : 'border-success/30'
        }`}
      >
        <div
          className={`p-5 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r ${
            semester.status === 'current'
              ? 'from-lemon-50/80 via-white to-white'
              : 'from-success-bg/40 via-white to-white'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                semester.status === 'current' ? 'bg-lemon-500 text-navy-900' : 'bg-success text-white'
              }`}
            >
              <GraduationCap size={22} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[18px] font-bold text-navy-900">{semester.term}</h2>
                <StatusPill
                  label={semester.status === 'current' ? 'In progress' : 'Completed'}
                  tone={semester.status === 'current' ? 'info' : 'success'}
                />
              </div>
              <p className="text-[12.5px] text-secondary-text mt-0.5">
                {semester.courses.length} course{semester.courses.length === 1 ? '' : 's'} · {semester.creditHours} credit hours
              </p>
            </div>
          </div>
          <div className="flex gap-6">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-secondary-text">Term GPA</div>
              <div className="text-[28px] font-extrabold text-navy-900 leading-none mt-1">{semester.gpa.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-secondary-text">Courses</div>
              <div className="text-[28px] font-extrabold text-navy-900 leading-none mt-1">{semester.courses.length}</div>
            </div>
          </div>
        </div>
      </GlassCard>

      {semester.status === 'completed' ? (
        <GlassCard className="p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-divider flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-secondary-text">
            <BookOpen size={14} />
            Official transcript summary
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[12px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-secondary-text bg-navy-50/50">
                  <th className="py-2.5 px-5 font-semibold">Course</th>
                  <th className="py-2.5 px-3 font-semibold">Credits</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Score</th>
                  <th className="py-2.5 px-5 font-semibold text-right">Grade</th>
                </tr>
              </thead>
              <tbody>
                {semester.courses.map((course) => (
                  <tr key={course.id} className="border-t border-divider">
                    <td className="py-3 px-5">
                      <div className="font-semibold text-navy-900">{course.courseCode}</div>
                      <div className="text-[11px] text-secondary-text mt-0.5">{course.course.replace(`${course.courseCode} `, '')}</div>
                    </td>
                    <td className="py-3 px-3 text-navy-800">{course.credits}</td>
                    <td className="py-3 px-3 text-right font-semibold text-navy-900">{course.percent}%</td>
                    <td className="py-3 px-5 text-right">
                      <span className="inline-flex min-w-[2.5rem] justify-center rounded-md bg-navy-50 px-2 py-1 font-bold text-navy-900">
                        {course.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      ) : null}

      <div>
        <div className="flex items-center gap-2 mb-3 text-[12px] font-bold uppercase tracking-wider text-navy-900">
          <Layers size={14} />
          Course details
          <span className="font-normal normal-case text-secondary-text">— tap a course to expand breakdown</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {semester.courses.map((grade, index) => (
            <CourseGradeCard key={grade.id} grade={grade} defaultExpanded={index === 0 && semester.status === 'current'} />
          ))}
        </div>
      </div>

      {semester.courses.length === 0 ? (
        <GlassCard className="p-8 text-center text-[13px] text-secondary-text">
          No graded courses for this semester yet.
        </GlassCard>
      ) : null}
    </div>
  )
}

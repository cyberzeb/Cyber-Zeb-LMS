import { BookOpen, Clock, GraduationCap, Play, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { Monogram } from '../../../shared/components/Monogram'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { useLearnerBasePath } from '../../../shared/hooks/useLearnerBasePath'
import { StudentPageError, StudentPageLoading } from '../components/StudentPageStates'
import { useStudentDashboard } from '../hooks/useStudentDashboard'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import type { EnrolledCourse } from '../types'

const statusTone: Record<EnrolledCourse['status'], 'success' | 'info' | 'neutral'> = {
  active: 'success',
  completed: 'neutral',
  upcoming: 'info',
}

const statusLabel: Record<EnrolledCourse['status'], string> = {
  active: 'Active',
  completed: 'Completed',
  upcoming: 'Upcoming',
}

export function StudentCoursesPage() {
  const { t } = useLanguage()
  const basePath = useLearnerBasePath()
  const { data, isLoading, isError } = useStudentDashboard()

  if (isLoading) return <StudentPageLoading />
  if (isError || !data) return <StudentPageError message="Failed to load courses." />

  const activeCount = data.courses.filter((c) => c.status === 'active').length
  const avgProgress =
    data.courses.length > 0
      ? Math.round(data.courses.reduce((sum, c) => sum + c.progress, 0) / data.courses.length)
      : 0

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="My Courses"
        subtitle={t('page.coursesStudent.sub', { count: activeCount, department: data.department })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBlock
          label="Enrolled"
          value={data.courses.length}
          sub={data.term}
          icon={<BookOpen size={17} />}
          iconBg="bg-navy-50 text-navy-600"
        />
        <StatBlock
          label="Active"
          value={activeCount}
          sub="In progress"
          icon={<GraduationCap size={17} />}
          iconBg="bg-lemon-100 text-lemon-800"
        />
        <StatBlock
          label="Avg. progress"
          value={`${avgProgress}%`}
          sub="Across all courses"
          icon={<Clock size={17} />}
          iconBg="bg-success-bg text-success"
        />
      </div>

      {data.courses.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <BookOpen size={32} className="mx-auto text-navy-300 mb-3" />
          <p className="text-[14px] font-semibold text-navy-900">No courses assigned yet</p>
          <p className="text-[12.5px] text-secondary-text mt-1">
            Courses appear when your department assigns them in admin.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
          {data.courses.map((course) => (
            <Link
              key={course.id}
              to={`${basePath}/courses/${course.id}/learn`}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-lemon-500 rounded-2xl"
            >
            <GlassCard
              className="p-0 overflow-hidden hover:shadow-md transition-shadow border-l-4 border-l-lemon-500 cursor-pointer h-full"
            >
              <div className="p-5 flex flex-col gap-4 h-full">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Monogram label={course.title} size="md" />
                    <div className="min-w-0">
                      <div className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text">
                        {course.code}
                      </div>
                      <h3 className="font-bold text-navy-900 text-[15px] leading-tight">{course.title}</h3>
                    </div>
                  </div>
                  <StatusPill label={statusLabel[course.status]} tone={statusTone[course.status]} />
                </div>

                <div className="flex flex-col gap-1.5 text-[12px] text-secondary-text">
                  <div className="flex items-center gap-2">
                    <UserRound size={13} className="text-navy-500 shrink-0" />
                    <span className="truncate">{course.instructor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-navy-500 shrink-0" />
                    <span className="truncate">Next: {course.nextSession}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen size={13} className="text-navy-500 shrink-0" />
                    <span>{course.credits} credits</span>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10.5px] font-semibold uppercase tracking-wide text-secondary-text">
                      Course progress
                    </span>
                    <span className="text-[11px] font-bold text-navy-900">{course.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-navy-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-lemon-500 to-lemon-700 rounded-full"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <Button variant="outline-green" size="sm" className="w-full mt-3 pointer-events-none">
                    <Play size={13} className="inline mr-1.5" />
                    {course.progress > 0 ? 'Continue learning' : 'Start learning'}
                  </Button>
                </div>
              </div>
            </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default StudentCoursesPage

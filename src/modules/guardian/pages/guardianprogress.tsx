import { useMemo } from 'react'
import { BookOpen } from 'lucide-react'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { readCourses, readEnrollments } from '../../../shared/storage/readers'
import { useLinkedStudent } from '../hooks/useLinkedStudent'

export function GuardianProgressPage() {
  const { student } = useLinkedStudent()

  const enrollments = useMemo(() => {
    if (!student) return []
    const courses = readCourses()
    return readEnrollments()
      .filter((e) => e.studentId === student.id)
      .map((e) => {
        const course = courses.find((c) => c.id === e.courseId)
        return {
          id: e.id,
          courseTitle: course?.title ?? 'Unknown course',
          courseCode: course?.code ?? '—',
          progress: e.progress ?? 0,
          status: e.status,
        }
      })
  }, [student])

  if (!student) {
    return (
      <GlassCard className="p-6 text-[13px] text-secondary-text">
        No student is linked to your account yet. Ask the registrar to link one.
      </GlassCard>
    )
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Student Progress"
        subtitle={`Course progress for ${student.name}.`}
      />

      <GlassCard className="p-0 overflow-hidden">
        {enrollments.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen size={28} className="mx-auto text-navy-300 mb-2" />
            <p className="text-[13px] font-semibold text-navy-900">No enrollments to show</p>
            <p className="text-[12px] text-secondary-text mt-1">Enrollments appear here once the student is registered in courses.</p>
          </div>
        ) : (
          <div className="divide-y divide-divider">
            {enrollments.map((e) => (
              <div key={e.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-navy-900">{e.courseTitle}</div>
                  <div className="text-[12px] text-secondary-text">{e.courseCode}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[13px] font-bold text-navy-800">{e.progress}%</div>
                  <div className="w-24 h-2 rounded-full bg-navy-100 overflow-hidden">
                    <div
                      className="h-full bg-lemon-500 rounded-full"
                      style={{ width: `${Math.min(100, e.progress)}%` }}
                    />
                  </div>
                  <StatusPill label={e.status} tone={e.status === 'active' ? 'success' : 'neutral'} />
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}

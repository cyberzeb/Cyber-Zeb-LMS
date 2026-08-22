import { useMemo } from 'react'
import { BookOpen, GraduationCap, HeartHandshake } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { Monogram } from '../../../shared/components/Monogram'
import { getSessionPerson } from '../../../shared/storage/session'
import { readEnrollments, readPeople } from '../../../shared/storage/readers'

export function GuardianDashboardPage() {
  const person = getSessionPerson()

  const linkedStudent = useMemo(() => {
    if (!person) return null
    return readPeople().find(
      (p) => p.role === 'Student' && p.name === person.department && p.status !== 'suspended',
    )
  }, [person])

  const enrollmentCount = useMemo(() => {
    if (!linkedStudent) return 0
    return readEnrollments().filter((e) => e.studentId === linkedStudent.id).length
  }, [linkedStudent])

  if (!person) return null

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title={`Welcome, ${person.name.split(' ')[0]}`}
        subtitle="View your linked student's learning progress and campus updates."
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatBlock
          label="Linked student"
          value={linkedStudent?.name ?? person.department}
          sub={linkedStudent?.department ?? 'Student profile'}
          icon={<HeartHandshake size={17} />}
          iconBg="bg-warning-bg text-[#8A6D00]"
        />
        <StatBlock
          label="Enrolled courses"
          value={enrollmentCount}
          sub="Active enrollments"
          icon={<BookOpen size={17} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Account"
          value={person.status === 'active' ? 'Active' : person.status}
          sub={`Last active ${person.lastActive}`}
          icon={<GraduationCap size={17} />}
          iconBg="bg-success-bg text-success"
        />
      </div>

      <GlassCard className="p-5">
        <h3 className="text-[15px] font-bold text-navy-900">Linked student</h3>
        {linkedStudent ? (
          <div className="mt-4 flex items-center gap-4">
            <Monogram label={linkedStudent.name} size="md" />
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-bold text-navy-900">{linkedStudent.name}</div>
              <div className="text-[12px] text-secondary-text">{linkedStudent.email}</div>
              <div className="text-[12px] text-navy-600 mt-1">{linkedStudent.department}</div>
            </div>
            <StatusPill label={linkedStudent.status} tone={linkedStudent.status === 'active' ? 'success' : 'warning'} />
            <Link
              to="/guardian/progress"
              className="text-[13px] font-semibold text-navy-700 hover:text-navy-900"
            >
              View progress →
            </Link>
          </div>
        ) : (
          <p className="mt-3 text-[13px] text-secondary-text">
            No active student profile found for &ldquo;{person.department}&rdquo;. Ask your institution admin to link your account.
          </p>
        )}
      </GlassCard>
    </div>
  )
}

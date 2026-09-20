import { useMemo } from 'react'
import { BookOpen, GraduationCap, HeartHandshake } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { Monogram } from '../../../shared/components/Monogram'
import { getSessionPerson } from '../../../shared/storage/session'
import { readAttendances, readEnrollments, readPayments } from '../../../shared/storage/readers'
import { buildTranscript } from '../../../shared/academics/transcript'
import { formatCurrency } from '../../../shared/storage/platformUtils'
import { useLinkedStudent } from '../hooks/useLinkedStudent'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

export function GuardianDashboardPage() {
  const { t } = useLanguage()
  const person = getSessionPerson()

  const { student: linkedStudent } = useLinkedStudent()

  const enrollmentCount = useMemo(() => {
    if (!linkedStudent) return 0
    return readEnrollments().filter((e) => e.studentId === linkedStudent.id).length
  }, [linkedStudent])

  const academics = useMemo(
    () => (linkedStudent ? buildTranscript(linkedStudent) : null),
    [linkedStudent],
  )

  const attendanceRate = useMemo(() => {
    if (!linkedStudent) return null
    const records = readAttendances().filter((a) => a.studentId === linkedStudent.id)
    const sessions = records.reduce((sum, r) => sum + r.totalSessions, 0)
    if (sessions === 0) return null
    const attended = records.reduce((sum, r) => sum + r.present + r.late, 0)
    return Math.round((attended / sessions) * 100)
  }, [linkedStudent])

  const balance = useMemo(() => {
    if (!linkedStudent) return { amount: 0, currency: 'ETB', count: 0 }
    const unpaid = readPayments().filter((p) => p.studentId === linkedStudent.id && p.status !== 'paid')
    return {
      amount: unpaid.reduce((sum, p) => sum + p.amount, 0),
      currency: unpaid[0]?.currency ?? 'ETB',
      count: unpaid.length,
    }
  }, [linkedStudent])

  if (!person) return null

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title={t('common.welcome', { name: person.name.split(' ')[0] })}
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
          label="Cumulative GPA"
          value={academics?.cumulativeGpa === null || !academics ? '—' : academics.cumulativeGpa.toFixed(2)}
          sub={academics?.standing ?? 'No graded work yet'}
          icon={<GraduationCap size={17} />}
          iconBg="bg-success-bg text-success"
        />
        <StatBlock
          label="Attendance"
          value={attendanceRate === null ? '—' : `${attendanceRate}%`}
          sub={attendanceRate !== null && attendanceRate < 75 ? 'Below the 75% minimum' : 'Meets the minimum'}
          icon={<BookOpen size={17} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Outstanding fees"
          value={formatCurrency(balance.amount, balance.currency)}
          sub={`${balance.count} unpaid invoice${balance.count === 1 ? '' : 's'}`}
          icon={<HeartHandshake size={17} />}
          iconBg="bg-warning-bg text-[#8A6D00]"
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

import { useMemo, useState } from 'react'
import { Award, BookOpen, CalendarClock, Download, GraduationCap, HeartHandshake, Loader2, MonitorPlay, UserRoundCheck, Wallet } from 'lucide-react'
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
import { buildStudentDashboard } from '../../../shared/storage/dashboardBuilders'
import { Button } from '../../../shared/components/Button'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useCertificates } from '../../institution/hooks/useCertificates'
import {
  certificateDataFrom,
  useCertificateTemplates,
} from '../../institution/certificates/useCertificateTemplates'
import { downloadCertificatePdf } from '../../institution/certificates/certificatePdf'

export function GuardianDashboardPage() {
  const { t } = useLanguage()
  const { notify } = useToast()
  const person = getSessionPerson()

  const { student: linkedStudent } = useLinkedStudent()
  const { certificates: certRecords } = useCertificates()
  const { templateFor } = useCertificateTemplates()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // The same view the student gets: deadlines, live classes and certificates.
  const studentView = useMemo(
    () => (linkedStudent ? buildStudentDashboard(linkedStudent) : null),
    [linkedStudent],
  )
  const deadlines = studentView?.upcomingDeadlines.slice(0, 5) ?? []
  const liveSoon = (studentView?.liveClasses ?? []).filter((c) => c.status !== 'ended').slice(0, 3)
  const earned = (studentView?.certificates ?? []).filter((c) => c.status === 'issued')

  async function download(certId: string) {
    const record = certRecords.find((c) => c.id === certId)
    if (!record) {
      notify('This certificate is not available for download yet.', 'error')
      return
    }
    setDownloadingId(certId)
    try {
      await downloadCertificatePdf(templateFor(record.templateId), certificateDataFrom(record))
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not create the PDF.', 'error')
    } finally {
      setDownloadingId(null)
    }
  }

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
        subtitle={
          linkedStudent
            ? `How ${linkedStudent.name.split(' ')[0]} is doing — grades, attendance, fees and what is coming up.`
            : 'Your linked student\'s progress and campus updates.'
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatBlock
          label="Linked student"
          value={linkedStudent?.name ?? 'Not linked'}
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
          sub={
            attendanceRate === null
              ? 'No attendance recorded yet'
              : attendanceRate < 75
                ? 'Below the 75% minimum'
                : 'Meets the minimum'
          }
          icon={<UserRoundCheck size={17} />}
          iconBg={attendanceRate !== null && attendanceRate < 75 ? 'bg-danger-bg text-danger' : 'bg-info-bg text-info'}
        />
        <StatBlock
          label="Outstanding fees"
          value={formatCurrency(balance.amount, balance.currency)}
          sub={`${balance.count} unpaid invoice${balance.count === 1 ? '' : 's'}`}
          icon={<Wallet size={17} />}
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
            No student is linked to your account yet. Ask your institution admin to link your child.
          </p>
        )}
      </GlassCard>

      {linkedStudent ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <GlassCard className="p-5">
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-navy-900">
              <CalendarClock size={16} /> Coming up
            </h3>
            {deadlines.length === 0 && liveSoon.length === 0 ? (
              <p className="mt-3 text-[13px] text-secondary-text">Nothing due right now.</p>
            ) : (
              <ul className="mt-3 divide-y divide-divider">
                {liveSoon.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-navy-900">
                        <MonitorPlay size={13} className="text-info" /> {c.title}
                      </span>
                      <span className="block text-[12px] text-secondary-text">{c.course} · live class</span>
                    </span>
                    <StatusPill label={c.status === 'live' ? 'Live now' : c.startAt} tone={c.status === 'live' ? 'success' : 'info'} />
                  </li>
                ))}
                {deadlines.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-navy-900">{d.title}</span>
                      <span className="block text-[12px] text-secondary-text">{d.course}</span>
                    </span>
                    <StatusPill
                      label={d.dueIn}
                      tone={d.status === 'overdue' ? 'danger' : d.status === 'today' ? 'warning' : 'neutral'}
                    />
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-navy-900">
              <Award size={16} /> Certificates
            </h3>
            {earned.length === 0 ? (
              <p className="mt-3 text-[13px] text-secondary-text">No certificates earned yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-divider">
                {earned.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-navy-900">{c.course}</span>
                      <span className="block text-[12px] text-secondary-text">
                        {c.title} · issued {c.issuedAt}
                      </span>
                    </span>
                    <Button variant="secondary" size="sm" onClick={() => void download(c.id)} disabled={downloadingId === c.id}>
                      {downloadingId === c.id ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                      PDF
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      ) : null}
    </div>
  )
}

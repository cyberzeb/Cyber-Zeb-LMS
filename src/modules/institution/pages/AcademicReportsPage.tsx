import { useMemo, useState } from 'react'
import { AlertTriangle, Download, GraduationCap, TrendingUp, Users } from 'lucide-react'

import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { downloadTextFile } from '../../../shared/utils/downloadFile'
import {
  buildUniversityReportPack,
  toCsv,
  type DistributionRow,
} from '../../../shared/academics/universityReports'

const STAT = 17

function exportCsv<T extends object>(name: string, rows: readonly T[]) {
  const stamp = new Date().toISOString().slice(0, 10)
  downloadTextFile(`berana-${name}-${stamp}.csv`, toCsv(rows), 'text/csv;charset=utf-8')
}

function DistributionBars({ rows }: { rows: DistributionRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <div className="flex flex-col gap-2 p-5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-[12.5px] font-semibold text-navy-900">{row.label}</span>
          <div className="flex-1 h-2.5 rounded-full bg-navy-50 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-lemon-500"
              style={{ width: `${Math.round((row.count / max) * 100)}%` }}
            />
          </div>
          <span className="w-24 text-right text-[12px] text-secondary-text">
            {row.count} · {row.share}%
          </span>
        </div>
      ))}
      {rows.length === 0 && (
        <p className="text-[13px] text-secondary-text">Nothing has been graded yet.</p>
      )}
    </div>
  )
}

/** Registrar / academic admin reporting for the University Edition. */
export function AcademicReportsPage() {
  const [refreshToken, setRefreshToken] = useState(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pack = useMemo(() => buildUniversityReportPack(), [refreshToken])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Academic Reports"
        subtitle="Enrolment, grades, academic standing and students who need attention."
        actions={
          <Button variant="secondary" onClick={() => setRefreshToken((n) => n + 1)}>
            <TrendingUp size={15} />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock label="Students" value={pack.students} icon={<Users size={STAT} />} />
        <StatBlock
          label="With grades"
          value={pack.studentsWithGrades}
          icon={<GraduationCap size={STAT} />}
        />
        <StatBlock
          label="Average GPA"
          value={pack.averageGpa === null ? '—' : pack.averageGpa.toFixed(2)}
        />
        <StatBlock
          label="Need attention"
          value={pack.atRisk.length}
          sub="Low GPA, attendance or failed courses"
          icon={<AlertTriangle size={STAT} />}
        />
      </div>

      <GlassCard className="overflow-hidden">
        <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-divider">
          <div>
            <h3 className="text-[14px] font-extrabold text-navy-900">Enrolment by program</h3>
            <p className="text-[12px] text-secondary-text">Students, sections and average GPA per degree program.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => exportCsv('enrolment-by-program', pack.programEnrolment)}>
            <Download size={14} />
            CSV
          </Button>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-[11px] uppercase tracking-wide text-secondary-text bg-navy-50/60 dark:bg-white/5">
              <tr>
                <th className="px-5 py-3 font-medium">Program</th>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Students</th>
                <th className="px-5 py-3 font-medium">Sections</th>
                <th className="px-5 py-3 font-medium">Enrolments</th>
                <th className="px-5 py-3 font-medium">Average GPA</th>
              </tr>
            </thead>
            <tbody>
              {pack.programEnrolment.map((row) => (
                <tr key={row.programId} className="border-b border-divider last:border-0">
                  <td className="px-5 py-3 font-semibold text-navy-900">{row.program}</td>
                  <td className="px-5 py-3 text-secondary-text">{row.department}</td>
                  <td className="px-5 py-3 text-navy-900">{row.students}</td>
                  <td className="px-5 py-3 text-navy-900">{row.sections}</td>
                  <td className="px-5 py-3 text-navy-900">{row.enrolments}</td>
                  <td className="px-5 py-3 text-navy-900">
                    {row.averageGpa === null ? '—' : row.averageGpa.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-divider">
          <h3 className="text-[14px] font-extrabold text-navy-900">Term summary</h3>
          <Button variant="secondary" size="sm" onClick={() => exportCsv('term-summary', pack.termSummary)}>
            <Download size={14} />
            CSV
          </Button>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-[11px] uppercase tracking-wide text-secondary-text bg-navy-50/60 dark:bg-white/5">
              <tr>
                <th className="px-5 py-3 font-medium">Term</th>
                <th className="px-5 py-3 font-medium">Sections</th>
                <th className="px-5 py-3 font-medium">Course enrolments</th>
                <th className="px-5 py-3 font-medium">Credits earned</th>
                <th className="px-5 py-3 font-medium">Average term GPA</th>
              </tr>
            </thead>
            <tbody>
              {pack.termSummary.map((row) => (
                <tr key={row.termId} className="border-b border-divider last:border-0">
                  <td className="px-5 py-3">
                    <span className="font-semibold text-navy-900">{row.term}</span>
                    {row.isCurrent && <StatusPill label="Current" tone="info" />}
                  </td>
                  <td className="px-5 py-3 text-navy-900">{row.sections}</td>
                  <td className="px-5 py-3 text-navy-900">{row.enrolments}</td>
                  <td className="px-5 py-3 text-navy-900">{row.creditsEarned}</td>
                  <td className="px-5 py-3 text-navy-900">
                    {row.averageGpa === null ? '—' : row.averageGpa.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GlassCard className="overflow-hidden">
          <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-divider">
            <h3 className="text-[14px] font-extrabold text-navy-900">Grade distribution</h3>
            <Button variant="secondary" size="sm" onClick={() => exportCsv('grade-distribution', pack.gradeDistribution)}>
              <Download size={14} />
              CSV
            </Button>
          </header>
          <DistributionBars rows={pack.gradeDistribution} />
        </GlassCard>

        <GlassCard className="overflow-hidden">
          <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-divider">
            <h3 className="text-[14px] font-extrabold text-navy-900">Academic standing</h3>
            <Button variant="secondary" size="sm" onClick={() => exportCsv('academic-standing', pack.standingDistribution)}>
              <Download size={14} />
              CSV
            </Button>
          </header>
          <DistributionBars rows={pack.standingDistribution} />
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-divider">
          <div>
            <h3 className="text-[14px] font-extrabold text-navy-900">Students needing attention</h3>
            <p className="text-[12px] text-secondary-text">
              GPA below 2.00, attendance below 75%, or a failed course.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              exportCsv(
                'students-needing-attention',
                pack.atRisk.map((row) => ({ ...row, reasons: row.reasons.join('; ') })),
              )
            }
          >
            <Download size={14} />
            CSV
          </Button>
        </header>
        <div className="overflow-x-auto max-h-[420px]">
          <table className="w-full text-[13px]">
            <thead className="text-left text-[11px] uppercase tracking-wide text-secondary-text bg-navy-50/60 dark:bg-white/5">
              <tr>
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Program</th>
                <th className="px-5 py-3 font-medium">GPA</th>
                <th className="px-5 py-3 font-medium">Attendance</th>
                <th className="px-5 py-3 font-medium">Why</th>
              </tr>
            </thead>
            <tbody>
              {pack.atRisk.map((row) => (
                <tr key={row.studentId} className="border-b border-divider last:border-0">
                  <td className="px-5 py-3 font-semibold text-navy-900">{row.student}</td>
                  <td className="px-5 py-3 text-secondary-text">{row.program}</td>
                  <td className="px-5 py-3 text-navy-900">{row.gpa === null ? '—' : row.gpa.toFixed(2)}</td>
                  <td className="px-5 py-3 text-navy-900">
                    {row.attendance === null ? '—' : `${row.attendance}%`}
                  </td>
                  <td className="px-5 py-3 text-secondary-text">{row.reasons.join(' · ')}</td>
                </tr>
              ))}
              {pack.atRisk.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-secondary-text">
                    No students are flagged right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-divider">
          <h3 className="text-[14px] font-extrabold text-navy-900">Dean’s List (GPA 3.75+)</h3>
          <Button variant="secondary" size="sm" onClick={() => exportCsv('deans-list', pack.deansList)}>
            <Download size={14} />
            CSV
          </Button>
        </header>
        <div className="divide-y divide-divider max-h-[320px] overflow-y-auto">
          {pack.deansList.map((row) => (
            <div key={row.studentId} className="px-5 py-2.5 flex items-center justify-between gap-3">
              <div>
                <div className="text-[13.5px] font-semibold text-navy-900">{row.student}</div>
                <div className="text-[12px] text-secondary-text">{row.program}</div>
              </div>
              <span className="text-[13px] font-extrabold text-navy-900">{row.gpa.toFixed(2)}</span>
            </div>
          ))}
          {pack.deansList.length === 0 && (
            <p className="p-6 text-center text-[13px] text-secondary-text">
              No students have reached a 3.75 GPA yet.
            </p>
          )}
        </div>
      </GlassCard>
    </div>
  )
}

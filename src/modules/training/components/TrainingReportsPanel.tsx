/**
 * Training Edition reporting: enrollment and completion by program, how full
 * each cohort ran, attendance, and fee income — with CSV exports.
 */
import { useMemo } from 'react'
import { Award, Download, GraduationCap, Users, Wallet } from 'lucide-react'

import { Button } from '../../../shared/components/Button'
import { StatBlock } from '../../../shared/components/StatBlock'
import { useApiCollection } from '../../../shared/hooks/useApiCollection'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { STORAGE_KEYS } from '../../../shared/storage/keys'
import { MiniBarChart } from '../../institution/components/MiniBarChart'
import { useCertificates } from '../../institution/hooks/useCertificates'
import type { PaymentRecord } from '../../institution/types/platform'
import { useCohortAttendance, useCohortRegistrations, useCohorts, useTrainingPrograms } from '../hooks/useTrainingData'
import { attendanceRate, cohortState, downloadCsv, formatMoney, seatsTaken } from '../utils/trainingUtils'

const STAT = 17
const NO_PAYMENTS: PaymentRecord[] = []

export function TrainingReportsPanel() {
  const { programs } = useTrainingPrograms()
  const { cohorts } = useCohorts()
  const { registrations } = useCohortRegistrations()
  const { sessions } = useCohortAttendance()
  const { certificates } = useCertificates()
  const [payments] = useApiCollection<PaymentRecord[]>(STORAGE_KEYS.payments, NO_PAYMENTS)
  const invoiceById = useMemo(() => new Map(payments.map((p) => [p.id, p])), [payments])
  const currency = programs[0]?.currency ?? 'ETB'

  const byProgram = useMemo(
    () =>
      programs.map((p) => {
        const regs = registrations.filter((r) => r.programId === p.id)
        const enrolled = regs.filter((r) => r.status === 'enrolled')
        const certified = certificates.filter((c) => c.status === 'issued' && (c.programId ?? c.courseId) === p.id).length
        const revenue = regs.reduce((s, r) => s + (r.invoiceId && invoiceById.get(r.invoiceId)?.status === 'paid' ? Number(r.amount) || 0 : 0), 0)
        return {
          program: p,
          cohorts: cohorts.filter((c) => c.programId === p.id).length,
          registrations: regs.filter((r) => r.status !== 'cancelled').length,
          enrolled: enrolled.length,
          certified,
          completion: enrolled.length ? Math.round((certified / enrolled.length) * 100) : 0,
          revenue,
        }
      }),
    [programs, registrations, certificates, invoiceById, cohorts],
  )

  const byCohort = useMemo(
    () =>
      cohorts
        .filter((c) => c.status !== 'cancelled')
        .map((c) => {
          const enrolled = registrations.filter((r) => r.cohortId === c.id && r.status === 'enrolled')
          const rates = enrolled.map((r) => attendanceRate(r.studentId, c.id, sessions)).filter((x): x is number => x !== null)
          const taken = seatsTaken(c.id, registrations)
          return {
            cohort: c,
            program: programs.find((p) => p.id === c.programId),
            state: cohortState(c),
            taken,
            fill: c.seatCapacity ? Math.round((Math.min(taken, c.seatCapacity) / c.seatCapacity) * 100) : null,
            enrolled: enrolled.length,
            attendance: rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null,
          }
        })
        .sort((a, b) => b.cohort.startDate.localeCompare(a.cohort.startDate)),
    [cohorts, registrations, sessions, programs],
  )

  const totalRevenue = byProgram.reduce((s, r) => s + r.revenue, 0)
  const totalEnrolled = byProgram.reduce((s, r) => s + r.enrolled, 0)
  const totalCertified = byProgram.reduce((s, r) => s + r.certified, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBlock label="Learners enrolled" value={totalEnrolled} sub={`${registrations.filter((r) => r.status !== 'cancelled').length} registrations`} icon={<Users size={STAT} />} />
        <StatBlock label="Programs" value={programs.filter((p) => p.status === 'active').length} sub={`${cohorts.length} cohorts`} icon={<GraduationCap size={STAT} />} iconBg="bg-info-bg text-info" />
        <StatBlock label="Certified" value={totalCertified} sub={totalEnrolled ? `${Math.round((totalCertified / totalEnrolled) * 100)}% of enrolled` : undefined} icon={<Award size={STAT} />} iconBg="bg-success-bg text-success" />
        <StatBlock label="Fee income" value={formatMoney(totalRevenue, currency)} icon={<Wallet size={STAT} />} iconBg="bg-warning-bg text-[#8A6D00]" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <MiniBarChart title="Enrollment by program" subtitle="Learners enrolled" data={byProgram.map((r) => ({ label: r.program.code, value: r.enrolled }))} />
        <MiniBarChart title="Completion by program" subtitle="Certified % of enrolled" data={byProgram.map((r) => ({ label: r.program.code, value: r.completion }))} unit="%" />
        <MiniBarChart
          title="Attendance by cohort"
          subtitle="Average session attendance %"
          data={byCohort.filter((r) => r.attendance !== null).slice(0, 8).map((r) => ({ label: r.cohort.code || r.cohort.name, value: r.attendance ?? 0 }))}
          unit="%"
        />
      </div>

      <GlassCard className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold text-navy-900">Report pack</h3>
            <p className="text-[12.5px] text-secondary-text">Download the numbers behind this page.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={!byProgram.length}
              onClick={() =>
                downloadCsv(
                  'programs-summary.csv',
                  byProgram.map((r) => ({
                    Code: r.program.code,
                    Program: r.program.name,
                    Status: r.program.status,
                    Cohorts: r.cohorts,
                    Registrations: r.registrations,
                    Enrolled: r.enrolled,
                    Certified: r.certified,
                    'Completion %': r.completion,
                    [`Fee income (${currency})`]: r.revenue,
                  })),
                )
              }
            >
              <Download size={14} /> Programs
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!byCohort.length}
              onClick={() =>
                downloadCsv(
                  'cohorts-summary.csv',
                  byCohort.map((r) => ({
                    Cohort: r.cohort.name,
                    Program: r.program?.name ?? '',
                    Start: r.cohort.startDate,
                    End: r.cohort.endDate,
                    Status: r.state,
                    Seats: r.cohort.seatCapacity || 'No limit',
                    'Seats taken': r.taken,
                    'Fill %': r.fill ?? '',
                    Enrolled: r.enrolled,
                    'Attendance %': r.attendance ?? '',
                  })),
                )
              }
            >
              <Download size={14} /> Cohorts
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!registrations.length}
              onClick={() =>
                downloadCsv(
                  'fee-income.csv',
                  registrations
                    .filter((r) => Number(r.amount) > 0)
                    .map((r) => {
                      const invoice = r.invoiceId ? invoiceById.get(r.invoiceId) : undefined
                      return {
                        Learner: r.studentName,
                        Program: programs.find((p) => p.id === r.programId)?.name ?? '',
                        Cohort: cohorts.find((c) => c.id === r.cohortId)?.name ?? '',
                        Amount: r.amount,
                        Currency: r.currency,
                        Invoice: invoice?.status ?? (r.status === 'cancelled' ? 'cancelled' : ''),
                        'Paid on': invoice?.paidAt?.slice(0, 10) ?? '',
                      }
                    }),
                )
              }
            >
              <Download size={14} /> Fee income
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-[11px] uppercase tracking-wide text-secondary-text">
              <tr>
                <th className="py-2 pr-4 font-medium">Program</th>
                <th className="py-2 pr-4 font-medium">Cohorts</th>
                <th className="py-2 pr-4 font-medium">Enrolled</th>
                <th className="py-2 pr-4 font-medium">Certified</th>
                <th className="py-2 pr-4 font-medium">Completion</th>
                <th className="py-2 font-medium">Fee income</th>
              </tr>
            </thead>
            <tbody>
              {byProgram.map((r) => (
                <tr key={r.program.id} className="border-t border-divider">
                  <td className="py-2.5 pr-4 font-semibold text-navy-900">{r.program.name}</td>
                  <td className="py-2.5 pr-4 text-navy-900">{r.cohorts}</td>
                  <td className="py-2.5 pr-4 text-navy-900">{r.enrolled}</td>
                  <td className="py-2.5 pr-4 text-navy-900">{r.certified}</td>
                  <td className="py-2.5 pr-4 text-navy-900">{r.completion}%</td>
                  <td className="py-2.5 text-navy-900">{formatMoney(r.revenue, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}

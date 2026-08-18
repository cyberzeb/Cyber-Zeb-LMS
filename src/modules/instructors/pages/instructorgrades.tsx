import { useMemo } from 'react'
import { AlertTriangle, Award, Download, GraduationCap, Target, TrendingUp, Trophy } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { Monogram } from '../../../shared/components/Monogram'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { TrendLineChart } from '../../institution/components/TrendLineChart'
import { InstructorPageError, InstructorPageLoading } from '../components/InstructorPageStates'
import { useInstructorDashboard } from '../hooks/useInstructorDashboard'
import type { GradebookEntry } from '../types'

const statusTone: Record<GradebookEntry['status'], 'success' | 'danger' | 'info'> = {
  'on-track': 'info',
  'at-risk': 'danger',
  excellent: 'success',
}

const statusLabel: Record<GradebookEntry['status'], string> = {
  'on-track': 'On track',
  'at-risk': 'At risk',
  excellent: 'Excellent',
}

export function InstructorGradesPage() {
  const { data, isLoading, isError } = useInstructorDashboard()

  const stats = useMemo(() => {
    if (!data?.gradebook.length) return { average: '—', highest: '—', atRisk: 0, students: 0 }
    const average = Math.round(data.gradebook.reduce((sum, g) => sum + g.percent, 0) / data.gradebook.length)
    const highest = Math.max(...data.gradebook.map((g) => g.percent))
    const atRisk = data.gradebook.filter((g) => g.status === 'at-risk').length
    return { average: `${average}%`, highest: `${highest}%`, atRisk, students: data.gradebook.length }
  }, [data])

  if (isLoading) return <InstructorPageLoading />
  if (isError || !data) return <InstructorPageError message="Failed to load gradebook." />

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Gradebook"
        subtitle="Review student scores, identify at-risk learners, and export grade reports."
        actions={
          <Button variant="primary">
            <Download size={15} />
            Export grades
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatBlock
          label="Class average"
          value={stats.average}
          sub={data.term}
          icon={<Award size={17} />}
          iconBg="bg-lemon-100 text-lemon-800"
        />
        <StatBlock
          label="Highest score"
          value={stats.highest}
          sub="Top performer"
          icon={<Trophy size={17} />}
          iconBg="bg-success-bg text-success"
        />
        <StatBlock
          label="Students tracked"
          value={stats.students}
          sub="In gradebook"
          icon={<GraduationCap size={17} />}
          iconBg="bg-navy-50 text-navy-600"
        />
        <StatBlock
          label="At risk"
          value={stats.atRisk}
          sub="Need intervention"
          icon={<AlertTriangle size={17} />}
          iconBg="bg-danger-bg text-danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-5 border-b border-divider">
              <h3 className="text-[15px] font-bold text-navy-900">Student Grades</h3>
              <p className="text-[12px] text-secondary-text mt-0.5">Current term performance by student</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-secondary-text border-b border-divider">
                    <th className="py-3 px-5 font-semibold">Student</th>
                    <th className="py-3 px-2 font-semibold">Course</th>
                    <th className="py-3 px-2 font-semibold">Grade</th>
                    <th className="py-3 px-2 font-semibold">Score</th>
                    <th className="py-3 px-5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.gradebook.map((entry) => (
                    <tr key={entry.id} className="border-b border-divider last:border-0 text-[12px] hover:bg-navy-50/50">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <Monogram label={entry.studentName} size="sm" />
                          <span className="font-semibold text-navy-900">{entry.studentName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-navy-700">{entry.courseCode}</td>
                      <td className="py-3 px-2 font-bold text-navy-900">{entry.grade}</td>
                      <td className="py-3 px-2 text-secondary-text">{entry.percent}%</td>
                      <td className="py-3 px-5">
                        <StatusPill label={statusLabel[entry.status]} tone={statusTone[entry.status]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-4">
          <TrendLineChart
            title="Class Score Trend"
            subtitle="Average performance over 6 months"
            data={data.classScoreTrend}
            color="#A8D400"
            unit="%"
          />
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 text-[13px] font-bold text-navy-900">
              <Target size={16} className="text-lemon-700" />
              Grading insights
            </div>
            <ul className="mt-3 space-y-2 text-[12px] text-secondary-text">
              <li className="flex items-start gap-2">
                <TrendingUp size={14} className="text-success mt-0.5 shrink-0" />
                Class average improved 4% since March
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-danger mt-0.5 shrink-0" />
                {stats.atRisk} student{stats.atRisk === 1 ? '' : 's'} flagged for follow-up
              </li>
            </ul>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

export default InstructorGradesPage

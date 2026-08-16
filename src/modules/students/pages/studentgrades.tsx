import { useMemo } from 'react'
import { Award, GraduationCap, Sparkles, Target, TrendingUp, Trophy } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { TrendLineChart } from '../../institution/components/TrendLineChart'
import { StudentGradebook } from '../components/StudentGradebook'
import { StudentPageError, StudentPageLoading } from '../components/StudentPageStates'
import { useStudentDashboard } from '../hooks/useStudentDashboard'

export function StudentGradesPage() {
  const { data, isLoading, isError } = useStudentDashboard()

  const currentSemester = useMemo(
    () => data?.gradeHistory.find((s) => s.status === 'current'),
    [data],
  )

  const cumulativeGpa = useMemo(() => {
    if (!data?.gradeHistory.length) return '—'
    const completed = data.gradeHistory.filter((s) => s.status === 'completed')
    if (completed.length === 0) return data.kpis.gpa.toFixed(2)
    const avg = completed.reduce((sum, s) => sum + s.gpa, 0) / completed.length
    return ((avg + data.kpis.gpa) / 2).toFixed(2)
  }, [data])

  const stats = useMemo(() => {
    const courses = currentSemester?.courses ?? data?.grades ?? []
    if (courses.length === 0) {
      return { average: '—', highest: '—', courses: 0 }
    }
    const average = Math.round(courses.reduce((sum, g) => sum + g.percent, 0) / courses.length)
    const highest = Math.max(...courses.map((g) => g.percent))
    return { average: `${average}%`, highest: `${highest}%`, courses: courses.length }
  }, [data, currentSemester])

  const trendInsights = useMemo(() => {
    if (!data?.gradeTrend.length) {
      return { change: '—', peak: '—', peakLabel: '—', aGrades: 0, credits: 0, sparkline: [] as number[] }
    }
    const values = data.gradeTrend.map((p) => p.value)
    const first = values[0]
    const last = values[values.length - 1]
    const change = last - first
    const peakPoint = data.gradeTrend.reduce((best, p) => (p.value > best.value ? p : best))
    const courses = currentSemester?.courses ?? data.grades
    const aGrades = courses.filter((g) => g.grade.startsWith('A')).length

    return {
      change: `${change >= 0 ? '+' : ''}${change}%`,
      peak: `${peakPoint.value}%`,
      peakLabel: peakPoint.label,
      aGrades,
      credits: currentSemester?.creditHours ?? 0,
      sparkline: values,
    }
  }, [data, currentSemester])

  if (isLoading) return <StudentPageLoading />
  if (isError || !data) return <StudentPageError message="Failed to load grades." />

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Grades & Feedback"
        subtitle="View current scores, instructor feedback, and past semester transcripts."
        actions={
          <Button variant="primary">
            <GraduationCap size={15} />
            Download transcript
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatBlock
          label="Current term GPA"
          value={currentSemester?.gpa.toFixed(2) ?? data.kpis.gpa.toFixed(2)}
          sub={data.term}
          icon={<Award size={17} />}
          iconBg="bg-lemon-100 text-lemon-800"
        />
        <StatBlock
          label="Cumulative GPA"
          value={cumulativeGpa}
          sub={data.standing}
          icon={<Sparkles size={17} />}
          iconBg="bg-success-bg text-success"
        />
        <StatBlock
          label="Term average"
          value={stats.average}
          sub="Current semester"
          icon={<TrendingUp size={17} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Past semesters"
          value={data.gradeHistory.filter((s) => s.status === 'completed').length}
          sub="Archived transcripts"
          icon={<GraduationCap size={17} />}
          iconBg="bg-navy-50 text-navy-600"
        />
      </div>

      {data.gradeTrend.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <TrendLineChart
            title="Grade trend"
            subtitle="Average performance over recent months"
            data={data.gradeTrend}
            color="#EAB308"
            unit="%"
            compact
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatBlock
              label="6-month change"
              value={trendInsights.change}
              sub="Since first recorded month"
              icon={<TrendingUp size={17} />}
              iconBg="bg-success-bg text-success"
              trend="up"
              trendValue="Improving"
              sparkline={trendInsights.sparkline}
              sparklineColor="#16A34A"
            />
            <StatBlock
              label="Peak average"
              value={trendInsights.peak}
              sub={`Best month · ${trendInsights.peakLabel}`}
              icon={<Trophy size={17} />}
              iconBg="bg-lemon-100 text-lemon-800"
              sparkline={trendInsights.sparkline}
              sparklineColor="#EAB308"
            />
            <StatBlock
              label="A-range grades"
              value={trendInsights.aGrades}
              sub="Current semester courses"
              icon={<Award size={17} />}
              iconBg="bg-info-bg text-info"
            />
            <StatBlock
              label="Credits this term"
              value={trendInsights.credits}
              sub={`Quiz avg · ${data.kpis.avgQuizScore}%`}
              icon={<Target size={17} />}
              iconBg="bg-navy-50 text-navy-600"
              sparkline={data.kpiTrends.quizScores}
              sparklineColor="#1976D2"
            />
          </div>
        </div>
      ) : null}

      <StudentGradebook gradeHistory={data.gradeHistory} />
    </div>
  )
}

export default StudentGradesPage

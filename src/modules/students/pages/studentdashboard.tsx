import { ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StudentDashboardHero } from '../components/StudentDashboardHero'
import { useStudentDashboard } from '../hooks/useStudentDashboard'

export function StudentDashboardPage() {
	const { data, isLoading, isError, error, reload } = useStudentDashboard()

	if (isLoading) {
		return (
			<div className="flex min-h-[320px] items-center justify-center">
				<div className="h-10 w-10 animate-spin rounded-full border-2 border-navy-200 border-t-lemon-500" />
			</div>
		)
	}

	if (isError || !data) {
		return (
			<div className="rounded-2xl border border-danger/20 bg-danger-bg p-5 text-danger shadow-sm">
				<div className="flex items-start gap-3">
					<AlertTriangle size={18} className="mt-0.5 shrink-0" />
					<div className="min-w-0 flex-1">
						<h2 className="text-[15px] font-bold">Failed to load the student dashboard</h2>
						<p className="mt-1 text-[13px] leading-6 text-danger/80">
							{error?.message ?? 'Please try again to load your learning workspace.'}
						</p>
						<button
							type="button"
							onClick={() => void reload()}
							className="mt-4 inline-flex items-center gap-2 rounded-full bg-danger px-4 py-2 text-[12px] font-bold text-white transition hover:opacity-90"
						>
							<RefreshCw size={13} />
							Retry
						</button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-6 md:gap-8 animate-fade-in-up">
			<StudentDashboardHero data={data} />

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-5">
				{data.stats.map((stat) => (
					<StatBlock key={stat.label} label={stat.label} value={stat.value} sub={stat.detail} />
				))}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
				{[
					{ to: '/student/resources', title: 'Course Resources', desc: 'Syllabi, notes, readings, and videos.' },
					{ to: '/student/quizzes', title: 'Quizzes', desc: 'Open, locked, and completed assessments.' },
					{ to: '/student/assignments', title: 'Assignments', desc: 'Upload work to the secure dropbox.' },
					{ to: '/student/calendar', title: 'Calendar', desc: 'Due dates, exams, and live class meetings.' },
					{ to: '/student/grades', title: 'Grades', desc: 'Progress and instructor feedback.' },
				].map((item) => (
					<Link
						key={item.to}
						to={item.to}
						className="group rounded-2xl border border-divider/70 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
					>
						<div className="flex items-start justify-between gap-3">
							<div>
								<div className="text-[11px] font-bold uppercase tracking-[0.2em] text-lemon-700">Open section</div>
								<h2 className="mt-2 text-[16px] font-extrabold text-navy-900">{item.title}</h2>
								<p className="mt-1.5 text-[12.5px] text-secondary-text leading-6">{item.desc}</p>
							</div>
							<ArrowRight size={16} className="mt-1 text-navy-300 transition group-hover:translate-x-0.5 group-hover:text-navy-900" />
						</div>
					</Link>
				))}
			</div>
		</div>
	)
}

export default StudentDashboardPage

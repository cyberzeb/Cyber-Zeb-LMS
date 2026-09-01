import type { TrainingPlaceholderPageProps } from '../modules/training/types'

function TrainingPlaceholder({ title, subtitle, phase = 'Next sprint' }: TrainingPlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <h1 className="text-2xl font-bold text-navy-900 mb-2">{title}</h1>
      <p className="text-secondary-text mb-4">{subtitle}</p>
      <span className="bg-lemon-500/10 text-lemon-700 px-3 py-1 rounded-full text-sm font-medium">
        Phase: {phase}
      </span>
    </div>
  )
}

export function AdminCohortsPage() {
  return <TrainingPlaceholder title="Cohorts" subtitle="Manage class sessions, scheduling, and trainer assignments." />
}

export function AdminLearnersPage() {
  return <TrainingPlaceholder title="Learners" subtitle="Manage trainees and their enrollments across cohorts." />
}

export function AdminTrainingProgramsPage() {
  return <TrainingPlaceholder title="Training Programs" subtitle="Design and structure your training programs." />
}

export function AdminTrainingDivisionsPage() {
  return <TrainingPlaceholder title="Divisions" subtitle="Manage your organization's training divisions." />
}

export function AdminTrainersPage() {
  return <TrainingPlaceholder title="Trainers" subtitle="Manage trainers and their cohort assignments." />
}

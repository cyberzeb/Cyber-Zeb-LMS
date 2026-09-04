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

export { CohortsPage as AdminCohortsPage } from '../modules/training/pages/CohortsPage'
export { LearnersPage as AdminLearnersPage } from '../modules/training/pages/LearnersPage'
export { TrainingProgramsPage as AdminTrainingProgramsPage } from '../modules/training/pages/TrainingProgramsPage'
export { TrainersPage as AdminTrainersPage } from '../modules/training/pages/TrainersPage'

export function AdminTrainingDivisionsPage() {
  return <TrainingPlaceholder title="Divisions" subtitle="Manage your organization's training divisions." />
}

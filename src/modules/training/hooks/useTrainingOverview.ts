import type { TrainingOverviewData } from '../types'

export function useTrainingOverview(): TrainingOverviewData {
  return {
    organizationName: 'Global Training Institute',
    organizationSubtitle: 'Professional Development & Certification',
    kpis: {
      totalLearners: 1250,
      trainingPrograms: 18,
      activeCohorts: 24,
      trainers: 45,
      completionRate: 88,
      certificatesIssued: 3420,
    },
    kpiTrends: {
      totalLearners: [1000, 1050, 1100, 1150, 1200, 1250],
      trainingPrograms: [12, 14, 15, 16, 17, 18],
      activeCohorts: [15, 18, 20, 22, 22, 24],
      trainers: [30, 35, 38, 40, 42, 45],
      completionRate: [82, 83, 85, 86, 87, 88],
      certificatesIssued: [2800, 2900, 3050, 3150, 3300, 3420],
    },
    cohortProgress: [
      { label: 'Upcoming', count: 5, tone: 'info' },
      { label: 'In Progress', count: 24, tone: 'warning' },
      { label: 'Completed', count: 128, tone: 'success' },
    ],
    attentionItems: [
      {
        id: 'att-1',
        title: 'Low Enrollment',
        subtitle: 'Advanced Data Science Fall Cohort',
        severity: 'medium',
      },
      {
        id: 'att-2',
        title: 'Trainer Missing',
        subtitle: 'Leadership 101 needs an instructor',
        severity: 'high',
      },
    ],
    recentAnnouncements: [
      {
        id: 'ann-1',
        title: 'New Cloud Computing track launching next month',
        postedAt: '2 days ago',
        priority: 'normal',
        audience: 'all',
      },
    ],
  }
}

import type { InstitutionOverviewData } from '../types'

export async function getInstitutionOverview(): Promise<InstitutionOverviewData> {
  // Simulate 400ms delay
  await new Promise((resolve) => setTimeout(resolve, 400))

  return {
    institutionName: 'Berana University',
    institutionSubtitle: 'Main Campus · Addis Ababa',
    kpis: {
      totalStudents: 5248,
      activeStudents: 4382,
      activeCourses: 132,
      instructors: 78,
      completionRate: 76.8,
      pendingApprovals: 42,
    },
    enrollmentTrend: [
      { label: 'Dec', totalStudents: 4180, activeStudents: 3320 },
      { label: 'Jan', totalStudents: 4460, activeStudents: 3548 },
      { label: 'Feb', totalStudents: 4725, activeStudents: 3782 },
      { label: 'Mar', totalStudents: 4950, activeStudents: 4012 },
      { label: 'Apr', totalStudents: 5095, activeStudents: 4204 },
      { label: 'May', totalStudents: 5248, activeStudents: 4382 },
    ],
    progressOverview: [
      { label: 'Completed', count: 2512, tone: 'success' },
      { label: 'In Progress', count: 1488, tone: 'info' },
      { label: 'Not Started', count: 1068, tone: 'warning' },
      { label: 'Overdue', count: 180, tone: 'danger' },
    ],
    coursePerformance: [
      {
        id: 'cp1',
        courseCode: 'CS-201',
        title: 'Data Structures & Algorithms',
        instructor: 'Dr. Aaron Selassie',
        enrolled: 312,
        completionRate: 86,
        status: 'healthy',
      },
      {
        id: 'cp2',
        courseCode: 'BUS-110',
        title: 'Principles of Management',
        instructor: 'Dr. Martha Bekele',
        enrolled: 220,
        completionRate: 79,
        status: 'healthy',
      },
      {
        id: 'cp3',
        courseCode: 'ENG-220',
        title: 'Structural Analysis',
        instructor: 'Prof. Elias Hailu',
        enrolled: 84,
        completionRate: 62,
        status: 'watch',
      },
      {
        id: 'cp4',
        courseCode: 'CYB-501',
        title: 'Network Security & Defense',
        instructor: 'Wzro. Kidist Yohannes',
        enrolled: 96,
        completionRate: 54,
        status: 'critical',
      },
    ],
    pendingEnrollments: [
      {
        id: 'pe1',
        title: 'BSc Software Engineering',
        subtitle: '18 learner applications awaiting approval',
        severity: 'high',
      },
      {
        id: 'pe2',
        title: 'MSc Data Science & AI',
        subtitle: '7 learner applications awaiting approval',
        severity: 'medium',
      },
    ],
    learnersAtRisk: [
      {
        id: 'lr1',
        title: 'CS-340 · Machine Learning Foundations',
        subtitle: '14 learners inactive for 10+ days',
        severity: 'high',
      },
      {
        id: 'lr2',
        title: 'BUS-110 · Principles of Management',
        subtitle: '9 learners below attendance threshold',
        severity: 'medium',
      },
    ],
    overdueAssessments: [
      {
        id: 'oa1',
        title: 'CYB-501 Midterm Quiz',
        subtitle: '23 submissions overdue',
        severity: 'high',
      },
      {
        id: 'oa2',
        title: 'ENG-220 Lab Report 2',
        subtitle: '11 submissions overdue',
        severity: 'medium',
      },
    ],
    coursesRequiringAttention: [
      {
        id: 'ca1',
        title: 'CYB-501 · Network Security & Defense',
        subtitle: 'Low completion and high overdue count',
        severity: 'high',
      },
      {
        id: 'ca2',
        title: 'ENG-220 · Structural Analysis',
        subtitle: 'Instructor feedback turnaround above SLA',
        severity: 'medium',
      },
    ],
    upcomingLiveClasses: [
      {
        id: 'lc1',
        title: 'Advanced Marketing Strategies',
        course: 'BUS-314',
        instructor: 'Dr. Martha Bekele',
        date: 'May 17, 2026',
        time: '02:00 PM',
      },
      {
        id: 'lc2',
        title: 'React.js Best Practices',
        course: 'CS-410',
        instructor: 'Dr. Aaron Selassie',
        date: 'May 17, 2026',
        time: '11:00 AM',
      },
      {
        id: 'lc3',
        title: 'Financial Planning Basics',
        course: 'BUS-201',
        instructor: 'Emily Davis',
        date: 'May 18, 2026',
        time: '03:00 PM',
      },
    ],
    upcomingDeadlines: [
      {
        id: 'dl1',
        title: 'Data Science Project Draft',
        course: 'DS-410',
        dueIn: 'Due in 1 day',
        status: 'upcoming',
      },
      {
        id: 'dl2',
        title: 'Business Ethics Case Study',
        course: 'BUS-220',
        dueIn: 'Due today',
        status: 'today',
      },
      {
        id: 'dl3',
        title: 'Network Security Quiz 2',
        course: 'CYB-501',
        dueIn: 'Overdue by 2 days',
        status: 'overdue',
      },
    ],
    recentActivity: [
      {
        id: 'ra1',
        text: 'New learner registered in BSc Software Engineering',
        timestamp: '10:24 AM',
        type: 'student',
      },
      {
        id: 'ra2',
        text: 'Quiz marked complete in Data Science cohort 3',
        timestamp: '09:15 AM',
        type: 'assessment',
      },
      {
        id: 'ra3',
        text: 'Instructor updated assignment rubric for BUS-110',
        timestamp: '08:42 AM',
        type: 'course',
      },
    ],
    recentAnnouncements: [
      {
        id: 'an1',
        title: 'System maintenance on May 20, 2:00 AM EAT',
        audience: 'All learners',
        postedAt: 'May 13, 2026',
        priority: 'important',
      },
      {
        id: 'an2',
        title: 'New elective courses open for registration',
        audience: 'Undergraduate students',
        postedAt: 'May 12, 2026',
        priority: 'normal',
      },
      {
        id: 'an3',
        title: 'Certificate template update is now live',
        audience: 'Instructors',
        postedAt: 'May 10, 2026',
        priority: 'normal',
      },
    ],
    statTotals: {
      campusCount: 4,
      activeCampusCount: 3,
      totalUsers: 2450,
      pendingInvitations: 38,
      activeIntegrations: 2,
      totalIntegrations: 3,
      setupProgressPercent: 71,
    },
    campuses: [
      { id: 'c1', name: 'Main Campus — Addis Ababa', status: 'active', deptCount: 6 },
      { id: 'c2', name: 'Bole Campus', status: 'active', deptCount: 4 },
      { id: 'c3', name: 'Adama Campus', status: 'active', deptCount: 3 },
      { id: 'c4', name: 'Hawassa Campus', status: 'pending', deptCount: 0 },
    ],
    setupSteps: [
      { id: 's1', title: 'Institution Profile', subtitle: 'Basic identity details', done: true },
      { id: 's2', title: 'Organizational Structure', subtitle: 'Configure campuses & departments', done: true },
      { id: 's3', title: 'Branding Guidelines', subtitle: 'Add logo & custom theme colors', done: true },
      { id: 's4', title: 'Identity & SSO Integration', subtitle: 'Connect active directory', done: true },
      { id: 's5', title: 'Roles & Permissions', subtitle: 'Define base user groups', done: true },
      { id: 's6', title: 'User Data Import', subtitle: 'Upload faculty & students via CSV', done: false },
      { id: 's7', title: 'Integration Testing', subtitle: 'Verify platform communication', done: false },
    ],
    ssoProviders: [
      { id: 'sp1', name: 'Microsoft Entra ID', subtitle: 'Azure Active Directory provider', status: 'connected' },
      { id: 'sp2', name: 'Local Accounts', subtitle: 'Standard email/password login', status: 'enabled' },
      { id: 'sp3', name: 'Google Workspace', subtitle: 'Google Cloud Identity provider', status: 'not-configured' },
    ],
    auditLogEntries: [
      { id: 'a1', type: 'warn', text: 'Role permission changed for Registrar Administrator', timestamp: '10 minutes ago' },
      { id: 'a2', type: 'info', text: 'Bulk user import initiated (340 records)', timestamp: '2 hours ago' },
      { id: 'a3', type: 'ok', text: 'Integration connected: Microsoft Entra ID', timestamp: '1 day ago' },
    ],
  }
}

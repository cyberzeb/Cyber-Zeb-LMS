import type { PersonRow } from '../../modules/institution/types'
import type { CourseRecord } from '../../modules/institution/types'
import type { CourseEnrollment } from '../../modules/institution/types'
import type { StudentDashboardData } from '../../modules/students/types'
import type { InstructorDashboardData, InstructorCertificateRow } from '../../modules/instructors/types'
import type { InstitutionOverviewData } from '../../modules/institution/types'
import {
  readAnnouncements,
  readAssignmentRecords,
  readCampusRecords,
  readCertificates,
  readCourses,
  readDepartments,
  readEnrollments,
  readHelpDeskTickets,
  readInstitutionName,
  readIntegrations,
  readLiveSessions,
  readPayments,
  readPeople,
  readPublishedApprovedCourses,
  readQuizRecords,
  readStudentSubmissions,
} from './readers'
import { courseTeachesInstructor, instructorTeachingSummary } from '../../modules/institution/utils/courseAssignmentUtils'
import { getEnrollmentProgressPercent } from '../../modules/students/utils/studentLearningProgress'
import {
  computeStudentAssessmentStats,
  countUpcomingLiveSessions,
  toAdminAssignmentSubmissions,
  toInstructorAssignments,
  toInstructorLiveClasses,
  toInstructorQuizzes,
  toInstructorUpcomingTasks,
  toStudentAssignments,
  toStudentLiveClasses,
  toStudentQuizzes,
  toStudentUpcomingDeadlines,
  toUpcomingDeadlines,
  toUpcomingLiveClasses,
} from './assessmentUtils'
import {
  toAdminHelpDeskTickets,
  toInstructorHelpDeskTickets,
  toIntegrationStatusItems,
  toStudentHelpDeskTickets,
  toStudentPayments,
} from './platformUtils'
import {
  filterAnnouncementsForInstructorFeed,
  filterAnnouncementsForStudent,
  toAdminAnnouncementItems,
  toInstructorAnnouncementItems,
  toStudentAnnouncementItems,
} from './announcementUtils'
import { certificateToStudentItem } from '../../modules/institution/api/certificatesApi'

function emptyStudentDashboard(student: PersonRow): StudentDashboardData {
  return {
    studentId: student.id,
    studentName: student.name,
    email: student.email,
    department: student.department,
    program: student.department,
    term: 'Current term',
    standing: 'Not enrolled yet',
    stats: [
      { label: 'Active Courses', value: '0', detail: 'Enroll via admin' },
      { label: 'Due This Week', value: '0', detail: 'No deadlines' },
      { label: 'Avg. Quiz Score', value: '—', detail: 'No quizzes yet' },
      { label: 'Current GPA', value: '—', detail: 'No grades yet' },
    ],
    resources: [],
    quizzes: [],
    assignments: [],
    schedule: [],
    grades: [],
    courses: [],
    liveClasses: [],
    attendance: [],
    announcements: [],
    forumThreads: [],
    certificates: [],
    payments: [],
    helpDeskTickets: [],
    kpis: {
      activeCourses: 0,
      avgQuizScore: 0,
      gpa: 0,
      attendanceRate: 0,
      dueThisWeek: 0,
      upcomingSessions: 0,
      assignmentsCompleted: 0,
      studyHoursWeekly: 0,
    },
    kpiTrends: {
      gpa: [0],
      quizScores: [0],
      courseProgress: [0],
      attendanceRate: [0],
      assignmentsCompleted: [0],
      studyHours: [0],
    },
    progressOverview: [
      { label: 'Completed', count: 0, tone: 'success' },
      { label: 'In Progress', count: 0, tone: 'info' },
      { label: 'Due Soon', count: 0, tone: 'warning' },
      { label: 'Overdue', count: 0, tone: 'danger' },
    ],
    gradeTrend: [],
    gradeHistory: [],
    quizScoreTrend: [],
    attendanceTrend: [],
    studyHoursTrend: [],
    upcomingDeadlines: [],
    recentActivity: [],
  }
}

function enrollmentToCourse(
  enrollment: CourseEnrollment,
  course: CourseRecord | undefined,
  studentId: string,
) {
  const progress = course
    ? getEnrollmentProgressPercent(studentId, course)
    : enrollment.progress
  const allComplete = course && progress >= 100

  return {
    id: enrollment.courseId,
    code: enrollment.courseCode,
    title: enrollment.courseTitle,
    instructor: course?.instructor ?? 'Unassigned',
    progress,
    nextSession: course?.startDate ?? 'Schedule TBA',
    credits: course?.credits ?? 3,
    status: allComplete
      ? ('completed' as const)
      : enrollment.status === 'active'
        ? ('active' as const)
        : ('upcoming' as const),
    department: course?.department ?? '',
  }
}

export function buildStudentDashboard(student: PersonRow): StudentDashboardData {
  const base = emptyStudentDashboard(student)

  const enrollments = readEnrollments().filter(
    (e) => e.studentId === student.id && e.status === 'active',
  )

  const coursesCatalog = readPublishedApprovedCourses()

  const courses = enrollments
    .map((e) => {
      const course = coursesCatalog.find((c) => c.id === e.courseId)
      return enrollmentToCourse(e, course, student.id)
    })
    .filter((c) => c.code)

  if (courses.length === 0) {
    const enrolledCourseIds = enrollments.map((e) => e.courseId)

    const announcementRecords = filterAnnouncementsForStudent(
      readAnnouncements(),
      student.id,
      enrolledCourseIds,
    )

    const studentCertificates = readCertificates()
      .filter((c) => c.studentId === student.id && c.status !== 'revoked')
      .map(certificateToStudentItem)

    const paymentRecords = readPayments()
    const helpDeskRecords = readHelpDeskTickets()

    return {
      ...base,
      payments: toStudentPayments(paymentRecords, student.id),
      helpDeskTickets: toStudentHelpDeskTickets(helpDeskRecords, student.id),
      announcements: toStudentAnnouncementItems(announcementRecords),
      certificates: studentCertificates,
    }
  }

  const activeCount = courses.filter((c) => c.status === 'active').length

  const enrolledCourseIds = enrollments.map((e) => e.courseId)

  const announcementRecords = filterAnnouncementsForStudent(
    readAnnouncements(),
    student.id,
    enrolledCourseIds,
  )

  const studentCertificates = readCertificates()
    .filter((c) => c.studentId === student.id && c.status !== 'revoked')
    .map(certificateToStudentItem)

  const liveSessions = readLiveSessions()
  const assignments = readAssignmentRecords()
  const quizzes = readQuizRecords()
  const submissions = readStudentSubmissions()

  const liveClasses = toStudentLiveClasses(liveSessions, student.id)
  const studentQuizzes = toStudentQuizzes(quizzes, submissions, student.id)
  const studentAssignments = toStudentAssignments(assignments, submissions, student.id)
  const upcomingDeadlines = toStudentUpcomingDeadlines(
    assignments,
    quizzes,
    submissions,
    student.id,
  )
  const assessmentStats = computeStudentAssessmentStats(
    studentQuizzes,
    studentAssignments,
    liveClasses,
  )

  const paymentRecords = readPayments()
  const helpDeskRecords = readHelpDeskTickets()

  return {
    ...base,
    courses,
    liveClasses,
    quizzes: studentQuizzes,
    assignments: studentAssignments,
    payments: toStudentPayments(paymentRecords, student.id),
    helpDeskTickets: toStudentHelpDeskTickets(helpDeskRecords, student.id),
    upcomingDeadlines,
    announcements: toStudentAnnouncementItems(announcementRecords),
    certificates: studentCertificates,
    standing: `${activeCount} active course${activeCount === 1 ? '' : 's'}`,
    kpis: {
      ...base.kpis,
      activeCourses: activeCount,
      avgQuizScore: assessmentStats.avgQuizScore,
      dueThisWeek: assessmentStats.dueThisWeek,
      upcomingSessions: assessmentStats.upcomingSessions,
      assignmentsCompleted: assessmentStats.assignmentsCompleted,
    },
    stats: base.stats.map((s) => {
      if (s.label === 'Active Courses') {
        return { ...s, value: String(activeCount), detail: `${courses.length} enrolled` }
      }
      if (s.label === 'Due This Week') {
        return {
          ...s,
          value: String(assessmentStats.dueThisWeek),
          detail: assessmentStats.dueThisWeek === 1 ? '1 deadline' : `${assessmentStats.dueThisWeek} deadlines`,
        }
      }
      if (s.label === 'Avg. Quiz Score') {
        return {
          ...s,
          value: assessmentStats.avgQuizScore > 0 ? `${assessmentStats.avgQuizScore}%` : '—',
          detail: assessmentStats.avgQuizScore > 0 ? 'From completed quizzes' : 'No quizzes yet',
        }
      }
      return s
    }),
    progressOverview: [
      {
        label: 'In Progress',
        count: studentAssignments.filter((a) => a.status === 'Ready to submit').length,
        tone: 'info' as const,
      },
      {
        label: 'Completed',
        count: studentAssignments.filter((a) => a.status !== 'Ready to submit').length,
        tone: 'success' as const,
      },
      {
        label: 'Due Soon',
        count: upcomingDeadlines.filter((d) => d.status === 'upcoming' || d.status === 'today').length,
        tone: 'warning' as const,
      },
      {
        label: 'Overdue',
        count: upcomingDeadlines.filter((d) => d.status === 'overdue').length,
        tone: 'danger' as const,
      },
    ],
    recentActivity: [
      ...studentAssignments.slice(0, 2).map((a, i) => ({
        id: `asg-act-${i}`,
        text: `Assignment “${a.title}” — ${a.status}`,
        timestamp: a.dueAt,
      })),
      ...courses.slice(0, 2).map((c, i) => ({
        id: `act-${i}`,
        text: `Enrolled in ${c.code} — ${c.title}`,
        timestamp: 'From admin enrollments',
      })),
    ],
  }
}

function emptyInstructorDashboard(instructor: PersonRow): InstructorDashboardData {
  return {
    instructorId: instructor.id,
    instructorName: instructor.name,
    email: instructor.email,
    title: 'Instructor',
    department: 'Course faculty',
    term: 'Current term',
    officeHours: 'Not set',
    specialization: 'Assign courses to set teaching load',
    resources: [],
    quizzes: [],
    assignments: [],
    schedule: [],
    gradebook: [],
    courses: [],
    liveClasses: [],
    attendanceSessions: [],
    announcements: [],
    forumThreads: [],
    students: [],
    helpDeskTickets: [],
    kpis: {
      activeCourses: 0,
      totalStudents: 0,
      pendingGrading: 0,
      avgClassScore: 0,
      upcomingSessions: 0,
      ungradedSubmissions: 0,
      forumThreads: 0,
      officeHoursWeekly: 0,
    },
    kpiTrends: {
      classAvgScore: [0],
      submissionsGraded: [0],
      attendanceRate: [0],
      activeStudents: [0],
      forumEngagement: [0],
      sessionsHeld: [0],
    },
    workloadOverview: [
      { label: 'Graded', count: 0, tone: 'success' },
      { label: 'Pending review', count: 0, tone: 'warning' },
      { label: 'Upcoming deadlines', count: 0, tone: 'info' },
      { label: 'Overdue grading', count: 0, tone: 'danger' },
    ],
    classScoreTrend: [],
    gradingTrend: [],
    attendanceTrend: [],
    engagementTrend: [],
    upcomingTasks: [],
    recentActivity: [],
  }
}

export function buildInstructorDashboard(instructor: PersonRow): InstructorDashboardData {
  const base = emptyInstructorDashboard(instructor)
  const allCourses = readCourses()

  const myCourses = allCourses.filter((c) =>
    courseTeachesInstructor(c, instructor.id, instructor.name),
  )

  const enrollments = readEnrollments()

  const teachingCourses = myCourses.map((c) => {
    const enrolled = enrollments.filter(
      (e) => e.courseId === c.id && e.status === 'active',
    )

    return {
      id: c.id,
      code: c.code,
      title: c.title,
      enrolledCount: enrolled.length,
      nextSession: c.startDate ?? 'Schedule TBA',
      progress: c.progressPercent,
      credits: c.credits ?? 3,
      status:
        c.approvalStatus === 'pending'
          ? ('upcoming' as const)
          : c.status === 'published'
            ? ('active' as const)
            : ('upcoming' as const),
      department: c.department,
      pendingGrading: 0,
    }
  })

  const courseIds = new Set(myCourses.map((c) => c.id))
  const people = readPeople()

  const students = enrollments
    .filter((e) => courseIds.has(e.courseId) && e.status === 'active')
    .map((enrollment) => {
      const person = people.find((p) => p.id === enrollment.studentId)
      const course = myCourses.find((c) => c.id === enrollment.courseId)

      return {
        id: `${enrollment.studentId}-${enrollment.courseId}`,
        name: person?.name ?? enrollment.studentName,
        email: person?.email ?? '',
        course: course?.code ?? enrollment.courseCode,
        attendanceRate: enrollment.progress,
        avgGrade: enrollment.progress,
        status: 'active' as const,
        lastActive: person?.lastActive ?? '—',
      }
    })

  const activeCourses = teachingCourses.filter((c) => c.status === 'active').length
  const teachingSummary = instructorTeachingSummary(
    allCourses,
    instructor.id,
    instructor.name,
  )

  const teachingCourseIds = myCourses.map((course) => course.id)

  const announcementRecords = filterAnnouncementsForInstructorFeed(
    readAnnouncements(),
    instructor.id,
    teachingCourseIds,
  )

  const liveSessions = readLiveSessions()
  const assignments = readAssignmentRecords()
  const quizzes = readQuizRecords()
  const submissions = readStudentSubmissions()

  const liveClasses = toInstructorLiveClasses(
    liveSessions,
    instructor.id,
    instructor.name,
  )
  const instructorQuizzes = toInstructorQuizzes(
    quizzes,
    submissions,
    instructor.id,
    instructor.name,
  )
  const instructorAssignments = toInstructorAssignments(
    assignments,
    submissions,
    instructor.id,
    instructor.name,
  )
  const pendingGrading = instructorAssignments.reduce(
    (sum, a) => sum + a.pendingCount,
    0,
  )
  const assessmentTasks = toInstructorUpcomingTasks(
    assignments,
    quizzes,
    liveSessions,
    instructor.id,
    instructor.name,
  )

  const helpDeskRecords = readHelpDeskTickets()

  return {
    ...base,
    department: teachingSummary.label,
    specialization:
      teachingSummary.departments.length > 0
        ? teachingSummary.departments.join(', ')
        : 'No courses assigned yet',
    courses: teachingCourses,
    students,
    liveClasses,
    quizzes: instructorQuizzes,
    assignments: instructorAssignments,
    helpDeskTickets: toInstructorHelpDeskTickets(helpDeskRecords, instructor.id),
    announcements: toInstructorAnnouncementItems(
      announcementRecords,
      instructor.id,
    ),
    kpis: {
      ...base.kpis,
      activeCourses,
      totalStudents: students.length,
      pendingGrading,
      ungradedSubmissions: pendingGrading,
      upcomingSessions: liveClasses.filter((s) => s.status === 'upcoming').length,
    },
    workloadOverview: [
      {
        label: 'Graded',
        count: instructorAssignments.filter((a) => a.status === 'Graded').length,
        tone: 'success' as const,
      },
      {
        label: 'Pending review',
        count: pendingGrading,
        tone: 'warning' as const,
      },
      {
        label: 'Upcoming deadlines',
        count: assessmentTasks.filter((t) => t.type !== 'session').length,
        tone: 'info' as const,
      },
      {
        label: 'Overdue grading',
        count: instructorAssignments.filter((a) => a.pendingCount > 0).length,
        tone: 'danger' as const,
      },
    ],
    upcomingTasks: [
      ...assessmentTasks,
      ...myCourses
        .filter((c) => c.approvalStatus === 'pending')
        .map((c) => ({
          id: c.id,
          title: `Awaiting approval: ${c.title}`,
          course: c.code,
          dueIn: c.submittedAt ?? 'Pending',
          status: 'upcoming' as const,
          type: 'announcement' as const,
        })),
    ],
    recentActivity: [
      ...instructorAssignments.slice(0, 2).map((a, i) => ({
        id: `asg-act-${i}`,
        text: `${a.pendingCount} submission${a.pendingCount === 1 ? '' : 's'} pending for “${a.title}”`,
        timestamp: a.dueAt,
      })),
      ...myCourses.slice(0, 2).map((c, i) => ({
        id: `act-${i}`,
        text:
          c.approvalStatus === 'pending'
            ? `Course proposal “${c.title}” pending admin approval.`
            : `Teaching ${c.code} — ${
                enrollments.filter(
                  (e) => e.courseId === c.id && e.status === 'active',
                ).length
              } students enrolled.`,
        timestamp: c.submittedAt ?? 'Active',
      })),
    ],
  }
}

function sparklineFrom(value: number, points = 6): number[] {
  return Array.from({ length: points }, (_, i) =>
    i === points - 1
      ? value
      : Math.max(0, Math.round(value * (0.7 + i * 0.05))),
  )
}

export function buildInstitutionOverview(): InstitutionOverviewData {
  const people = readPeople()
  const courses = readCourses()
  const enrollments = readEnrollments()
  const certificates = readCertificates()
  const departments = readDepartments()
  const campusRecords = readCampusRecords()

  const students = people.filter((p) => p.role === 'Student')
  const instructors = people.filter((p) => p.role === 'Instructor')
  const activeStudents = students.filter((p) => p.status === 'active').length
  const activeCourses = courses.filter((c) => c.status === 'published').length
  const pendingApprovals = courses.filter(
    (c) => c.approvalStatus === 'pending',
  ).length
  const pendingEnrollmentRows = enrollments.filter(
    (e) => e.status === 'pending',
  )

  const completionRate = enrollments.length
    ? Math.round(
        enrollments.reduce((sum, e) => sum + e.progress, 0) /
          enrollments.length,
      )
    : 0

  const certificatesIssued = certificates.filter(
    (c) => c.status === 'issued',
  ).length

  const campuses = campusRecords.map((campus) => ({
    ...campus,
    deptCount: departments.filter((d) => d.campusId === campus.id).length,
  }))

  const setupSteps = [
    {
      id: 'profile',
      title: 'University Setup',
      subtitle: 'Tenant profile and regional settings',
      done: Boolean(readInstitutionName()?.trim()),
      href: '/admin/settings',
    },
    {
      id: 'structure',
      title: 'Academic Structure',
      subtitle: 'Campuses, colleges and departments',
      done: campusRecords.length > 0 && departments.length > 0,
      href: '/admin/institution/structure',
    },
    {
      id: 'calendar',
      title: 'Academic Year / Term',
      subtitle: 'Calendar and current term',
      done: false,
      href: '/admin/institution/academic-calendar',
    },
    {
      id: 'catalog',
      title: 'Course Catalog',
      subtitle: 'Reusable course templates',
      done: courses.length > 0,
      href: '/admin/courses',
    },
    {
      id: 'offerings',
      title: 'Course Offerings',
      subtitle: 'Term-bound sections',
      done: false,
      href: '/admin/course-offerings',
    },
    {
      id: 'enrollments',
      title: 'Student Enrollment',
      subtitle: 'Register students into offerings',
      done: enrollments.some((e) => e.status === 'active'),
      href: '/admin/enrollments',
    },
  ]

  const setupDone = setupSteps.filter((s) => s.done).length

  const liveSessions = readLiveSessions()
  const assignments = readAssignmentRecords()
  const quizzes = readQuizRecords()
  const submissions = readStudentSubmissions()
  const upcomingLiveCount = countUpcomingLiveSessions(liveSessions)
  const helpDeskRecords = readHelpDeskTickets()
  const integrationRecords = readIntegrations()
  const connectedIntegrations = integrationRecords.filter(
    (i) => i.enabled && i.status === 'connected',
  ).length

  return {
    institutionName: readInstitutionName(),
    institutionSubtitle:
      departments.length > 0
        ? `${departments.length} department${
            departments.length === 1 ? '' : 's'
          } · ${campusRecords.length} campus${
            campusRecords.length === 1 ? '' : 'es'
          }`
        : 'Complete setup to get started',
    kpis: {
      totalStudents: students.length,
      activeStudents,
      activeCourses,
      instructors: instructors.length,
      completionRate,
      pendingApprovals,
      upcomingLiveSessions: upcomingLiveCount,
      certificatesIssued,
    },
    kpiTrends: {
      totalStudents: sparklineFrom(students.length),
      activeStudents: sparklineFrom(activeStudents),
      activeCourses: sparklineFrom(activeCourses),
      instructors: sparklineFrom(instructors.length),
      completionRate: sparklineFrom(completionRate),
      pendingApprovals: sparklineFrom(pendingApprovals),
      upcomingLiveSessions: sparklineFrom(upcomingLiveCount),
      certificatesIssued: sparklineFrom(certificatesIssued),
    },
    enrollmentTrend: [
      {
        label: 'Now',
        totalStudents: students.length,
        activeStudents,
      },
    ],
    progressOverview: [
      {
        label: 'Active enrollments',
        count: enrollments.filter((e) => e.status === 'active').length,
        tone: 'success',
      },
      {
        label: 'Pending enrollments',
        count: pendingEnrollmentRows.length,
        tone: 'warning',
      },
      {
        label: 'Published courses',
        count: activeCourses,
        tone: 'info',
      },
      {
        label: 'Course proposals',
        count: pendingApprovals,
        tone: 'danger',
      },
    ],
    coursePerformance: courses.slice(0, 6).map((c) => ({
      id: c.id,
      courseCode: c.code,
      title: c.title,
      instructor: c.instructor,
      enrolled: enrollments.filter(
        (e) => e.courseId === c.id && e.status === 'active',
      ).length,
      completionRate: c.progressPercent,
      status: (
        c.progressPercent >= 80
          ? 'healthy'
          : c.progressPercent >= 50
            ? 'watch'
            : 'critical'
      ) as 'healthy' | 'watch' | 'critical',
    })),
    pendingEnrollments: pendingEnrollmentRows.slice(0, 5).map((e) => ({
      id: e.id,
      title: e.studentName,
      subtitle: `${e.courseCode} · pending`,
      severity: 'medium' as const,
    })),
    learnersAtRisk: [],
    overdueAssessments: [],
    coursesRequiringAttention: courses
      .filter((c) => c.approvalStatus === 'pending')
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        title: c.title,
        subtitle: `Proposed by ${c.submittedByName ?? c.instructor}`,
        severity: 'high' as const,
      })),
    upcomingLiveClasses: toUpcomingLiveClasses(liveSessions),
    upcomingDeadlines: toUpcomingDeadlines(assignments, quizzes),
    recentActivity: [
      ...people.slice(-3).map((p, i) => ({
        id: `person-${i}`,
        text: `${p.name} added as ${p.role}`,
        timestamp: p.lastActive,
        type: 'student' as const,
      })),
      ...courses.slice(-2).map((c, i) => ({
        id: `course-${i}`,
        text: `Course ${c.code} — ${c.status}${
          c.approvalStatus === 'pending' ? ' (pending approval)' : ''
        }`,
        timestamp: c.submittedAt ?? 'Catalog',
        type: 'course' as const,
      })),
    ],
    recentAnnouncements: toAdminAnnouncementItems(
      readAnnouncements(),
    ).slice(0, 5),
    calendarEvents: [
      {
        id: 'e1',
        day: '12',
        month: 'AUG',
        title: 'Fall Semester Registration',
        subtitle: 'Undergraduate & Postgraduate cohorts',
      },
      {
        id: 'e2',
        day: '05',
        month: 'SEP',
        title: 'Orientation & Induction Day',
        subtitle: 'Freshman and transfer student meetups',
      },
      {
        id: 'e3',
        day: '18',
        month: 'OCT',
        title: 'Mid-term Assessment Week',
        subtitle: 'Continuous assessment tests (CAT)',
      },
    ],
    helpDeskTickets: toAdminHelpDeskTickets(helpDeskRecords).slice(0, 6),
    assignmentSubmissions: toAdminAssignmentSubmissions(assignments, submissions),
    integrationStatus: toIntegrationStatusItems(integrationRecords).slice(0, 6),
    statTotals: {
      campusCount: campusRecords.length,
      activeCampusCount: campusRecords.filter(
        (c) => c.status === 'active',
      ).length,
      totalUsers: people.length,
      pendingInvitations: people.filter((p) => p.status === 'invited').length,
      activeIntegrations: connectedIntegrations,
      totalIntegrations: integrationRecords.length,
      setupProgressPercent: Math.round(
        (setupDone / setupSteps.length) * 100,
      ),
    },
    campuses,
    setupSteps,
    ssoProviders: [
      {
        id: 'google',
        name: 'Google Workspace',
        subtitle: 'SSO',
        status: 'not-configured' as const,
      },
      {
        id: 'microsoft',
        name: 'Microsoft Entra',
        subtitle: 'SSO',
        status: 'not-configured' as const,
      },
    ],
    auditLogEntries: recentActivityToAudit(
      people,
      courses,
      enrollments,
    ),
  }
}

function recentActivityToAudit(
  people: PersonRow[],
  courses: CourseRecord[],
  enrollments: CourseEnrollment[],
) {
  const entries = []

  if (people.length) {
    entries.push({
      id: 'audit-people',
      type: 'info' as const,
      text: `${people.length} people in directory`,
      timestamp: 'Now',
    })
  }

  if (courses.length) {
    entries.push({
      id: 'audit-courses',
      type: 'ok' as const,
      text: `${courses.length} courses in catalog`,
      timestamp: 'Now',
    })
  }

  if (enrollments.length) {
    entries.push({
      id: 'audit-enroll',
      type: 'ok' as const,
      text: `${enrollments.length} enrollment records`,
      timestamp: 'Now',
    })
  }

  return entries
}

// ─── Instructor Certificates ──────────────────────────────────────────────────

/**
 * Builds the certificate view rows for the instructor-scoped certificates page.
 *
 * Logic:
 *   - Only enrollments in courses taught by this instructor are included.
 *   - For each enrollment we join with CertificateRecord (if one exists).
 *   - certStatus derivation:
 *       'issued'      — a CertificateRecord with status='issued' exists
 *       'pending'     — a CertificateRecord with status='pending' exists
 *       'eligible'    — progress >= 80 and no certificate record yet
 *       'not-eligible'— progress < 80 and no certificate record
 */
export function buildInstructorCertificates(
  instructor: PersonRow,
): InstructorCertificateRow[] {
  const allCourses = readCourses()

  const myCourses = allCourses.filter((c) =>
    courseTeachesInstructor(c, instructor.id, instructor.name),
  )

  if (myCourses.length === 0) return []

  const courseIds = new Set(myCourses.map((c) => c.id))
  const people = readPeople()

  const enrollments = readEnrollments().filter(
    (e) => courseIds.has(e.courseId) && e.status === 'active',
  )

  const certificates = readCertificates()
  const institutionName = readInstitutionName()

  return enrollments.map((enrollment): InstructorCertificateRow => {
    const person = people.find((p) => p.id === enrollment.studentId)
    const course = myCourses.find((c) => c.id === enrollment.courseId)

    const certRecord = certificates.find(
      (c) =>
        c.studentId === enrollment.studentId &&
        c.courseId === enrollment.courseId &&
        c.status !== 'revoked',
    )

    const progress = enrollment.progress
    const gradeDisplay = progress > 0 ? `${progress}%` : '—'

    let certStatus: InstructorCertificateRow['certStatus']

    if (certRecord?.status === 'issued') {
      certStatus = 'issued'
    } else if (certRecord?.status === 'pending') {
      certStatus = 'pending'
    } else if (progress >= 80) {
      certStatus = 'eligible'
    } else {
      certStatus = 'not-eligible'
    }

    const completionDateDisplay = certRecord?.completionDate
      ? new Date(certRecord.completionDate).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : progress >= 100
        ? 'Completed'
        : undefined

    const issuedAtDisplay = certRecord?.issueDate
      ? new Date(certRecord.issueDate).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : undefined

    return {
      id: `${enrollment.studentId}-${enrollment.courseId}`,
      studentId: enrollment.studentId,
      studentName: person?.name ?? enrollment.studentName,
      studentEmail: person?.email ?? '',
      courseId: enrollment.courseId,
      courseCode: course?.code ?? enrollment.courseCode,
      courseTitle: course?.title ?? enrollment.courseTitle,
      completionPercent: progress,
      finalGrade: gradeDisplay,
      completionDate: completionDateDisplay,
      certStatus,
      certificateId: certRecord?.certificateId,
      issuedAt: issuedAtDisplay,
      certRecordId: certRecord?.id,
      institution: institutionName,
    }
  })
}
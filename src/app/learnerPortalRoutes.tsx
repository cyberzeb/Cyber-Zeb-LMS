import type { RouteObject } from 'react-router-dom'
import { StudentDashboardPage } from '../modules/students/pages/studentdashboard'
import { StudentResourcesPage } from '../modules/students/pages/studentresources'
import { StudentQuizzesPage } from '../modules/students/pages/studentquizzes'
import { StudentAssignmentsPage } from '../modules/students/pages/studentassignments'
import { StudentCalendarPage } from '../modules/students/pages/studentcalendar'
import { StudentGradesPage } from '../modules/students/pages/studentgrades'
import { StudentCoursesShell } from '../modules/students/pages/StudentCoursesShell'
import { StudentLiveClassesPage } from '../modules/students/pages/studentliveclasses'
import { StudentAttendancePage } from '../modules/students/pages/studentattendance'
import { StudentAnnouncementsPage } from '../modules/students/pages/studentannouncements'
import { StudentForumPage } from '../modules/students/pages/studentforum'
import { StudentCertificatesPage } from '../modules/students/pages/studentcertificates'
import { StudentPaymentsPage } from '../modules/students/pages/studentpayments'
import { StudentHelpDeskPage } from '../modules/students/pages/studenthelpdesk'
import { StudentSettingsPage } from '../modules/students/pages/studentsettings'

/** Shared route tree for `/student` and `/employee` learner portals. */
export const learnerPortalChildren: RouteObject[] = [
  {
    index: true,
    element: <StudentDashboardPage />,
  },
  {
    path: 'resources',
    element: <StudentResourcesPage />,
  },
  {
    path: 'quizzes',
    element: <StudentQuizzesPage />,
  },
  {
    path: 'assignments',
    element: <StudentAssignmentsPage />,
  },
  {
    path: 'calendar',
    element: <StudentCalendarPage />,
  },
  {
    path: 'grades',
    element: <StudentGradesPage />,
  },
  {
    path: 'courses',
    element: <StudentCoursesShell />,
  },
  {
    path: 'courses/:courseId/learn',
    element: <StudentCoursesShell />,
  },
  {
    path: 'courses/:courseId/learn/:lessonId',
    element: <StudentCoursesShell />,
  },
  {
    path: 'live-classes',
    element: <StudentLiveClassesPage />,
  },
  {
    path: 'attendance',
    element: <StudentAttendancePage />,
  },
  {
    path: 'announcements',
    element: <StudentAnnouncementsPage />,
  },
  {
    path: 'forum',
    element: <StudentForumPage />,
  },
  {
    path: 'certificates',
    element: <StudentCertificatesPage />,
  },
  {
    path: 'payments',
    element: <StudentPaymentsPage />,
  },
  {
    path: 'help-desk',
    element: <StudentHelpDeskPage />,
  },
  {
    path: 'settings',
    element: <StudentSettingsPage />,
  },
]

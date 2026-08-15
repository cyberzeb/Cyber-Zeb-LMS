import { createBrowserRouter } from 'react-router-dom'
import { InstitutionAdminLayout } from './InstitutionAdminLayout'
import { CampusProfilePage } from '../modules/institution/pages/CampusProfilePage'
import { InstitutionOverviewPage } from '../modules/institution/pages/InstitutionOverviewPage'
import { DepartmentsPage } from '../modules/institution/pages/DepartmentsPage'
import { ProgramsPage } from '../modules/institution/pages/ProgramsPage'
import { CoursesPage } from '../modules/institution/pages/CoursesPage'
import { PeoplePage } from '../modules/institution/pages/PeoplePage'
import { ReportsPage } from '../modules/institution/pages/ReportsPage'
import { SettingsPage } from '../modules/institution/pages/SettingsPage'
import { LandingPage } from '../modules/marketing/pages/LandingPage'
import { StudentLayout } from '../modules/students/layout/StudentLayout'
import { StudentDashboardPage } from '../modules/students/pages/studentdashboard'
import { StudentResourcesPage } from '../modules/students/pages/studentresources'
import { StudentQuizzesPage } from '../modules/students/pages/studentquizzes'
import { StudentAssignmentsPage } from '../modules/students/pages/studentassignments'
import { StudentCalendarPage } from '../modules/students/pages/studentcalendar'
import { StudentGradesPage } from '../modules/students/pages/studentgrades'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/student',
    element: <StudentLayout />,
    children: [
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
    ],
  },
  {
    path: '/admin',
    element: <InstitutionAdminLayout />,
    children: [
      {
        index: true,
        element: <InstitutionOverviewPage />,
      },
      {
        path: 'institution/overview',
        element: <InstitutionOverviewPage />,
      },
      {
        path: 'institution/dashboard',
        element: <InstitutionOverviewPage />,
      },
      {
        path: 'institution/profile',
        element: <CampusProfilePage />,
      },
      {
        path: 'institution/departments',
        element: <DepartmentsPage />,
      },
      {
        path: 'institution/programs',
        element: <ProgramsPage />,
      },
      {
        path: 'courses',
        element: <CoursesPage />,
      },
      {
        path: 'people',
        element: <PeoplePage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'live-classes',
        element: <CoursesPage />,
      },
      {
        path: 'assignments',
        element: <CoursesPage />,
      },
      {
        path: 'quizzes-exams',
        element: <CoursesPage />,
      },
      {
        path: 'question-bank',
        element: <CoursesPage />,
      },
      {
        path: 'students',
        element: <PeoplePage />,
      },
      {
        path: 'instructors',
        element: <PeoplePage />,
      },
      {
        path: 'enrollments',
        element: <PeoplePage />,
      },
      {
        path: 'attendance',
        element: <ReportsPage />,
      },
      {
        path: 'announcements',
        element: <ReportsPage />,
      },
      {
        path: 'discussion-forum',
        element: <ReportsPage />,
      },
      {
        path: 'certificates',
        element: <ReportsPage />,
      },
      {
        path: 'resources',
        element: <CoursesPage />,
      },
      {
        path: 'calendar',
        element: <CampusProfilePage />,
      },
      {
        path: 'payments',
        element: <ReportsPage />,
      },
      {
        path: 'api-integrations',
        element: <SettingsPage />,
      },
      {
        path: 'help-desk',
        element: <SettingsPage />,
      },
    ],
  },
])

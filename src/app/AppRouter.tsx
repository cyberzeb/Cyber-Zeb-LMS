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
import { InstitutionLandingPage } from '../modules/marketing/pages/InstitutionLandingPage'
import { StudentLayout } from '../modules/students/layout/StudentLayout'
import { StudentDashboardPage } from '../modules/students/pages/studentdashboard'
import { StudentResourcesPage } from '../modules/students/pages/studentresources'
import { StudentQuizzesPage } from '../modules/students/pages/studentquizzes'
import { StudentAssignmentsPage } from '../modules/students/pages/studentassignments'
import { StudentCalendarPage } from '../modules/students/pages/studentcalendar'
import { StudentGradesPage } from '../modules/students/pages/studentgrades'
import { SuperAdminLayout } from '../modules/superadmin/layout/SuperAdminLayout'
import { SuperAdminLoginPage } from '../modules/superadmin/pages/SuperAdminLoginPage'
import { ServiceRequestsListPage } from '../modules/superadmin/pages/ServiceRequestsListPage'
import { ServiceRequestDetailPage } from '../modules/superadmin/pages/ServiceRequestDetailPage'
import { ManageModulesPage } from '../modules/superadmin/pages/ManageModulesPage'
import { AddOnRequestsPage } from '../modules/superadmin/pages/AddOnRequestsPage'
import { RenewalsPage } from '../modules/superadmin/pages/RenewalsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    // Local fallback only; production tenant lookup is by subdomain host.
    path: '/institution/:slug',
    element: <InstitutionLandingPage />,
  },
  {
    path: '/super-admin',
    element: <SuperAdminLayout />,
    children: [
      { index: true, element: <ServiceRequestsListPage /> },
      { path: 'requests/:id', element: <ServiceRequestDetailPage /> },
      { path: 'addons', element: <AddOnRequestsPage /> },
      { path: 'modules', element: <ManageModulesPage /> },
      { path: 'renewals', element: <RenewalsPage /> },
      { path: 'login', element: <SuperAdminLoginPage /> },
    ],
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
        element: <CampusProfilePage />,
      },
      {
        path: 'institution/overview',
        element: <InstitutionOverviewPage />,
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
    ],
  },
])

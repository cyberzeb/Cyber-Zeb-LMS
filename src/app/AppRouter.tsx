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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
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

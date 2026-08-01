import { createBrowserRouter } from 'react-router-dom'
import { InstitutionAdminLayout } from './InstitutionAdminLayout'
import { CampusProfilePage } from '../modules/institution/pages/CampusProfilePage'
import { InstitutionOverviewPage } from '../modules/institution/pages/InstitutionOverviewPage'
import { LandingPage } from '../modules/marketing/pages/LandingPage'
import { SuperAdminLeadsPage } from '../modules/superadmin/pages/SuperAdminLeadsPage'

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
    ],
  },
  {
    path: '/admin/leads',
    element: <SuperAdminLeadsPage />,
  },
])
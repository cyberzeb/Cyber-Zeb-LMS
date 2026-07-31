import { createBrowserRouter } from 'react-router-dom'
import { InstitutionAdminLayout } from './InstitutionAdminLayout'
import { CampusProfilePage } from '../modules/institution/pages/CampusProfilePage'
import { InstitutionOverviewPage } from '../modules/institution/pages/InstitutionOverviewPage'

export const router = createBrowserRouter([
  {
    path: '/',
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
])

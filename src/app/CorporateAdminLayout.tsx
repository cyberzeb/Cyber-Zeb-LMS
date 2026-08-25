import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import brandLogo from '../assets/Logo.jpg'
import { Sidebar } from '../shared/layout/Sidebar'
import { AdminTopHeader } from '../shared/layout/AdminTopHeader'
import { AdminFooter } from '../shared/layout/AdminFooter'
import { PortalAuthRedirect } from '../shared/components/PortalAuthRedirect'
import { getSessionPerson, readPortalSession } from '../shared/storage/session'
import { CampusProvider, useCampusContext } from '../modules/institution/context/CampusContext'
import { readPeopleFromStorage } from '../modules/institution/hooks/usePeople'
import {
  countPendingVerifications,
  PEOPLE_UPDATED_EVENT,
} from '../modules/institution/utils/peopleVerification'
import { getEditionConfig } from '../shared/config/useOrganizationConfig'
import { useTenantBranding } from '../shared/config/useTenantBranding'
import {
  buildCorporateNavSections,
  resolveCorporateBreadcrumb,
} from '../shared/config/corporateNav'

export function CorporateAdminLayout() {
  return (
    <CampusProvider>
      <CorporateAdminShell />
    </CampusProvider>
  )
}

function CorporateAdminShell() {
  const location = useLocation()
  const path = location.pathname
  const session = readPortalSession()
  const person = getSessionPerson()
  const { campuses, selectedCampusId, setSelectedCampusId } = useCampusContext()
  const { organizationName, adminRoleLabel } = useTenantBranding()
  const editionConfig = getEditionConfig()
  const [pendingVerifications, setPendingVerifications] = useState(0)

  useEffect(() => {
    const refresh = () => {
      setPendingVerifications(countPendingVerifications(readPeopleFromStorage()))
    }
    refresh()
    window.addEventListener(PEOPLE_UPDATED_EVENT, refresh)
    return () => window.removeEventListener(PEOPLE_UPDATED_EVENT, refresh)
  }, [path])

  if (!session || session.role !== 'Admin' || !person) {
    return <PortalAuthRedirect role="Admin" />
  }

  const navSections = buildCorporateNavSections(editionConfig, path, {
    'verify-people': pendingVerifications,
  })

  const breadcrumb = resolveCorporateBreadcrumb(editionConfig, path)
  const isForumPage = path === '/admin/discussion-forum'

  return (
    <div className="flex h-screen app-shell-bg font-sans overflow-hidden">
      <Sidebar
        sections={navSections}
        brandLogoSrc={brandLogo}
        brandName={organizationName}
        brandSubtitle="Enterprise Learning"
      />

      <div className="flex flex-col flex-1 min-w-0">
        <AdminTopHeader
          userName={person.name}
          userRole={adminRoleLabel}
          institutionName={organizationName}
          breadcrumb={breadcrumb}
          campuses={campuses}
          selectedCampusId={selectedCampusId}
          onCampusChange={setSelectedCampusId}
          hideCampusSelector
        />

        <main
          className={`page-content flex-1 min-h-0 ${
            isForumPage
              ? 'overflow-hidden flex flex-col p-0'
              : 'app-scroll overflow-y-auto p-5 md:p-6'
          }`}
        >
          <div
            key={path}
            className={isForumPage ? 'flex-1 min-h-0 flex flex-col' : 'animate-fade-in-up'}
          >
            <Outlet />
          </div>
        </main>

        <AdminFooter />
      </div>
    </div>
  )
}

import { Navigate, useLocation } from 'react-router-dom'

import type { PersonRole } from '../../modules/institution/types'
import { getSessionPerson, readPortalSession } from '../storage/session'

type PortalRole = PersonRole | 'Admin'

interface PortalAuthRedirectProps {
  role: PortalRole
}

/** Redirects unauthenticated users to /login with return path. */
export function PortalAuthRedirect({ role }: PortalAuthRedirectProps) {
  const location = useLocation()
  const params = new URLSearchParams({
    role,
    redirect: location.pathname + location.search,
  })
  return <Navigate to={`/login?${params.toString()}`} replace />
}

export function usePortalAuth(role: PortalRole) {
  const session = readPortalSession()
  const person = getSessionPerson()
  const authenticated = Boolean(session && session.role === role && person)
  return { session, person, authenticated }
}

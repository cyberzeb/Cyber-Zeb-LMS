import type { PersonRole } from '../../modules/institution/types'
import { STORAGE_KEYS } from './keys'
import { readPersonById } from './readers'

export interface PortalSession {
  personId: string
  role: PersonRole | 'Admin'
}

export function readPortalSession(): PortalSession | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.session)
    if (!stored) return null
    return JSON.parse(stored) as PortalSession
  } catch {
    return null
  }
}

export function writePortalSession(session: PortalSession | null) {
  if (!session) {
    window.localStorage.removeItem(STORAGE_KEYS.session)
    return
  }
  window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session))
}

export function getSessionPerson() {
  const session = readPortalSession()
  if (!session?.personId) return null
  return readPersonById(session.personId) ?? null
}

import type { PersonRole } from '../../modules/institution/types'
import { SESSION_COOKIE_KEY } from '../api/collectionKeys'
import { STORAGE_KEYS } from './keys'
import { readPersonById } from './readers'
import { getCookie, removeCookie, setCookie } from './cookies'

export interface PortalSession {
  personId: string
  role: PersonRole | 'Admin'
}

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

function migrateLegacySession(): PortalSession | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.session)
    if (!stored) return null
    const session = JSON.parse(stored) as PortalSession
    setCookie(SESSION_COOKIE_KEY, stored, { maxAgeSeconds: SESSION_MAX_AGE_SECONDS })
    window.localStorage.removeItem(STORAGE_KEYS.session)
    return session
  } catch {
    window.localStorage.removeItem(STORAGE_KEYS.session)
    return null
  }
}

export function readPortalSession(): PortalSession | null {
  try {
    const stored = getCookie(SESSION_COOKIE_KEY)
    if (!stored) return migrateLegacySession()
    return JSON.parse(stored) as PortalSession
  } catch {
    removeCookie(SESSION_COOKIE_KEY)
    return null
  }
}

export function writePortalSession(session: PortalSession | null) {
  if (!session) {
    removeCookie(SESSION_COOKIE_KEY)
    window.localStorage.removeItem(STORAGE_KEYS.session)
    return
  }
  const payload = JSON.stringify(session)
  setCookie(SESSION_COOKIE_KEY, payload, { maxAgeSeconds: SESSION_MAX_AGE_SECONDS })
  window.localStorage.removeItem(STORAGE_KEYS.session)
}

export function getSessionPerson() {
  const session = readPortalSession()
  if (!session?.personId) return null
  return readPersonById(session.personId) ?? null
}

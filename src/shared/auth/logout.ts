import { setAccessToken } from '../api/client'
import { AUTH_TOKEN_KEY, SESSION_COOKIE_KEY } from '../api/collectionKeys'
import { STORAGE_KEYS } from '../storage/keys'
import { removeCookie } from '../storage/cookies'
import { writePortalSession } from '../storage/session'

/** Clears JWT and portal session from cookies (and legacy localStorage). */
export function clearAuthSession() {
  setAccessToken(null)
  writePortalSession(null)
  removeCookie(SESSION_COOKIE_KEY)
  removeCookie(AUTH_TOKEN_KEY)
  window.localStorage.removeItem(STORAGE_KEYS.session)
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function logout() {
  clearAuthSession()
  window.location.href = '/login'
}

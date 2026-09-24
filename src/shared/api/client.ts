import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import {
  AUTH_TOKEN_KEY,
  DEFAULT_TENANT_CODE,
  LEGACY_AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  SESSION_COOKIE_KEY,
} from './collectionKeys'
import { getCookie, removeCookie, setCookie } from '../storage/cookies'
import { getActiveTenant } from '../config/tenant'

/** The tenant code used at sign-in — the active institution, or the demo tenant. */
export function activeTenantCode(): string {
  return getActiveTenant()?.slug || DEFAULT_TENANT_CODE
}

// In Vite, always go through the /api proxy so a stale .env.local (e.g. :8000)
// cannot send the browser to a dead port. Production still honors VITE_API_BASE_URL.
const API_BASE = import.meta.env.DEV
  ? '/api/v1'
  : (import.meta.env.VITE_API_BASE_URL ?? '/api/v1')
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days (JWT may expire sooner)
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 14

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

function migrateLegacyToken(): string | null {
  const legacy = window.localStorage.getItem(LEGACY_AUTH_TOKEN_KEY)
  if (!legacy) return null
  setCookie(AUTH_TOKEN_KEY, legacy, { maxAgeSeconds: TOKEN_MAX_AGE_SECONDS })
  window.localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY)
  return legacy
}

export function getAccessToken(): string | null {
  return getCookie(AUTH_TOKEN_KEY) ?? migrateLegacyToken()
}

/**
 * Seconds-since-epoch that a JWT expires, read from its unverified payload.
 * The server is still the authority — this only lets the app notice an expired
 * session before making a request that is certain to be rejected.
 */
function tokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    // atob rejects base64url payloads that are missing their padding.
    const json = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='))
    const exp = (JSON.parse(json) as { exp?: unknown }).exp
    return typeof exp === 'number' ? exp : null
  } catch {
    return null
  }
}

/** True when the token is past its expiry. A token we cannot read is not expired. */
export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return false
  const exp = tokenExpiry(token)
  return exp !== null && exp * 1000 <= Date.now()
}

/** True when a session exists but its access token has already run out. */
export function hasExpiredAccessToken(): boolean {
  return isTokenExpired(getAccessToken())
}

/** True when the refresh token is still usable, so the session can be renewed. */
export function canRenewSession(): boolean {
  const refresh = getCookie(REFRESH_TOKEN_KEY)
  return Boolean(refresh) && !isTokenExpired(refresh)
}


export function setAccessToken(token: string | null) {
  if (token) {
    setCookie(AUTH_TOKEN_KEY, token, { maxAgeSeconds: TOKEN_MAX_AGE_SECONDS })
    window.localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY)
  } else {
    removeCookie(AUTH_TOKEN_KEY)
    window.localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY)
  }
}

export function setRefreshToken(token: string | null) {
  if (token) setCookie(REFRESH_TOKEN_KEY, token, { maxAgeSeconds: REFRESH_MAX_AGE_SECONDS })
  else removeCookie(REFRESH_TOKEN_KEY)
}

/** Store both tokens returned by a portal sign-in or refresh. */
export function setPortalTokens(accessToken: string, refreshToken: string) {
  setAccessToken(accessToken)
  setRefreshToken(refreshToken)
}

/** Drop the portal session (tokens + session cookie) and go to sign-in. */
export function endPortalSession(reason: 'expired' | 'logout' = 'expired') {
  setAccessToken(null)
  setRefreshToken(null)
  removeCookie(SESSION_COOKIE_KEY)
  const onLogin = window.location.pathname.startsWith('/login')
  if (!onLogin) {
    window.location.assign(reason === 'expired' ? '/login?expired=1' : '/login')
  }
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// One refresh at a time; concurrent 401s wait for the same renewal.
let refreshing: Promise<string | null> | null = null

async function renewAccessToken(): Promise<string | null> {
  const refreshToken = getCookie(REFRESH_TOKEN_KEY)
  if (!refreshToken) return null
  try {
    const { data } = await axios.post<{ access_token: string; refresh_token: string }>(
      `${API_BASE}/auth/portal/refresh`,
      { refresh_token: refreshToken },
    )
    setPortalTokens(data.access_token, data.refresh_token)
    return data.access_token
  } catch {
    return null
  }
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    const isAuthCall = config?.url?.startsWith('/auth/')
    if (error.response?.status !== 401 || !config || isAuthCall || config._retried) {
      throw error
    }
    refreshing ??= renewAccessToken().finally(() => {
      refreshing = null
    })
    const token = await refreshing
    if (!token) {
      endPortalSession('expired')
      throw error
    }
    config._retried = true
    config.headers.Authorization = `Bearer ${token}`
    return apiClient(config)
  },
)

type ErrorLike = {
  code?: string
  request?: unknown
  response?: {
    status?: number
    data?: { error?: { message?: unknown }; detail?: unknown }
  }
}

/** "master_data.contact.official_email" → "Official email". */
function fieldLabel(loc: unknown): string | null {
  if (!Array.isArray(loc)) return null
  const last = [...loc].reverse().find((part) => typeof part === 'string' && part !== 'body')
  if (typeof last !== 'string') return null
  const words = last.replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** FastAPI's own validation errors: `{"detail": [{"loc": [...], "msg": "..."}]}`. */
function validationDetailMessage(detail: unknown): string | null {
  if (typeof detail === 'string') return detail || null
  if (!Array.isArray(detail) || !detail.length) return null
  const first = detail[0] as { loc?: unknown; msg?: unknown }
  if (typeof first?.msg !== 'string') return null
  const msg = first.msg.replace(/^Value error,\s*/i, '')
  const field = fieldLabel(first.loc)
  const text = field ? `${field}: ${msg}` : msg
  return detail.length > 1 ? `${text} (and ${detail.length - 1} more)` : text
}

/**
 * A human-readable message for a failed API call: the server's own message when
 * it sent one, otherwise a description of what went wrong (offline, timeout,
 * server fault). Null only when nothing more specific than a generic fallback
 * can be said, so callers can supply one that fits their action.
 */
export function apiErrorMessage(err: unknown): string | null {
  const e = err as ErrorLike | null
  if (!e || typeof e !== 'object') return null
  const data = e.response?.data
  const serverMessage = data?.error?.message
  if (typeof serverMessage === 'string' && serverMessage) return serverMessage
  const detail = validationDetailMessage(data?.detail)
  if (detail) return detail

  if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT') {
    return 'The server took too long to respond. Please try again.'
  }
  const status = e.response?.status
  if (!e.response && (e.request || e.code === 'ERR_NETWORK')) {
    return 'Cannot reach the server. Check your internet connection and try again.'
  }
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.'
  if (status && status >= 500) {
    return 'The server ran into a problem. Please try again in a moment.'
  }
  return null
}

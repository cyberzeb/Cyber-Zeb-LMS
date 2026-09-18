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

/** The server's human-readable error message, if the response carried one. */
export function apiErrorMessage(err: unknown): string | null {
  const message = (err as { response?: { data?: { error?: { message?: unknown } } } })?.response?.data
    ?.error?.message
  return typeof message === 'string' && message ? message : null
}

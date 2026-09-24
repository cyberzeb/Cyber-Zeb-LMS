import axios from 'axios'

import { apiErrorMessage, isTokenExpired } from '../shared/api/client'

const baseURL = import.meta.env.DEV
  ? '/api/v1'
  : (import.meta.env.VITE_API_BASE_URL ?? '/api/v1')

export const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

/** Error carrying the HTTP status, so callers can tell 401 from a real fault. */
export interface ApiError extends Error {
  status?: number
}

function endSuperAdminSession() {
  localStorage.removeItem('berana_super_admin_token')
  localStorage.removeItem('berana_super_admin_email')
  if (window.location.pathname.startsWith('/super-admin')) {
    window.location.assign('/login?role=SuperAdmin&expired=1')
  }
}

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('berana_super_admin_token')
  if (token) {
    // An expired console token cannot be renewed (there is no super-admin
    // refresh token), so go straight back to sign-in.
    if (isTokenExpired(token)) {
      endSuperAdminSession()
      throw new Error('Your session has expired. Please sign in again.')
    }
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status: number | undefined = error?.response?.status
    // An expired super-admin session: sign in again instead of showing errors.
    if (status === 401 && localStorage.getItem('berana_super_admin_token')) {
      endSuperAdminSession()
    }
    const message = apiErrorMessage(error) ?? error?.message ?? 'Request failed'
    // Keep the status on the error: without it callers cannot tell a rejected
    // session from a backend outage, and report one as the other.
    const wrapped: ApiError = new Error(message)
    wrapped.status = status
    return Promise.reject(wrapped)
  },
)

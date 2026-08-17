import { axiosClient } from '../../../lib/axiosClient'

const TOKEN_KEY = 'berana_super_admin_token'
const EMAIL_KEY = 'berana_super_admin_email'

export function getSuperAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getSuperAdminEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY)
}

export function clearSuperAdminSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EMAIL_KEY)
}

export async function loginSuperAdmin(email: string, password: string) {
  const { data } = await axiosClient.post<{
    access_token: string
    email: string
    role: string
  }>('/auth/super-admin/login', { email, password })
  localStorage.setItem(TOKEN_KEY, data.access_token)
  localStorage.setItem(EMAIL_KEY, data.email)
  return data
}

export function logoutSuperAdmin() {
  clearSuperAdminSession()
}

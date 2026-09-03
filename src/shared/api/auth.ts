import { apiClient } from './client'
import { DEFAULT_TENANT_CODE } from './collectionKeys'

export interface DemoLoginResult {
  access_token: string
  refresh_token: string
  person_id: string
  frontend_role: string
  display_name: string
  /** Present when a provisioned institution admin signs in (their own tenant). */
  tenant_code?: string | null
  tenant_name?: string | null
  institution_type?: string | null
}

export interface OtpSendResult {
  message: string
  email: string
  role: string
  expires_in_seconds: number
  demo_code?: string
}

export async function demoLogin(personId: string, tenantCode = DEFAULT_TENANT_CODE): Promise<DemoLoginResult> {
  const { data } = await apiClient.post<DemoLoginResult>('/auth/demo-login', {
    person_id: personId,
    tenant_code: tenantCode,
  })
  return data
}

export async function sendLoginOtp(
  email: string,
  role: string,
  tenantCode = DEFAULT_TENANT_CODE,
): Promise<OtpSendResult> {
  const { data } = await apiClient.post<OtpSendResult>('/auth/otp/send', {
    email,
    role,
    tenant_code: tenantCode,
  })
  return data
}

export async function verifyLoginOtp(
  email: string,
  role: string,
  code: string,
  tenantCode = DEFAULT_TENANT_CODE,
): Promise<DemoLoginResult> {
  const { data } = await apiClient.post<DemoLoginResult>('/auth/otp/verify', {
    email,
    role,
    code,
    tenant_code: tenantCode,
  })
  return data
}

export async function fetchBootstrap(tenantCode = DEFAULT_TENANT_CODE) {
  const { data } = await apiClient.get<{ tenant_code: string; tenant_id: string; people: unknown[] }>(
    '/data/bootstrap',
    { params: { tenant_code: tenantCode } },
  )
  return data
}

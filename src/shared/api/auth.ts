import { apiClient } from './client'
import { DEFAULT_TENANT_CODE } from './collectionKeys'
import { isMockDataMode } from '../config/dataSource'
import { getDemoAccounts, DEMO_OTP_CODE } from '../data/demoAccounts'
import type { LoginRole } from '../auth/portalRoutes'
import { readPeople } from '../storage/readers'

export interface DemoLoginResult {
  access_token: string
  refresh_token: string
  person_id: string
  frontend_role: string
  display_name: string
}

export interface OtpSendResult {
  message: string
  email: string
  role: string
  expires_in_seconds: number
  demo_code?: string
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function resolveMockPerson(email: string, role: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const demoAccount = getDemoAccounts()[role as LoginRole]
  if (demoAccount && demoAccount.email.toLowerCase() === normalizedEmail) {
    return demoAccount
  }

  const person = readPeople().find(
    (row) => row.email.toLowerCase() === normalizedEmail && row.role === role,
  )
  if (person) {
    return { id: person.id, name: person.name, email: person.email }
  }

  if (demoAccount) return demoAccount
  throw new Error('Account not found in demo data')
}

export async function demoLogin(personId: string, tenantCode = DEFAULT_TENANT_CODE): Promise<DemoLoginResult> {
  if (isMockDataMode()) {
    await delay(150)
    const person = readPeople().find((row) => row.id === personId)
    if (!person) throw new Error('Person not found')
    return {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      person_id: person.id,
      frontend_role: person.role,
      display_name: person.name,
    }
  }

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
  if (isMockDataMode()) {
    await delay(150)
    resolveMockPerson(email, role)
    return {
      message: 'Verification code sent (demo mode).',
      email: email.trim().toLowerCase(),
      role,
      expires_in_seconds: 600,
      demo_code: DEMO_OTP_CODE,
    }
  }

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
  if (isMockDataMode()) {
    await delay(150)
    if (code.trim() !== DEMO_OTP_CODE) {
      throw new Error('Invalid verification code')
    }
    const person = resolveMockPerson(email, role)
    return {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      person_id: person.id,
      frontend_role: role,
      display_name: person.name,
    }
  }

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

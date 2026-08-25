import type { LoginRole } from '../auth/portalRoutes'
import { isCorporateEdition } from '../config/edition'

export const DEMO_OTP_CODE = '000000'

const UNIVERSITY_DEMO_ACCOUNTS: Record<
  LoginRole,
  { id: string; name: string; email: string }
> = {
  Student: {
    id: 'u-demo-amina',
    name: 'Amina Lemma',
    email: 'amina.lemma@student.berana.edu',
  },
  Instructor: {
    id: 'u2',
    name: 'Dr. Aaron Selassie',
    email: 'a.selassie@berana.edu',
  },
  Staff: {
    id: 'u7',
    name: 'Kidist Yohannes',
    email: 'k.yohannes@berana.edu',
  },
  Guardian: {
    id: 'u4',
    name: 'Yonas Tadesse',
    email: 'yonas.t@gmail.com',
  },
  HelpDesk: {
    id: 'u14',
    name: 'Mekdes Haile',
    email: 'm.haile@berana.edu',
  },
  Admin: {
    id: 'u3',
    name: 'Martha Bekele',
    email: 'm.bekele@berana.edu',
  },
}

const CORPORATE_DEMO_ACCOUNTS: Record<
  LoginRole,
  { id: string; name: string; email: string }
> = {
  Student: {
    id: 'u-demo-amina',
    name: 'Dawit Bekele',
    email: 'dawit.bekele@horizonbank.et',
  },
  Instructor: {
    id: 'u2',
    name: 'Sara Tadesse',
    email: 's.tadesse@horizonbank.et',
  },
  Staff: {
    id: 'u7',
    name: 'Kidist Yohannes',
    email: 'k.yohannes@horizonbank.et',
  },
  Guardian: {
    id: 'u4',
    name: 'Yonas Tadesse',
    email: 'yonas.t@gmail.com',
  },
  HelpDesk: {
    id: 'u14',
    name: 'Mekdes Haile',
    email: 'm.haile@horizonbank.et',
  },
  Admin: {
    id: 'u3',
    name: 'Martha Bekele',
    email: 'm.bekele@horizonbank.et',
  },
}

export function getDemoAccounts(): Record<LoginRole, { id: string; name: string; email: string }> {
  return isCorporateEdition() ? CORPORATE_DEMO_ACCOUNTS : UNIVERSITY_DEMO_ACCOUNTS
}

/** @deprecated Use getDemoAccounts() for edition-aware demos. */
export const DEMO_ACCOUNTS = UNIVERSITY_DEMO_ACCOUNTS

export function getDemoAccountEmails(): Set<string> {
  return new Set(Object.values(getDemoAccounts()).map((account) => account.email.toLowerCase()))
}

/** @deprecated Use getDemoAccountEmails(). */
export const DEMO_ACCOUNT_EMAILS = new Set(
  Object.values(UNIVERSITY_DEMO_ACCOUNTS).map((account) => account.email.toLowerCase()),
)

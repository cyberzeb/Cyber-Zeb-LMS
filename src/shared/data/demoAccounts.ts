import type { LoginRole } from '../auth/portalRoutes'

export const DEMO_OTP_CODE = '000000'

export const DEMO_ACCOUNTS: Record<
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
  SuperAdmin: {
    id: 'super-admin',
    name: 'Platform Super Admin',
    email: 'admin@berana.com',
  },
}

export const DEMO_ACCOUNT_EMAILS = new Set(
  Object.values(DEMO_ACCOUNTS).map((account) => account.email.toLowerCase()),
)

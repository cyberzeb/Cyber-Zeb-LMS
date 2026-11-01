import type { LoginRole } from '../auth/portalRoutes'

export const DEMO_OTP_CODE = '000000'

/**
 * One demo sign-in per role. The seven University roles belong to the
 * `berana` demo university; Staff, Help Desk and Manager to the corporate demo.
 */
export const DEMO_ACCOUNTS: Record<
  LoginRole,
  { id: string; name: string; email: string }
> = {
  Admin: {
    id: 'u-inst',
    name: 'Helen Desta',
    email: 'h.desta@berana.edu',
  },
  Registrar: {
    id: 'u-reg',
    name: 'Getachew Nega',
    email: 'g.nega@berana.edu',
  },
  FinanceOfficer: {
    id: 'u-fin',
    name: 'Rahel Assefa',
    email: 'r.assefa@berana.edu',
  },
  Instructor: {
    id: 'u2',
    name: 'Dr. Aaron Selassie',
    email: 'a.selassie@berana.edu',
  },
  TeachingAssistant: {
    id: 'u-ta-1',
    name: 'Liya Mengistu',
    email: 'l.mengistu@berana.edu',
  },
  Student: {
    id: 'u-demo-amina',
    name: 'Amina Lemma',
    email: 'amina.lemma@student.berana.edu',
  },
  Guardian: {
    id: 'u4',
    name: 'Yonas Tadesse',
    email: 'yonas.t@gmail.com',
  },
  // Corporate demo (Horizon Bank).
  Staff: {
    id: 'u7',
    name: 'Kidist Yohannes',
    email: 'k.yohannes@horizonbank.et',
  },
  HelpDesk: {
    id: 'u14',
    name: 'Mekdes Haile',
    email: 'm.haile@horizonbank.et',
  },
  Manager: {
    id: 'u-mgr-1',
    name: 'Dawit Kebede',
    email: 'd.kebede@horizonbank.et',
  },
  SuperAdmin: {
    id: 'super-admin',
    name: 'Platform Super Admin',
    email: 'superadmin@berana.edu',
  },
}

export const DEMO_ACCOUNT_EMAILS = new Set(
  Object.values(DEMO_ACCOUNTS).map((account) => account.email.toLowerCase()),
)

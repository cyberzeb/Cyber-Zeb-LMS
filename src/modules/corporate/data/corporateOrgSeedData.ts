import type { CampusRecord, College, Department } from '../../institution/types'

/** Shared default location id for corporate org (head office). */
export const CORPORATE_DEFAULT_CAMPUS_ID = 'c1'
export const CORPORATE_DEFAULT_COLLEGE_ID = 'col1'

export const seedCorporateCampuses: CampusRecord[] = [
  {
    id: 'c1',
    name: 'Head Office — Addis Ababa',
    code: 'HQ',
    address: 'Africa Avenue, Addis Ababa, Ethiopia',
    subtitle: 'Corporate headquarters · Regulatory hub',
    status: 'active',
  },
  {
    id: 'c2',
    name: 'Bole Branch',
    code: 'BOLE',
    address: 'Bole Road, Addis Ababa, Ethiopia',
    subtitle: 'Retail banking · High-volume branch',
    status: 'active',
  },
  {
    id: 'c3',
    name: 'Hawassa Regional Office',
    code: 'HAW',
    address: 'Hawassa, Sidama Region, Ethiopia',
    subtitle: 'Southern region operations',
    status: 'active',
  },
]

/** Minimal org grouping shim — not surfaced in corporate UI. */
export const seedCorporateColleges: College[] = [
  {
    id: CORPORATE_DEFAULT_COLLEGE_ID,
    name: 'Horizon Bank',
    deanName: 'Executive Leadership',
    campusId: CORPORATE_DEFAULT_CAMPUS_ID,
    description: 'Enterprise operating structure',
  },
]

export const seedCorporateDepartments: Department[] = [
  {
    id: 'd1',
    name: 'Retail Banking',
    headName: 'Tewodros Alemu',
    studentsCount: 842,
    facultyCount: 0,
    icon: '🏦',
    campusId: CORPORATE_DEFAULT_CAMPUS_ID,
    collegeId: CORPORATE_DEFAULT_COLLEGE_ID,
    description: 'Branches, contact center, and customer-facing operations.',
    status: 'active',
  },
  {
    id: 'd2',
    name: 'Digital Channels',
    headName: 'Hanna Mekonnen',
    studentsCount: 318,
    facultyCount: 0,
    icon: '📱',
    campusId: CORPORATE_DEFAULT_CAMPUS_ID,
    collegeId: CORPORATE_DEFAULT_COLLEGE_ID,
    description: 'Mobile banking, internet banking, and digital product teams.',
    status: 'active',
  },
  {
    id: 'd3',
    name: 'Risk & Compliance',
    headName: 'Sara Tadesse',
    studentsCount: 156,
    facultyCount: 0,
    icon: '🛡️',
    campusId: CORPORATE_DEFAULT_CAMPUS_ID,
    collegeId: CORPORATE_DEFAULT_COLLEGE_ID,
    description: 'AML, KYC, regulatory reporting, and internal audit support.',
    status: 'active',
  },
  {
    id: 'd4',
    name: 'HR & Learning',
    headName: 'Martha Bekele',
    studentsCount: 64,
    facultyCount: 0,
    icon: '👥',
    campusId: CORPORATE_DEFAULT_CAMPUS_ID,
    collegeId: CORPORATE_DEFAULT_COLLEGE_ID,
    description: 'Workforce planning, onboarding, and enterprise learning.',
    status: 'active',
  },
  {
    id: 'd5',
    name: 'IT & Security',
    headName: 'Mekonnen Alemu',
    studentsCount: 210,
    facultyCount: 0,
    icon: '💻',
    campusId: CORPORATE_DEFAULT_CAMPUS_ID,
    collegeId: CORPORATE_DEFAULT_COLLEGE_ID,
    description: 'Core banking systems, infrastructure, and cybersecurity.',
    status: 'active',
  },
]

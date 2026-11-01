import type { CampusRecord, Department } from '../types'

export const DEFAULT_CAMPUS_ID = 'c1'

export const seedCampuses: CampusRecord[] = [
  {
    id: 'c1',
    name: 'Main Campus — Addis Ababa',
    code: 'MAIN',
    address: 'Bole Sub-city, Addis Ababa, Ethiopia',
    subtitle: 'Flagship campus · Berana University',
    status: 'active',
  },
  {
    id: 'c2',
    name: 'Bole Extension Campus',
    code: 'BOLE',
    address: 'Bole Road, Addis Ababa, Ethiopia',
    subtitle: 'Extension campus · Opening soon',
    status: 'pending',
  },
]

export const seedDepartments: Department[] = [
  {
    id: 'd1',
    name: 'Computer Science',
    headId: 'u2',
    headName: 'Dr. Aaron Selassie',
    studentsCount: 320,
    facultyCount: 18,
    icon: '',
    campusId: 'c1',
  },
  {
    id: 'd2',
    name: 'Software Engineering',
    headId: 'u6',
    headName: 'Prof. Elias Hailu',
    studentsCount: 210,
    facultyCount: 12,
    icon: '',
    campusId: 'c1',
  },
  {
    id: 'd3',
    name: 'Information Technology',
    headId: 'u7',
    headName: 'Kidist Yohannes',
    studentsCount: 140,
    facultyCount: 8,
    icon: '',
    campusId: 'c1',
  },
  {
    id: 'd4',
    name: 'Business Administration',
    headId: 'u3',
    headName: 'Dr. Martha Bekele',
    studentsCount: 280,
    facultyCount: 16,
    icon: '',
    campusId: 'c1',
  },
]

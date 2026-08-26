import type { CampusRecord, College, Department } from '../types'

export const DEFAULT_CAMPUS_ID = 'c1'
export const DEFAULT_COLLEGE_ID = 'col1'

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

export const seedColleges: College[] = [
  {
    id: 'col1',
    name: 'College of Computing & IT',
    deanName: 'Dr. Aaron Selassie',
    campusId: 'c1',
    description: 'Computer science, software engineering, and information technology',
  },
  {
    id: 'col2',
    name: 'College of Business',
    deanName: 'Dr. Martha Bekele',
    campusId: 'c1',
    description: 'Business administration, management, and finance',
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
    collegeId: 'col1',
    programCode: 'BSC-CS',
    programLevel: 'Undergraduate',
    maxYears: 4,
    semestersPerYear: 2,
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
    collegeId: 'col1',
    programCode: 'BSC-SE',
    programLevel: 'Undergraduate',
    maxYears: 4,
    semestersPerYear: 2,
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
    collegeId: 'col1',
    programCode: 'BSC-IT',
    programLevel: 'Undergraduate',
    maxYears: 4,
    semestersPerYear: 2,
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
    collegeId: 'col2',
    programCode: 'BBA',
    programLevel: 'Undergraduate',
    maxYears: 4,
    semestersPerYear: 2,
  },
]

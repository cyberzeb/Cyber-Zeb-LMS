import type { PersonRow } from '../types'

type CohortSpec = {
  departmentId: string
  departmentName: string
  studyYear: number
  programSemester: number
  count: number
  idPrefix: string
}

const FIRST_NAMES = [
  'Abel',
  'Hanna',
  'Dawit',
  'Meron',
  'Samuel',
  'Liya',
  'Natnael',
  'Rahel',
  'Yared',
  'Sara',
  'Fitsum',
  'Bethel',
  'Kaleb',
  'Eden',
  'Solomon',
  'Mahi',
  'Henok',
  'Tigist',
  'Binyam',
  'Helen',
  'Ermias',
  'Feven',
  'Daniel',
  'Mahlet',
  'Robel',
  'Senait',
  'Mikias',
  'Almaz',
  'Nahom',
  'Tsion',
]

const LAST_NAMES = [
  'Tesfaye',
  'Mekonnen',
  'Haile',
  'Bekele',
  'Alemu',
  'Negash',
  'Girma',
  'Desta',
  'Worku',
  'Kebede',
  'Assefa',
  'Hailu',
  'Yohannes',
  'Tadesse',
  'Lemma',
  'Wolde',
  'Gebru',
  'Abate',
  'Mulugeta',
  'Demissie',
]

const COHORTS: CohortSpec[] = [
  { departmentId: 'd1', departmentName: 'Computer Science', studyYear: 1, programSemester: 1, count: 12, idPrefix: 'stu-cs-y1s1' },
  { departmentId: 'd1', departmentName: 'Computer Science', studyYear: 1, programSemester: 2, count: 10, idPrefix: 'stu-cs-y1s2' },
  { departmentId: 'd1', departmentName: 'Computer Science', studyYear: 2, programSemester: 1, count: 12, idPrefix: 'stu-cs-y2s1' },
  { departmentId: 'd1', departmentName: 'Computer Science', studyYear: 2, programSemester: 2, count: 10, idPrefix: 'stu-cs-y2s2' },
  { departmentId: 'd1', departmentName: 'Computer Science', studyYear: 3, programSemester: 1, count: 8, idPrefix: 'stu-cs-y3s1' },
  { departmentId: 'd1', departmentName: 'Computer Science', studyYear: 3, programSemester: 2, count: 8, idPrefix: 'stu-cs-y3s2' },
  { departmentId: 'd1', departmentName: 'Computer Science', studyYear: 4, programSemester: 1, count: 6, idPrefix: 'stu-cs-y4s1' },
  { departmentId: 'd2', departmentName: 'Software Engineering', studyYear: 1, programSemester: 1, count: 10, idPrefix: 'stu-se-y1s1' },
  { departmentId: 'd2', departmentName: 'Software Engineering', studyYear: 1, programSemester: 2, count: 8, idPrefix: 'stu-se-y1s2' },
  { departmentId: 'd2', departmentName: 'Software Engineering', studyYear: 2, programSemester: 1, count: 10, idPrefix: 'stu-se-y2s1' },
  { departmentId: 'd2', departmentName: 'Software Engineering', studyYear: 2, programSemester: 2, count: 8, idPrefix: 'stu-se-y2s2' },
  { departmentId: 'd2', departmentName: 'Software Engineering', studyYear: 3, programSemester: 1, count: 6, idPrefix: 'stu-se-y3s1' },
  { departmentId: 'd3', departmentName: 'Information Technology', studyYear: 1, programSemester: 1, count: 10, idPrefix: 'stu-it-y1s1' },
  { departmentId: 'd3', departmentName: 'Information Technology', studyYear: 1, programSemester: 2, count: 8, idPrefix: 'stu-it-y1s2' },
  { departmentId: 'd3', departmentName: 'Information Technology', studyYear: 2, programSemester: 1, count: 10, idPrefix: 'stu-it-y2s1' },
  { departmentId: 'd3', departmentName: 'Information Technology', studyYear: 2, programSemester: 2, count: 8, idPrefix: 'stu-it-y2s2' },
  { departmentId: 'd4', departmentName: 'Business Administration', studyYear: 1, programSemester: 1, count: 12, idPrefix: 'stu-bus-y1s1' },
  { departmentId: 'd4', departmentName: 'Business Administration', studyYear: 1, programSemester: 2, count: 10, idPrefix: 'stu-bus-y1s2' },
  { departmentId: 'd4', departmentName: 'Business Administration', studyYear: 2, programSemester: 1, count: 10, idPrefix: 'stu-bus-y2s1' },
  { departmentId: 'd4', departmentName: 'Business Administration', studyYear: 2, programSemester: 2, count: 8, idPrefix: 'stu-bus-y2s2' },
  { departmentId: 'd4', departmentName: 'Business Administration', studyYear: 3, programSemester: 1, count: 6, idPrefix: 'stu-bus-y3s1' },
]

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function slugEmail(first: string, last: string, id: string): string {
  const base = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, '')
  return `${base}.${id.split('-').pop()}@student.berana.edu`
}

let nameIndex = 0

function nextName(): { first: string; last: string; full: string } {
  const first = FIRST_NAMES[nameIndex % FIRST_NAMES.length]
  const last = LAST_NAMES[Math.floor(nameIndex / FIRST_NAMES.length) % LAST_NAMES.length]
  nameIndex += 1
  return { first, last, full: `${first} ${last}` }
}

/** Generates a large student population spread across departments and program slots. */
export function buildBulkSeedStudents(): PersonRow[] {
  const rows: PersonRow[] = []
  nameIndex = 0

  for (const cohort of COHORTS) {
    for (let i = 1; i <= cohort.count; i += 1) {
      const id = `${cohort.idPrefix}-${String(i).padStart(2, '0')}`
      const { first, last, full } = nextName()
      rows.push({
        id,
        name: full,
        email: slugEmail(first, last, id),
        role: 'Student',
        department: cohort.departmentName,
        departmentId: cohort.departmentId,
        studyYear: cohort.studyYear,
        programSemester: cohort.programSemester,
        campusId: 'c1',
        status: i % 17 === 0 ? 'invited' : 'active',
        lastActive: i % 3 === 0 ? 'Today' : i % 3 === 1 ? 'Yesterday' : '2 days ago',
        initials: initials(full),
        verificationStatus: i % 11 === 0 ? 'pending' : 'verified',
      })
    }
  }

  return rows
}

import { createId } from '../../../shared/hooks/useLocalStorageState'
import { DEFAULT_CAMPUS_ID } from '../data/orgSeedData'
import { INSTRUCTOR_FACULTY_LABEL } from '../utils/courseAssignmentUtils'
import type { Campus, Department, PersonRow } from '../types'

export interface StudentImportInput {
  name: string
  email: string
  campus: string
  department: string
  status?: PersonRow['status']
}

export interface StudentImportError {
  row: number
  message: string
}

export interface StudentImportResult {
  imported: PersonRow[]
  updated: PersonRow[]
  errors: StudentImportError[]
  skippedDuplicates: number
}

export interface UpdateStudentInput {
  name: string
  email: string
  campusId: string
  departmentId: string
  status: PersonRow['status']
  teamId?: string
  jobRoleId?: string
}

export interface UpdateInstructorInput {
  name: string
  email: string
  campusId: string
  status: PersonRow['status']
}

export interface UpdateStaffInput {
  name: string
  email: string
  campusId: string
  office: string
  isDepartmentHead: boolean
  status: PersonRow['status']
}

export interface UpdateGuardianInput {
  name: string
  email: string
  linkedStudentId: string
  status: PersonRow['status']
}

const VALID_STATUSES: PersonRow['status'][] = ['active', 'invited', 'suspended']

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '_')
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current.trim())
  return cells
}

export function parseStudentCsv(csvText: string): { rows: StudentImportInput[]; errors: StudentImportError[] } {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return { rows: [], errors: [{ row: 0, message: 'CSV file is empty.' }] }
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader)
  const required = ['name', 'email', 'campus', 'department']
  const missing = required.filter((col) => !headers.includes(col))
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [{ row: 1, message: `Missing required columns: ${missing.join(', ')}.` }],
    }
  }

  const rows: StudentImportInput[] = []
  const errors: StudentImportError[] = []

  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i])
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = cells[index]?.trim() ?? ''
    })

    const name = record.name ?? ''
    const email = record.email ?? ''
    const campus = record.campus ?? ''
    const department = record.department ?? ''
    const statusRaw = (record.status ?? 'invited').toLowerCase() as PersonRow['status']

    if (!name || !email || !campus || !department) {
      errors.push({ row: i + 1, message: 'Name, email, campus and department are required.' })
      continue
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ row: i + 1, message: `Invalid email: ${email}` })
      continue
    }

    if (statusRaw && !VALID_STATUSES.includes(statusRaw)) {
      errors.push({ row: i + 1, message: `Invalid status "${record.status}". Use active, invited or suspended.` })
      continue
    }

    rows.push({
      name,
      email: email.toLowerCase(),
      campus,
      department,
      status: statusRaw || 'invited',
    })
  }

  return { rows, errors }
}

function resolveCampus(campusRef: string, campuses: Campus[]): Campus | undefined {
  const ref = campusRef.trim().toLowerCase()
  return campuses.find(
    (c) =>
      c.id.toLowerCase() === ref ||
      c.code.toLowerCase() === ref ||
      c.name.toLowerCase() === ref ||
      c.name.toLowerCase().includes(ref),
  )
}

function resolveDepartment(
  departmentRef: string,
  campusId: string,
  departments: Department[],
): Department | undefined {
  const ref = departmentRef.trim().toLowerCase()
  return departments.find(
    (d) =>
      d.campusId === campusId &&
      (d.id.toLowerCase() === ref || d.name.toLowerCase() === ref || d.name.toLowerCase().includes(ref)),
  )
}

export function migrateStudentRecord(
  person: PersonRow,
  departments: Department[],
): PersonRow {
  if (person.role !== 'Student') return person
  if (person.campusId) return person

  const dept = departments.find((d) => d.name === person.department)
  return {
    ...person,
    campusId: dept?.campusId ?? DEFAULT_CAMPUS_ID,
  }
}

export function migrateInstructorRecord(
  person: PersonRow,
  _departments: Department[],
): PersonRow {
  if (person.role !== 'Instructor') return person
  const campusId = person.campusId ?? DEFAULT_CAMPUS_ID
  const department =
    person.department && person.department !== '—' ? person.department : INSTRUCTOR_FACULTY_LABEL
  return { ...person, campusId, department }
}

export function migrateStaffRecord(person: PersonRow): PersonRow {
  if (person.role !== 'Staff') return person
  if (person.campusId) return person
  return { ...person, campusId: DEFAULT_CAMPUS_ID }
}

export function migrateAdminRecord(
  person: PersonRow,
  departments: Department[],
): PersonRow {
  if (person.role !== 'Admin') return person
  if (person.campusId) return person

  const dept = departments.find((d) => d.name === person.department)
  return {
    ...person,
    campusId: dept?.campusId ?? DEFAULT_CAMPUS_ID,
  }
}

export function migrateGuardianRecord(
  person: PersonRow,
  allPeople: PersonRow[],
): PersonRow {
  if (person.role !== 'Guardian') return person
  if (person.campusId) return person
  if (person.department === '—') return person

  const student = allPeople.find(
    (p) => p.role === 'Student' && p.name === person.department,
  )
  return {
    ...person,
    campusId: student?.campusId ?? DEFAULT_CAMPUS_ID,
  }
}

/** Simulates a backend bulk-import endpoint with validation against org structure. */
export async function bulkImportStudents(
  inputs: StudentImportInput[],
  campuses: Campus[],
  departments: Department[],
  existingPeople: PersonRow[],
): Promise<StudentImportResult> {
  await new Promise((resolve) => setTimeout(resolve, 650))

  const imported: PersonRow[] = []
  const updated: PersonRow[] = []
  const errors: StudentImportError[] = []
  let skippedDuplicates = 0

  const emailIndex = new Map(existingPeople.map((p) => [p.email.toLowerCase(), p]))

  inputs.forEach((input, index) => {
    const row = index + 2
    const campus = resolveCampus(input.campus, campuses)
    if (!campus) {
      errors.push({ row, message: `Unknown campus "${input.campus}". Use campus code (e.g. MAIN) or name.` })
      return
    }

    const department = resolveDepartment(input.department, campus.id, departments)
    if (!department) {
      errors.push({
        row,
        message: `Department "${input.department}" not found on ${campus.name}.`,
      })
      return
    }

    const existing = emailIndex.get(input.email.toLowerCase())
    if (existing) {
      if (existing.role !== 'Student') {
        errors.push({ row, message: `Email ${input.email} belongs to a non-student account.` })
        return
      }
      const patched: PersonRow = {
        ...existing,
        name: input.name.trim(),
        department: department.name,
        campusId: campus.id,
        status: input.status ?? existing.status,
        initials: initialsFromName(input.name),
      }
      updated.push(patched)
      emailIndex.set(patched.email.toLowerCase(), patched)
      skippedDuplicates += 1
      return
    }

    const student: PersonRow = {
      id: createId('user'),
      name: input.name.trim(),
      email: input.email.toLowerCase(),
      role: 'Student',
      department: department.name,
      campusId: campus.id,
      verificationStatus: 'verified',
      addedByRole: 'Admin',
      status: input.status ?? 'invited',
      lastActive: input.status === 'active' ? 'Just imported' : 'Never',
      initials: initialsFromName(input.name),
    }
    imported.push(student)
    emailIndex.set(student.email.toLowerCase(), student)
  })

  return { imported, updated, errors, skippedDuplicates }
}

/** Simulates a backend PUT endpoint for updating a student record. */
export async function updateStudent(
  studentId: string,
  input: UpdateStudentInput,
  campuses: Campus[],
  departments: Department[],
): Promise<PersonRow> {
  await new Promise((resolve) => setTimeout(resolve, 350))

  const campus = campuses.find((c) => c.id === input.campusId)
  if (!campus) throw new Error('Selected campus was not found.')

  const department = departments.find(
    (d) => d.id === input.departmentId && d.campusId === input.campusId,
  )
  if (!department) throw new Error('Selected department does not belong to this campus.')

  if (!input.name.trim()) throw new Error('Student name is required.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) throw new Error('Invalid email address.')

  return {
    id: studentId,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: 'Student',
    department: department.name,
    campusId: campus.id,
    departmentId: department.id,
    teamId: input.teamId || undefined,
    jobRoleId: input.jobRoleId || undefined,
    status: input.status,
    lastActive: 'Just now',
    initials: initialsFromName(input.name),
  }
}

/** Simulates a backend PUT endpoint for updating an instructor record. */
export async function updateInstructor(
  instructorId: string,
  input: UpdateInstructorInput,
  campuses: Campus[],
): Promise<PersonRow> {
  await new Promise((resolve) => setTimeout(resolve, 350))

  const campus = campuses.find((c) => c.id === input.campusId)
  if (!campus) throw new Error('Selected campus was not found.')

  if (!input.name.trim()) throw new Error('Instructor name is required.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) throw new Error('Invalid email address.')

  return {
    id: instructorId,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: 'Instructor',
    department: INSTRUCTOR_FACULTY_LABEL,
    campusId: campus.id,
    status: input.status,
    lastActive: 'Just now',
    initials: initialsFromName(input.name),
  }
}

/** Simulates a backend PUT endpoint for updating a staff record. */
export async function updateStaff(
  staffId: string,
  input: UpdateStaffInput,
  campuses: Campus[],
): Promise<PersonRow> {
  await new Promise((resolve) => setTimeout(resolve, 350))

  const campus = campuses.find((c) => c.id === input.campusId)
  if (!campus) throw new Error('Selected campus was not found.')
  if (!input.name.trim()) throw new Error('Staff name is required.')
  if (!input.office.trim()) throw new Error('Office assignment is required.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) throw new Error('Invalid email address.')

  return {
    id: staffId,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: 'Staff',
    department: input.office.trim(),
    campusId: campus.id,
    isDepartmentHead: input.isDepartmentHead,
    status: input.status,
    lastActive: 'Just now',
    initials: initialsFromName(input.name),
  }
}

/** Simulates a backend PUT endpoint for updating an administrator record. */
export async function updateAdmin(
  adminId: string,
  input: UpdateStudentInput,
  campuses: Campus[],
  departments: Department[],
): Promise<PersonRow> {
  await new Promise((resolve) => setTimeout(resolve, 350))

  const campus = campuses.find((c) => c.id === input.campusId)
  if (!campus) throw new Error('Selected campus was not found.')

  const department = departments.find(
    (d) => d.id === input.departmentId && d.campusId === input.campusId,
  )
  if (!department) throw new Error('Selected department does not belong to this campus.')

  if (!input.name.trim()) throw new Error('Administrator name is required.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) throw new Error('Invalid email address.')

  return {
    id: adminId,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: 'Admin',
    department: department.name,
    campusId: campus.id,
    status: input.status,
    lastActive: 'Just now',
    initials: initialsFromName(input.name),
  }
}

/** Simulates a backend PUT endpoint for updating a guardian record. */
export async function updateGuardian(
  guardianId: string,
  input: UpdateGuardianInput,
  students: PersonRow[],
): Promise<PersonRow> {
  await new Promise((resolve) => setTimeout(resolve, 350))

  if (!input.name.trim()) throw new Error('Guardian name is required.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) throw new Error('Invalid email address.')

  const student = students.find((s) => s.id === input.linkedStudentId)
  if (!student) throw new Error('Linked student is required.')

  return {
    id: guardianId,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: 'Guardian',
    department: student.name,
    campusId: student.campusId,
    status: input.status,
    lastActive: 'Just now',
    initials: initialsFromName(input.name),
  }
}

/** Simulates admin approval of a staff-submitted person record. */
export async function verifyPerson(personId: string, people: PersonRow[]): Promise<PersonRow> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const person = people.find((p) => p.id === personId)
  if (!person) throw new Error('Person record not found.')
  if (person.verificationStatus !== 'pending') {
    throw new Error('Only pending submissions can be verified.')
  }
  return {
    ...person,
    verificationStatus: 'verified',
    status: person.status === 'suspended' ? 'suspended' : 'invited',
    lastActive: 'Verified just now',
  }
}

/** Simulates admin rejection of a staff-submitted person record. */
export async function rejectPerson(personId: string, people: PersonRow[]): Promise<PersonRow> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const person = people.find((p) => p.id === personId)
  if (!person) throw new Error('Person record not found.')
  if (person.verificationStatus !== 'pending') {
    throw new Error('Only pending submissions can be rejected.')
  }
  return {
    ...person,
    verificationStatus: 'rejected',
    status: 'suspended',
    lastActive: 'Rejected just now',
  }
}

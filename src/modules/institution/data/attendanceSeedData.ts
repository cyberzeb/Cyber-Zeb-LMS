import type { AttendanceRecord } from '../types'
import { DEFAULT_CAMPUS_ID } from './orgSeedData'

type SessionStatus = 'present' | 'absent' | 'late' | 'excused'

function buildHistory(pattern: SessionStatus[]): AttendanceRecord['history'] {
  const today = new Date()
  return pattern.map((status, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (pattern.length - 1 - i) * 7)
    return { date: d.toISOString().slice(0, 10), status }
  })
}

function deriveStats(history: AttendanceRecord['history']) {
  const present = history.filter((h) => h.status === 'present').length
  const absent = history.filter((h) => h.status === 'absent').length
  const late = history.filter((h) => h.status === 'late').length
  const excused = history.filter((h) => h.status === 'excused').length
  const total = history.length
  const attendancePercent = total > 0 ? Math.round(((present + late) / total) * 100) : 0
  const riskLevel =
    attendancePercent >= 80
      ? ('good' as const)
      : attendancePercent >= 60
        ? ('warning' as const)
        : ('at-risk' as const)
  const lastSessionDate = history[history.length - 1]?.date
  return { present, absent, late, excused, totalSessions: total, attendancePercent, riskLevel, lastSessionDate }
}

function make(
  id: string,
  student: { id: string; name: string; email: string },
  course: { id: string; code: string; title: string },
  instructor: { id: string; name: string },
  department: string,
  pattern: SessionStatus[],
): AttendanceRecord {
  const history = buildHistory(pattern)
  const stats = deriveStats(history)
  return {
    id,
    studentId: student.id,
    studentName: student.name,
    studentEmail: student.email,
    courseId: course.id,
    courseCode: course.code,
    courseTitle: course.title,
    instructorId: instructor.id,
    instructorName: instructor.name,
    department,
    campusId: DEFAULT_CAMPUS_ID,
    history,
    ...stats,
  }
}

export const seedAttendance: AttendanceRecord[] = [
  make(
    'att-1',
    { id: 'u-demo-amina', name: 'Amina Lemma', email: 'amina.lemma@student.berana.edu' },
    { id: 'c2', code: 'CS-201', title: 'Data Structures & Algorithms' },
    { id: 'u2', name: 'Dr. Aaron Selassie' },
    'Computer Science',
    ['present', 'present', 'late', 'present', 'present', 'present', 'present', 'late', 'present', 'present'],
  ),
  make(
    'att-2',
    { id: 'u1', name: 'Selam Girma', email: 'selam.girma@berana.edu' },
    { id: 'c1', code: 'CS-101', title: 'Introduction to Programming' },
    { id: 'u2', name: 'Dr. Aaron Selassie' },
    'Computer Science',
    ['present', 'present', 'present', 'absent', 'present', 'present', 'present', 'present', 'present', 'present'],
  ),
  make(
    'att-3',
    { id: 'u10', name: 'Bruk Alemu', email: 'bruk.alemu@berana.edu' },
    { id: 'c3', code: 'CS-340', title: 'Machine Learning Foundations' },
    { id: 'u2', name: 'Dr. Aaron Selassie' },
    'Computer Science',
    ['present', 'late', 'present', 'present', 'present', 'present', 'late', 'present', 'present', 'present'],
  ),
  make(
    'att-4',
    { id: 'u18', name: 'Tomas Bekele', email: 'tomas.bekele@berana.edu' },
    { id: 'c4', code: 'BUS-110', title: 'Principles of Management' },
    { id: 'u3', name: 'Dr. Martha Bekele' },
    'Business Administration',
    ['present', 'present', 'present', 'present', 'late', 'present', 'present', 'present', 'present', 'present'],
  ),
  make(
    'att-5',
    { id: 'u17', name: 'Sara Negash', email: 'sara.negash@berana.edu' },
    { id: 'c2', code: 'CS-201', title: 'Data Structures & Algorithms' },
    { id: 'u2', name: 'Dr. Aaron Selassie' },
    'Software Engineering',
    ['present', 'present', 'present', 'present', 'present', 'present', 'present', 'present', 'present', 'present'],
  ),
]

export function computeAttendanceSummary(records: AttendanceRecord[]) {
  const today = new Date().toISOString().slice(0, 10)
  let presentToday = 0
  let absentToday = 0
  let lateToday = 0
  for (const r of records) {
    const todaySession = r.history.find((h) => h.date === today)
    const latest = todaySession ?? r.history[r.history.length - 1]
    if (latest?.status === 'present') presentToday++
    else if (latest?.status === 'absent') absentToday++
    else if (latest?.status === 'late') lateToday++
  }
  const overallRate =
    records.length > 0
      ? Math.round(records.reduce((sum, r) => sum + r.attendancePercent, 0) / records.length)
      : 0
  const atRisk = records.filter((r) => r.riskLevel === 'at-risk').length
  return { overallRate, presentToday, absentToday, lateToday, atRisk }
}

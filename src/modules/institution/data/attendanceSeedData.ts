import type { AttendanceRecord } from '../types'
import { DEFAULT_CAMPUS_ID } from './orgSeedData'

// ─── Helper ───────────────────────────────────────────────────────────────────

type SessionStatus = 'present' | 'absent' | 'late' | 'excused'

/** Build a synthetic session history going back `totalSessions` weeks from today. */
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

// ─── Seed records ─────────────────────────────────────────────────────────────

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
    { id: 'u1', name: 'Selam Girma', email: 'selam@example.com' },
    { id: 'c1', code: 'CS-201', title: 'Data Structures & Algorithms' },
    { id: 'u2', name: 'Dr. Aaron Selassie' },
    'Computer Science & IT',
    ['present','present','present','late','present','present','present','present','late','present','present','present'],
  ),
  make(
    'att-2',
    { id: 'u1', name: 'Selam Girma', email: 'selam@example.com' },
    { id: 'c4', code: 'CYB-501', title: 'Network Security & Defense' },
    { id: 'u7', name: 'Kidist Yohannes' },
    'Computer Science & IT',
    ['present','present','absent','present','present','absent','present','present','present','present','present','late'],
  ),
  make(
    'att-3',
    { id: 'u5', name: 'Hanna Wolde', email: 'hanna@example.com' },
    { id: 'c3', code: 'BUS-110', title: 'Principles of Management' },
    { id: 'u3', name: 'Dr. Martha Bekele' },
    'Business & Management',
    ['present','absent','absent','present','absent','present','absent','absent','present','absent','present','absent'],
  ),
  make(
    'att-4',
    { id: 'u8', name: 'Daniel Mekonnen', email: 'daniel@example.com' },
    { id: 'c2', code: 'CS-340', title: 'Machine Learning Foundations' },
    { id: 'u6', name: 'Prof. Elias Hailu' },
    'Computer Science & IT',
    ['present','present','late','present','present','present','late','present','present','present','present','present'],
  ),
  make(
    'att-5',
    { id: 'u9', name: 'Meron Assefa', email: 'meron@example.com' },
    { id: 'c1', code: 'CS-201', title: 'Data Structures & Algorithms' },
    { id: 'u2', name: 'Dr. Aaron Selassie' },
    'Computer Science & IT',
    ['absent','absent','absent','present','absent','absent','late','absent','present','absent','absent','absent'],
  ),
  make(
    'att-6',
    { id: 'u10', name: 'Yonas Tadesse', email: 'yonas@example.com' },
    { id: 'c3', code: 'BUS-110', title: 'Principles of Management' },
    { id: 'u3', name: 'Dr. Martha Bekele' },
    'Business & Management',
    ['present','present','present','present','late','present','present','present','present','present','present','present'],
  ),
  make(
    'att-7',
    { id: 'u11', name: 'Tigist Bekele', email: 'tigist@example.com' },
    { id: 'c2', code: 'CS-340', title: 'Machine Learning Foundations' },
    { id: 'u6', name: 'Prof. Elias Hailu' },
    'Engineering & Technology',
    ['present','absent','present','absent','present','absent','present','present','absent','present','present','absent'],
  ),
  make(
    'att-8',
    { id: 'u12', name: 'Biruk Haile', email: 'biruk@example.com' },
    { id: 'c4', code: 'CYB-501', title: 'Network Security & Defense' },
    { id: 'u7', name: 'Kidist Yohannes' },
    'Computer Science & IT',
    ['absent','absent','late','absent','absent','present','absent','absent','excused','absent','absent','absent'],
  ),
  make(
    'att-9',
    { id: 'u13', name: 'Rahel Solomon', email: 'rahel@example.com' },
    { id: 'c1', code: 'CS-201', title: 'Data Structures & Algorithms' },
    { id: 'u2', name: 'Dr. Aaron Selassie' },
    'Computer Science & IT',
    ['present','present','present','present','present','present','late','present','present','present','present','present'],
  ),
  make(
    'att-10',
    { id: 'u14', name: 'Abel Tesfaye', email: 'abel@example.com' },
    { id: 'c3', code: 'BUS-110', title: 'Principles of Management' },
    { id: 'u3', name: 'Dr. Martha Bekele' },
    'Business & Management',
    ['excused','present','present','absent','present','present','absent','late','present','present','present','present'],
  ),
  make(
    'att-11',
    { id: 'u15', name: 'Fatuma Nuri', email: 'fatuma@example.com' },
    { id: 'c2', code: 'CS-340', title: 'Machine Learning Foundations' },
    { id: 'u6', name: 'Prof. Elias Hailu' },
    'Engineering & Technology',
    ['absent','absent','absent','absent','present','absent','absent','absent','absent','present','absent','late'],
  ),
  make(
    'att-12',
    { id: 'u16', name: 'Dawit Alemu', email: 'dawit@example.com' },
    { id: 'c4', code: 'CYB-501', title: 'Network Security & Defense' },
    { id: 'u7', name: 'Kidist Yohannes' },
    'Computer Science & IT',
    ['present','present','present','present','present','present','present','present','late','present','present','present'],
  ),
]

/** Compute a quick AttendanceSummary across all records using today's last session */
export function computeAttendanceSummary(records: AttendanceRecord[]) {
  const today = new Date().toISOString().slice(0, 10)
  let presentToday = 0, absentToday = 0, lateToday = 0
  for (const r of records) {
    const todaySession = r.history.find((h) => h.date === today)
    // Fall back to the most recent session if no exact today match
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

import { BarChart2, BookOpen, Building2, Download, FileText, User } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { Button } from '../../../shared/components/Button'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import type { AttendanceRecord } from '../types'

// ─── Report definitions ───────────────────────────────────────────────────────

interface ReportDef {
  id: string
  title: string
  description: string
  icon: typeof FileText
  iconBg: string
}

const REPORTS: ReportDef[] = [
  {
    id: 'daily',
    title: 'Daily Attendance',
    description: 'Session-by-session attendance for today and recent dates.',
    icon: FileText,
    iconBg: 'bg-info-bg text-info',
  },
  {
    id: 'course',
    title: 'Course Attendance',
    description: 'Attendance breakdown per course with rates and student counts.',
    icon: BookOpen,
    iconBg: 'bg-lemon-50 text-lemon-900',
  },
  {
    id: 'department',
    title: 'Department Attendance',
    description: 'Aggregated attendance rates grouped by department.',
    icon: Building2,
    iconBg: 'bg-warning-bg text-[#8A6D00]',
  },
  {
    id: 'student',
    title: 'Student Attendance',
    description: 'Per-student attendance summary across all enrolled courses.',
    icon: User,
    iconBg: 'bg-success-bg text-success',
  },
]

// ─── Helper — build CSV ───────────────────────────────────────────────────────

function buildCsv(rows: string[][]): string {
  return rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function todayLabel(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── Report generators ────────────────────────────────────────────────────────

function generateDailyReport(records: AttendanceRecord[]): string {
  const header = ['Date', 'Student', 'Course', 'Instructor', 'Status', 'Note']
  const rows: string[][] = [header]
  for (const r of records) {
    const sorted = [...r.history].sort((a, b) => b.date.localeCompare(a.date))
    for (const session of sorted) {
      rows.push([
        session.date,
        r.studentName,
        `${r.courseCode} — ${r.courseTitle}`,
        r.instructorName,
        session.status,
        session.note ?? '',
      ])
    }
  }
  return buildCsv(rows)
}

function generateCourseReport(records: AttendanceRecord[]): string {
  const courseMap = new Map<
    string,
    { code: string; title: string; instructor: string; totalPercent: number; count: number; present: number; absent: number; late: number }
  >()
  for (const r of records) {
    const key = r.courseId
    const existing = courseMap.get(key)
    if (existing) {
      existing.totalPercent += r.attendancePercent
      existing.count += 1
      existing.present += r.present
      existing.absent += r.absent
      existing.late += r.late
    } else {
      courseMap.set(key, {
        code: r.courseCode,
        title: r.courseTitle,
        instructor: r.instructorName,
        totalPercent: r.attendancePercent,
        count: 1,
        present: r.present,
        absent: r.absent,
        late: r.late,
      })
    }
  }
  const header = ['Course Code', 'Course Title', 'Instructor', 'Avg Attendance %', 'Total Present', 'Total Absent', 'Total Late', 'Students']
  const rows: string[][] = [header]
  for (const c of courseMap.values()) {
    rows.push([
      c.code,
      c.title,
      c.instructor,
      `${Math.round(c.totalPercent / c.count)}%`,
      String(c.present),
      String(c.absent),
      String(c.late),
      String(c.count),
    ])
  }
  return buildCsv(rows)
}

function generateDepartmentReport(records: AttendanceRecord[]): string {
  const deptMap = new Map<string, { totalPercent: number; count: number; atRisk: number }>()
  for (const r of records) {
    const existing = deptMap.get(r.department)
    if (existing) {
      existing.totalPercent += r.attendancePercent
      existing.count += 1
      if (r.riskLevel === 'at-risk') existing.atRisk += 1
    } else {
      deptMap.set(r.department, {
        totalPercent: r.attendancePercent,
        count: 1,
        atRisk: r.riskLevel === 'at-risk' ? 1 : 0,
      })
    }
  }
  const header = ['Department', 'Avg Attendance %', 'Students', 'At Risk']
  const rows: string[][] = [header]
  for (const [dept, d] of deptMap.entries()) {
    rows.push([
      dept,
      `${Math.round(d.totalPercent / d.count)}%`,
      String(d.count),
      String(d.atRisk),
    ])
  }
  return buildCsv(rows)
}

function generateStudentReport(records: AttendanceRecord[]): string {
  const header = ['Student', 'Email', 'Course', 'Instructor', 'Department', 'Attendance %', 'Present', 'Absent', 'Late', 'Excused', 'Risk Level']
  const rows: string[][] = [header]
  for (const r of records) {
    rows.push([
      r.studentName,
      r.studentEmail,
      `${r.courseCode} — ${r.courseTitle}`,
      r.instructorName,
      r.department,
      `${r.attendancePercent}%`,
      String(r.present),
      String(r.absent),
      String(r.late),
      String(r.excused),
      r.riskLevel,
    ])
  }
  return buildCsv(rows)
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AttendanceReportsPanelProps {
  records: AttendanceRecord[]
}

export function AttendanceReportsPanel({ records }: AttendanceReportsPanelProps) {
  const { notify } = useToast()

  const handleExport = (reportId: string) => {
    let csv = ''
    let filename = ''
    const today = todayLabel()

    switch (reportId) {
      case 'daily':
        csv = generateDailyReport(records)
        filename = `attendance-daily-${today}.csv`
        break
      case 'course':
        csv = generateCourseReport(records)
        filename = `attendance-by-course-${today}.csv`
        break
      case 'department':
        csv = generateDepartmentReport(records)
        filename = `attendance-by-department-${today}.csv`
        break
      case 'student':
        csv = generateStudentReport(records)
        filename = `attendance-by-student-${today}.csv`
        break
    }

    if (csv) {
      downloadCsv(filename, csv)
      notify(`${filename} downloaded.`, 'success')
    }
  }

  // Quick stats for inline summary cards
  const courseCount = new Set(records.map((r) => r.courseId)).size
  const deptCount = new Set(records.map((r) => r.department)).size
  const studentCount = new Set(records.map((r) => r.studentId)).size
  const todayIso = todayLabel()
  const todaySessions = records.reduce((sum, r) => {
    return sum + r.history.filter((h) => h.date === todayIso).length
  }, 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Section title */}
      <div className="flex items-center gap-2">
        <BarChart2 size={17} className="text-secondary-text" />
        <h2 className="text-[15px] font-bold text-navy-900">Reports & Export</h2>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Sessions today', value: todaySessions },
          { label: 'Courses tracked', value: courseCount },
          { label: 'Departments', value: deptCount },
          { label: 'Students', value: studentCount },
        ].map(({ label, value }) => (
          <GlassCard key={label} className="p-3 text-center">
            <p className="text-[22px] font-bold text-navy-900 leading-none">{value}</p>
            <p className="text-[11px] text-secondary-text mt-1">{label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {REPORTS.map((report) => {
          const Icon = report.icon
          return (
            <GlassCard
              key={report.id}
              className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${report.iconBg}`}
              >
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-bold text-navy-900">{report.title}</p>
                <p className="text-[11.5px] text-secondary-text mt-0.5 leading-snug">
                  {report.description}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="shrink-0"
                onClick={() => handleExport(report.id)}
                aria-label={`Export ${report.title} as CSV`}
              >
                <Download size={13} />
                Export
              </Button>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}

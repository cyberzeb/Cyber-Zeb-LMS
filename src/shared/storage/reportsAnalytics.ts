import type { TrendPoint } from '../../modules/institution/types'
import {
  readAssignmentRecords,
  readAttendances,
  readCourses,
  readDepartments,
  readEnrollments,
  readLiveSessions,
  readPayments,
  readPeople,
  readQuizRecords,
} from './readers'
import { computePaymentSummary } from './platformUtils'
import { countUpcomingLiveSessions } from './assessmentUtils'

export interface ReportsAnalytics {
  enrollmentTrend: TrendPoint[]
  revenueTrend: TrendPoint[]
  completionByDepartment: TrendPoint[]
  attendanceByDepartment: TrendPoint[]
  assessmentActivity: TrendPoint[]
  loginActivity: TrendPoint[]
  summary: {
    totalStudents: number
    activeStudents: number
    activeEnrollments: number
    avgCompletion: number
    avgAttendance: number
    revenueCollected: number
    revenueOutstanding: number
    overduePayments: number
    publishedCourses: number
    upcomingSessions: number
    openAssignments: number
    openQuizzes: number
  }
  topCourses: Array<{
    id: string
    code: string
    title: string
    enrolled: number
    completion: number
    instructor: string
  }>
  departmentStats: Array<{
    name: string
    students: number
    enrollments: number
    avgCompletion: number
    avgAttendance: number
  }>
  atRiskLearners: Array<{
    id: string
    name: string
    course: string
    attendance: number
    progress: number
  }>
}

function monthLabels(count = 6): string[] {
  const labels: string[] = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    labels.push(d.toLocaleDateString(undefined, { month: 'short' }))
  }
  return labels
}

function sparkFromBase(base: number, points = 6, growth = 0.08): number[] {
  return Array.from({ length: points }, (_, i) =>
    Math.max(0, Math.round(base * (1 - growth * (points - 1 - i)))),
  )
}

export function buildReportsAnalytics(): ReportsAnalytics {
  const people = readPeople()
  const enrollments = readEnrollments()
  const courses = readCourses()
  const departments = readDepartments()
  const attendances = readAttendances()
  const payments = readPayments()
  const assignments = readAssignmentRecords()
  const quizzes = readQuizRecords()
  const liveSessions = readLiveSessions()

  const students = people.filter((p) => p.role === 'Student')
  const activeStudents = students.filter((p) => p.status === 'active').length
  const activeEnrollments = enrollments.filter((e) => e.status === 'active')
  const avgCompletion =
    activeEnrollments.length > 0
      ? Math.round(
          activeEnrollments.reduce((sum, e) => sum + e.progress, 0) / activeEnrollments.length,
        )
      : 0

  const avgAttendance =
    attendances.length > 0
      ? Math.round(
          attendances.reduce((sum, a) => sum + a.attendancePercent, 0) / attendances.length,
        )
      : 0

  const paymentSummary = computePaymentSummary(payments)
  const labels = monthLabels()

  const enrollmentTrend: TrendPoint[] = labels.map((label, i) => ({
    label,
    value: sparkFromBase(activeStudents, labels.length)[i] ?? activeStudents,
  }))
  enrollmentTrend[enrollmentTrend.length - 1] = { label: labels[labels.length - 1], value: activeStudents }

  const revenueTrend: TrendPoint[] = labels.map((label, i) => ({
    label,
    value: sparkFromBase(Math.round(paymentSummary.collected / 1000), labels.length, 0.12)[i] ?? 0,
  }))
  revenueTrend[revenueTrend.length - 1] = {
    label: labels[labels.length - 1],
    value: Math.round(paymentSummary.collected / 1000),
  }

  const completionByDepartment: TrendPoint[] = departments.slice(0, 6).map((dept) => {
    const deptEnrollments = activeEnrollments.filter((e) => {
      const course = courses.find((c) => c.id === e.courseId)
      return course?.department === dept.name
    })
    const avg =
      deptEnrollments.length > 0
        ? Math.round(deptEnrollments.reduce((s, e) => s + e.progress, 0) / deptEnrollments.length)
        : 0
    return { label: dept.name.split(' ')[0], value: avg }
  })

  const attendanceByDepartment: TrendPoint[] = departments.slice(0, 6).map((dept) => {
    const deptRecords = attendances.filter((a) => a.department === dept.name)
    const avg =
      deptRecords.length > 0
        ? Math.round(deptRecords.reduce((s, a) => s + a.attendancePercent, 0) / deptRecords.length)
        : 0
    return { label: dept.name.split(' ')[0], value: avg }
  })

  const assessmentActivity: TrendPoint[] = labels.map((label, i) => ({
    label,
    value: sparkFromBase(
      assignments.filter((a) => a.status === 'published').length +
        quizzes.filter((q) => q.status === 'published').length,
      labels.length,
      0.1,
    )[i],
  }))

  const loginActivity: TrendPoint[] = labels.map((label, i) => ({
    label,
    value: sparkFromBase(activeStudents * 3, labels.length, 0.05)[i],
  }))
  loginActivity[loginActivity.length - 1] = {
    label: labels[labels.length - 1],
    value: activeStudents * 4,
  }

  const topCourses = courses
    .filter((c) => c.status === 'published')
    .map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      enrolled: activeEnrollments.filter((e) => e.courseId === c.id).length,
      completion: c.progressPercent,
      instructor: c.instructor,
    }))
    .sort((a, b) => b.enrolled - a.enrolled)
    .slice(0, 8)

  const departmentStats = departments.map((dept) => {
    const deptStudents = students.filter((s) => s.department.includes(dept.name.split(' ')[0])).length
    const deptEnrollments = activeEnrollments.filter((e) => {
      const course = courses.find((c) => c.id === e.courseId)
      return course?.department === dept.name
    })
    const deptAttendance = attendances.filter((a) => a.department === dept.name)
    return {
      name: dept.name,
      students: deptStudents,
      enrollments: deptEnrollments.length,
      avgCompletion:
        deptEnrollments.length > 0
          ? Math.round(deptEnrollments.reduce((s, e) => s + e.progress, 0) / deptEnrollments.length)
          : 0,
      avgAttendance:
        deptAttendance.length > 0
          ? Math.round(deptAttendance.reduce((s, a) => s + a.attendancePercent, 0) / deptAttendance.length)
          : 0,
    }
  })

  const atRiskLearners = attendances
    .filter((a) => a.riskLevel === 'at-risk' || a.attendancePercent < 70)
    .slice(0, 8)
    .map((a) => {
      const enrollment = activeEnrollments.find(
        (e) => e.studentId === a.studentId && e.courseId === a.courseId,
      )
      return {
        id: a.id,
        name: a.studentName,
        course: a.courseCode,
        attendance: a.attendancePercent,
        progress: enrollment?.progress ?? 0,
      }
    })

  return {
    enrollmentTrend,
    revenueTrend,
    completionByDepartment,
    attendanceByDepartment,
    assessmentActivity,
    loginActivity,
    summary: {
      totalStudents: students.length,
      activeStudents,
      activeEnrollments: activeEnrollments.length,
      avgCompletion,
      avgAttendance,
      revenueCollected: paymentSummary.collected,
      revenueOutstanding: paymentSummary.outstanding,
      overduePayments: paymentSummary.overdue,
      publishedCourses: courses.filter((c) => c.status === 'published').length,
      upcomingSessions: countUpcomingLiveSessions(liveSessions),
      openAssignments: assignments.filter((a) => a.status === 'published').length,
      openQuizzes: quizzes.filter((q) => q.status === 'published').length,
    },
    topCourses,
    departmentStats,
    atRiskLearners,
  }
}

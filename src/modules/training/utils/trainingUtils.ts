/**
 * Training Edition rules shared by the admin, trainer and learner portals. They
 * mirror `backend/app/modules/training/logic.py`, which is the authority for
 * seats and enrollment — the portal uses these only to display state.
 */
import type { CourseEnrollment } from '../../institution/types'
import type {
  AttendanceMark,
  Cohort,
  CohortRegistration,
  CohortSession,
  CohortStatus,
  RegistrationStatus,
  TrainingProgram,
} from '../types'

export const HOLD_DAYS = 7
export const DEFAULT_MIN_ATTENDANCE = 75

/** Today's date on the viewer's calendar (not UTC), e.g. for an evening session in Addis Ababa. */
export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(`${fromIso.slice(0, 10)}T00:00:00Z`)
  const b = Date.parse(`${toIso.slice(0, 10)}T00:00:00Z`)
  return Math.round((b - a) / 86_400_000)
}

/** upcoming / active / completed / cancelled — from the dates unless set by hand. */
export function cohortState(cohort: Cohort, today = todayIso()): CohortStatus {
  if (cohort.status === 'cancelled' || cohort.status === 'completed') return cohort.status
  if (cohort.endDate && cohort.endDate < today) return 'completed'
  if (cohort.startDate && cohort.startDate <= today) return 'active'
  return 'upcoming'
}

export function holdExpired(reg: CohortRegistration, today = todayIso()): boolean {
  return reg.status === 'pending_payment' && !!reg.createdAt && addDays(reg.createdAt, HOLD_DAYS) < today
}

export function holdsSeat(reg: CohortRegistration, today = todayIso()): boolean {
  return (reg.status === 'pending_payment' || reg.status === 'enrolled') && !holdExpired(reg, today)
}

export function seatsTaken(cohortId: string, regs: CohortRegistration[], today = todayIso()): number {
  return regs.filter((r) => r.cohortId === cohortId && holdsSeat(r, today)).length
}

/** null means no seat limit. */
export function seatsLeft(cohort: Cohort, regs: CohortRegistration[], today = todayIso()): number | null {
  if (!cohort.seatCapacity || cohort.seatCapacity <= 0) return null
  return Math.max(0, cohort.seatCapacity - seatsTaken(cohort.id, regs, today))
}

export function cohortPrice(cohort: Cohort | undefined, program: TrainingProgram | undefined): number {
  if (cohort && cohort.price != null && !Number.isNaN(Number(cohort.price))) return Math.max(0, Number(cohort.price))
  return Math.max(0, Number(program?.price ?? 0))
}

export function formatMoney(amount: number, currency = 'ETB'): string {
  if (!amount) return 'Free'
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`
}

export function minAttendance(program: TrainingProgram | undefined): number {
  const value = Number(program?.minAttendance ?? DEFAULT_MIN_ATTENDANCE)
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : DEFAULT_MIN_ATTENDANCE
}

/** Share of recorded sessions attended (late counts, excused is left out). null with no sessions. */
export function attendanceRate(studentId: string, cohortId: string, sessions: CohortSession[]): number | null {
  let attended = 0
  let counted = 0
  for (const s of sessions) {
    if (s.cohortId !== cohortId) continue
    const mark = s.marks?.[studentId]
    if (!mark || mark === 'excused') continue
    counted += 1
    if (mark === 'present' || mark === 'late') attended += 1
  }
  return counted ? Math.round((attended / counted) * 100) : null
}

/** A learner's progress through the program: the average of their course progress in this cohort. */
export function cohortProgress(studentId: string, cohortId: string, enrollments: CourseEnrollment[]): number {
  const mine = enrollments.filter(
    (e) => e.studentId === studentId && e.cohortId === cohortId && e.status !== 'withdrawn',
  )
  if (!mine.length) return 0
  return Math.round(mine.reduce((sum, e) => sum + Math.min(100, e.progress ?? 0), 0) / mine.length)
}

export const REGISTRATION_META: Record<RegistrationStatus | 'expired', { label: string; tone: 'success' | 'warning' | 'neutral' | 'danger' }> = {
  enrolled: { label: 'Enrolled', tone: 'success' },
  pending_payment: { label: 'Awaiting payment', tone: 'warning' },
  expired: { label: 'Hold expired', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export function registrationState(reg: CohortRegistration, today = todayIso()): RegistrationStatus | 'expired' {
  return holdExpired(reg, today) ? 'expired' : reg.status
}

export const COHORT_META: Record<CohortStatus, { label: string; tone: 'success' | 'warning' | 'info' | 'neutral' | 'danger' }> = {
  upcoming: { label: 'Upcoming', tone: 'info' },
  active: { label: 'Running', tone: 'success' },
  completed: { label: 'Completed', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
}

export const MARK_META: Record<AttendanceMark, { label: string; short: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  present: { label: 'Present', short: 'P', tone: 'success' },
  late: { label: 'Late', short: 'L', tone: 'warning' },
  absent: { label: 'Absent', short: 'A', tone: 'danger' },
  excused: { label: 'Excused', short: 'E', tone: 'neutral' },
}

export const DELIVERY_LABEL: Record<string, string> = {
  'in-person': 'In person',
  online: 'Online (live)',
  hybrid: 'Hybrid',
  'self-paced': 'Self-paced',
}

export function formatDateRange(start?: string, end?: string): string {
  const fmt = (iso?: string) =>
    iso ? new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
  return `${fmt(start)} – ${fmt(end)}`
}

/** Why a learner cannot register for this cohort now, or null when they can. */
export function registrationClosedReason(
  cohort: Cohort | undefined,
  program: TrainingProgram | undefined,
  regs: CohortRegistration[],
  today = todayIso(),
): string | null {
  if (!cohort || !program) return 'This cohort does not exist.'
  if (program.status && program.status !== 'active') return 'This program is not open for registration.'
  if (!cohort.enrollmentOpen) return 'Registration is closed.'
  const state = cohortState(cohort, today)
  if (state === 'completed' || state === 'cancelled') return 'This cohort has finished.'
  if (cohort.registrationDeadline && cohort.registrationDeadline < today) return 'The registration deadline has passed.'
  const left = seatsLeft(cohort, regs, today)
  if (left !== null && left <= 0) return 'This cohort is full.'
  return null
}

export function downloadCsv(filename: string, rows: Record<string, string | number>[]): void {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const escape = (v: string | number) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

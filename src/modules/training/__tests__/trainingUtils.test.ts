import { describe, expect, it } from 'vitest'

import type { Cohort, CohortRegistration, CohortSession, TrainingProgram } from '../types'
import {
  attendanceRate,
  cohortPrice,
  cohortProgress,
  cohortState,
  registrationClosedReason,
  registrationState,
  seatsLeft,
} from '../utils/trainingUtils'

const TODAY = '2026-09-27'

const program = { id: 'p', price: 5000, status: 'active', minAttendance: 75 } as TrainingProgram
const cohort = {
  id: 'c',
  programId: 'p',
  startDate: '2026-10-10',
  endDate: '2026-11-30',
  seatCapacity: 2,
  enrollmentOpen: true,
  status: 'upcoming',
} as Cohort

const reg = (over: Partial<CohortRegistration>): CohortRegistration =>
  ({ id: 'r', cohortId: 'c', programId: 'p', studentId: 's', status: 'enrolled', createdAt: TODAY, ...over }) as CohortRegistration

describe('training rules', () => {
  it('derives the cohort state from its dates unless cancelled', () => {
    expect(cohortState(cohort, TODAY)).toBe('upcoming')
    expect(cohortState({ ...cohort, startDate: '2026-09-01' }, TODAY)).toBe('active')
    expect(cohortState({ ...cohort, endDate: '2026-09-20', startDate: '2026-09-01' }, TODAY)).toBe('completed')
    expect(cohortState({ ...cohort, status: 'cancelled' }, TODAY)).toBe('cancelled')
  })

  it('counts held seats, and releases an unpaid hold after 7 days', () => {
    const regs = [reg({ id: 'a' }), reg({ id: 'b', status: 'pending_payment', createdAt: '2026-09-10' })]
    expect(seatsLeft(cohort, regs, TODAY)).toBe(1)
    expect(registrationState(regs[1], TODAY)).toBe('expired')
    expect(seatsLeft({ ...cohort, seatCapacity: 0 }, regs, TODAY)).toBeNull()
  })

  it('explains why registration is closed', () => {
    expect(registrationClosedReason(cohort, program, [], TODAY)).toBeNull()
    expect(registrationClosedReason({ ...cohort, enrollmentOpen: false }, program, [], TODAY)).toMatch(/closed/i)
    expect(registrationClosedReason(cohort, program, [reg({ id: 'a' }), reg({ id: 'b' })], TODAY)).toMatch(/full/i)
    expect(registrationClosedReason({ ...cohort, registrationDeadline: '2026-09-01' }, program, [], TODAY)).toMatch(/deadline/i)
  })

  it('uses the cohort price when it overrides the program', () => {
    expect(cohortPrice(cohort, program)).toBe(5000)
    expect(cohortPrice({ ...cohort, price: 4000 }, program)).toBe(4000)
    expect(cohortPrice({ ...cohort, price: 0 }, program)).toBe(0)
  })

  it('computes attendance with late counting and excused left out', () => {
    const sessions = ['present', 'late', 'absent', 'excused'].map((m, i) => ({ id: `${i}`, cohortId: 'c', date: TODAY, marks: { s: m } })) as CohortSession[]
    expect(attendanceRate('s', 'c', sessions)).toBe(67)
    expect(attendanceRate('other', 'c', sessions)).toBeNull()
  })

  it('averages course progress within the cohort only', () => {
    const enrollments = [
      { studentId: 's', courseId: 'a', cohortId: 'c', progress: 100, status: 'active' },
      { studentId: 's', courseId: 'b', cohortId: 'c', progress: 50, status: 'active' },
      { studentId: 's', courseId: 'x', cohortId: 'other', progress: 0, status: 'active' },
    ] as never
    expect(cohortProgress('s', 'c', enrollments)).toBe(75)
  })
})

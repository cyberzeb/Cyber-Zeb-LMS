import { describe, expect, it } from 'vitest'

import { apiErrorMessage } from '../api/client'
import { academicStanding, gradePointAverage, isPassingPercent, percentToLetter } from '../academics/gradeScale'
import { guardianLinkFields, linkedStudentIdsOf } from '../people/guardianLinks'
import type { PersonRow } from '../../modules/institution/types'

const person = (p: Partial<PersonRow>): PersonRow =>
  ({ id: 'x', name: 'X', email: 'x@x.com', role: 'Student', department: '', status: 'active', lastActive: '', initials: 'X', ...p }) as PersonRow

describe('guardian links', () => {
  const students = [person({ id: 's1', name: 'Sam' }), person({ id: 's2', name: 'Tia' })]

  it('reads every form of link', () => {
    expect(linkedStudentIdsOf(person({ role: 'Guardian', linkedStudentIds: ['s1', 's2'] }), students)).toEqual(['s1', 's2'])
    expect(linkedStudentIdsOf(person({ role: 'Guardian', linkedStudentId: 's2' }), students)).toEqual(['s2'])
    expect(linkedStudentIdsOf(person({ role: 'Guardian', department: 'Sam' }), students)).toEqual(['s1'])
    expect(linkedStudentIdsOf(null, students)).toEqual([])
  })

  it('stores all children and a readable label', () => {
    expect(guardianLinkFields(students)).toMatchObject({
      linkedStudentId: 's1',
      linkedStudentIds: ['s1', 's2'],
      department: 'Sam, Tia',
    })
  })
})

describe('grade scale', () => {
  it('maps percentages to letters and passing', () => {
    expect(percentToLetter(96)).toBe('A+')
    expect(percentToLetter(72)).toBe('B-')
    expect(percentToLetter(12)).toBe('F')
    expect(isPassingPercent(50)).toBe(true)
    expect(isPassingPercent(49)).toBe(false)
  })

  it('computes credit-weighted GPA and standing', () => {
    const gpa = gradePointAverage([
      { points: 4, credits: 3 },
      { points: 2, credits: 1 },
    ])
    expect(gpa).toBeCloseTo(3.5, 2)
    expect(academicStanding(null)).toBeNull()
  })
})

describe('API error messages', () => {
  it('prefers the server message', () => {
    expect(apiErrorMessage({ response: { status: 400, data: { error: { message: 'Bad code' } } } })).toBe('Bad code')
  })

  it('explains FastAPI validation errors', () => {
    const err = {
      response: {
        status: 422,
        data: { detail: [{ loc: ['body', 'master_data', 'official_email'], msg: 'Value error, not an email' }, { loc: ['body', 'x'], msg: 'bad' }] },
      },
    }
    expect(apiErrorMessage(err)).toBe('Official email: not an email (and 1 more)')
  })

  it('describes network, timeout, rate-limit and server failures', () => {
    expect(apiErrorMessage({ request: {}, code: 'ERR_NETWORK' })).toMatch(/Cannot reach the server/)
    expect(apiErrorMessage({ code: 'ECONNABORTED' })).toMatch(/took too long/)
    expect(apiErrorMessage({ response: { status: 429, data: {} } })).toMatch(/Too many attempts/)
    expect(apiErrorMessage({ response: { status: 503, data: {} } })).toMatch(/server ran into a problem/)
    expect(apiErrorMessage({ response: { status: 404, data: {} } })).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'

import { applyEditionVocabulary } from '../editionGlossary'

describe('applyEditionVocabulary', () => {
  it('leaves University text unchanged', () => {
    expect(applyEditionVocabulary('Enroll Student', 'university')).toBe('Enroll Student')
  })

  it('rewrites University words for the Corporate Edition', () => {
    expect(applyEditionVocabulary('Students', 'corporate')).toBe('Employees')
    expect(applyEditionVocabulary('Instructor dashboard', 'corporate')).toBe('Trainer dashboard')
    expect(applyEditionVocabulary('TOTAL STUDENTS', 'corporate')).toBe('TOTAL EMPLOYEES')
    expect(applyEditionVocabulary('Campus-wide', 'corporate')).toBe('Organization-wide')
    expect(applyEditionVocabulary('12 students enrolled', 'corporate')).toBe('12 employees assigned')
    expect(applyEditionVocabulary('Enroll Student', 'corporate')).toBe('Add Employee')
  })

  it('fixes the article when the noun changes', () => {
    expect(applyEditionVocabulary('Add a student', 'corporate')).toBe('Add an employee')
    expect(applyEditionVocabulary('A student must sign in', 'corporate')).toBe('An employee must sign in')
  })

  it('only replaces whole words', () => {
    expect(applyEditionVocabulary('Studentship', 'corporate')).toBe('Studentship')
    expect(applyEditionVocabulary('campusnet', 'corporate')).toBe('campusnet')
  })

  it('uses learner wording for the Training Edition', () => {
    expect(applyEditionVocabulary('Students', 'training_organization')).toBe('Learners')
    expect(applyEditionVocabulary('Campus-wide', 'training_organization')).toBe('Academy-wide')
  })

  it('handles empty text and unknown editions', () => {
    expect(applyEditionVocabulary('', 'corporate')).toBe('')
    expect(applyEditionVocabulary('Students', 'other')).toBe('Students')
  })
})

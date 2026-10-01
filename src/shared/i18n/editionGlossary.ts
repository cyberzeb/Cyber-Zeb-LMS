/**
 * Edition vocabulary for shared screens.
 *
 * Most pages are shared by every edition and were written with University words
 * ("Students", "Instructors", "Campus"). Text that goes through `tx()` — page
 * headers, stat tiles, filters, buttons, form labels, status pills, menus — is
 * rewritten here into the active edition's words, so a bank sees "Employees" and
 * "Trainers" without every page carrying its own copy.
 *
 * Only whole words are replaced, and "a Student" becomes "an Employee". Text that
 * is specific to one screen is still written per edition in that screen.
 */

import { getActiveEdition } from '../config/tenant'

type Rule = [RegExp, string]

function words(pairs: [string, string][]): Rule[] {
  const rules: Rule[] = []
  for (const [from, to] of pairs) {
    // Article agreement first: "a student" → "an employee".
    const vowel = /^[aeiou]/i.test(to)
    const fromVowel = /^[aeiou]/i.test(from)
    if (vowel !== fromVowel) {
      rules.push([new RegExp(`\\b${fromVowel ? 'an' : 'a'} ${from}\\b`, 'g'), `${vowel ? 'an' : 'a'} ${to}`])
      rules.push([new RegExp(`\\b${fromVowel ? 'An' : 'A'} ${from}\\b`, 'g'), `${vowel ? 'An' : 'A'} ${to}`])
    }
    rules.push([new RegExp(`\\b${from}\\b`, 'g'), to])
  }
  return rules
}

function cased(pairs: [string, string][]): [string, string][] {
  const out: [string, string][] = []
  for (const [from, to] of pairs) {
    out.push([from, to])
    out.push([from.charAt(0).toUpperCase() + from.slice(1), to.charAt(0).toUpperCase() + to.slice(1)])
    out.push([from.toUpperCase(), to.toUpperCase()])
  }
  return out
}

const CORPORATE: Rule[] = [
  // Whole phrases that read better than word-by-word swaps.
  [/\bCampus-wide\b/g, 'Organization-wide'],
  [/\bcampus-wide\b/g, 'organization-wide'],
  [/\bacross campus\b/g, 'across the organization'],
  [/\bFaculty & Staff\b/g, 'Trainers & Staff'],
  [/\bFaculty\b/g, 'Trainers'],
  [/\bEnroll Student\b/g, 'Add Employee'],
  [/\bStudent Roster\b/g, 'Employee Roster'],
  [/\bGrades & Transcript\b/g, 'My Results'],
  [/\bGradebook\b/g, 'Results'],
  [/\bAll campuses\b/g, 'All branches'],
  [/\bCampus Profile\b/g, 'Branch Profile'],
  [/\bcourse offerings?\b/gi, 'training modules'],
  [/\bEnrolled\b/g, 'Assigned'],
  [/\benrolled\b/g, 'assigned'],
  ...words(
    cased([
      ['students', 'employees'],
      ['student', 'employee'],
      ['learners', 'employees'],
      ['learner', 'employee'],
      ['instructors', 'trainers'],
      ['instructor', 'trainer'],
      ['campuses', 'branches'],
      ['campus', 'branch'],
      ['enrollments', 'assignments'],
      ['enrollment', 'assignment'],
      ['enrolments', 'assignments'],
      ['enrolment', 'assignment'],
      ['classmates', 'colleagues'],
      ['coursework', 'training work'],
    ]),
  ),
]

const TRAINING: Rule[] = [
  [/\bCampus-wide\b/g, 'Academy-wide'],
  [/\bacross campus\b/g, 'across the academy'],
  [/\bAll campuses\b/g, 'All locations'],
  [/\bStudent Roster\b/g, 'Learner Roster'],
  [/\bFaculty & Staff\b/g, 'Trainers & Staff'],
  [/\bFaculty\b/g, 'Trainers'],
  [/\bGrades & Transcript\b/g, 'My Results'],
  ...words(
    cased([
      ['students', 'learners'],
      ['student', 'learner'],
      ['instructors', 'trainers'],
      ['instructor', 'trainer'],
      ['campuses', 'locations'],
      ['campus', 'location'],
    ]),
  ),
]

export function applyEditionVocabulary(text: string, edition: string): string {
  if (!text || edition === 'university') return text
  const rules = edition === 'corporate' ? CORPORATE : edition === 'training_organization' ? TRAINING : null
  if (!rules) return text
  let out = text
  for (const [pattern, replacement] of rules) out = out.replace(pattern, replacement)
  return out
}

/** The same rewrite for code outside React components (builders, utilities). */
export function vocab(text: string): string {
  return applyEditionVocabulary(text, getActiveEdition())
}

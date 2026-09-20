/**
 * University Edition grading scale (letter grades on a 4.0 scale).
 *
 * One place decides how a percentage becomes a letter and grade points, so the
 * student gradebook, transcripts, the guardian portal and registrar reports all
 * agree. `settings.academic.grading` currently names the scale in words; when it
 * becomes structured data this is the only file that has to change.
 */

export interface GradeBand {
  letter: string
  points: number
  /** Lowest percentage that earns this letter. */
  min: number
}

export const GRADE_BANDS: GradeBand[] = [
  { letter: 'A+', points: 4.0, min: 95 },
  { letter: 'A', points: 4.0, min: 90 },
  { letter: 'A-', points: 3.75, min: 85 },
  { letter: 'B+', points: 3.5, min: 80 },
  { letter: 'B', points: 3.0, min: 75 },
  { letter: 'B-', points: 2.75, min: 70 },
  { letter: 'C+', points: 2.5, min: 65 },
  { letter: 'C', points: 2.0, min: 60 },
  { letter: 'C-', points: 1.75, min: 55 },
  { letter: 'D', points: 1.0, min: 50 },
  { letter: 'F', points: 0, min: 0 },
]

/** Lowest letter that still earns credit. */
export const PASS_MARK_PERCENT = 50

export function percentToLetter(percent: number): string {
  const band = GRADE_BANDS.find((b) => percent >= b.min)
  return band?.letter ?? 'F'
}

export function letterToPoints(letter: string): number {
  return GRADE_BANDS.find((b) => b.letter === letter)?.points ?? 0
}

export function percentToPoints(percent: number): number {
  return letterToPoints(percentToLetter(percent))
}

export function isPassingPercent(percent: number): boolean {
  return percent >= PASS_MARK_PERCENT
}

/** Weighted grade point average, rounded to two decimals. */
export function gradePointAverage(
  entries: { points: number; credits: number }[],
): number | null {
  const credits = entries.reduce((sum, e) => sum + e.credits, 0)
  if (credits <= 0) return null
  const weighted = entries.reduce((sum, e) => sum + e.points * e.credits, 0)
  return Math.round((weighted / credits) * 100) / 100
}

export type AcademicStanding = 'Dean’s List' | 'Good Standing' | 'Academic Warning' | 'Academic Probation'

export function academicStanding(gpa: number | null): AcademicStanding | null {
  if (gpa === null) return null
  if (gpa >= 3.75) return 'Dean’s List'
  if (gpa >= 2.5) return 'Good Standing'
  if (gpa >= 2.0) return 'Academic Warning'
  return 'Academic Probation'
}

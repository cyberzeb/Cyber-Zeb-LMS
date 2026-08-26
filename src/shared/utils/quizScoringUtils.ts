import type { QuestionRecord } from '../../modules/institution/types/assessments'

export function scoreQuizAnswers(
  questions: QuestionRecord[],
  answers: Record<string, string>,
): { score: number; maxScore: number } {
  let score = 0
  let maxScore = 0

  for (const question of questions) {
    maxScore += question.points
    const given = answers[question.id]?.trim()
    const expected = question.correctAnswer?.trim()
    if (!given || !expected) continue

    if (question.type === 'true-false') {
      if (given.toLowerCase() === expected.toLowerCase()) score += question.points
    } else if (given === expected) {
      score += question.points
    }
  }

  return { score, maxScore }
}

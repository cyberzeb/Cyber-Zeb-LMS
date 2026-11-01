import { apiClient } from './client'
import type { QuizAnswer } from '../../modules/institution/types/assessments'

export interface QuizAttemptResult {
  submission: Record<string, unknown>
  score: number
  max_score: number
  /** Answers the instructor still has to mark (essays). */
  pending_review?: number
}

/** Submit answers; the server grades them and records the submission. */
export async function submitQuizAttempt(quizId: string, answers: Record<string, QuizAnswer>) {
  const { data } = await apiClient.post<QuizAttemptResult>(
    `/assessments/quizzes/${encodeURIComponent(quizId)}/attempts`,
    { answers },
  )
  return data
}

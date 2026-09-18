import { apiClient } from './client'

export interface QuizAttemptResult {
  submission: Record<string, unknown>
  score: number
  max_score: number
}

/** Submit answers; the server grades them and records the submission. */
export async function submitQuizAttempt(quizId: string, answers: Record<string, string>) {
  const { data } = await apiClient.post<QuizAttemptResult>(
    `/assessments/quizzes/${encodeURIComponent(quizId)}/attempts`,
    { answers },
  )
  return data
}

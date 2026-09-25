import type { QueryClient } from '@tanstack/react-query'

import { apiClient } from '../../../shared/api/client'
import { refreshCollection } from '../../../shared/hooks/useApiCollection'
import { whenSaved } from '../../../shared/storage/collectionSync'
import { STORAGE_EVENTS, STORAGE_KEYS } from '../../../shared/storage/keys'

export interface AutoIssueResult {
  enabled: boolean
  issued: string[]
  pending: string[]
}

/** Collections the completion rules read; wait for local edits to reach the server. */
const INPUTS = ['lesson-progress', 'student-submissions', 'enrollments', 'settings', 'courses']

/**
 * Ask the server to apply the institution's certificate rules now. Learners
 * only ever trigger their own check. Returns what was created, and refreshes
 * the certificates everyone sees.
 */
export async function runCertificateAutoIssue(
  queryClient: QueryClient,
  scope: { studentId?: string; courseId?: string } = {},
): Promise<AutoIssueResult> {
  await Promise.all(INPUTS.map(whenSaved))
  const { data } = await apiClient.post<AutoIssueResult>('/certificates/auto-issue', {
    student_id: scope.studentId,
    course_id: scope.courseId,
  })
  if (data.issued.length || data.pending.length) {
    await refreshCollection(queryClient, STORAGE_KEYS.certificates)
    window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.certificatesUpdated))
  }
  return data
}

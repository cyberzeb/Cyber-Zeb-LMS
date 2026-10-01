import { useState } from 'react'

import { apiErrorMessage } from '../../../shared/api/client'
import { remindEmployee } from '../../../shared/api/remindApi'
import { useToast } from '../../../shared/components/toast/ToastProvider'

/** Send a training reminder to one employee, with feedback. */
export function useRemind() {
  const { notify } = useToast()
  const [sendingId, setSendingId] = useState<string | null>(null)

  async function remind(employeeId: string) {
    setSendingId(employeeId)
    try {
      const result = await remindEmployee(employeeId)
      notify(result.message, result.sent ? 'success' : 'info')
    } catch (err) {
      notify(apiErrorMessage(err) ?? 'Could not send the reminder.', 'error')
    } finally {
      setSendingId(null)
    }
  }

  return { remind, sendingId }
}

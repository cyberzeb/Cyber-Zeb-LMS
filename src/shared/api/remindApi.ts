import { apiClient } from './client'

/** Email an employee the training they still owe (admins, or the employee's manager). */
export async function remindEmployee(employeeId: string): Promise<{ sent: boolean; message: string }> {
  const { data } = await apiClient.post<{ sent: boolean; message: string }>('/communication/remind', {
    employee_id: employeeId,
  })
  return data
}

/** Send today's due-soon / overdue / renewal reminders now (they also run automatically). */
export async function runTrainingReminders(): Promise<{ sent: number }> {
  const { data } = await apiClient.post<{ sent: number }>('/communication/training-reminders')
  return data
}

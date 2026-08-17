import type { HelpDeskTicket } from '../../modules/institution/types'
import type { IntegrationStatusItem } from '../../modules/institution/types'
import type { HelpDeskTicket as StudentHelpDeskTicket, PaymentItem } from '../../modules/students/types'
import type { HelpDeskTicket as InstructorHelpDeskTicket } from '../../modules/instructors/types'
import type {
  ApiIntegrationRecord,
  HelpDeskTicketRecord,
  PaymentRecord,
} from '../../modules/institution/types/platform'

export function formatCurrency(amount: number, currency = 'ETB'): string {
  return `${currency} ${amount.toLocaleString('en-US')}`
}

export function formatPlatformDateTime(iso: string): string {
  if (iso === 'Never') return 'Never'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatRelativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return formatPlatformDateTime(iso)
}

function resolvePaymentStatus(record: PaymentRecord): PaymentItem['status'] {
  if (record.status === 'paid' || record.status === 'refunded') return 'paid'
  if (record.status === 'overdue') return 'overdue'
  if (new Date(record.dueAt).getTime() < Date.now()) return 'overdue'
  return 'pending'
}

export function toStudentPayments(records: PaymentRecord[], studentId: string): PaymentItem[] {
  return records
    .filter((p) => p.studentId === studentId && p.status !== 'refunded')
    .map((p) => ({
      id: p.id,
      label: p.label,
      amount: formatCurrency(p.amount, p.currency),
      dueAt: p.paidAt
        ? `Paid ${formatPlatformDateTime(p.paidAt)}`
        : `Due ${formatPlatformDateTime(p.dueAt)}`,
      status: resolvePaymentStatus(p),
    }))
    .sort((a, b) => {
      const order = { overdue: 0, pending: 1, paid: 2 }
      return order[a.status] - order[b.status]
    })
}

export function toStudentHelpDeskTickets(
  records: HelpDeskTicketRecord[],
  requesterId: string,
): StudentHelpDeskTicket[] {
  return records
    .filter((t) => t.requesterId === requesterId)
    .map((t) => ({
      id: t.id,
      subject: t.subject,
      category: t.category,
      status: t.status,
      priority: t.priority,
      updatedAt: formatRelativeDate(t.updatedAt),
    }))
    .sort((a, b) => {
      const order = { open: 0, 'in-review': 1, resolved: 2 }
      return order[a.status] - order[b.status]
    })
}

export function toInstructorHelpDeskTickets(
  records: HelpDeskTicketRecord[],
  requesterId: string,
): InstructorHelpDeskTicket[] {
  return toStudentHelpDeskTickets(records, requesterId)
}

export function toAdminHelpDeskTickets(records: HelpDeskTicketRecord[]): HelpDeskTicket[] {
  return records
    .map((t) => ({
      id: t.id,
      subject: t.subject,
      requester: `${t.requesterName} (${t.requesterRole})`,
      priority: t.priority,
      status: t.status,
      updatedAt: formatRelativeDate(t.updatedAt),
    }))
    .sort((a, b) => {
      const order = { open: 0, 'in-review': 1, resolved: 2 }
      return order[a.status] - order[b.status]
    })
}

export function toIntegrationStatusItems(records: ApiIntegrationRecord[]): IntegrationStatusItem[] {
  return records
    .filter((r) => r.enabled)
    .map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      lastSync: r.lastSync === 'Never' ? 'Never' : formatRelativeDate(r.lastSync),
    }))
}

export function computePaymentSummary(records: PaymentRecord[]) {
  const active = records.filter((p) => p.status !== 'refunded')
  const collected = active
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0)
  const outstanding = active
    .filter((p) => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0)
  const overdue = active.filter((p) => resolvePaymentStatus(p) === 'overdue').length
  const pending = active.filter((p) => p.status === 'pending').length
  const paid = active.filter((p) => p.status === 'paid').length

  return { collected, outstanding, overdue, pending, paid, total: active.length }
}

export function markPaymentPaid(records: PaymentRecord[], paymentId: string): PaymentRecord[] {
  return records.map((p) =>
    p.id === paymentId
      ? {
          ...p,
          status: 'paid' as const,
          paidAt: new Date().toISOString(),
        }
      : p,
  )
}

import type { ComplianceAlert, ComplianceStatus } from '../types'

export const COMPLIANCE_STATUS_TONE: Record<ComplianceStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  compliant: 'success',
  'at-risk': 'warning',
  overdue: 'danger',
  expiring: 'warning',
  'not-assigned': 'neutral',
}

export const COMPLIANCE_STATUS_LABEL: Record<ComplianceStatus, string> = {
  compliant: 'compliant',
  'at-risk': 'at risk',
  overdue: 'overdue',
  expiring: 'recertification due',
  'not-assigned': 'not assigned',
}

export const ALERT_LABEL: Record<ComplianceAlert['kind'], { label: string; tone: 'danger' | 'warning' | 'neutral' }> = {
  overdue: { label: 'Overdue', tone: 'danger' },
  unassigned: { label: 'Not assigned', tone: 'warning' },
  'due-soon': { label: 'Due soon', tone: 'warning' },
  recertification: { label: 'Recertification', tone: 'neutral' },
}

export function alertDetail(alert: ComplianceAlert): string {
  if (alert.kind === 'unassigned') return 'Required by job role — never assigned'
  if (alert.daysFromNow === undefined) return alert.date ?? ''
  if (alert.daysFromNow < 0) return `${Math.abs(alert.daysFromNow)} days late`
  if (alert.daysFromNow === 0) return 'Due today'
  return `in ${alert.daysFromNow} days`
}

/** Download rows as a CSV file. */
export function downloadCsv(filename: string, rows: Record<string, string | number>[]): void {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const escape = (v: string | number) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

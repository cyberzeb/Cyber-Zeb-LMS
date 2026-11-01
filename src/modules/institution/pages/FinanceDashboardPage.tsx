import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Percent, Receipt, Wallet } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { computePaymentSummary, formatCurrency } from '../../../shared/storage/platformUtils'
import { getSessionPerson } from '../../../shared/storage/session'
import { usePayments } from '../hooks/usePlatformStorage'
import type { PaymentRecord } from '../types/platform'

function isOverdue(p: PaymentRecord, now: number): boolean {
  if (p.status === 'overdue') return true
  return p.status === 'pending' && Boolean(p.dueAt) && new Date(p.dueAt).getTime() < now
}

function shortDate(iso?: string): string {
  if (!iso) return '—'
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Finance Officer home: what has been collected, what is owed, and who is late. */
export function FinanceDashboardPage() {
  const navigate = useNavigate()
  const person = getSessionPerson()
  const { records } = usePayments()
  // Fixed for this visit so the overdue list stays stable between renders.
  const [now] = useState(() => Date.now())

  const summary = useMemo(() => computePaymentSummary(records), [records])

  const { overdue, recentPaid, byCategory } = useMemo(() => {
    const active = records.filter((r) => r.status !== 'refunded')
    const late = active
      .filter((r) => isOverdue(r, now))
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    const paid = active
      .filter((r) => r.status === 'paid')
      .sort((a, b) => (b.paidAt ?? '').localeCompare(a.paidAt ?? ''))
    const categories = new Map<string, { billed: number; collected: number }>()
    for (const r of active) {
      const row = categories.get(r.category) ?? { billed: 0, collected: 0 }
      row.billed += r.amount
      if (r.status === 'paid') row.collected += r.amount
      categories.set(r.category, row)
    }
    return {
      overdue: late,
      recentPaid: paid.slice(0, 6),
      byCategory: [...categories.entries()].sort((a, b) => b[1].billed - a[1].billed),
    }
  }, [records, now])

  const billed = summary.collected + summary.outstanding
  const collectionRate = billed > 0 ? Math.round((summary.collected / billed) * 100) : 0
  const currency = records[0]?.currency ?? 'ETB'

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Finance Dashboard"
        subtitle={`Welcome${person ? `, ${person.name.split(' ')[0]}` : ''}. Tuition and fee collection across the institution.`}
        actions={
          <Button variant="primary" onClick={() => navigate('/admin/payments')}>
            <Receipt size={16} />
            Manage invoices
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatBlock
          label="Collected"
          value={formatCurrency(summary.collected, currency)}
          sub={`${summary.paid} paid invoice${summary.paid === 1 ? '' : 's'}`}
          icon={<CheckCircle2 size={17} />}
        />
        <StatBlock
          label="Outstanding"
          value={formatCurrency(summary.outstanding, currency)}
          sub={`${summary.pending} awaiting payment`}
          icon={<Wallet size={17} />}
        />
        <StatBlock
          label="Overdue invoices"
          value={overdue.length}
          sub="Past their due date"
          icon={<AlertTriangle size={17} />}
        />
        <StatBlock
          label="Collection rate"
          value={`${collectionRate}%`}
          sub="Collected of all billed"
          icon={<Percent size={17} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <GlassCard className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold text-navy-900">Overdue invoices</h2>
            <span className="text-[12px] text-secondary-text">{overdue.length} total</span>
          </div>
          {overdue.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-secondary-text">No overdue invoices.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-secondary-text border-b border-divider">
                    <th className="py-2 pr-4 font-semibold">Student</th>
                    <th className="py-2 pr-4 font-semibold">Invoice</th>
                    <th className="py-2 pr-4 font-semibold">Amount</th>
                    <th className="py-2 font-semibold">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {overdue.slice(0, 8).map((p) => (
                    <tr key={p.id} className="border-b border-divider/60">
                      <td className="py-2.5 pr-4 font-semibold text-navy-900">{p.studentName}</td>
                      <td className="py-2.5 pr-4 text-secondary-text">{p.label}</td>
                      <td className="py-2.5 pr-4 font-semibold">{formatCurrency(p.amount, p.currency)}</td>
                      <td className="py-2.5 text-red-600 dark:text-red-400">{shortDate(p.dueAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="text-[15px] font-bold text-navy-900 mb-3">By fee type</h2>
          {byCategory.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-secondary-text">No invoices yet.</p>
          ) : (
            <ul className="flex flex-col gap-3.5">
              {byCategory.map(([category, row]) => {
                const pct = row.billed > 0 ? Math.round((row.collected / row.billed) * 100) : 0
                return (
                  <li key={category}>
                    <div className="flex justify-between text-[12.5px] mb-1">
                      <span className="font-semibold text-navy-900 capitalize">{category.replace('-', ' ')}</span>
                      <span className="text-secondary-text">
                        {formatCurrency(row.collected, currency)} / {formatCurrency(row.billed, currency)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-navy-100 dark:bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-lemon-500" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <h2 className="text-[15px] font-bold text-navy-900 mb-3">Recently paid</h2>
        {recentPaid.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-secondary-text">No payments received yet.</p>
        ) : (
          <ul className="divide-y divide-divider/60">
            {recentPaid.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5 text-[13px]">
                <div className="min-w-0">
                  <div className="font-semibold text-navy-900 truncate">{p.studentName}</div>
                  <div className="text-[11.5px] text-secondary-text truncate">{p.label}</div>
                </div>
                <div className="text-right shrink-0 pl-4">
                  <div className="font-semibold">{formatCurrency(p.amount, p.currency)}</div>
                  <div className="text-[11.5px] text-secondary-text">{shortDate(p.paidAt)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  )
}

import { useMemo } from 'react'
import { CheckCircle2, CreditCard, Receipt, Wallet } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { usePayments } from '../../institution/hooks/usePlatformStorage'
import { StudentPageError, StudentPageLoading } from '../components/StudentPageStates'
import { useStudentDashboard } from '../hooks/useStudentDashboard'
import type { PaymentItem } from '../types'

const statusTone: Record<PaymentItem['status'], 'success' | 'warning' | 'danger'> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
}

const statusLabel: Record<PaymentItem['status'], string> = {
  paid: 'Paid',
  pending: 'Pending',
  overdue: 'Overdue',
}

const statusAccent: Record<PaymentItem['status'], string> = {
  paid: 'border-l-success from-success-bg/40',
  pending: 'border-l-warning from-warning-bg/40',
  overdue: 'border-l-danger from-danger-bg/40',
}

export function StudentPaymentsPage() {
  const { notify } = useToast()
  const { markPaid } = usePayments()
  const { data, isLoading, isError, reload } = useStudentDashboard()

  const stats = useMemo(() => {
    if (!data) return { pending: 0, paid: 0, overdue: 0 }
    return {
      pending: data.payments.filter((p) => p.status === 'pending').length,
      paid: data.payments.filter((p) => p.status === 'paid').length,
      overdue: data.payments.filter((p) => p.status === 'overdue').length,
    }
  }, [data])

  if (isLoading) return <StudentPageLoading />
  if (isError || !data) return <StudentPageError message="Failed to load payments." />

  const outstanding = data.payments.filter((p) => p.status !== 'paid')
  const nextDue = outstanding[0]

  const handlePay = (paymentId: string, label: string) => {
    markPaid(paymentId)
    notify(`Payment for "${label}" submitted successfully.`)
    void reload()
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Payments & Fees"
        subtitle="Tuition, lab fees, and registration — view balances and pay online."
        actions={
          outstanding.length > 0 ? (
            <Button variant="primary">
              <CreditCard size={15} />
              Pay outstanding
            </Button>
          ) : undefined
        }
      />

      {nextDue && nextDue.status !== 'paid' ? (
        <GlassCard className="relative overflow-hidden p-0 border-warning/30">
          <div className="absolute inset-0 banner-warning" />
          <div className="relative p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning text-navy-900 flex items-center justify-center shrink-0">
                <Receipt size={22} />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-warning">Next payment due</div>
                <h2 className="mt-1 text-[18px] font-bold text-navy-900">{nextDue.label}</h2>
                <p className="mt-1 text-[13px] text-secondary-text">{nextDue.dueAt}</p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <div className="text-[28px] font-extrabold text-navy-900 leading-none">{nextDue.amount}</div>
              <Button variant="primary" size="sm" className="mt-3" onClick={() => handlePay(nextDue.id, nextDue.label)}>
                Pay now
              </Button>
            </div>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="relative overflow-hidden p-0">
          <div className="absolute inset-0 banner-success" />
          <div className="relative p-6 flex items-center gap-4">
            <CheckCircle2 size={28} className="text-success shrink-0" />
            <div>
              <h2 className="text-[16px] font-bold text-navy-900">All caught up!</h2>
              <p className="text-[13px] text-secondary-text mt-0.5">No outstanding payments for {data.term}.</p>
            </div>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBlock
          label="Outstanding"
          value={stats.pending + stats.overdue}
          sub="Requires action"
          icon={<Wallet size={17} />}
          iconBg="bg-warning-bg text-warning"
        />
        <StatBlock
          label="Paid"
          value={stats.paid}
          sub="This term"
          icon={<CheckCircle2 size={17} />}
          iconBg="bg-success-bg text-success"
        />
        <StatBlock
          label="Program"
          value={data.term}
          sub={data.program}
          icon={<Receipt size={17} />}
          iconBg="bg-navy-50 text-navy-600"
        />
      </div>

      <div className="flex flex-col gap-3">
        {data.payments.map((payment) => (
          <GlassCard
            key={payment.id}
            className={`p-0 overflow-hidden border-l-4 bg-gradient-to-r ${statusAccent[payment.status]} to-card-end hover:shadow-md transition-shadow`}
          >
            <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    payment.status === 'paid'
                      ? 'bg-success text-white'
                      : payment.status === 'overdue'
                        ? 'bg-danger text-white'
                        : 'bg-warning text-navy-900'
                  }`}
                >
                  {payment.status === 'paid' ? <CheckCircle2 size={18} /> : <CreditCard size={18} />}
                </div>
                <div>
                  <StatusPill label={statusLabel[payment.status]} tone={statusTone[payment.status]} />
                  <h3 className="mt-1.5 text-[15px] font-bold text-navy-900">{payment.label}</h3>
                  <p className="mt-1 text-[12px] text-secondary-text">{payment.dueAt}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-[22px] font-extrabold text-navy-900">{payment.amount}</div>
                {payment.status !== 'paid' ? (
                  <Button
                    variant={payment.status === 'overdue' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => handlePay(payment.id, payment.label)}
                  >
                    Pay now
                  </Button>
                ) : null}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

export default StudentPaymentsPage

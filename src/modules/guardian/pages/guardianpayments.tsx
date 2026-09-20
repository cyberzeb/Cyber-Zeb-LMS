import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Wallet } from 'lucide-react'

import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { apiErrorMessage } from '../../../shared/api/client'
import { checkoutInvoice, verifyCheckout } from '../../../shared/api/paymentsApi'
import { refreshCollection } from '../../../shared/hooks/useApiCollection'
import { STORAGE_KEYS } from '../../../shared/storage/keys'
import { readPayments } from '../../../shared/storage/readers'
import { formatCurrency } from '../../../shared/storage/platformUtils'
import { useLinkedStudent } from '../hooks/useLinkedStudent'

export function GuardianPaymentsPage() {
  const { notify } = useToast()
  const queryClient = useQueryClient()
  const { student } = useLinkedStudent()
  const [payingId, setPayingId] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [searchParams, setSearchParams] = useSearchParams()
  const verifiedRef = useRef<string | null>(null)

  const invoices = useMemo(
    () => (student ? readPayments().filter((p) => p.studentId === student.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [student, reloadToken],
  )

  const outstanding = invoices.filter((i) => i.status !== 'paid')

  // Coming back from the payment provider: confirm with the server.
  const txRef = searchParams.get('tx_ref')
  useEffect(() => {
    if (!txRef || verifiedRef.current === txRef) return
    verifiedRef.current = txRef
    void (async () => {
      try {
        const result = await verifyCheckout(txRef)
        await refreshCollection(queryClient, STORAGE_KEYS.payments)
        setReloadToken((n) => n + 1)
        notify(
          result.status === 'paid'
            ? 'Payment confirmed. Thank you!'
            : 'Your payment is still being processed.',
          result.status === 'paid' ? 'success' : 'info',
        )
      } catch (err) {
        notify(apiErrorMessage(err) ?? 'We could not confirm the payment.', 'error')
      } finally {
        setSearchParams({}, { replace: true })
      }
    })()
  }, [txRef, notify, queryClient, setSearchParams])

  const handlePay = async (invoiceId: string, label: string) => {
    if (payingId) return
    setPayingId(invoiceId)
    try {
      const result = await checkoutInvoice(invoiceId, '/guardian/payments')
      if (result.status === 'redirect' && result.checkout_url) {
        window.location.assign(result.checkout_url)
        return
      }
      await refreshCollection(queryClient, STORAGE_KEYS.payments)
      setReloadToken((n) => n + 1)
      notify(`Payment for "${label}" completed.`)
    } catch (err) {
      notify(apiErrorMessage(err) ?? 'Payment could not be started.', 'error')
    } finally {
      setPayingId(null)
    }
  }

  if (!student) {
    return (
      <GlassCard className="p-6 text-[13px] text-secondary-text">
        No student is linked to your account yet.
      </GlassCard>
    )
  }

  const balance = outstanding.reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Fees & Payments"
        subtitle={`Tuition and fees for ${student.name}. You can settle outstanding invoices here.`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatBlock
          label="Outstanding balance"
          value={formatCurrency(balance, invoices[0]?.currency ?? 'ETB')}
          sub={`${outstanding.length} unpaid invoice${outstanding.length === 1 ? '' : 's'}`}
          icon={<Wallet size={17} />}
        />
        <StatBlock label="Paid invoices" value={invoices.filter((i) => i.status === 'paid').length} />
        <StatBlock label="Total invoices" value={invoices.length} />
      </div>

      <GlassCard className="overflow-hidden">
        <div className="divide-y divide-divider">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="text-[14px] font-semibold text-navy-900">{invoice.label}</div>
                <div className="text-[12px] text-secondary-text">
                  {invoice.term} · due {new Date(invoice.dueAt).toLocaleDateString()}
                </div>
              </div>
              <div className="text-[15px] font-extrabold text-navy-900">
                {formatCurrency(invoice.amount, invoice.currency)}
              </div>
              <StatusPill
                label={invoice.status}
                tone={invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'danger' : 'warning'}
              />
              {invoice.status !== 'paid' && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={payingId !== null}
                  onClick={() => void handlePay(invoice.id, invoice.label)}
                >
                  Pay now
                </Button>
              )}
            </div>
          ))}
          {invoices.length === 0 && (
            <p className="p-6 text-center text-[13px] text-secondary-text">No invoices yet.</p>
          )}
        </div>
      </GlassCard>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { CheckCircle2, CreditCard, Plus, Receipt, Trash2, Wallet } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { FormField } from '../../../shared/components/FormField'
import { Modal } from '../../../shared/components/Modal'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { formatCurrency, formatPlatformDateTime, computePaymentSummary } from '../../../shared/storage/platformUtils'
import { readPeople } from '../../../shared/storage/readers'
import { useCampusContext } from '../context/CampusContext'
import { useSyncCampusFilter } from '../hooks/useSyncCampusFilter'
import { usePayments } from '../hooks/usePlatformStorage'
import type { PaymentRecord, PaymentStatus } from '../types/platform'

const tabs = ['All', 'Pending', 'Overdue', 'Paid']

const statusTone: Record<PaymentStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
  refunded: 'neutral',
}

export function PaymentsAdminPage() {
  const { notify } = useToast()
  const { activeCampuses, selectedCampusId } = useCampusContext()
  const { records, createPayment, markPaid, deletePayment } = usePayments()
  const [activeTab, setActiveTab] = useState('All')
  const [query, setQuery] = useState('')
  const [campusFilter, setCampusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    studentId: '',
    label: '',
    amount: '',
    dueAt: '',
    category: 'tuition',
  })

  useSyncCampusFilter(selectedCampusId, setCampusFilter)

  const students = useMemo(
    () => readPeople().filter((p) => p.role === 'Student' && p.status === 'active'),
    [],
  )

  const campusOptions = useMemo(
    () => [
      { value: 'all', label: 'All campuses' },
      ...activeCampuses.map((c) => ({ value: c.id, label: c.name })),
    ],
    [activeCampuses],
  )

  const summary = useMemo(() => computePaymentSummary(records), [records])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records.filter((r) => {
      if (activeTab === 'Pending' && r.status !== 'pending') return false
      if (activeTab === 'Overdue' && r.status !== 'overdue') return false
      if (activeTab === 'Paid' && r.status !== 'paid') return false
      if (campusFilter !== 'all' && r.campusId !== campusFilter) return false
      if (!q) return true
      return (
        r.studentName.toLowerCase().includes(q) ||
        r.label.toLowerCase().includes(q) ||
        (r.reference?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [records, activeTab, query, campusFilter])

  const handleCreate = () => {
    const student = students.find((s) => s.id === form.studentId)
    if (!student || !form.label.trim() || !form.amount || !form.dueAt) {
      notify('Fill in student, label, amount, and due date.', 'error')
      return
    }

    createPayment({
      studentId: student.id,
      studentName: student.name,
      label: form.label.trim(),
      amount: Number(form.amount),
      currency: 'ETB',
      dueAt: new Date(form.dueAt).toISOString(),
      status: 'pending',
      category: form.category as PaymentRecord['category'],
      term: 'Fall 2026',
      campusId: student.campusId ?? 'c1',
      reference: `INV-${Date.now().toString(36).toUpperCase()}`,
    })

    notify('Invoice created.')
    setModalOpen(false)
    setForm({ studentId: '', label: '', amount: '', dueAt: '', category: 'tuition' })
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Payments"
        subtitle="Manage tuition, fees, invoices, and payment reconciliation."
        actions={
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Plus size={15} />
            Create invoice
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock
          label="Collected"
          value={formatCurrency(summary.collected)}
          sub="Paid this term"
          icon={<CheckCircle2 size={17} />}
          iconBg="bg-success-bg text-success"
        />
        <StatBlock
          label="Outstanding"
          value={formatCurrency(summary.outstanding)}
          sub="Awaiting payment"
          icon={<Wallet size={17} />}
          iconBg="bg-warning-bg text-warning"
        />
        <StatBlock
          label="Overdue"
          value={summary.overdue}
          sub="Requires follow-up"
          icon={<CreditCard size={17} />}
          iconBg="bg-danger-bg text-danger"
        />
        <StatBlock
          label="Invoices"
          value={summary.total}
          sub={`${summary.paid} paid · ${summary.pending} pending`}
          icon={<Receipt size={17} />}
          iconBg="bg-navy-50 text-navy-600"
        />
      </div>

      <GlassCard className="p-4 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <SearchInput value={query} onChange={setQuery} placeholder="Search invoices…" className="sm:w-56" />
            <SelectMenu value={campusFilter} onChange={setCampusFilter} options={campusOptions} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-divider text-[11px] uppercase tracking-wider text-secondary-text">
                <th className="py-2.5 pr-4 font-semibold">Invoice</th>
                <th className="py-2.5 pr-4 font-semibold">Student</th>
                <th className="py-2.5 pr-4 font-semibold">Amount</th>
                <th className="py-2.5 pr-4 font-semibold">Due</th>
                <th className="py-2.5 pr-4 font-semibold">Category</th>
                <th className="py-2.5 pr-4 font-semibold">Status</th>
                <th className="py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((payment) => (
                <tr key={payment.id} className="border-b border-divider/60 hover:bg-navy-50/40">
                  <td className="py-3 pr-4">
                    <div className="font-semibold text-navy-900">{payment.label}</div>
                    <div className="text-[11px] text-secondary-text">{payment.reference}</div>
                  </td>
                  <td className="py-3 pr-4">{payment.studentName}</td>
                  <td className="py-3 pr-4 font-semibold">{formatCurrency(payment.amount, payment.currency)}</td>
                  <td className="py-3 pr-4 text-secondary-text">{formatPlatformDateTime(payment.dueAt)}</td>
                  <td className="py-3 pr-4 capitalize">{payment.category.replace('-', ' ')}</td>
                  <td className="py-3 pr-4">
                    <StatusPill label={payment.status} tone={statusTone[payment.status]} />
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {payment.status !== 'paid' ? (
                        <Button variant="ghost" size="sm" onClick={() => { markPaid(payment.id); notify('Payment marked as paid.') }}>
                          Mark paid
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="sm" onClick={() => { deletePayment(payment.id); notify('Invoice removed.') }}>
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Receipt size={28} className="mx-auto text-navy-300 mb-2" />
              <p className="text-[13px] font-semibold text-navy-900">No invoices match your filters</p>
            </div>
          ) : null}
        </div>
      </GlassCard>

      <Modal
        open={modalOpen}
        title="Create invoice"
        description="Students see this on their payments page."
        icon={<Receipt size={18} />}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate}>Create</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-navy-900">Student</span>
            <select value={form.studentId} onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))} className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px]">
              <option value="">Select student…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <FormField label="Description" value={form.label} onChange={(v) => setForm((f) => ({ ...f, label: v }))} placeholder="e.g. Fall 2026 Tuition" />
          <FormField label="Amount (ETB)" value={form.amount} onChange={(v) => setForm((f) => ({ ...f, amount: v }))} type="number" />
          <FormField label="Due date" value={form.dueAt} onChange={(v) => setForm((f) => ({ ...f, dueAt: v }))} placeholder="2026-09-01T23:59" />
          <FormField label="Category" value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} type="select" options={['tuition', 'lab-fee', 'registration', 'housing', 'other']} />
        </div>
      </Modal>
    </div>
  )
}

export default PaymentsAdminPage

import { useMemo, useState } from 'react'
import { Clock, Headset, MessageCircle, Plus, Shield } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { FormField } from '../../../shared/components/FormField'
import { Modal } from '../../../shared/components/Modal'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { getSessionPerson } from '../../../shared/storage/session'
import { useHelpDesk } from '../../institution/hooks/usePlatformStorage'
import type { HelpDeskPriority } from '../../institution/types/platform'
import { StudentPageError, StudentPageLoading } from '../components/StudentPageStates'
import { useStudentDashboard } from '../hooks/useStudentDashboard'
import type { HelpDeskTicket } from '../types'

const tabs = ['All', 'Open', 'In review', 'Resolved']

const statusTone: Record<HelpDeskTicket['status'], 'warning' | 'info' | 'success'> = {
  open: 'warning',
  'in-review': 'info',
  resolved: 'success',
}

const statusLabel: Record<HelpDeskTicket['status'], string> = {
  open: 'Open',
  'in-review': 'In review',
  resolved: 'Resolved',
}

const priorityTone: Record<HelpDeskTicket['priority'], 'danger' | 'warning' | 'neutral'> = {
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
}

const statusAccent: Record<HelpDeskTicket['status'], string> = {
  open: 'border-l-warning from-warning-bg/40',
  'in-review': 'border-l-info from-info-bg/40',
  resolved: 'border-l-success from-success-bg/40',
}

export function StudentHelpDeskPage() {
  const { notify } = useToast()
  const { createTicket } = useHelpDesk()
  const sessionPerson = getSessionPerson()
  const { data, isLoading, isError, reload } = useStudentDashboard()
  const [activeTab, setActiveTab] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    subject: '',
    description: '',
    category: 'Technical',
    priority: 'medium' as HelpDeskPriority,
  })

  const stats = useMemo(() => {
    if (!data) return { open: 0, inReview: 0, resolved: 0 }
    return {
      open: data.helpDeskTickets.filter((t) => t.status === 'open').length,
      inReview: data.helpDeskTickets.filter((t) => t.status === 'in-review').length,
      resolved: data.helpDeskTickets.filter((t) => t.status === 'resolved').length,
    }
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return []
    if (activeTab === 'Open') return data.helpDeskTickets.filter((t) => t.status === 'open')
    if (activeTab === 'In review') return data.helpDeskTickets.filter((t) => t.status === 'in-review')
    if (activeTab === 'Resolved') return data.helpDeskTickets.filter((t) => t.status === 'resolved')
    return data.helpDeskTickets
  }, [data, activeTab])

  if (isLoading) return <StudentPageLoading />
  if (isError || !data) return <StudentPageError message="Failed to load help desk tickets." />

  const handleCreate = () => {
    if (!sessionPerson || !form.subject.trim()) {
      notify('Enter a subject for your ticket.', 'error')
      return
    }

    createTicket({
      subject: form.subject.trim(),
      description: form.description.trim() || 'No additional details provided.',
      category: form.category,
      priority: form.priority,
      status: 'open',
      requesterId: sessionPerson.id,
      requesterName: sessionPerson.name,
      requesterRole: 'Student',
    })

    notify('Support ticket submitted.')
    setModalOpen(false)
    setForm({ subject: '', description: '', category: 'Technical', priority: 'medium' })
    void reload()
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Help Desk"
        subtitle="Get support for technical issues, grades, payments, and campus services."
        actions={
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Plus size={15} />
            New ticket
          </Button>
        }
      />

      <GlassCard className="relative overflow-hidden p-0">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900" />
        <div className="relative p-6 md:p-7 flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-lemon-500 text-navy-900 flex items-center justify-center shrink-0">
            <Headset size={26} />
          </div>
          <div className="flex-1 text-white">
            <h2 className="text-[18px] font-bold">Need help? We&apos;re here for you.</h2>
            <p className="mt-1 text-[13px] text-navy-200">
              Average response time under 4 hours on weekdays · {stats.open + stats.inReview} active ticket
              {stats.open + stats.inReview === 1 ? '' : 's'}
            </p>
          </div>
          <Button variant="primary" className="shrink-0">
            <MessageCircle size={15} />
            Start chat
          </Button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBlock
          label="Open"
          value={stats.open}
          sub="Awaiting response"
          icon={<MessageCircle size={17} />}
          iconBg="bg-warning-bg text-warning"
        />
        <StatBlock
          label="In review"
          value={stats.inReview}
          sub="Support is working on it"
          icon={<Clock size={17} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Resolved"
          value={stats.resolved}
          sub="Closed tickets"
          icon={<Shield size={17} />}
          iconBg="bg-success-bg text-success"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <span className="text-[12px] text-secondary-text">{filtered.length} ticket{filtered.length === 1 ? '' : 's'}</span>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((ticket) => (
          <GlassCard
            key={ticket.id}
            className={`p-0 overflow-hidden border-l-4 bg-gradient-to-r ${statusAccent[ticket.status]} to-white hover:shadow-md transition-shadow`}
          >
            <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill label={statusLabel[ticket.status]} tone={statusTone[ticket.status]} />
                  <StatusPill label={`${ticket.priority} priority`} tone={priorityTone[ticket.priority]} />
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text">
                    {ticket.category}
                  </span>
                </div>
                <h3 className="mt-2 text-[15px] font-bold text-navy-900 leading-snug">{ticket.subject}</h3>
                <p className="mt-1 text-[12px] text-secondary-text">Updated {ticket.updatedAt}</p>
              </div>
              <Button variant="secondary" size="sm" className="shrink-0 self-start sm:self-center">
                <Headset size={13} />
                View ticket
              </Button>
            </div>
          </GlassCard>
        ))}

        {filtered.length === 0 ? (
          <GlassCard className="p-10 text-center">
            <Headset size={32} className="mx-auto text-navy-300 mb-3" />
            <p className="text-[14px] font-semibold text-navy-900">No tickets in this view</p>
          </GlassCard>
        ) : null}
      </div>

      <Modal
        open={modalOpen}
        title="New support ticket"
        description="Describe your issue and our team will respond shortly."
        icon={<Headset size={18} />}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate}>Submit ticket</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormField label="Subject" value={form.subject} onChange={(v) => setForm((f) => ({ ...f, subject: v }))} placeholder="Brief summary of your issue" />
          <FormField label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} type="textarea" placeholder="Provide details to help us assist you" />
          <FormField label="Category" value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} type="select" options={['Technical', 'Grades', 'Payments', 'Enrollment', 'Other']} />
          <FormField label="Priority" value={form.priority} onChange={(v) => setForm((f) => ({ ...f, priority: v as HelpDeskPriority }))} type="select" options={['low', 'medium', 'high']} />
        </div>
      </Modal>
    </div>
  )
}

export default StudentHelpDeskPage

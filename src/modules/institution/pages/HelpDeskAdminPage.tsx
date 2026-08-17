import { useMemo, useState } from 'react'
import { Headset, MessageCircle, Trash2 } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { Modal } from '../../../shared/components/Modal'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { formatPlatformDateTime, formatRelativeDate } from '../../../shared/storage/platformUtils'
import { useHelpDesk } from '../hooks/usePlatformStorage'
import type { HelpDeskPriority, HelpDeskStatus, HelpDeskTicketRecord } from '../types/platform'

const tabs = ['All', 'Open', 'In review', 'Resolved']

const statusTone: Record<HelpDeskStatus, 'warning' | 'info' | 'success'> = {
  open: 'warning',
  'in-review': 'info',
  resolved: 'success',
}

const priorityTone: Record<HelpDeskPriority, 'danger' | 'warning' | 'neutral'> = {
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
}

export function HelpDeskAdminPage() {
  const { notify } = useToast()
  const { records, updateTicket, deleteTicket } = useHelpDesk()
  const [activeTab, setActiveTab] = useState('All')
  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [detailTicket, setDetailTicket] = useState<HelpDeskTicketRecord | null>(null)

  const stats = useMemo(
    () => ({
      open: records.filter((t) => t.status === 'open').length,
      inReview: records.filter((t) => t.status === 'in-review').length,
      resolved: records.filter((t) => t.status === 'resolved').length,
      high: records.filter((t) => t.priority === 'high' && t.status !== 'resolved').length,
    }),
    [records],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records.filter((t) => {
      if (activeTab === 'Open' && t.status !== 'open') return false
      if (activeTab === 'In review' && t.status !== 'in-review') return false
      if (activeTab === 'Resolved' && t.status !== 'resolved') return false
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      if (!q) return true
      return (
        t.subject.toLowerCase().includes(q) ||
        t.requesterName.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      )
    })
  }, [records, activeTab, query, priorityFilter])

  const priorityOptions = [
    { value: 'all', label: 'All priorities' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ]

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Help Desk"
        subtitle="Manage support tickets from students, instructors, and staff."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock label="Open" value={stats.open} sub="Awaiting response" icon={<MessageCircle size={17} />} iconBg="bg-warning-bg text-warning" />
        <StatBlock label="In review" value={stats.inReview} sub="Being handled" icon={<Headset size={17} />} iconBg="bg-info-bg text-info" />
        <StatBlock label="Resolved" value={stats.resolved} sub="Closed tickets" icon={<Headset size={17} />} iconBg="bg-success-bg text-success" />
        <StatBlock label="High priority" value={stats.high} sub="Needs attention" icon={<MessageCircle size={17} />} iconBg="bg-danger-bg text-danger" />
      </div>

      <GlassCard className="p-4 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <SearchInput value={query} onChange={setQuery} placeholder="Search tickets…" className="sm:w-56" />
            <SelectMenu value={priorityFilter} onChange={setPriorityFilter} options={priorityOptions} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-divider text-[11px] uppercase tracking-wider text-secondary-text">
                <th className="py-2.5 pr-4 font-semibold">Subject</th>
                <th className="py-2.5 pr-4 font-semibold">Requester</th>
                <th className="py-2.5 pr-4 font-semibold">Category</th>
                <th className="py-2.5 pr-4 font-semibold">Priority</th>
                <th className="py-2.5 pr-4 font-semibold">Status</th>
                <th className="py-2.5 pr-4 font-semibold">Updated</th>
                <th className="py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ticket) => (
                <tr key={ticket.id} className="border-b border-divider/60 hover:bg-navy-50/40">
                  <td className="py-3 pr-4 font-semibold text-navy-900 max-w-[220px] truncate">{ticket.subject}</td>
                  <td className="py-3 pr-4">
                    <div>{ticket.requesterName}</div>
                    <div className="text-[11px] text-secondary-text">{ticket.requesterRole}</div>
                  </td>
                  <td className="py-3 pr-4">{ticket.category}</td>
                  <td className="py-3 pr-4">
                    <StatusPill label={ticket.priority} tone={priorityTone[ticket.priority]} />
                  </td>
                  <td className="py-3 pr-4">
                    <StatusPill label={ticket.status} tone={statusTone[ticket.status]} />
                  </td>
                  <td className="py-3 pr-4 text-secondary-text">{formatRelativeDate(ticket.updatedAt)}</td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setDetailTicket(ticket)}>View</Button>
                      {ticket.status === 'open' ? (
                        <Button variant="ghost" size="sm" onClick={() => { updateTicket(ticket.id, { status: 'in-review', assignedTo: 'Support Team' }); notify('Ticket assigned.') }}>
                          Assign
                        </Button>
                      ) : null}
                      {ticket.status !== 'resolved' ? (
                        <Button variant="ghost" size="sm" onClick={() => { updateTicket(ticket.id, { status: 'resolved' }); notify('Ticket resolved.') }}>
                          Resolve
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="sm" onClick={() => { deleteTicket(ticket.id); notify('Ticket deleted.') }}>
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
              <Headset size={28} className="mx-auto text-navy-300 mb-2" />
              <p className="text-[13px] font-semibold text-navy-900">No tickets match your filters</p>
            </div>
          ) : null}
        </div>
      </GlassCard>

      <Modal
        open={detailTicket !== null}
        title="Ticket details"
        description={detailTicket ? `#${detailTicket.id}` : undefined}
        icon={<Headset size={18} />}
        onClose={() => setDetailTicket(null)}
        footer={<Button variant="secondary" onClick={() => setDetailTicket(null)}>Close</Button>}
      >
        {detailTicket ? (
          <div className="flex flex-col gap-4 text-[13px]">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-secondary-text">Subject</div>
              <p className="mt-1 font-semibold text-navy-900">{detailTicket.subject}</p>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-secondary-text">Description</div>
              <p className="mt-1 text-secondary-text leading-relaxed">{detailTicket.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-secondary-text">Requester</div>
                <p className="mt-1">{detailTicket.requesterName} · {detailTicket.requesterRole}</p>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-secondary-text">Assigned to</div>
                <p className="mt-1">{detailTicket.assignedTo ?? 'Unassigned'}</p>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-secondary-text">Created</div>
                <p className="mt-1">{formatPlatformDateTime(detailTicket.createdAt)}</p>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-secondary-text">Last updated</div>
                <p className="mt-1">{formatPlatformDateTime(detailTicket.updatedAt)}</p>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

export default HelpDeskAdminPage

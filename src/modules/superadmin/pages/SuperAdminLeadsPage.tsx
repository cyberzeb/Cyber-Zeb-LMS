import { useEffect, useState } from 'react'
import { advanceLeadStatus, getLeads } from '../../marketing/api/leadApi'
import type { LeadStatus, ServiceLead } from '../../marketing/types'

const STATUS_META: Record<LeadStatus, { label: string; badgeClass: string; nextLabel: string | null; nextStatus: LeadStatus | null }> = {
  new: {
    label: 'New Request',
    badgeClass: 'bg-info-bg text-info',
    nextLabel: 'Mark Invoice Sent',
    nextStatus: 'invoice_sent',
  },
  invoice_sent: {
    label: 'Invoice Sent',
    badgeClass: 'bg-warning-bg text-[#8a6d00]',
    nextLabel: 'Confirm Payment & Agreement',
    nextStatus: 'paid_agreement_signed',
  },
  paid_agreement_signed: {
    label: 'Paid & Agreement Signed',
    badgeClass: 'bg-lemon-50 text-lemon-700',
    nextLabel: 'Activate & Send Link',
    nextStatus: 'subdomain_activated',
  },
  subdomain_activated: {
    label: 'Subdomain Activated',
    badgeClass: 'bg-navy-900 text-lemon-500',
    nextLabel: null,
    nextStatus: null,
  },
}

export function SuperAdminLeadsPage() {
  const [leads, setLeads] = useState<ServiceLead[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setLeads(await getLeads())
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    refresh()
  }, [])

  async function handleAdvance(lead: ServiceLead) {
    const meta = STATUS_META[lead.status]
    if (!meta.nextStatus) return
    setBusyId(lead.id)
    await advanceLeadStatus(lead.id, meta.nextStatus)
    await refresh()
    setBusyId(null)
  }

  return (
    <div className="min-h-screen bg-canvas font-sans">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-10">
        <div className="mb-8">
          <span className="text-lemon-700 font-bold text-[12px] uppercase tracking-wider">
            Super Admin · Demo
          </span>
          <h1 className="mt-2 text-[26px] font-extrabold text-navy-900">
            Institution Service Requests
          </h1>
          <p className="mt-1 text-[13.5px] text-secondary-text">
            Requests submitted from the public landing page appear here. This
            is a frontend-only mock — data lives in your browser&rsquo;s
            local storage.
          </p>
        </div>

        {loading && <p className="text-[13.5px] text-secondary-text">Loading…</p>}

        {!loading && leads.length === 0 && (
          <div className="bg-white rounded-2xl border border-divider p-10 text-center">
            <p className="text-[14px] text-secondary-text">
              No requests yet. Submit the form on the landing page to see it
              appear here.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {leads.map((lead) => {
            const meta = STATUS_META[lead.status]
            return (
              <div
                key={lead.id}
                className="bg-white rounded-2xl border border-divider p-6 shadow-[0_8px_28px_rgba(27,35,64,0.05)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-[16px] font-extrabold text-navy-900">
                        {lead.institutionName}
                      </h3>
                      <span
                        className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-secondary-text mt-1">
                      {lead.contactName} · {lead.email} · {lead.phone}
                    </p>
                  </div>
                  <span className="text-[11.5px] text-secondary-text">
                    {new Date(lead.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {lead.modules.map((m) => (
                    <span
                      key={m}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-canvas text-navy-700 border border-divider"
                    >
                      {m.replace('_', ' ')}
                    </span>
                  ))}
                </div>

                {lead.message && (
                  <p className="mt-4 text-[13px] text-secondary-text bg-canvas rounded-xl p-3.5">
                    &ldquo;{lead.message}&rdquo;
                  </p>
                )}

                <div className="mt-5 flex items-center justify-between flex-wrap gap-3">
                  <div className="text-[12.5px] text-secondary-text">
                    Preferred subdomain:{' '}
                    <strong className="text-navy-900">
                      {lead.preferredSubdomain
                        ? `${lead.preferredSubdomain}.brana-lms.com`
                        : 'auto-assigned'}
                    </strong>
                  </div>

                  {lead.status === 'subdomain_activated' && lead.subdomainLink ? (
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="text-[12.5px] font-bold text-navy-900 bg-lemon-50 px-4 py-2 rounded-lg"
                    >
                      🔗 {lead.subdomainLink}
                    </a>
                  ) : (
                    <button
                      onClick={() => handleAdvance(lead)}
                      disabled={busyId === lead.id || !meta.nextStatus}
                      className="bg-navy-900 text-white font-bold text-[12.5px] px-5 py-2.5 rounded-lg hover:bg-navy-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {busyId === lead.id ? 'Working…' : meta.nextLabel}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
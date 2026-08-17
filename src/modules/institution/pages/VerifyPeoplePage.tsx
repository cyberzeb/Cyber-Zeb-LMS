import { useMemo, useState } from 'react'
import { ShieldCheck, UserCheck } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatBlock } from '../../../shared/components/StatBlock'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useCampusContext } from '../context/CampusContext'
import { usePeople } from '../hooks/usePeople'
import { verifyPerson, rejectPerson } from '../api/peopleApi'
import { migrateVerification } from '../utils/peopleVerification'
import { VerifyQueueTable } from '../components/VerifyQueueTable'
import type { PersonRow } from '../types'

const STAT = 17
const tabs = ['Pending', 'Verified', 'Rejected', 'All']

export function VerifyPeoplePage() {
  const { notify } = useToast()
  const { campuses } = useCampusContext()
  const { people, setPeople } = usePeople()
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('Pending')
  const [busyId, setBusyId] = useState<string | null>(null)

  const normalized = useMemo(() => people.map((p) => migrateVerification(p)), [people])

  const filtered = useMemo(() => {
    return normalized.filter((person) => {
      const matchesTab =
        activeTab === 'All' ||
        (activeTab === 'Pending' && person.verificationStatus === 'pending') ||
        (activeTab === 'Verified' && person.verificationStatus === 'verified') ||
        (activeTab === 'Rejected' && person.verificationStatus === 'rejected')
      const q = query.trim().toLowerCase()
      const matchesQuery =
        q === '' ||
        person.name.toLowerCase().includes(q) ||
        person.email.toLowerCase().includes(q) ||
        person.role.toLowerCase().includes(q) ||
        (person.submittedByName ?? '').toLowerCase().includes(q)
      return matchesTab && matchesQuery
    })
  }, [normalized, activeTab, query])

  const stats = useMemo(() => {
    const pending = normalized.filter((p) => p.verificationStatus === 'pending').length
    const staffSubmitted = normalized.filter((p) => p.addedByRole === 'Staff').length
    const verified = normalized.filter((p) => p.verificationStatus === 'verified').length
    return { pending, staffSubmitted, verified, total: normalized.length }
  }, [normalized])

  const handleVerify = async (person: PersonRow) => {
    setBusyId(person.id)
    try {
      const updated = await verifyPerson(person.id, people)
      setPeople((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      notify(`${updated.name} verified. Invitation can proceed.`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Verification failed.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (person: PersonRow) => {
    setBusyId(person.id)
    try {
      const updated = await rejectPerson(person.id, people)
      setPeople((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      notify(`${updated.name} rejected.`, 'info')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Rejection failed.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const showActions = activeTab === 'Pending'

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Verify People"
        subtitle="Review people submitted by staff. Records added by administrators are verified automatically."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatBlock label="Pending Review" value={stats.pending} icon={<UserCheck size={STAT} />} />
        <StatBlock
          label="Staff Submissions"
          value={stats.staffSubmitted}
          sub="All time"
          icon={<ShieldCheck size={STAT} />}
        />
        <StatBlock label="Verified" value={stats.verified} icon={<ShieldCheck size={STAT} />} />
        <StatBlock label="Total People" value={stats.total} icon={<UserCheck size={STAT} />} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search by name, email, role or submitter..."
          className="md:w-80"
        />
      </div>

      {filtered.length > 0 ? (
        showActions ? (
          <VerifyQueueTable
            people={filtered}
            campuses={campuses}
            onVerify={handleVerify}
            onReject={handleReject}
            busyId={busyId}
          />
        ) : (
          <GlassCard className="p-0 overflow-hidden">
            <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-6 py-3.5 border-b border-divider/60 bg-gradient-to-b from-white/70 to-white/30">
              {['Person', 'Role', 'Campus', 'Added By', 'Status'].map((h) => (
                <span key={h} className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text">
                  {h}
                </span>
              ))}
            </div>
            <div className="divide-y divide-divider/50">
              {filtered.map((person) => (
                <div
                  key={person.id}
                  className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 md:gap-3 px-6 py-3.5 items-center"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-navy-900 text-[13.5px] truncate">{person.name}</div>
                    <div className="text-[11.5px] text-secondary-text truncate">{person.email}</div>
                  </div>
                  <div className="text-[12px] text-navy-700">{person.role}</div>
                  <div className="text-[12px] text-navy-700">
                    {campuses.find((c) => c.id === person.campusId)?.code ?? '—'}
                  </div>
                  <div className="text-[12px] text-secondary-text capitalize">
                    {person.addedByRole ?? 'Admin'}
                  </div>
                  <div className="text-[12px] font-semibold capitalize text-navy-700">
                    {person.verificationStatus}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )
      ) : (
        <GlassCard className="p-10 text-center text-secondary-text text-[13.5px] font-medium">
          {activeTab === 'Pending'
            ? 'No pending verifications. Staff submissions will appear here for review.'
            : 'No records match your filters.'}
        </GlassCard>
      )}
    </div>
  )
}

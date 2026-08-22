import { useMemo } from 'react'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { Monogram } from '../../../shared/components/Monogram'
import { getSessionPerson } from '../../../shared/storage/session'
import { readPeople } from '../../../shared/storage/readers'

const verificationTone = {
  pending: 'warning',
  verified: 'success',
  rejected: 'danger',
} as const

export function StaffSubmissionsPage() {
  const person = getSessionPerson()

  const submissions = useMemo(() => {
    if (!person) return []
    return readPeople().filter(
      (p) => p.addedByRole === 'Staff' && p.submittedByName === person.name,
    )
  }, [person])

  if (!person) return null

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="My Submissions"
        subtitle="People you submitted for admin verification."
      />

      <GlassCard className="p-0 overflow-hidden">
        {submissions.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-secondary-text">
            You have not submitted any people yet.
          </div>
        ) : (
          <div className="divide-y divide-divider">
            {submissions.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-navy-50/40">
                <Monogram label={p.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-navy-900">{p.name}</div>
                  <div className="text-[12px] text-secondary-text">{p.email}</div>
                  <div className="text-[11px] text-navy-600 mt-0.5">
                    {p.role} · Submitted {p.submittedAt ?? 'recently'}
                  </div>
                </div>
                <StatusPill
                  label={p.verificationStatus ?? 'pending'}
                  tone={verificationTone[p.verificationStatus ?? 'pending']}
                />
                <StatusPill label={p.status} tone={p.status === 'active' ? 'success' : 'warning'} />
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}

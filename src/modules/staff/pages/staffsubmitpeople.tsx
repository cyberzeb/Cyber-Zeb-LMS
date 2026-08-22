import { useMemo, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { PageHeader } from '../../../shared/components/PageHeader'
import { Button } from '../../../shared/components/Button'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { getSessionPerson } from '../../../shared/storage/session'
import { readCampusRecords, readDepartments } from '../../../shared/storage/readers'
import { usePeople } from '../../institution/hooks/usePeople'
import { StaffSubmitPersonModal } from '../../institution/components/StaffSubmitPersonModal'
import type { PersonRow } from '../../institution/types'

import type { Campus } from '../../institution/types'

function readCampusesForStaffModal(): Campus[] {
  const campuses = readCampusRecords()
  const departments = readDepartments()
  return campuses.map((campus) => ({
    ...campus,
    deptCount: departments.filter((d) => d.campusId === campus.id).length,
  }))
}

export function StaffSubmitPeoplePage() {
  const { notify } = useToast()
  const person = getSessionPerson()
  const { people, setPeople } = usePeople()
  const [submitOpen, setSubmitOpen] = useState(false)
  const campuses = useMemo(() => readCampusesForStaffModal(), [])
  const departments = useMemo(() => readDepartments(), [])

  const students = useMemo(
    () => people.filter((p) => p.role === 'Student' && p.status !== 'suspended'),
    [people],
  )

  const handleSubmit = (newPerson: PersonRow) => {
    setPeople((prev) => [...prev, newPerson])
    notify('Person submitted for admin verification.', 'success')
    setSubmitOpen(false)
  }

  if (!person) return null

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Submit People"
        subtitle="Add students, instructors or guardians for institution admin verification."
      />

      <GlassCard className="p-6 text-center max-w-xl">
        <div className="w-14 h-14 rounded-2xl bg-navy-50 text-navy-600 flex items-center justify-center mx-auto mb-4">
          <UserPlus size={28} />
        </div>
        <h3 className="text-[16px] font-bold text-navy-900">Submit a new person record</h3>
        <p className="mt-2 text-[13px] text-secondary-text leading-relaxed">
          Submissions from {person.department} are sent to the admin verification queue.
          You will be recorded as the submitter in local storage.
        </p>
        <Button variant="primary" className="mt-5" onClick={() => setSubmitOpen(true)}>
          <UserPlus size={15} />
          Open submission form
        </Button>
      </GlassCard>

      <StaffSubmitPersonModal
        open={submitOpen}
        campuses={campuses}
        departments={departments}
        students={students}
        submittedByName={person.name}
        onClose={() => setSubmitOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Loader2, UserPlus } from 'lucide-react'

import { Button } from '../../../shared/components/Button'
import { Modal } from '../../../shared/components/Modal'
import { SearchInput } from '../../../shared/components/SearchInput'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import type { PersonRow } from '../../institution/types'
import type { Cohort, CohortRegistration } from '../types'
import { formatMoney, holdsSeat, seatsLeft } from '../utils/trainingUtils'

interface Props {
  cohort: Cohort
  price: number
  currency: string
  learners: PersonRow[]
  registrations: CohortRegistration[]
  busy: boolean
  onAddLearner: (person: PersonRow) => void
  onClose: () => void
  onEnroll: (studentIds: string[], charge: boolean) => void
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

/** Add learners to a cohort by hand: sponsored places, walk-ins, or paying later. */
export function EnrollLearnersModal({ cohort, price, currency, learners, registrations, busy, onAddLearner, onClose, onEnroll }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [charge, setCharge] = useState(price > 0)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')

  const seated = useMemo(
    () => new Set(registrations.filter((r) => r.cohortId === cohort.id && holdsSeat(r)).map((r) => r.studentId)),
    [registrations, cohort.id],
  )
  const available = useMemo(() => {
    const q = query.trim().toLowerCase()
    return learners.filter((p) => !seated.has(p.id) && (!q || `${p.name} ${p.email}`.toLowerCase().includes(q)))
  }, [learners, seated, query])
  const left = seatsLeft(cohort, registrations)
  const overCapacity = left !== null && selected.length > left
  const emailTaken = newEmail.trim() !== '' && learners.some((p) => p.email.toLowerCase() === newEmail.trim().toLowerCase())
  const canCreate = newName.trim().length > 1 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail.trim()) && !emailTaken

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function createLearner() {
    if (!canCreate) return
    const person: PersonRow = {
      id: createId('lrn'),
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      phone: newPhone.trim() || null,
      role: 'Student',
      department: 'Independent learner',
      campusId: 'c1',
      status: 'active',
      verificationStatus: 'verified',
      lastActive: 'Never',
      initials: initialsOf(newName),
      joinedAt: new Date().toISOString().slice(0, 10),
      source: 'admin',
      addedByRole: 'Admin',
    }
    onAddLearner(person)
    setSelected((prev) => [...prev, person.id])
    setNewName('')
    setNewEmail('')
    setNewPhone('')
  }

  return (
    <Modal
      open
      size="lg"
      icon={<UserPlus size={18} />}
      title={`Add learners to ${cohort.name}`}
      description={left === null ? 'No seat limit.' : `${left} seat${left === 1 ? '' : 's'} left.`}
      onClose={onClose}
      footer={
        <>
          <span className="mr-auto text-[12px] text-danger">{overCapacity ? `Only ${left} seat${left === 1 ? '' : 's'} left — raise the seat limit first.` : ''}</span>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!selected.length || overCapacity || busy} onClick={() => onEnroll(selected, charge)}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
            {charge && price > 0 ? `Invoice ${selected.length || ''} learner${selected.length === 1 ? '' : 's'}` : `Enroll ${selected.length || ''} learner${selected.length === 1 ? '' : 's'}`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {price > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              { value: true, title: `Send an invoice (${formatMoney(price, currency)})`, text: 'The seat is held and confirmed once paid.' },
              { value: false, title: 'Enroll without charge', text: 'Sponsored or already paid — enrolled right away.' },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => setCharge(opt.value)}
                className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${charge === opt.value ? 'border-lemon-500 bg-lemon-50 dark:bg-lemon-500/10' : 'border-divider hover:bg-navy-50 dark:hover:bg-white/5'}`}
              >
                <p className="text-[13px] font-semibold text-navy-900">{opt.title}</p>
                <p className="text-[12px] text-secondary-text">{opt.text}</p>
              </button>
            ))}
          </div>
        ) : null}

        <SearchInput value={query} onChange={setQuery} placeholder="Search learners by name or email…" />
        <div className="max-h-64 overflow-y-auto rounded-xl border border-divider">
          {available.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-3 border-b border-divider px-3 py-2 last:border-0 hover:bg-navy-50 dark:hover:bg-white/5">
              <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} className="accent-lemon-500" />
              <span className="flex-1">
                <span className="block text-[13px] font-semibold text-navy-900">{p.name}</span>
                <span className="block text-[12px] text-secondary-text">{p.email}</span>
              </span>
            </label>
          ))}
          {available.length === 0 ? <p className="px-3 py-6 text-center text-[12px] text-secondary-text">No other learners found. Add a new one below.</p> : null}
        </div>

        <div className="rounded-xl border border-dashed border-divider p-3">
          <p className="mb-2 text-[12px] font-semibold text-navy-900">New learner</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_0.8fr_auto]">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name" className="rounded-lg border border-divider bg-white px-3 py-2 text-[13px] text-navy-900 dark:bg-navy-50" />
            <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" className="rounded-lg border border-divider bg-white px-3 py-2 text-[13px] text-navy-900 dark:bg-navy-50" />
            <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone" className="rounded-lg border border-divider bg-white px-3 py-2 text-[13px] text-navy-900 dark:bg-navy-50" />
            <Button variant="secondary" onClick={createLearner} disabled={!canCreate}>
              Add
            </Button>
          </div>
          {emailTaken ? <p className="mt-1.5 text-[12px] text-danger">A learner with this email already exists — pick them from the list.</p> : null}
        </div>
      </div>
    </Modal>
  )
}

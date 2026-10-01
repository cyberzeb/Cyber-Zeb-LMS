import { useState } from 'react'
import { UsersRound } from 'lucide-react'

import { Button } from '../../../shared/components/Button'
import { FormField } from '../../../shared/components/FormField'
import { Modal } from '../../../shared/components/Modal'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import type { PersonRow } from '../../institution/types'
import type { Cohort, CohortStatus, DeliveryMode, TrainingProgram } from '../types'
import { DELIVERY_LABEL, formatMoney } from '../utils/trainingUtils'

type CohortInput = Omit<Cohort, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }

interface Props {
  cohort: Cohort | null
  programs: TrainingProgram[]
  trainers: PersonRow[]
  defaultProgramId?: string
  onClose: () => void
  onSave: (input: CohortInput) => void
}

function initial(cohort: Cohort | null, programs: TrainingProgram[], defaultProgramId?: string) {
  const program = programs.find((p) => p.id === (cohort?.programId ?? defaultProgramId)) ?? programs[0]
  return {
    programId: cohort?.programId ?? program?.id ?? '',
    name: cohort?.name ?? '',
    code: cohort?.code ?? '',
    startDate: cohort?.startDate ?? '',
    endDate: cohort?.endDate ?? '',
    seatCapacity: String(cohort?.seatCapacity ?? 25),
    trainerId: cohort?.trainerId ?? '',
    deliveryMode: cohort?.deliveryMode ?? program?.deliveryMode ?? 'in-person',
    location: cohort?.location ?? '',
    schedule: cohort?.schedule ?? '',
    meetingUrl: cohort?.meetingUrl ?? '',
    enrollmentOpen: cohort?.enrollmentOpen ?? true,
    registrationDeadline: cohort?.registrationDeadline ?? '',
    price: cohort?.price != null ? String(cohort.price) : '',
    status: (cohort?.status === 'cancelled' || cohort?.status === 'completed' ? cohort.status : 'scheduled') as CohortStatus | 'scheduled',
  }
}

/** Schedule an intake of a program: dates, seats, trainer and where it happens. */
export function CohortFormModal({ cohort, programs, trainers, defaultProgramId, onClose, onSave }: Props) {
  const [form, setForm] = useState(() => initial(cohort, programs, defaultProgramId))
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }))
  const program = programs.find((p) => p.id === form.programId)

  const errors: string[] = []
  if (!form.programId) errors.push('Pick a program.')
  if (!form.name.trim()) errors.push('Give the cohort a name.')
  if (!form.startDate || !form.endDate) errors.push('Set the start and end dates.')
  else if (form.endDate < form.startDate) errors.push('The end date is before the start date.')
  if (form.registrationDeadline && form.endDate && form.registrationDeadline > form.endDate) errors.push('The registration deadline is after the cohort ends.')

  function submit() {
    if (errors.length) return
    onSave({
      id: cohort?.id,
      programId: form.programId,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase() || `${program?.code ?? 'COH'}-${form.startDate.slice(2, 7).replace('-', '')}`,
      startDate: form.startDate,
      endDate: form.endDate,
      seatCapacity: Math.max(0, Number(form.seatCapacity) || 0),
      trainerId: form.trainerId || null,
      deliveryMode: form.deliveryMode as DeliveryMode,
      location: form.location.trim() || undefined,
      schedule: form.schedule.trim() || undefined,
      meetingUrl: form.meetingUrl.trim() || undefined,
      enrollmentOpen: form.enrollmentOpen,
      registrationDeadline: form.registrationDeadline || undefined,
      price: form.price.trim() === '' ? null : Math.max(0, Number(form.price) || 0),
      // Upcoming/running follow the dates; only a cancellation or an early close is stored.
      status: form.status === 'scheduled' ? 'upcoming' : (form.status as CohortStatus),
    })
  }

  return (
    <Modal
      open
      size="lg"
      icon={<UsersRound size={18} />}
      title={cohort ? 'Edit cohort' : 'Schedule a cohort'}
      description="A cohort is one intake of a program, with its own dates, seats and trainer."
      onClose={onClose}
      footer={
        <>
          <span className="mr-auto text-[12px] text-danger">{errors[0] ?? ''}</span>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={errors.length > 0}>
            {cohort ? 'Save changes' : 'Schedule cohort'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-[12px] font-semibold text-navy-900">Program</span>
          <SelectMenu
            value={form.programId}
            onChange={(v) => set('programId', v)}
            options={programs.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}`, hint: formatMoney(p.price, p.currency) }))}
            aria-label="Program"
          />
        </label>
        <FormField label="Cohort name" value={form.name} onChange={(v) => set('name', v)} placeholder="October 2026 evening intake" />
        <FormField label="Code (optional)" value={form.code} onChange={(v) => set('code', v)} placeholder="PMP-2610" />
        <FormField label="Start date" type="date" value={form.startDate} onChange={(v) => set('startDate', v)} />
        <FormField label="End date" type="date" value={form.endDate} min={form.startDate} onChange={(v) => set('endDate', v)} />
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Trainer</span>
          <SelectMenu
            value={form.trainerId}
            onChange={(v) => set('trainerId', v)}
            options={[{ value: '', label: 'Not assigned yet' }, ...trainers.map((t) => ({ value: t.id, label: t.name, hint: t.department }))]}
            aria-label="Trainer"
          />
        </label>
        <FormField label="Seats (0 = no limit)" type="number" min="0" value={form.seatCapacity} onChange={(v) => set('seatCapacity', v)} />
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Delivery</span>
          <SelectMenu
            value={form.deliveryMode}
            onChange={(v) => set('deliveryMode', v as DeliveryMode)}
            options={Object.entries(DELIVERY_LABEL).map(([value, label]) => ({ value, label }))}
            aria-label="Delivery"
          />
        </label>
        <FormField label="Location" value={form.location} onChange={(v) => set('location', v)} placeholder="Bole campus, room 3" />
        <FormField label="Schedule" value={form.schedule} onChange={(v) => set('schedule', v)} placeholder="Tue & Thu, 18:00–21:00" />
        <FormField label="Online meeting link (optional)" value={form.meetingUrl} onChange={(v) => set('meetingUrl', v)} placeholder="https://…" />
        <FormField
          label="Price for this cohort (optional)"
          type="number"
          min="0"
          value={form.price}
          onChange={(v) => set('price', v)}
          placeholder={program ? String(program.price) : ''}
          hint={program ? `Leave empty to use the program price (${formatMoney(program.price, program.currency)}).` : undefined}
        />
        <FormField label="Registration deadline (optional)" type="date" value={form.registrationDeadline} max={form.endDate} onChange={(v) => set('registrationDeadline', v)} />
        <FormField
          label="Status"
          type="select"
          value={form.status}
          onChange={(v) => set('status', v as typeof form.status)}
          options={['scheduled', 'completed', 'cancelled']}
          hint="Scheduled cohorts show as upcoming or running from their dates."
        />
        <label className="flex items-center gap-2.5 sm:col-span-2 rounded-xl border border-divider px-3 py-2.5">
          <input type="checkbox" checked={form.enrollmentOpen} onChange={(e) => set('enrollmentOpen', e.target.checked)} className="accent-lemon-500" />
          <span className="text-[13px] text-navy-900">
            <span className="font-semibold">Open for registration</span>
            <span className="text-secondary-text"> — shown on the public registration page and in the learner catalog.</span>
          </span>
        </label>
      </div>
    </Modal>
  )
}

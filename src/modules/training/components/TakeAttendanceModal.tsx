import { useState } from 'react'
import { ClipboardCheck } from 'lucide-react'

import { Button } from '../../../shared/components/Button'
import { FormField } from '../../../shared/components/FormField'
import { Modal } from '../../../shared/components/Modal'
import type { AttendanceMark, Cohort, CohortSession } from '../types'
import { MARK_META, todayIso } from '../utils/trainingUtils'

interface Props {
  cohort: Cohort
  roster: { id: string; name: string }[]
  session: CohortSession | null
  existingDates: string[]
  onClose: () => void
  onSave: (session: Omit<CohortSession, 'id'> & { id?: string }) => void
}

const MARKS: AttendanceMark[] = ['present', 'late', 'absent', 'excused']

const ACTIVE: Record<AttendanceMark, string> = {
  present: 'bg-success text-white border-success',
  late: 'bg-warning text-navy-900 border-warning',
  absent: 'bg-danger text-white border-danger',
  excused: 'bg-navy-500 text-white border-navy-500',
}

/** Mark one cohort session. Everyone starts as present — mark the exceptions. */
export function TakeAttendanceModal({ cohort, roster, session, existingDates, onClose, onSave }: Props) {
  const [date, setDate] = useState(session?.date ?? todayIso())
  const [topic, setTopic] = useState(session?.topic ?? '')
  const [marks, setMarks] = useState<Record<string, AttendanceMark>>(() =>
    Object.fromEntries(roster.map((r) => [r.id, session?.marks?.[r.id] ?? 'present'])),
  )
  const duplicate = !session && existingDates.includes(date)
  const counts = MARKS.map((m) => ({ m, n: Object.values(marks).filter((x) => x === m).length }))

  return (
    <Modal
      open
      size="lg"
      icon={<ClipboardCheck size={18} />}
      title={session ? 'Edit attendance' : 'Take attendance'}
      description={`${cohort.name} · ${roster.length} learner${roster.length === 1 ? '' : 's'}`}
      onClose={onClose}
      footer={
        <>
          <span className="mr-auto text-[12px] text-danger">{duplicate ? 'Attendance for this date is already recorded — edit that session instead.' : ''}</span>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!date || duplicate || roster.length === 0}
            onClick={() => onSave({ id: session?.id, cohortId: cohort.id, date, topic: topic.trim() || undefined, marks })}
          >
            Save attendance
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr]">
        <FormField label="Session date" type="date" value={date} onChange={setDate} min={cohort.startDate} />
        <FormField label="Topic (optional)" value={topic} onChange={setTopic} placeholder="Week 2 — scheduling and critical path" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-secondary-text">
        {counts.map(({ m, n }) => (
          <span key={m}>
            {MARK_META[m].label}: <span className="font-semibold text-navy-900">{n}</span>
          </span>
        ))}
        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setMarks(Object.fromEntries(roster.map((r) => [r.id, 'present' as AttendanceMark])))}>
          Mark all present
        </Button>
      </div>
      <div className="mt-2 max-h-[46vh] overflow-y-auto rounded-xl border border-divider">
        {roster.map((r) => (
          <div key={r.id} className="flex items-center gap-3 border-b border-divider px-3 py-2 last:border-0">
            <span className="flex-1 text-[13px] font-medium text-navy-900">{r.name}</span>
            <div className="flex gap-1" role="radiogroup" aria-label={`Attendance for ${r.name}`}>
              {MARKS.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={marks[r.id] === m}
                  title={MARK_META[m].label}
                  onClick={() => setMarks((prev) => ({ ...prev, [r.id]: m }))}
                  className={`h-8 min-w-[64px] rounded-lg border px-2 text-[12px] font-semibold transition-colors ${
                    marks[r.id] === m ? ACTIVE[m] : 'border-divider text-secondary-text hover:bg-navy-50 dark:hover:bg-white/5'
                  }`}
                >
                  {MARK_META[m].label}
                </button>
              ))}
            </div>
          </div>
        ))}
        {roster.length === 0 ? <p className="px-3 py-8 text-center text-[12px] text-secondary-text">No enrolled learners in this cohort yet.</p> : null}
      </div>
    </Modal>
  )
}

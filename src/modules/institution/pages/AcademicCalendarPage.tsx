import { useMemo, useState } from 'react'
import {
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock,
  Plus,
  Star,
  Trash2,
} from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { Modal } from '../../../shared/components/Modal'
import { FormField } from '../../../shared/components/FormField'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useCampusContext } from '../context/CampusContext'
import { useAcademicCalendar } from '../hooks/useAcademicCalendar'
import { DEFAULT_CAMPUS_ID } from '../data/orgSeedData'
import type { AcademicTermStatus, AcademicTermType } from '../types/academic'
import { nextTermStatus, termStatusActionLabel } from '../utils/studyYearUtils'

const STAT = 17

const termTypeOptions: AcademicTermType[] = ['semester', 'trimester', 'quarter', 'summer', 'custom']
const termStatusOptions: AcademicTermStatus[] = [
  'planned',
  'registration',
  'in_progress',
  'grading',
  'closed',
]

function statusTone(status: AcademicTermStatus) {
  switch (status) {
    case 'in_progress':
      return 'success' as const
    case 'registration':
      return 'info' as const
    case 'grading':
      return 'warning' as const
    case 'closed':
      return 'neutral' as const
    default:
      return 'neutral' as const
  }
}

function formatTermType(type: AcademicTermType) {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

const emptyYearForm = {
  code: '',
  name: '',
  startDate: '',
  endDate: '',
  campusId: DEFAULT_CAMPUS_ID,
}

const emptyTermForm = {
  academicYearId: '',
  code: '',
  name: '',
  termType: 'semester' as AcademicTermType,
  status: 'planned' as AcademicTermStatus,
  startDate: '',
  endDate: '',
  registrationOpens: '',
  registrationCloses: '',
  classesStart: '',
  classesEnd: '',
  gradingDeadline: '',
  campusId: DEFAULT_CAMPUS_ID,
}

export function AcademicCalendarPage() {
  const { notify } = useToast()
  const { activeCampuses, selectedCampusId } = useCampusContext()
  const {
    years,
    terms,
    currentTerm,
    currentYear,
    addYear,
    addTerm,
    updateTerm,
    setCurrentTerm,
    removeTerm,
    termsForYear,
  } = useAcademicCalendar()

  const [selectedYearId, setSelectedYearId] = useState<string>(() => currentYear?.id ?? years[0]?.id ?? '')
  const [yearModalOpen, setYearModalOpen] = useState(false)
  const [termModalOpen, setTermModalOpen] = useState(false)
  const [yearForm, setYearForm] = useState(emptyYearForm)
  const [termForm, setTermForm] = useState(emptyTermForm)

  const scopedYears = useMemo(() => {
    if (selectedCampusId === 'all') return years
    return years.filter((y) => !y.campusId || y.campusId === selectedCampusId)
  }, [years, selectedCampusId])

  const activeYearId = selectedYearId || scopedYears[0]?.id || ''
  const yearTerms = useMemo(() => termsForYear(activeYearId), [termsForYear, activeYearId])

  const scopedTerms = useMemo(() => {
    if (selectedCampusId === 'all') return terms
    return terms.filter((t) => !t.campusId || t.campusId === selectedCampusId)
  }, [terms, selectedCampusId])

  const stats = useMemo(() => {
    const inProgress = scopedTerms.filter((t) => t.status === 'in_progress').length
    const registration = scopedTerms.filter((t) => t.status === 'registration').length
    return {
      years: scopedYears.length,
      terms: scopedTerms.length,
      inProgress,
      registration,
    }
  }, [scopedYears, scopedTerms])

  const openYearModal = () => {
    const campusId =
      selectedCampusId !== 'all' ? selectedCampusId : activeCampuses[0]?.id ?? DEFAULT_CAMPUS_ID
    setYearForm({ ...emptyYearForm, campusId })
    setYearModalOpen(true)
  }

  const openTermModal = () => {
    if (!activeYearId) {
      notify('Create an academic year first.', 'error')
      return
    }
    const campusId =
      selectedCampusId !== 'all' ? selectedCampusId : activeCampuses[0]?.id ?? DEFAULT_CAMPUS_ID
    setTermForm({ ...emptyTermForm, academicYearId: activeYearId, campusId })
    setTermModalOpen(true)
  }

  const handleCreateYear = () => {
    if (!yearForm.code.trim() || !yearForm.name.trim() || !yearForm.startDate || !yearForm.endDate) {
      notify('Fill in year code, name, and date range.', 'error')
      return
    }
    const row = addYear({
      ...yearForm,
      code: yearForm.code.trim(),
      name: yearForm.name.trim(),
      isCurrent: years.length === 0,
    })
    setSelectedYearId(row.id)
    setYearModalOpen(false)
    notify(`Academic year “${row.name}” created.`)
  }

  const handleCreateTerm = () => {
    if (!termForm.code.trim() || !termForm.name.trim() || !termForm.startDate || !termForm.endDate) {
      notify('Fill in term code, name, and date range.', 'error')
      return
    }
    const year = years.find((y) => y.id === termForm.academicYearId)
    addTerm({
      ...termForm,
      code: termForm.code.trim().toUpperCase(),
      name: termForm.name.trim(),
      isCurrent: terms.length === 0,
    })
    setTermModalOpen(false)
    notify(`Term added to ${year?.name ?? 'academic year'}.`)
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Academic Calendar"
        subtitle="Define academic years and semesters. Course offerings and enrollments are bound to the current term."
        actions={
          <>
            <Button variant="secondary" onClick={openYearModal}>
              <Plus size={15} />
              Add Year
            </Button>
            <Button variant="primary" onClick={openTermModal}>
              <Plus size={16} />
              Add Term
            </Button>
          </>
        }
      />

      {currentTerm ? (
        <GlassCard className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 border-l-4 border-l-lemon-500">
          <Star size={18} className="text-lemon-700 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-navy-900">Current term</p>
            <p className="text-[12.5px] text-secondary-text">
              {currentTerm.name}
              {currentYear ? ` · ${currentYear.code}` : ''}
            </p>
          </div>
          <StatusPill label={currentTerm.status.replace('_', ' ')} tone={statusTone(currentTerm.status)} />
        </GlassCard>
      ) : (
        <GlassCard className="p-4 text-[13px] text-secondary-text">
          No current term set. Mark a term as current so offerings and enrollments default correctly.
        </GlassCard>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatBlock label="Academic Years" value={stats.years} icon={<CalendarRange size={STAT} />} />
        <StatBlock label="Terms" value={stats.terms} icon={<Clock size={STAT} />} />
        <StatBlock
          label="In Progress"
          value={stats.inProgress}
          icon={<CheckCircle2 size={STAT} />}
        />
        <StatBlock label="Registration Open" value={stats.registration} icon={<CalendarRange size={STAT} />} />
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-5">
        <GlassCard className="p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Academic years</h3>
          {scopedYears.length === 0 ? (
            <p className="text-xs text-slate-500">No years yet.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {scopedYears.map((year) => (
                <button
                  key={year.id}
                  type="button"
                  onClick={() => setSelectedYearId(year.id)}
                  className={`text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                    activeYearId === year.id
                      ? 'bg-lemon-50 text-navy-900 ring-1 ring-lemon-500/30'
                      : 'text-secondary-text hover:bg-navy-50'
                  }`}
                >
                  {year.code}
                  {year.isCurrent ? (
                    <span className="ml-2 text-[10px] uppercase text-lemon-700 font-bold">Current</span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200/60 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-800">
              Terms {activeYearId ? `· ${scopedYears.find((y) => y.id === activeYearId)?.code ?? ''}` : ''}
            </h3>
          </div>
          {yearTerms.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">No terms for this year. Add a semester or term.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200/60">
                    <th className="px-5 py-3 font-medium">Term</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Dates</th>
                    <th className="px-5 py-3 font-medium">Registration</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {yearTerms.map((term) => (
                    <tr key={term.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-5 py-3">
                        <div className="font-medium text-navy-900">{term.name}</div>
                        <div className="text-xs text-slate-500">{term.code}</div>
                        {term.isCurrent ? (
                          <span className="text-[10px] font-bold text-lemon-700 uppercase">Current</span>
                        ) : null}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{formatTermType(term.termType)}</td>
                      <td className="px-5 py-3 text-slate-600 text-xs">
                        {term.startDate} → {term.endDate}
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs">
                        {term.registrationOpens && term.registrationCloses
                          ? `${term.registrationOpens} → ${term.registrationCloses}`
                          : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill label={term.status.replace('_', ' ')} tone={statusTone(term.status)} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {!term.isCurrent ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setCurrentTerm(term.id)
                                notify(`“${term.name}” is now the current term.`, 'success')
                              }}
                            >
                              <Star size={14} />
                              Set current
                            </Button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-lemon-800 bg-lemon-50 px-2 py-1 rounded-full">
                              <Star size={12} fill="currentColor" />
                              Current
                            </span>
                          )}
                          {termStatusActionLabel(term.status) ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                const next = nextTermStatus(term.status)!
                                updateTerm(term.id, { status: next })
                                notify(`“${term.name}” → ${next.replace('_', ' ')}.`)
                              }}
                            >
                              <ChevronRight size={14} />
                              {termStatusActionLabel(term.status)}
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger hover:bg-danger-bg hover:text-danger"
                            onClick={() => {
                              if (
                                !window.confirm(
                                  `Remove “${term.name}”? Course offerings tied to this term will lose their term reference.`,
                                )
                              ) {
                                return
                              }
                              removeTerm(term.id)
                              notify('Term removed.', 'info')
                            }}
                          >
                            <Trash2 size={14} />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>

      <Modal
        open={yearModalOpen}
        onClose={() => setYearModalOpen(false)}
        icon={<CalendarRange size={18} />}
        title="Add Academic Year"
        description="Define the institutional year that groups semesters or terms."
        footer={
          <>
            <Button variant="secondary" onClick={() => setYearModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateYear}>Create Year</Button>
          </>
        }
      >
        <FormField
          label="Year Code"
          value={yearForm.code}
          onChange={(v) => setYearForm({ ...yearForm, code: v })}
          placeholder="e.g. 2026-2027"
        />
        <FormField
          label="Display Name"
          value={yearForm.name}
          onChange={(v) => setYearForm({ ...yearForm, name: v })}
          placeholder="e.g. Academic Year 2026–2027"
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Start Date"
            type="date"
            value={yearForm.startDate}
            onChange={(v) => setYearForm({ ...yearForm, startDate: v })}
          />
          <FormField
            label="End Date"
            type="date"
            value={yearForm.endDate}
            onChange={(v) => setYearForm({ ...yearForm, endDate: v })}
          />
        </div>
      </Modal>

      <Modal
        open={termModalOpen}
        onClose={() => setTermModalOpen(false)}
        icon={<Clock size={18} />}
        title="Add Term / Semester"
        description="Terms anchor course offerings and student enrollments."
        footer={
          <>
            <Button variant="secondary" onClick={() => setTermModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateTerm}>Create Term</Button>
          </>
        }
      >
        <FormField
          label="Term Code"
          value={termForm.code}
          onChange={(v) => setTermForm({ ...termForm, code: v })}
          placeholder="e.g. 2026-FALL"
        />
        <FormField
          label="Term Name"
          value={termForm.name}
          onChange={(v) => setTermForm({ ...termForm, name: v })}
          placeholder="e.g. Fall Semester 2026"
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Type"
            type="select"
            value={formatTermType(termForm.termType)}
            options={termTypeOptions.map(formatTermType)}
            onChange={(v) =>
              setTermForm({
                ...termForm,
                termType: v.toLowerCase() as AcademicTermType,
              })
            }
          />
          <FormField
            label="Initial Status"
            type="select"
            value={termForm.status.replace('_', ' ')}
            options={termStatusOptions.map((s) => s.replace('_', ' '))}
            onChange={(v) =>
              setTermForm({
                ...termForm,
                status: v.replace(' ', '_') as AcademicTermStatus,
              })
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Start Date"
            type="date"
            value={termForm.startDate}
            onChange={(v) => setTermForm({ ...termForm, startDate: v })}
          />
          <FormField
            label="End Date"
            type="date"
            value={termForm.endDate}
            onChange={(v) => setTermForm({ ...termForm, endDate: v })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Registration Opens"
            type="date"
            value={termForm.registrationOpens}
            onChange={(v) => setTermForm({ ...termForm, registrationOpens: v })}
          />
          <FormField
            label="Registration Closes"
            type="date"
            value={termForm.registrationCloses}
            onChange={(v) => setTermForm({ ...termForm, registrationCloses: v })}
          />
        </div>
      </Modal>
    </div>
  )
}

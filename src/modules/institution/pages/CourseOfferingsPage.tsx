import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BookOpen, ChevronRight, Layers, Plus, Trash2, UserRoundCog, Users, Wand2 } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { Modal } from '../../../shared/components/Modal'
import { FormField } from '../../../shared/components/FormField'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useCampusContext } from '../context/CampusContext'
import { useAcademicCalendar } from '../hooks/useAcademicCalendar'
import { useCourseOfferings, type CreateOfferingInput } from '../hooks/useCourseOfferings'
import { useCourses } from '../hooks/useCourses'
import { usePeople } from '../hooks/usePeople'
import { usePrograms } from '../hooks/usePrograms'
import { offeringDisplayLabel } from '../utils/offeringUtils'
import {
  curriculumForSlot,
  programSemesters,
  programYears,
  resolveOfferingProgramId,
  termSemesterNumber,
} from '../utils/programUtils'
import {
  formatProgramSemester,
  formatProgramSlot,
  formatStudyYear,
  programSemesterOptions,
  studyYearOptions,
} from '../utils/studyYearUtils'
import type { CourseOfferingDeliveryMode, CourseOfferingStatus } from '../types/academic'
import type { ProgramRow } from '../types'

const STAT = 17

const deliveryLabels: Record<CourseOfferingDeliveryMode, string> = {
  in_person: 'In person',
  online: 'Online',
  hybrid: 'Hybrid',
  self_paced: 'Self-paced',
}

const statusTone = (status: CourseOfferingStatus) => {
  switch (status) {
    case 'in_progress':
    case 'open':
      return 'success' as const
    case 'planned':
      return 'info' as const
    case 'cancelled':
      return 'danger' as const
    default:
      return 'neutral' as const
  }
}

const emptyOfferingForm = {
  programId: '',
  studyYear: 1,
  programSemester: 1,
  academicTermId: '',
  courseId: '',
  sectionCode: '01',
  primaryInstructorId: '',
  deliveryMode: 'in_person' as CourseOfferingDeliveryMode,
  maxEnrollment: '60',
  scheduleSummary: '',
  location: '',
}

/**
 * Course sections for each term. A section is one curriculum course of a
 * program (year + semester) running in a calendar term, with its instructor.
 */
export function CourseOfferingsPage() {
  const { notify } = useToast()
  const [searchParams] = useSearchParams()
  const { departments } = useCampusContext()
  const { courses } = useCourses()
  const { people } = usePeople()
  const { programs } = usePrograms()
  const { offerings, addOffering, updateOffering, removeOffering } = useCourseOfferings()
  const { terms, currentTerm } = useAcademicCalendar()

  const instructors = useMemo(
    () => people.filter((p) => p.role === 'Instructor' && p.status === 'active'),
    [people],
  )
  const courseById = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses])
  const programById = useMemo(() => new Map(programs.map((p) => [p.id, p])), [programs])

  const [programFilter, setProgramFilter] = useState(searchParams.get('program') ?? '')
  const [termFilter, setTermFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyOfferingForm)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [generateTermId, setGenerateTermId] = useState('')
  const [generateProgramIds, setGenerateProgramIds] = useState<string[]>([])

  const filterProgram = programFilter ? programById.get(programFilter) : undefined

  const programOf = (offering: (typeof offerings)[number]): ProgramRow | undefined => {
    const id = resolveOfferingProgramId(offering, programs)
    return id ? programById.get(id) : undefined
  }

  const filteredOfferings = useMemo(() => {
    return offerings.filter((o) => {
      if (programFilter && resolveOfferingProgramId(o, programs) !== programFilter) return false
      if (termFilter && o.academicTermId !== termFilter) return false
      if (yearFilter && o.studyYear !== Number(yearFilter)) return false
      if (semesterFilter && (o.programSemester ?? 1) !== Number(semesterFilter)) return false
      return true
    })
  }, [offerings, programs, programFilter, termFilter, yearFilter, semesterFilter])

  const stats = useMemo(() => {
    const open = filteredOfferings.filter((o) => o.status === 'open' || o.status === 'in_progress').length
    const enrolled = filteredOfferings.reduce((sum, o) => sum + o.enrolledCount, 0)
    const withInstructor = filteredOfferings.filter((o) => o.primaryInstructorId).length
    return { total: filteredOfferings.length, open, enrolled, withInstructor }
  }, [filteredOfferings])

  /* ── Create one section ───────────────────────────────── */

  const formProgram = programById.get(form.programId)
  const formYears = programYears(formProgram)
  const formSemesters = programSemesters(formProgram)

  // Courses offered in this slot come from the program's curriculum.
  const slotCourses = curriculumForSlot(formProgram, form.studyYear, form.programSemester)
    .map((e) => courseById.get(e.courseId))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))

  const openCreateModal = () => {
    const programId = programFilter || programs.find((p) => p.status === 'active')?.id || ''
    if (!programId) {
      notify('Add a program and its curriculum first.', 'error')
      return
    }
    setForm({
      ...emptyOfferingForm,
      programId,
      studyYear: yearFilter ? Number(yearFilter) : 1,
      programSemester: semesterFilter ? Number(semesterFilter) : 1,
      academicTermId: termFilter || currentTerm?.id || terms[0]?.id || '',
    })
    setModalOpen(true)
  }

  const buildSection = (
    program: ProgramRow,
    courseId: string,
    studyYear: number,
    programSemester: number,
    termId: string,
    sectionCode: string,
  ): CreateOfferingInput | null => {
    const course = courseById.get(courseId)
    const term = terms.find((t) => t.id === termId)
    const dept = departments.find((d) => d.id === program.departmentId)
    if (!course || !term) return null
    const instructor = instructors.find((i) => i.id === course.instructorId)
    return {
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      departmentId: program.departmentId,
      departmentName: dept?.name ?? program.department,
      programId: program.id,
      programName: program.name,
      studyYear,
      programSemester,
      academicTermId: term.id,
      academicTermName: term.name,
      campusId: program.campusId,
      sectionCode,
      primaryInstructorId: instructor?.id,
      primaryInstructorName: instructor?.name,
      deliveryMode: 'in_person',
      maxEnrollment: 60,
      status: 'planned',
    }
  }

  const sectionExists = (programId: string, courseId: string, year: number, semester: number, termId: string, code = '01') =>
    offerings.some(
      (o) =>
        o.courseId === courseId &&
        resolveOfferingProgramId(o, programs) === programId &&
        o.studyYear === year &&
        (o.programSemester ?? 1) === semester &&
        o.academicTermId === termId &&
        o.sectionCode === code,
    )

  const handleCreate = () => {
    if (!formProgram || !form.courseId) {
      notify('Choose the program, year, semester and course.', 'error')
      return
    }
    if (!form.academicTermId) {
      notify('Choose the academic term this section runs in.', 'error')
      return
    }
    const code = form.sectionCode.trim() || '01'
    if (sectionExists(formProgram.id, form.courseId, form.studyYear, form.programSemester, form.academicTermId, code)) {
      notify(`Section ${code} of this course already exists for this term.`, 'error')
      return
    }
    const base = buildSection(formProgram, form.courseId, form.studyYear, form.programSemester, form.academicTermId, code)
    if (!base) return
    const instructor = instructors.find((i) => i.id === form.primaryInstructorId)
    addOffering({
      ...base,
      primaryInstructorId: instructor?.id ?? base.primaryInstructorId,
      primaryInstructorName: instructor?.name ?? base.primaryInstructorName,
      deliveryMode: form.deliveryMode,
      maxEnrollment: Number(form.maxEnrollment) || undefined,
      scheduleSummary: form.scheduleSummary.trim() || undefined,
      location: form.location.trim() || undefined,
    })
    setModalOpen(false)
    notify(`Section created: ${base.courseCode} §${code} · ${formProgram.code} ${formatProgramSlot(form.studyYear, form.programSemester)}.`)
  }

  /* ── Generate a term's sections from the curriculum ───── */

  const generateTerm = terms.find((t) => t.id === generateTermId)
  const generateSemester = generateTerm ? termSemesterNumber(generateTerm) : 1

  // Every curriculum course running this term that has no section yet.
  const generatePlan: CreateOfferingInput[] = []
  if (generateTerm) {
    for (const program of programs) {
      if (!generateProgramIds.includes(program.id)) continue
      if (generateSemester > programSemesters(program)) continue
      for (let year = 1; year <= programYears(program); year += 1) {
        for (const entry of curriculumForSlot(program, year, generateSemester)) {
          if (sectionExists(program.id, entry.courseId, year, generateSemester, generateTerm.id)) continue
          const section = buildSection(program, entry.courseId, year, generateSemester, generateTerm.id, '01')
          if (section) generatePlan.push(section)
        }
      }
    }
  }

  const openGenerate = () => {
    const term = termFilter || currentTerm?.id || terms[0]?.id || ''
    setGenerateTermId(term)
    setGenerateProgramIds(
      programFilter ? [programFilter] : programs.filter((p) => p.status === 'active').map((p) => p.id),
    )
    setGenerateOpen(true)
  }

  const handleGenerate = () => {
    if (generatePlan.length === 0) {
      notify('Nothing to create: every curriculum course already has a section this term.', 'info')
      return
    }
    for (const section of generatePlan) addOffering(section)
    setGenerateOpen(false)
    notify(`${generatePlan.length} section${generatePlan.length === 1 ? '' : 's'} created for ${generateTerm?.name}. Assign instructors where missing.`)
  }

  const assignInstructor = (offeringId: string, instructorId: string) => {
    const instructor = instructors.find((i) => i.id === instructorId)
    updateOffering(offeringId, {
      primaryInstructorId: instructorId,
      primaryInstructorName: instructor?.name,
    })
    notify(instructor ? `Assigned ${instructor.name}.` : 'Instructor assigned.')
  }

  const filterLabel = [
    filterProgram?.code,
    termFilter ? terms.find((t) => t.id === termFilter)?.name : undefined,
    yearFilter ? formatStudyYear(Number(yearFilter)) : undefined,
    semesterFilter ? formatProgramSemester(Number(semesterFilter)) : undefined,
  ]
    .filter(Boolean)
    .join(' · ') || 'All sections'

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Course Offerings"
        subtitle="The sections running each term. Generate them from each program's curriculum, then assign instructors."
        actions={
          <>
            <Button variant="secondary" onClick={openGenerate} disabled={programs.length === 0 || terms.length === 0}>
              <Wand2 size={15} />
              Generate from curriculum
            </Button>
            <Button variant="primary" onClick={openCreateModal}>
              <Plus size={16} />
              New Section
            </Button>
          </>
        }
      />

      <GlassCard className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Program</label>
            <SelectMenu
              value={programFilter}
              onChange={(id) => {
                setProgramFilter(id)
                setYearFilter('')
                setSemesterFilter('')
              }}
              placeholder="All programs"
              options={[
                { value: '', label: 'All programs' },
                ...programs.map((p) => ({ value: p.id, label: p.name, hint: p.department })),
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Term</label>
            <SelectMenu
              value={termFilter}
              onChange={setTermFilter}
              placeholder="All terms"
              options={[
                { value: '', label: 'All terms' },
                ...terms.map((t) => ({ value: t.id, label: t.name, hint: t.isCurrent ? 'Current' : undefined })),
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Study year</label>
            <SelectMenu
              value={yearFilter}
              onChange={setYearFilter}
              placeholder="All years"
              options={[
                { value: '', label: 'All years' },
                ...studyYearOptions(filterProgram ? programYears(filterProgram) : 5).map((y) => ({
                  value: String(y),
                  label: formatStudyYear(y),
                })),
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Semester</label>
            <SelectMenu
              value={semesterFilter}
              onChange={setSemesterFilter}
              placeholder="All semesters"
              options={[
                { value: '', label: 'All semesters' },
                ...programSemesterOptions(programSemesters(filterProgram)).map((s) => ({
                  value: String(s),
                  label: formatProgramSemester(s),
                })),
              ]}
            />
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatBlock label="Sections" value={stats.total} icon={<Layers size={STAT} />} />
        <StatBlock label="Active / Open" value={stats.open} icon={<BookOpen size={STAT} />} />
        <StatBlock label="Students Enrolled" value={stats.enrolled} icon={<Users size={STAT} />} />
        <StatBlock
          label="With Instructor"
          value={`${stats.withInstructor} / ${stats.total}`}
          icon={<UserRoundCog size={STAT} />}
        />
      </div>

      <GlassCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-divider/60">
          <h3 className="text-sm font-semibold text-navy-900">
            {filterLabel} ({filteredOfferings.length})
          </h3>
        </div>
        {filteredOfferings.length === 0 ? (
          <p className="p-5 text-sm text-secondary-text">
            No sections match your filters. Use <strong>Generate from curriculum</strong> to create a term's sections
            in one step.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-secondary-text border-b border-divider/60">
                  <th className="px-5 py-3 font-medium">Section</th>
                  <th className="px-5 py-3 font-medium">Program · slot</th>
                  <th className="px-5 py-3 font-medium">Term</th>
                  <th className="px-5 py-3 font-medium">Instructor</th>
                  <th className="px-5 py-3 font-medium">Enrolled</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOfferings.map((offering) => {
                  const program = programOf(offering)
                  return (
                    <tr key={offering.id} className="border-b border-divider/40 last:border-0">
                      <td className="px-5 py-3">
                        <div className="font-medium text-navy-900">
                          {offering.courseCode} §{offering.sectionCode}
                        </div>
                        <div className="text-xs text-secondary-text truncate max-w-[220px]">{offering.courseTitle}</div>
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {program ? (
                          <Link
                            to={`/admin/institution/programs/${program.id}`}
                            className="font-semibold text-navy-900 hover:text-lemon-700"
                          >
                            {program.code}
                          </Link>
                        ) : (
                          <span className="text-warning font-semibold">No program</span>
                        )}
                        <div className="text-[11px] text-secondary-text">
                          {formatProgramSlot(offering.studyYear, offering.programSemester ?? 1)}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-secondary-text">
                        {terms.find((t) => t.id === offering.academicTermId)?.name ?? (
                          <span className="text-warning font-semibold">No term set</span>
                        )}
                      </td>
                      <td className="px-5 py-3 min-w-[180px]">
                        <SelectMenu
                          value={offering.primaryInstructorId ?? ''}
                          onChange={(id) => assignInstructor(offering.id, id)}
                          placeholder="Assign instructor"
                          options={instructors.map((i) => ({ value: i.id, label: i.name }))}
                        />
                      </td>
                      <td className="px-5 py-3 text-secondary-text">
                        {offering.enrolledCount}
                        {offering.maxEnrollment ? ` / ${offering.maxEnrollment}` : ''}
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill label={offering.status.replace('_', ' ')} tone={statusTone(offering.status)} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger hover:bg-danger-bg"
                            onClick={() => {
                              if (!window.confirm(`Delete section ${offeringDisplayLabel(offering)}?`)) return
                              removeOffering(offering.id)
                              notify('Section removed.', 'info')
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Create one section */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        icon={<Layers size={18} />}
        title="New Section"
        description="Program → year → semester → curriculum course → term"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={!form.courseId}>
              <ChevronRight size={15} />
              Create Section
            </Button>
          </>
        }
      >
        <FormField
          label="1. Program"
          type="select"
          value={form.programId}
          options={programs.map((p) => p.id)}
          optionLabels={Object.fromEntries(programs.map((p) => [p.id, `${p.name} (${p.department})`]))}
          onChange={(id) => setForm({ ...form, programId: id, studyYear: 1, programSemester: 1, courseId: '' })}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="2. Study year"
            type="select"
            value={String(form.studyYear)}
            options={studyYearOptions(formYears).map(String)}
            optionLabels={Object.fromEntries(studyYearOptions(formYears).map((y) => [String(y), formatStudyYear(y)]))}
            onChange={(v) => setForm({ ...form, studyYear: Number(v), courseId: '' })}
          />
          <FormField
            label="3. Semester"
            type="select"
            value={String(form.programSemester)}
            options={programSemesterOptions(formSemesters).map(String)}
            optionLabels={Object.fromEntries(
              programSemesterOptions(formSemesters).map((s) => [String(s), formatProgramSemester(s)]),
            )}
            onChange={(v) => setForm({ ...form, programSemester: Number(v), courseId: '' })}
          />
        </div>
        {slotCourses.length > 0 ? (
          <FormField
            label="4. Course (from the curriculum)"
            type="select"
            value={form.courseId}
            options={['', ...slotCourses.map((c) => c.id)]}
            optionLabels={{ '': 'Choose a course…', ...Object.fromEntries(slotCourses.map((c) => [c.id, `${c.code} — ${c.title}`])) }}
            onChange={(id) => setForm({ ...form, courseId: id })}
          />
        ) : (
          <p className="text-[12px] text-warning font-medium rounded-lg bg-warning-bg/50 px-3 py-2">
            The curriculum has no courses for this year and semester.{' '}
            {formProgram ? (
              <Link to={`/admin/institution/programs/${formProgram.id}`} className="underline font-semibold">
                Add them to the curriculum
              </Link>
            ) : null}{' '}
            first.
          </p>
        )}
        <FormField
          label="5. Academic term"
          type="select"
          value={form.academicTermId}
          options={terms.map((t) => t.id)}
          optionLabels={Object.fromEntries(terms.map((t) => [t.id, t.name]))}
          onChange={(id) => setForm({ ...form, academicTermId: id })}
          hint="Grades and transcripts are grouped by this term."
        />

        <p className="text-[11px] font-bold uppercase tracking-wide text-secondary-text pt-1">6. Section details</p>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Section code"
            value={form.sectionCode}
            onChange={(v) => setForm({ ...form, sectionCode: v })}
            placeholder="e.g. 01"
          />
          <FormField
            label="Max enrollment"
            value={form.maxEnrollment}
            onChange={(v) => setForm({ ...form, maxEnrollment: v })}
            placeholder="60"
          />
        </div>
        <FormField
          label="Primary instructor"
          type="select"
          value={form.primaryInstructorId}
          options={['', ...instructors.map((i) => i.id)]}
          optionLabels={{ '': "Course's default instructor", ...Object.fromEntries(instructors.map((i) => [i.id, i.name])) }}
          onChange={(id) => setForm({ ...form, primaryInstructorId: id })}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Delivery mode"
            type="select"
            value={form.deliveryMode}
            options={Object.keys(deliveryLabels)}
            optionLabels={deliveryLabels}
            onChange={(v) => setForm({ ...form, deliveryMode: v as CourseOfferingDeliveryMode })}
          />
          <FormField
            label="Room"
            value={form.location}
            onChange={(v) => setForm({ ...form, location: v })}
            placeholder="e.g. Block B, Room 204"
          />
        </div>
        <FormField
          label="Schedule"
          value={form.scheduleSummary}
          onChange={(v) => setForm({ ...form, scheduleSummary: v })}
          placeholder="e.g. Mon/Wed 10:00–11:30"
        />
      </Modal>

      {/* Generate a term's sections from every program's curriculum */}
      <Modal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        icon={<Wand2 size={18} />}
        title="Generate sections from curriculum"
        description="Creates one section for every curriculum course that runs this term and has no section yet."
        footer={
          <>
            <Button variant="secondary" onClick={() => setGenerateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleGenerate} disabled={generatePlan.length === 0}>
              Create {generatePlan.length} section{generatePlan.length === 1 ? '' : 's'}
            </Button>
          </>
        }
      >
        <FormField
          label="Term"
          type="select"
          value={generateTermId}
          options={terms.map((t) => t.id)}
          optionLabels={Object.fromEntries(terms.map((t) => [t.id, `${t.name}${t.isCurrent ? ' (current)' : ''}`]))}
          onChange={setGenerateTermId}
          hint={generateTerm ? `${generateTerm.name} runs semester ${generateSemester} of each study year.` : undefined}
        />
        <div>
          <div className="text-[12px] font-semibold text-navy-900 mb-1.5">Programs</div>
          <div className="max-h-48 overflow-y-auto app-scroll space-y-1 rounded-xl border border-divider/70 p-2">
            {programs.map((p) => (
              <label key={p.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-navy-50/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateProgramIds.includes(p.id)}
                  onChange={() =>
                    setGenerateProgramIds((prev) =>
                      prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id],
                    )
                  }
                  className="accent-lemon-600"
                />
                <span className="text-[12.5px] font-semibold text-navy-900">{p.name}</span>
                <span className="ml-auto text-[11px] text-secondary-text">{p.department}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="rounded-xl nested-panel p-3 text-[12px]">
          {generatePlan.length === 0 ? (
            <span className="text-secondary-text">Nothing new to create for this term.</span>
          ) : (
            <>
              <div className="font-semibold text-navy-900 mb-1.5">Will create {generatePlan.length} sections:</div>
              <ul className="max-h-36 overflow-y-auto app-scroll space-y-0.5 text-secondary-text">
                {generatePlan.map((s) => (
                  <li key={`${s.programId}-${s.courseId}-${s.studyYear}`}>
                    {s.courseCode} §01 · {programById.get(s.programId ?? '')?.code} Y{s.studyYear}
                    {s.primaryInstructorName ? ` · ${s.primaryInstructorName}` : ' · no instructor yet'}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}

import { useMemo, useState } from 'react'
import {
  BookOpen,
  ChevronRight,
  Layers,
  Plus,
  Trash2,
  UserRoundCog,
  Users,
} from 'lucide-react'
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
import { useCourseOfferings } from '../hooks/useCourseOfferings'
import { useCourses } from '../hooks/useCourses'
import { usePeople } from '../hooks/usePeople'
import { offeringDisplayLabel } from '../utils/offeringUtils'
import {
  departmentMaxYears,
  departmentSemestersPerYear,
  formatProgramSemester,
  formatProgramSlot,
  formatStudyYear,
  programSemesterOptions,
  studyYearOptions,
} from '../utils/studyYearUtils'
import type { CourseOfferingDeliveryMode, CourseOfferingStatus } from '../types/academic'

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
    case 'completed':
      return 'neutral' as const
    case 'cancelled':
      return 'danger' as const
    default:
      return 'neutral' as const
  }
}

const emptyOfferingForm = {
  departmentId: '',
  studyYear: 1,
  programSemester: 1,
  courseId: '',
  sectionCode: '01',
  primaryInstructorId: '',
  deliveryMode: 'in_person' as CourseOfferingDeliveryMode,
  maxEnrollment: '60',
  scheduleSummary: '',
  location: '',
}

export function CourseOfferingsPage() {
  const { notify } = useToast()
  const { departments } = useCampusContext()
  const { courses } = useCourses()
  const { people } = usePeople()
  const { offerings, addOffering, updateOffering, removeOffering } = useCourseOfferings()

  const instructors = useMemo(
    () => people.filter((p) => p.role === 'Instructor' && p.status === 'active'),
    [people],
  )

  const catalogCourses = useMemo(
    () => courses.filter((c) => c.status === 'published' || c.status === 'draft'),
    [courses],
  )

  const [deptFilter, setDeptFilter] = useState('')
  const [yearFilter, setYearFilter] = useState<string>('')
  const [semesterFilter, setSemesterFilter] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyOfferingForm)

  const filterDept = deptFilter ? departments.find((d) => d.id === deptFilter) : undefined
  const filterSemestersPerYear = departmentSemestersPerYear(filterDept)

  const filteredOfferings = useMemo(() => {
    return offerings.filter((o) => {
      if (deptFilter && o.departmentId !== deptFilter) return false
      if (yearFilter && o.studyYear !== Number(yearFilter)) return false
      if (semesterFilter && (o.programSemester ?? 1) !== Number(semesterFilter)) return false
      return true
    })
  }, [offerings, deptFilter, yearFilter, semesterFilter])

  const deptCourses = useMemo(() => {
    if (!form.departmentId) return catalogCourses
    const dept = departments.find((d) => d.id === form.departmentId)
    if (!dept) return catalogCourses
    return catalogCourses.filter((c) => c.department === dept.name)
  }, [catalogCourses, departments, form.departmentId])

  const stats = useMemo(() => {
    const open = filteredOfferings.filter((o) => o.status === 'open' || o.status === 'in_progress').length
    const enrolled = filteredOfferings.reduce((sum, o) => sum + o.enrolledCount, 0)
    const withInstructor = filteredOfferings.filter((o) => o.primaryInstructorId).length
    return { total: filteredOfferings.length, open, enrolled, withInstructor }
  }, [filteredOfferings])

  const openCreateModal = () => {
    const defaultDept = deptFilter || departments[0]?.id || ''
    const defaultDeptMeta = departments.find((d) => d.id === defaultDept)
    setForm({
      ...emptyOfferingForm,
      departmentId: defaultDept,
      studyYear: yearFilter ? Number(yearFilter) : 1,
      programSemester: semesterFilter ? Number(semesterFilter) : 1,
      courseId: '',
      primaryInstructorId: instructors[0]?.id ?? '',
    })
    if (!defaultDept) {
      notify('Add a department first.', 'error')
      return
    }
    if (!defaultDeptMeta) return
    setModalOpen(true)
  }

  const handleCreate = () => {
    const dept = departments.find((d) => d.id === form.departmentId)
    const course = deptCourses.find((c) => c.id === form.courseId)
    if (!dept || !course) {
      notify('Complete department, study year, program semester, and course selection.', 'error')
      return
    }

    const instructor = instructors.find((i) => i.id === form.primaryInstructorId)
    const duplicate = offerings.some(
      (o) =>
        o.courseId === course.id &&
        o.departmentId === dept.id &&
        o.studyYear === form.studyYear &&
        (o.programSemester ?? 1) === form.programSemester &&
        o.sectionCode === form.sectionCode.trim(),
    )
    if (duplicate) {
      notify('This section already exists for this department, year, and semester.', 'error')
      return
    }

    addOffering({
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      departmentId: dept.id,
      departmentName: dept.name,
      studyYear: form.studyYear,
      programSemester: form.programSemester,
      campusId: dept.campusId,
      sectionCode: form.sectionCode.trim() || '01',
      primaryInstructorId: instructor?.id,
      primaryInstructorName: instructor?.name,
      deliveryMode: form.deliveryMode,
      maxEnrollment: Number(form.maxEnrollment) || undefined,
      status: 'planned',
      scheduleSummary: form.scheduleSummary.trim() || undefined,
      location: form.location.trim() || undefined,
    })
    setModalOpen(false)
    notify(
      `Offering created: ${dept.name} · ${formatProgramSlot(form.studyYear, form.programSemester)} · ${course.code}.`,
      'success',
    )
  }

  const assignInstructor = (offeringId: string, instructorId: string) => {
    const instructor = instructors.find((i) => i.id === instructorId)
    updateOffering(offeringId, {
      primaryInstructorId: instructorId,
      primaryInstructorName: instructor?.name,
      status: 'in_progress',
    })
    notify(instructor ? `Assigned ${instructor.name}.` : 'Instructor assigned.')
  }

  const formDept = departments.find((d) => d.id === form.departmentId)
  const formMaxYears = departmentMaxYears(formDept)
  const formSemestersPerYear = departmentSemestersPerYear(formDept)

  const filterLabel =
    yearFilter && semesterFilter
      ? formatProgramSlot(Number(yearFilter), Number(semesterFilter))
      : yearFilter
        ? formatStudyYear(Number(yearFilter))
        : semesterFilter
          ? formatProgramSemester(Number(semesterFilter))
          : 'All program slots'

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Course Offerings"
        subtitle="Define curriculum sections by department, study year, and program semester — where students land as they progress."
        actions={
          <Button variant="primary" onClick={openCreateModal}>
            <Plus size={16} />
            New Offering
          </Button>
        }
      />

      <GlassCard className="p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-secondary-text mb-3">
          Filter offerings
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
            <SelectMenu
              value={deptFilter}
              onChange={(id) => {
                setDeptFilter(id)
                setSemesterFilter('')
              }}
              placeholder="All departments"
              options={[
                { value: '', label: 'All departments' },
                ...departments.map((d) => ({
                  value: d.id,
                  label: d.name,
                  hint: d.programCode ?? `${d.maxYears ?? 4} years`,
                })),
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
                ...studyYearOptions(deptFilter ? departmentMaxYears(filterDept) : 5).map((y) => ({
                  value: String(y),
                  label: formatStudyYear(y),
                })),
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Program semester</label>
            <SelectMenu
              value={semesterFilter}
              onChange={setSemesterFilter}
              placeholder="All semesters"
              options={[
                { value: '', label: 'All semesters' },
                ...programSemesterOptions(filterSemestersPerYear).map((s) => ({
                  value: String(s),
                  label: formatProgramSemester(s),
                })),
              ]}
            />
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatBlock label="Offerings" value={stats.total} icon={<Layers size={STAT} />} />
        <StatBlock label="Active / Open" value={stats.open} icon={<BookOpen size={STAT} />} />
        <StatBlock label="Students Enrolled" value={stats.enrolled} icon={<Users size={STAT} />} />
        <StatBlock label="With Instructor" value={stats.withInstructor} icon={<UserRoundCog size={STAT} />} />
      </div>

      <GlassCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/60">
          <h3 className="text-sm font-semibold text-slate-800">
            Offerings · {filterLabel} ({filteredOfferings.length})
          </h3>
        </div>
        {filteredOfferings.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            No offerings match your filters. Create one using department → study year → program semester → course.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200/60">
                  <th className="px-5 py-3 font-medium">Section</th>
                  <th className="px-5 py-3 font-medium">Program slot</th>
                  <th className="px-5 py-3 font-medium">Department</th>
                  <th className="px-5 py-3 font-medium">Instructor</th>
                  <th className="px-5 py-3 font-medium">Enrolled</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOfferings.map((offering) => (
                  <tr key={offering.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3">
                      <div className="font-medium text-navy-900">
                        {offering.courseCode} §{offering.sectionCode}
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-[220px]">{offering.courseTitle}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs">
                      {formatProgramSlot(offering.studyYear, offering.programSemester ?? 1)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{offering.departmentName}</td>
                    <td className="px-5 py-3 min-w-[180px]">
                      <SelectMenu
                        value={offering.primaryInstructorId ?? ''}
                        onChange={(id) => assignInstructor(offering.id, id)}
                        placeholder="Assign instructor"
                        options={instructors.map((i) => ({
                          value: i.id,
                          label: i.name,
                          hint: i.department,
                        }))}
                      />
                    </td>
                    <td className="px-5 py-3 text-slate-600">
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
                            if (!window.confirm(`Delete offering ${offeringDisplayLabel(offering)}?`)) return
                            removeOffering(offering.id)
                            notify('Offering removed.', 'info')
                          }}
                        >
                          <Trash2 size={14} />
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        icon={<Layers size={18} />}
        title="Create Course Offering"
        description="Department → study year → program semester → catalog course → section details"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate}>
              <ChevronRight size={15} />
              Create Offering
            </Button>
          </>
        }
      >
        <FormField
          label="1. Department"
          type="select"
          value={formDept?.name ?? ''}
          options={departments.map((d) => d.name)}
          onChange={(name) => {
            const dept = departments.find((d) => d.name === name)
            if (dept) {
              setForm({
                ...form,
                departmentId: dept.id,
                studyYear: 1,
                programSemester: 1,
                courseId: '',
              })
            }
          }}
        />
        {formDept ? (
          <p className="text-[11px] text-secondary-text -mt-2">
            {formDept.programCode ?? 'Program'} · {formDept.programLevel ?? 'Undergraduate'} ·{' '}
            {formMaxYears} years · {formSemestersPerYear} semesters/year
          </p>
        ) : null}

        <FormField
          label="2. Study year"
          type="select"
          value={formatStudyYear(form.studyYear)}
          options={studyYearOptions(formMaxYears).map(formatStudyYear)}
          onChange={(label) => {
            const year = studyYearOptions(formMaxYears).find((y) => formatStudyYear(y) === label)
            if (year) setForm({ ...form, studyYear: year, courseId: '' })
          }}
        />

        <FormField
          label="3. Program semester"
          type="select"
          value={formatProgramSemester(form.programSemester)}
          options={programSemesterOptions(formSemestersPerYear).map(formatProgramSemester)}
          onChange={(label) => {
            const sem = programSemesterOptions(formSemestersPerYear).find(
              (s) => formatProgramSemester(s) === label,
            )
            if (sem) setForm({ ...form, programSemester: sem, courseId: '' })
          }}
          hint="Which semester within this study year — not a calendar year like 2026."
        />

        <FormField
          label="4. Catalog course"
          type="select"
          value={
            deptCourses.find((c) => c.id === form.courseId)
              ? `${deptCourses.find((c) => c.id === form.courseId)!.code} — ${deptCourses.find((c) => c.id === form.courseId)!.title}`
              : ''
          }
          options={deptCourses.map((c) => `${c.code} — ${c.title}`)}
          onChange={(label) => {
            const course = deptCourses.find((c) => `${c.code} — ${c.title}` === label)
            if (course) setForm({ ...form, courseId: course.id })
          }}
        />

        <p className="text-[11px] font-bold uppercase tracking-wide text-secondary-text pt-1">5. Section details</p>
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
          value={instructors.find((i) => i.id === form.primaryInstructorId)?.name ?? ''}
          options={instructors.map((i) => i.name)}
          onChange={(name) => {
            const instructor = instructors.find((i) => i.name === name)
            setForm({ ...form, primaryInstructorId: instructor?.id ?? '' })
          }}
        />
        <FormField
          label="Delivery mode"
          type="select"
          value={deliveryLabels[form.deliveryMode]}
          options={Object.values(deliveryLabels)}
          onChange={(label) => {
            const mode = (Object.entries(deliveryLabels).find(([, v]) => v === label)?.[0] ??
              'in_person') as CourseOfferingDeliveryMode
            setForm({ ...form, deliveryMode: mode })
          }}
        />
        <FormField
          label="Schedule"
          value={form.scheduleSummary}
          onChange={(v) => setForm({ ...form, scheduleSummary: v })}
          placeholder="e.g. Mon/Wed 10:00–11:30"
        />
      </Modal>
    </div>
  )
}

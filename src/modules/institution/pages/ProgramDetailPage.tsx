import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, GraduationCap, Layers, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { ProgramFormModal } from '../components/ProgramFormModal'
import { useCampusContext } from '../context/CampusContext'
import { useCourses } from '../hooks/useCourses'
import { usePeople } from '../hooks/usePeople'
import { usePrograms } from '../hooks/usePrograms'
import { useAcademicCalendar } from '../hooks/useAcademicCalendar'
import {
  addCurriculumEntry,
  curriculumCredits,
  curriculumForSlot,
  programSemesters,
  programYears,
  removeCurriculumEntry,
  studentsInProgram,
} from '../utils/programUtils'
import type { CourseRecord, CurriculumEntry } from '../types'

const STAT = 17

interface AddTarget {
  studyYear: number
  semester: number
}

/** One program and its curriculum: which courses run in which year and semester. */
export function ProgramDetailPage() {
  const { programId } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()
  const { departments } = useCampusContext()
  const { programs, saveProgram } = usePrograms()
  const { courses } = useCourses()
  const { people } = usePeople()
  const { ensureCalendarForProgram } = useAcademicCalendar()
  const [editOpen, setEditOpen] = useState(false)
  const [addTarget, setAddTarget] = useState<AddTarget | null>(null)
  const [addCourseId, setAddCourseId] = useState('')
  const [addType, setAddType] = useState<CurriculumEntry['type']>('core')

  const program = programs.find((p) => p.id === programId)
  const courseById = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses])
  const department = departments.find((d) => d.id === program?.departmentId)

  const students = useMemo(
    () => (program ? studentsInProgram(people, program, programs, departments) : []),
    [people, program, programs, departments],
  )

  // Courses of the owning department first, then everything else in the catalog.
  const courseChoices = useMemo(() => {
    const active = courses.filter((c) => c.status !== 'archived')
    const own = active.filter((c) => c.department === department?.name)
    const other = active.filter((c) => c.department !== department?.name)
    const sort = (list: CourseRecord[]) => [...list].sort((a, b) => a.code.localeCompare(b.code))
    return { own: sort(own), other: sort(other) }
  }, [courses, department])

  if (!program) {
    return (
      <GlassCard className="p-10 text-center">
        <p className="text-[14px] font-semibold text-navy-900">Program not found</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/admin/institution/programs')}>
          <ArrowLeft size={15} />
          Back to programs
        </Button>
      </GlassCard>
    )
  }

  const years = programYears(program)
  const semesters = programSemesters(program)
  const curriculum = program.curriculum ?? []
  const plannedCredits = curriculumCredits(program, courses)
  const coreCount = curriculum.filter((e) => e.type === 'core').length

  const openAdd = (target: AddTarget) => {
    setAddTarget(target)
    setAddCourseId('')
    setAddType('core')
  }

  const handleAdd = () => {
    if (!addTarget || !addCourseId) return
    const course = courseById.get(addCourseId)
    const next = addCurriculumEntry(program, { courseId: addCourseId, ...addTarget, type: addType })
    if (next === program) {
      notify('That course is already in this semester.', 'error')
      return
    }
    saveProgram(next)
    setAddTarget(null)
    notify(`${course?.code ?? 'Course'} added to Year ${addTarget.studyYear}, Semester ${addTarget.semester}.`)
  }

  const handleRemove = (entry: CurriculumEntry) => {
    saveProgram(removeCurriculumEntry(program, entry))
    notify(`${courseById.get(entry.courseId)?.code ?? 'Course'} removed from the curriculum.`, 'info')
  }

  const toggleType = (entry: CurriculumEntry) => {
    const curriculumNext = curriculum.map((e) =>
      e === entry ? { ...e, type: e.type === 'core' ? ('elective' as const) : ('core' as const) } : e,
    )
    saveProgram({ ...program, curriculum: curriculumNext })
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div>
        <Link
          to="/admin/institution/programs"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-secondary-text hover:text-navy-900"
        >
          <ArrowLeft size={14} />
          All programs
        </Link>
      </div>

      <PageHeader
        title={program.name}
        subtitle={`${program.code} · ${program.level} · ${program.department} · ${years} year${years === 1 ? '' : 's'}, ${semesters} semester${semesters === 1 ? '' : 's'} per year`}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => navigate(`/admin/course-offerings?program=${program.id}`)}
            >
              <Layers size={15} />
              Sections
            </Button>
            <Button variant="primary" onClick={() => setEditOpen(true)}>
              <Pencil size={15} />
              Edit Program
            </Button>
          </>
        }
      />

      {program.description ? (
        <p className="-mt-3 text-[13px] text-secondary-text max-w-3xl">{program.description}</p>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatBlock label="Students" value={students.length} icon={<Users size={STAT} />} />
        <StatBlock
          label="Curriculum Courses"
          value={new Set(curriculum.map((e) => e.courseId)).size}
          sub={`${coreCount} core · ${curriculum.length - coreCount} elective`}
          icon={<BookOpen size={STAT} />}
        />
        <StatBlock
          label="Credits Planned"
          value={program.totalCredits ? `${plannedCredits} / ${program.totalCredits}` : plannedCredits}
          sub={program.totalCredits ? 'Planned of required' : 'Across all semesters'}
          icon={<GraduationCap size={STAT} />}
        />
        <StatBlock
          label="Status"
          value={program.status.charAt(0).toUpperCase() + program.status.slice(1)}
          icon={<Layers size={STAT} />}
        />
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-[16px] font-extrabold text-navy-900">Curriculum</h2>
          <p className="text-[12.5px] text-secondary-text mt-1">
            The courses students take in each year and semester. Each term, sections are created from this plan
            on the Course Offerings page.
          </p>
        </div>

        {Array.from({ length: years }, (_, i) => i + 1).map((year) => {
          const yearStudents = students.filter((s) => (s.studyYear ?? 1) === year).length
          return (
            <GlassCard key={year} className="p-5 md:p-6">
              <div className="flex items-baseline justify-between gap-3 mb-4">
                <h3 className="text-[15px] font-extrabold text-navy-900">Year {year}</h3>
                <span className="text-[11.5px] text-secondary-text">
                  {yearStudents} student{yearStudents === 1 ? '' : 's'}
                </span>
              </div>
              <div className={`grid grid-cols-1 gap-4 ${semesters >= 2 ? 'md:grid-cols-2' : ''} ${semesters >= 3 ? 'xl:grid-cols-3' : ''}`}>
                {Array.from({ length: semesters }, (_, j) => j + 1).map((semester) => {
                  const entries = curriculumForSlot(program, year, semester)
                  const credits = entries.reduce((sum, e) => sum + (courseById.get(e.courseId)?.credits ?? 3), 0)
                  const adding = addTarget?.studyYear === year && addTarget.semester === semester
                  const taken = new Set(entries.map((e) => e.courseId))
                  return (
                    <div key={semester} className="nested-panel rounded-xl p-3.5 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold uppercase tracking-wide text-navy-700">
                          Semester {semester}
                        </span>
                        <span className="text-[11px] text-secondary-text">{credits} credits</span>
                      </div>

                      {entries.length === 0 && !adding ? (
                        <p className="text-[12px] text-secondary-text py-2">No courses planned yet.</p>
                      ) : null}

                      {entries.map((entry) => {
                        const course = courseById.get(entry.courseId)
                        return (
                          <div
                            key={entry.courseId}
                            className="group nested-panel-strong rounded-lg px-3 py-2 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="text-[12.5px] font-bold text-navy-900 truncate">
                                {course ? `${course.code} — ${course.title}` : 'Course removed from catalog'}
                              </div>
                              <div className="text-[11px] text-secondary-text">
                                {course?.credits ?? 3} credits
                                {course && course.department !== program.department ? ` · ${course.department}` : ''}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => toggleType(entry)}
                                title="Switch between core and elective"
                                className="cursor-pointer"
                              >
                                <StatusPill
                                  label={entry.type === 'core' ? 'Core' : 'Elective'}
                                  tone={entry.type === 'core' ? 'info' : 'neutral'}
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemove(entry)}
                                aria-label={`Remove ${course?.code ?? 'course'}`}
                                className="opacity-70 md:opacity-0 md:group-hover:opacity-100 text-secondary-text hover:text-danger hover:bg-danger-bg w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        )
                      })}

                      {adding ? (
                        <div className="rounded-lg border border-lemon-500/40 bg-lemon-50/40 dark:bg-lemon-500/5 p-2.5 flex flex-col gap-2">
                          <select
                            value={addCourseId}
                            onChange={(e) => setAddCourseId(e.target.value)}
                            className="w-full bg-white dark:bg-navy-50 border border-divider rounded-lg px-2.5 py-1.5 text-[12.5px] text-navy-900 dark:[color-scheme:dark]"
                          >
                            <option value="">Choose a course…</option>
                            <optgroup label={program.department}>
                              {courseChoices.own.filter((c) => !taken.has(c.id)).map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.code} — {c.title}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Other departments">
                              {courseChoices.other.filter((c) => !taken.has(c.id)).map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.code} — {c.title} ({c.department})
                                </option>
                              ))}
                            </optgroup>
                          </select>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex gap-1">
                              {(['core', 'elective'] as const).map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setAddType(t)}
                                  className={`px-2.5 py-1 rounded-md text-[11.5px] font-semibold cursor-pointer ${
                                    addType === t ? 'bg-navy-900 text-white' : 'text-secondary-text hover:bg-navy-50'
                                  }`}
                                >
                                  {t === 'core' ? 'Core' : 'Elective'}
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-1.5">
                              <Button variant="ghost" size="sm" onClick={() => setAddTarget(null)}>
                                Cancel
                              </Button>
                              <Button variant="primary" size="sm" onClick={handleAdd} disabled={!addCourseId}>
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openAdd({ studyYear: year, semester })}
                          className="self-start inline-flex items-center gap-1 text-[12px] font-bold text-lemon-700 hover:text-lemon-900 cursor-pointer mt-0.5"
                        >
                          <Plus size={13} />
                          Add course
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </GlassCard>
          )
        })}
      </div>

      <ProgramFormModal
        open={editOpen}
        program={program}
        departments={departments}
        existingCodes={programs.map((p) => p.code)}
        onClose={() => setEditOpen(false)}
        onSave={(updated) => {
          const removed = (program.curriculum?.length ?? 0) - (updated.curriculum?.length ?? 0)
          saveProgram(updated)
          ensureCalendarForProgram(updated.durationYears, updated.campusId, updated.semestersPerYear)
          setEditOpen(false)
          notify(
            removed > 0
              ? `${updated.name} updated. ${removed} curriculum course${removed === 1 ? '' : 's'} outside the new length ${removed === 1 ? 'was' : 'were'} removed.`
              : `${updated.name} updated.`,
          )
        }}
      />
    </div>
  )
}

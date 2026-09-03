import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Users } from 'lucide-react'
import { PageHeader } from '../../../shared/components/PageHeader'
import { useOrganizationConfig } from '../../../shared/config/useOrganizationConfig'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { Button } from '../../../shared/components/Button'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useEnrollments } from '../hooks/useEnrollments'
import { usePeople } from '../hooks/usePeople'
import { useCourses } from '../hooks/useCourses'
import { useCourseOfferings } from '../hooks/useCourseOfferings'
import {
  isEnrollableOffering,
  normalizeOfferings,
  offeringDisplayLabel,
  syncOfferingEnrollmentCounts,
} from '../utils/offeringUtils'
import { useCampusContext } from '../context/CampusContext'
import {
  departmentMaxYears,
  departmentSemestersPerYear,
  formatProgramSemester,
  formatProgramSlot,
  formatStudyYear,
  programSemesterOptions,
  resolveStudentProgramSemester,
  studyYearOptions,
} from '../utils/studyYearUtils'
import {
  getOfferingsForProgramSlot,
  getStudentsForProgramSlot,
  isEnrollableStudent,
  syncCourseEnrollmentCounts,
} from '../utils/enrollmentUtils'
import type { CourseEnrollment } from '../types'

export function EnrollmentsPage() {
  const { notify } = useToast()
  const { terminology: t } = useOrganizationConfig()
  const { departments } = useCampusContext()
  const { enrollments, bulkEnrollCohort, updateEnrollment, removeEnrollment } = useEnrollments()
  const { people } = usePeople()
  const { courses, setCourses } = useCourses()
  const { offerings, setOfferings } = useCourseOfferings()

  const [departmentId, setDepartmentId] = useState('')
  const [studyYear, setStudyYear] = useState('1')
  const [programSemester, setProgramSemester] = useState('1')
  const [tableFilter, setTableFilter] = useState('')

  const normalizedOfferings = useMemo(() => normalizeOfferings(offerings), [offerings])

  const students = useMemo(
    () => people.filter((p) => p.role === 'Student' && isEnrollableStudent(p.status)),
    [people],
  )

  const selectedDepartment = departments.find((d) => d.id === departmentId)
  const yearNum = Number(studyYear) || 1
  const semesterNum = Number(programSemester) || 1
  const maxYears = departmentMaxYears(selectedDepartment)
  const semestersPerYear = departmentSemestersPerYear(selectedDepartment)

  const cohortStudents = useMemo(() => {
    if (!departmentId) return []
    return getStudentsForProgramSlot(students, departmentId, yearNum, semesterNum, departments)
  }, [students, departmentId, yearNum, semesterNum, departments])

  const catalogOfferings = useMemo(() => {
    if (!departmentId) return []
    return getOfferingsForProgramSlot(normalizedOfferings, departmentId, yearNum, semesterNum)
  }, [normalizedOfferings, departmentId, yearNum, semesterNum])

  useEffect(() => {
    setCourses((prev) => syncCourseEnrollmentCounts(prev, enrollments))
    setOfferings((prev) => syncOfferingEnrollmentCounts(prev, enrollments))
  }, [enrollments, setCourses, setOfferings])

  const handleCohortEnroll = () => {
    if (!departmentId) {
      notify('Select a department.', 'error')
      return
    }
    if (catalogOfferings.length === 0) {
      notify('No course offerings in this catalog.', 'error')
      return
    }
    if (cohortStudents.length === 0) {
      notify('No students in this cohort.', 'info')
      return
    }

    const result = bulkEnrollCohort(
      { departmentId, studyYear: yearNum, programSemester: semesterNum },
      cohortStudents,
      catalogOfferings,
    )

    if (result.enrolled === 0) {
      notify('Cohort already enrolled in all catalog courses.', 'info')
      return
    }

    notify(
      `${result.enrolled} enrollment${result.enrolled === 1 ? '' : 's'} created for ${formatProgramSlot(yearNum, semesterNum)}.`,
      'success',
    )
  }

  const rows = useMemo(() => {
    return enrollments
      .map((e) => {
        const student = people.find((p) => p.id === e.studentId)
        const offering = normalizedOfferings.find((o) => o.id === e.courseOfferingId)
        const course = courses.find((c) => c.id === e.courseId)
        return { enrollment: e, student, offering, course }
      })
      .filter(({ offering }) => {
        if (!tableFilter) return true
        if (!offering) return false
        return (
          offering.departmentId === tableFilter ||
          offering.departmentName === departments.find((d) => d.id === tableFilter)?.name
        )
      })
      .sort((a, b) => b.enrollment.enrolledOn.localeCompare(a.enrollment.enrolledOn))
  }, [enrollments, people, normalizedOfferings, courses, tableFilter, departments])

  const toggleStatus = (enrollment: CourseEnrollment) => {
    updateEnrollment(enrollment.id, {
      status: enrollment.status === 'active' ? 'withdrawn' : 'active',
    })
    notify(
      enrollment.status === 'active' ? 'Enrollment withdrawn.' : 'Enrollment reactivated.',
      'success',
    )
  }

  const missingSetup = normalizedOfferings.length === 0

  return (
    <div className="space-y-6">
      <PageHeader title={t.trainingAssignment} />

      {missingSetup ? (
        <GlassCard className="p-4 text-[13px] text-secondary-text space-y-2">
          <p>No course offerings yet.</p>
          <Link to="/admin/course-offerings">
            <Button variant="primary" size="sm">
              Course Offerings
            </Button>
          </Link>
        </GlassCard>
      ) : null}

      <GlassCard className="p-5 space-y-5">
        <h3 className="text-sm font-semibold text-slate-800">Cohort enrollment</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
            <SelectMenu
              value={departmentId}
              onChange={setDepartmentId}
              placeholder="Select department"
              options={departments.map((d) => ({
                value: d.id,
                label: d.name,
                hint: d.programCode,
              }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Study year</label>
            <SelectMenu
              value={studyYear}
              onChange={setStudyYear}
              options={studyYearOptions(maxYears).map((y) => ({
                value: String(y),
                label: formatStudyYear(y),
              }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Program semester</label>
            <SelectMenu
              value={programSemester}
              onChange={setProgramSemester}
              options={programSemesterOptions(semestersPerYear).map((s) => ({
                value: String(s),
                label: formatProgramSemester(s),
              }))}
            />
          </div>
        </div>

        {departmentId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-divider/70 bg-navy-50/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-[13px] font-extrabold text-navy-900">
                <Users size={15} className="text-lemon-700" />
                Students ({cohortStudents.length})
              </div>
              {cohortStudents.length > 0 ? (
                <ul className="text-[12.5px] text-navy-800 space-y-1 max-h-36 overflow-y-auto app-scroll">
                  {cohortStudents.map((s) => (
                    <li key={s.id} className="truncate">
                      {s.name}
                      <span className="text-secondary-text">
                        {' '}
                        · {s.department} ·{' '}
                        {formatProgramSlot(s.studyYear ?? 1, resolveStudentProgramSemester(s))}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12.5px] text-secondary-text">—</p>
              )}
            </div>

            <div className="rounded-xl border border-divider/70 bg-navy-50/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-[13px] font-extrabold text-navy-900">
                <BookOpen size={15} className="text-lemon-700" />
                Term catalog ({catalogOfferings.length})
              </div>
              {catalogOfferings.length > 0 ? (
                <ul className="text-[12.5px] text-navy-800 space-y-1 max-h-36 overflow-y-auto app-scroll">
                  {catalogOfferings.map((o) => (
                    <li key={o.id} className="truncate">
                      {offeringDisplayLabel(o)}
                      {!isEnrollableOffering(o) ? (
                        <span className="text-warning font-semibold"> · closed</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12.5px] text-secondary-text">—</p>
              )}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end pt-2 border-t border-slate-200/60">
          <Button
            onClick={handleCohortEnroll}
            disabled={!departmentId || cohortStudents.length === 0 || catalogOfferings.length === 0}
          >
            Enroll cohort
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-800">Enrollments ({rows.length})</h3>
          <div className="w-full sm:w-56">
            <SelectMenu
              value={tableFilter}
              onChange={setTableFilter}
              placeholder="All departments"
              options={[
                { value: '', label: 'All departments' },
                ...departments.map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
          </div>
        </div>
        {rows.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No enrollments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200/60">
                  <th className="px-5 py-3 font-medium">Student</th>
                  <th className="px-5 py-3 font-medium">Department</th>
                  <th className="px-5 py-3 font-medium">Course</th>
                  <th className="px-5 py-3 font-medium">Program slot</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Enrolled</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ enrollment, student, offering, course }) => (
                  <tr key={enrollment.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3">
                      {student?.name ?? enrollment.studentName}
                      {student?.email ? (
                        <div className="text-xs text-slate-500">{student.email}</div>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs">
                      {offering?.departmentName ?? enrollment.program ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      {offering
                        ? `${offering.courseCode} §${offering.sectionCode} — ${offering.courseTitle}`
                        : course
                          ? `${course.code} — ${course.title}`
                          : `${enrollment.courseCode} — ${enrollment.courseTitle}`}
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs">
                      {offering
                        ? formatProgramSlot(offering.studyYear, offering.programSemester ?? 1)
                        : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill
                        label={
                          enrollment.status === 'active'
                            ? 'Active'
                            : enrollment.status === 'pending'
                              ? 'Pending'
                              : 'Withdrawn'
                        }
                        tone={
                          enrollment.status === 'active'
                            ? 'success'
                            : enrollment.status === 'pending'
                              ? 'warning'
                              : 'neutral'
                        }
                      />
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {new Date(enrollment.enrolledOn).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => toggleStatus(enrollment)}>
                        {enrollment.status === 'active' ? 'Withdraw' : 'Reactivate'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          removeEnrollment(enrollment.id)
                          notify('Enrollment removed.', 'success')
                        }}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  )
}

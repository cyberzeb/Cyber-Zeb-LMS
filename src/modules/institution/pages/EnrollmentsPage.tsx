import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../../../shared/components/PageHeader'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { Button } from '../../../shared/components/Button'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useEnrollments } from '../hooks/useEnrollments'
import { usePeople } from '../hooks/usePeople'
import { useCourses } from '../hooks/useCourses'
import {
  isEnrollableCourse,
  isEnrollableStudent,
  syncCourseEnrollmentCounts,
} from '../utils/enrollmentUtils'
import { getEditionPageCopy } from '../../../shared/config/editionUi'
import { useCorporateFieldLabels } from '../../../shared/config/useEditionPageCopy'
import { isCorporateEdition } from '../../../shared/config/edition'
import { isEnrollmentOverdue } from '../../corporate/utils/complianceUtils'
import type { CourseEnrollment } from '../types'

export function EnrollmentsPage() {
  const { notify } = useToast()
  const pageCopy = getEditionPageCopy('enrollments')
  const labels = useCorporateFieldLabels()
  const { enrollments, enrollStudent, updateEnrollment, removeEnrollment } = useEnrollments()
  const { people } = usePeople()
  const { courses, setCourses } = useCourses()

  const students = useMemo(
    () => people.filter((p) => p.role === 'Student' && isEnrollableStudent(p.status)),
    [people],
  )

  const enrollableCourses = useMemo(
    () => courses.filter((c) => isEnrollableCourse(c)),
    [courses],
  )

  const [studentId, setStudentId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [isMandatory, setIsMandatory] = useState(true)
  const [dueDate, setDueDate] = useState('')

  const corporateMode = isCorporateEdition()

  useEffect(() => {
    setCourses((prev) => syncCourseEnrollmentCounts(prev, enrollments))
  }, [enrollments, setCourses])

  const handleEnroll = () => {
    if (!studentId || !courseId) {
      notify('Select a student and course.', 'error')
      return
    }

    const student = students.find((s) => s.id === studentId)
    const course = enrollableCourses.find((c) => c.id === courseId)
    if (!student || !course) return

    const exists = enrollments.some(
      (e) => e.studentId === studentId && e.courseId === courseId && e.status === 'active',
    )
    if (exists) {
      notify(`${labels.student} is already enrolled in this ${labels.course.toLowerCase()}.`, 'error')
      return
    }

    enrollStudent(studentId, courseId, {
      studentName: student.name,
      courseCode: course.code,
      courseTitle: course.title,
      program: student.department,
      campus: student.campusId,
      isMandatory: corporateMode ? isMandatory : undefined,
      dueDate: corporateMode && dueDate ? dueDate : undefined,
      assignedBy: corporateMode ? 'HR' : undefined,
    })
    notify(`${labels.student} assigned to training. They will see it in the employee portal.`, 'success')
    setStudentId('')
    setCourseId('')
    if (corporateMode) {
      setIsMandatory(true)
      setDueDate('')
    }
  }

  const handleEnrollDepartmentMatches = () => {
    if (!courseId) {
      notify('Select a course first.', 'error')
      return
    }
    const course = enrollableCourses.find((c) => c.id === courseId)
    if (!course) return

    const matches = students.filter((s) => s.department === course.department)
    if (matches.length === 0) {
      notify(`No students found in department “${course.department}”.`, 'info')
      return
    }

    let added = 0
    let nextEnrollments = [...enrollments]
    for (const student of matches) {
      const exists = nextEnrollments.some(
        (e) => e.studentId === student.id && e.courseId === course.id && e.status === 'active',
      )
      if (exists) continue
      enrollStudent(student.id, course.id, {
        studentName: student.name,
        courseCode: course.code,
        courseTitle: course.title,
        program: student.department,
        campus: student.campusId,
        isMandatory: corporateMode ? true : undefined,
        dueDate: corporateMode
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
          : undefined,
        assignedBy: corporateMode ? 'HR' : undefined,
      })
      added += 1
    }

    if (added === 0) {
      notify('All matching students are already enrolled in this course.', 'info')
      return
    }

    notify(
      `Enrolled ${added} student${added === 1 ? '' : 's'} from ${course.department} into ${course.code}.`,
      'success',
    )
  }

  const rows = useMemo(() => {
    return enrollments
      .map((e) => {
        const student = people.find((p) => p.id === e.studentId)
        const course = courses.find((c) => c.id === e.courseId)
        return { enrollment: e, student, course }
      })
      .sort((a, b) => b.enrollment.enrolledOn.localeCompare(a.enrollment.enrolledOn))
  }, [enrollments, people, courses])

  const toggleStatus = (enrollment: CourseEnrollment) => {
    updateEnrollment(enrollment.id, {
      status: enrollment.status === 'active' ? 'withdrawn' : 'active',
    })
    notify(
      enrollment.status === 'active' ? 'Enrollment withdrawn.' : 'Enrollment reactivated.',
      'success',
    )
  }

  const selectedCourse = enrollableCourses.find((c) => c.id === courseId)
  const departmentMatchCount = selectedCourse
    ? students.filter((s) => s.department === selectedCourse.department).length
    : 0

  return (
    <div className="space-y-6">
      <PageHeader title={pageCopy.title} subtitle={pageCopy.subtitle} />

      <GlassCard className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">New {labels.enrollment.toLowerCase()}</h3>
        {students.length === 0 || enrollableCourses.length === 0 ? (
          <p className="text-sm text-slate-500">
            {students.length === 0
              ? `Add ${labels.students.toLowerCase()} under Workforce → ${labels.students} first.`
              : `Create at least one ${labels.course.toLowerCase()} module before assigning training.`}
          </p>
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-3 md:items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-600 mb-1">{labels.student}</label>
                <SelectMenu
                  value={studentId}
                  onChange={setStudentId}
                  placeholder={`Select ${labels.student.toLowerCase()}`}
                  options={students.map((s) => ({
                    value: s.id,
                    label: `${s.name} (${s.email})`,
                    hint: s.department,
                  }))}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-600 mb-1">{labels.course}</label>
                <SelectMenu
                  value={courseId}
                  onChange={setCourseId}
                  placeholder={`Select ${labels.course.toLowerCase()}`}
                  options={enrollableCourses.map((c) => ({
                    value: c.id,
                    label: `${c.code} — ${c.title}`,
                    hint: c.department,
                  }))}
                />
              </div>
              <Button onClick={handleEnroll}>{labels.enrollment === 'Assignment' ? 'Assign' : 'Enroll'}</Button>
            </div>
            {corporateMode ? (
              <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-slate-200/60">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={isMandatory}
                    onChange={(e) => setIsMandatory(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Mandatory training
                </label>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">Due date (optional)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            ) : null}
            {selectedCourse && departmentMatchCount > 0 ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-slate-200/60">
                <p className="text-[12.5px] text-secondary-text flex-1">
                  {departmentMatchCount} {labels.student.toLowerCase()}
                  {departmentMatchCount === 1 ? '' : 's'} in{' '}
                  <strong>{selectedCourse.department}</strong> can be bulk-assigned to this{' '}
                  {labels.course.toLowerCase()}.
                </p>
                <Button variant="secondary" onClick={handleEnrollDepartmentMatches}>
                  Assign department matches
                </Button>
              </div>
            ) : null}
          </>
        )}
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/60">
          <h3 className="text-sm font-semibold text-slate-800">
            All {labels.enrollment.toLowerCase()}s ({rows.length})
          </h3>
        </div>
        {rows.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            No {labels.enrollment.toLowerCase()}s yet. Assign {labels.students.toLowerCase()} to{' '}
            {labels.courses.toLowerCase()} to track progress.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200/60">
                  <th className="px-5 py-3 font-medium">{labels.student}</th>
                  <th className="px-5 py-3 font-medium">{labels.course}</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  {corporateMode ? (
                    <>
                      <th className="px-5 py-3 font-medium">Mandatory</th>
                      <th className="px-5 py-3 font-medium">Due</th>
                    </>
                  ) : null}
                  <th className="px-5 py-3 font-medium">Enrolled</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ enrollment, student, course }) => (
                  <tr key={enrollment.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3">
                      {student?.name ?? enrollment.studentName}
                      {student?.email ? (
                        <div className="text-xs text-slate-500">{student.email}</div>
                      ) : null}
                    </td>
                    <td className="px-5 py-3">
                      {course
                        ? `${course.code} — ${course.title}`
                        : `${enrollment.courseCode} — ${enrollment.courseTitle}`}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill
                        label={
                          enrollment.status === 'active'
                            ? isEnrollmentOverdue(enrollment)
                              ? 'Overdue'
                              : 'Active'
                            : enrollment.status === 'pending'
                              ? 'Pending'
                              : 'Withdrawn'
                        }
                        tone={
                          enrollment.status === 'active'
                            ? isEnrollmentOverdue(enrollment)
                              ? 'danger'
                              : 'success'
                            : enrollment.status === 'pending'
                              ? 'warning'
                              : 'neutral'
                        }
                      />
                    </td>
                    {corporateMode ? (
                      <>
                        <td className="px-5 py-3 text-slate-600">
                          {enrollment.isMandatory !== false ? 'Yes' : 'No'}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {enrollment.dueDate
                            ? new Date(enrollment.dueDate).toLocaleDateString()
                            : '—'}
                        </td>
                      </>
                    ) : null}
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

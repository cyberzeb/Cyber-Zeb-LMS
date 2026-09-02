import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../../../shared/components/PageHeader'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { Button } from '../../../shared/components/Button'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useOrganizationConfig } from '../../../shared/config/useOrganizationConfig'
import { useEnrollments } from '../hooks/useEnrollments'
import { usePeople } from '../hooks/usePeople'
import { useCourses } from '../hooks/useCourses'
import {
  isEnrollableCourse,
  isEnrollableStudent,
  syncCourseEnrollmentCounts,
} from '../utils/enrollmentUtils'
import type { CourseEnrollment } from '../types'

export function EnrollmentsPage() {
  const { notify } = useToast()
  const { terminology: t } = useOrganizationConfig()
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
      notify('Student is already enrolled in this course.', 'error')
      return
    }

    enrollStudent(studentId, courseId, {
      studentName: student.name,
      courseCode: course.code,
      courseTitle: course.title,
      program: student.department,
      campus: student.campusId,
    })
    notify('Student enrolled. They will appear on the instructor roster and student portal.', 'success')
    setStudentId('')
    setCourseId('')
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
      <PageHeader
        title={t.trainingAssignment}
        subtitle={`${t.learners} only appear on ${t.trainer.toLowerCase()} rosters after you enroll them in a ${t.course.toLowerCase()} here. ${t.department} assignment alone does not enroll anyone.`}
      />

      <GlassCard className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">New enrollment</h3>
        {students.length === 0 || enrollableCourses.length === 0 ? (
          <p className="text-sm text-slate-500">
            {students.length === 0
              ? 'Add students under People → Students first.'
              : 'Create at least one course (draft or published) before enrolling students.'}
          </p>
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-3 md:items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-600 mb-1">Student</label>
                <SelectMenu
                  value={studentId}
                  onChange={setStudentId}
                  placeholder="Select student"
                  options={students.map((s) => ({
                    value: s.id,
                    label: `${s.name} (${s.email})`,
                    hint: s.department,
                  }))}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-600 mb-1">Course</label>
                <SelectMenu
                  value={courseId}
                  onChange={setCourseId}
                  placeholder="Select course"
                  options={enrollableCourses.map((c) => ({
                    value: c.id,
                    label: `${c.code} — ${c.title}`,
                    hint: c.department,
                  }))}
                />
              </div>
              <Button onClick={handleEnroll}>Enroll</Button>
            </div>
            {selectedCourse && departmentMatchCount > 0 ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-slate-200/60">
                <p className="text-[12.5px] text-secondary-text flex-1">
                  {departmentMatchCount} student{departmentMatchCount === 1 ? '' : 's'} in{' '}
                  <strong>{selectedCourse.department}</strong> can be bulk-enrolled into this course.
                </p>
                <Button variant="secondary" onClick={handleEnrollDepartmentMatches}>
                  Enroll department matches
                </Button>
              </div>
            ) : null}
          </>
        )}
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/60">
          <h3 className="text-sm font-semibold text-slate-800">
            All enrollments ({rows.length})
          </h3>
        </div>
        {rows.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            No enrollments yet. Enroll students into courses to connect them with instructors.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200/60">
                  <th className="px-5 py-3 font-medium">Student</th>
                  <th className="px-5 py-3 font-medium">Course</th>
                  <th className="px-5 py-3 font-medium">Status</th>
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

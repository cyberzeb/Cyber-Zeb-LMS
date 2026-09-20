import { useMemo } from 'react'
import { BookOpen, GraduationCap, Layers, Users } from 'lucide-react'

import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { getSessionPerson } from '../../../shared/storage/session'
import {
  readAcademicTerms,
  readDepartments,
  readCourseOfferings,
  readCourses,
  readEnrollments,
  readPeople,
  readPrograms,
} from '../../../shared/storage/readers'
import { buildTranscript, readTranscriptSources } from '../../../shared/academics/transcript'
import { formatProgramSlot } from '../../institution/utils/studyYearUtils'

const STAT = 17

/**
 * Department view for staff and heads of department: the programs, sections,
 * instructors and students that belong to their own department.
 */
export function StaffDepartmentPage() {
  const person = getSessionPerson()
  // Staff in an administrative office (e.g. the registrar) have no academic department.
  const academicDepartment = useMemo(() => {
    if (!person) return null
    const departments = readDepartments()
    return (
      departments.find((d) => d.id === person.departmentId) ??
      departments.find((d) => d.name === person.department) ??
      null
    )
  }, [person])
  const department = academicDepartment?.name ?? ''

  const data = useMemo(() => {
    const people = readPeople()
    const terms = readAcademicTerms()
    const currentTerm = terms.find((t) => t.isCurrent)
    const offerings = readCourseOfferings().filter((o) => o.departmentName === department)
    const courses = readCourses().filter((c) => c.department === department)
    const students = people.filter((p) => p.role === 'Student' && p.department === department)
    const instructors = people.filter((p) => p.role === 'Instructor' && p.department === department)
    const programs = readPrograms().filter((p) => p.department === department)
    const enrollments = readEnrollments()

    const sources = readTranscriptSources()
    const gpas = students
      .map((student) => buildTranscript(student, sources).cumulativeGpa)
      .filter((gpa): gpa is number => gpa !== null)

    return {
      terms,
      currentTerm,
      programs,
      courses,
      instructors,
      students,
      offerings: offerings.map((offering) => ({
        ...offering,
        enrolled: enrollments.filter((e) => e.courseOfferingId === offering.id && e.status === 'active')
          .length,
        termName: terms.find((t) => t.id === offering.academicTermId)?.name ?? 'No term set',
      })),
      averageGpa: gpas.length ? (gpas.reduce((sum, g) => sum + g, 0) / gpas.length).toFixed(2) : '—',
      atRisk: gpas.filter((gpa) => gpa < 2).length,
    }
  }, [department])

  if (!person) return null

  if (!academicDepartment) {
    return (
      <div className="flex flex-col gap-6 md:gap-8">
        <PageHeader
          title="My Department"
          subtitle={`${person.department} is an administrative office, not an academic department.`}
        />
        <GlassCard className="p-6 text-[13px] text-secondary-text">
          This page shows programs, sections and students for an academic department. Your account is
          attached to <span className="font-semibold text-navy-900">{person.department}</span>, so there
          is nothing to show here. Ask an administrator to attach your account to a department if you
          need this view.
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title={`${department} Department`}
        subtitle={`${person.isDepartmentHead ? 'Head of department' : 'Department staff'} · ${
          data.currentTerm ? `current term: ${data.currentTerm.name}` : 'no current academic term set'
        }`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatBlock label="Programs" value={data.programs.length} icon={<GraduationCap size={STAT} />} />
        <StatBlock label="Courses" value={data.courses.length} icon={<BookOpen size={STAT} />} />
        <StatBlock label="Sections" value={data.offerings.length} icon={<Layers size={STAT} />} />
        <StatBlock label="Students" value={data.students.length} icon={<Users size={STAT} />} />
        <StatBlock label="Average GPA" value={data.averageGpa} sub={`${data.atRisk} below 2.00`} />
      </div>

      <GlassCard className="overflow-hidden">
        <div className="px-5 py-3.5 border-b border-divider">
          <h3 className="text-[14px] font-extrabold text-navy-900">Course sections</h3>
          <p className="text-[12px] text-secondary-text">
            Sections offered by this department, with the assigned instructor.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-[11px] uppercase tracking-wide text-secondary-text bg-navy-50/60 dark:bg-white/5">
              <tr>
                <th className="px-5 py-3 font-medium">Section</th>
                <th className="px-5 py-3 font-medium">Curriculum slot</th>
                <th className="px-5 py-3 font-medium">Term</th>
                <th className="px-5 py-3 font-medium">Instructor</th>
                <th className="px-5 py-3 font-medium">Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {data.offerings.map((offering) => (
                <tr key={offering.id} className="border-b border-divider last:border-0">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-navy-900">
                      {offering.courseCode} §{offering.sectionCode}
                    </div>
                    <div className="text-[12px] text-secondary-text">{offering.courseTitle}</div>
                  </td>
                  <td className="px-5 py-3 text-secondary-text">
                    {formatProgramSlot(offering.studyYear, offering.programSemester ?? 1)}
                  </td>
                  <td className="px-5 py-3 text-secondary-text">{offering.termName}</td>
                  <td className="px-5 py-3">
                    {offering.primaryInstructorName ? (
                      <span className="text-navy-900">{offering.primaryInstructorName}</span>
                    ) : (
                      <StatusPill label="Unassigned" tone="warning" />
                    )}
                  </td>
                  <td className="px-5 py-3 text-navy-900">
                    {offering.enrolled}
                    {offering.maxEnrollment ? ` / ${offering.maxEnrollment}` : ''}
                  </td>
                </tr>
              ))}
              {data.offerings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-secondary-text">
                    This department has no course sections yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="px-5 py-3.5 border-b border-divider">
          <h3 className="text-[14px] font-extrabold text-navy-900">Instructors</h3>
        </div>
        <div className="divide-y divide-divider">
          {data.instructors.map((instructor) => (
            <div key={instructor.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-[13.5px] font-semibold text-navy-900">{instructor.name}</div>
                <div className="text-[12px] text-secondary-text">{instructor.email}</div>
              </div>
              <div className="text-[12px] text-secondary-text">
                {data.offerings.filter((o) => o.primaryInstructorId === instructor.id).length} section(s)
              </div>
            </div>
          ))}
          {data.instructors.length === 0 && (
            <p className="p-6 text-center text-[13px] text-secondary-text">
              No instructors are assigned to this department yet.
            </p>
          )}
        </div>
      </GlassCard>
    </div>
  )
}

import { useMemo } from 'react'
import type { PersonRole, PersonRow, CourseRecord } from '../../modules/institution/types'
import type { PeoplePageConfig, PeoplePageFocus } from '../../modules/institution/data/peoplePageConfig'
import { peoplePageConfigs } from '../../modules/institution/data/peoplePageConfig'
import { isCorporateEdition } from './edition'
import { MailPlus, Presentation, Shield, Users, Briefcase } from 'lucide-react'

const STAT = 17

function countByStatus(people: PersonRow[], status: PersonRow['status']) {
  return people.filter((p) => p.status === status).length
}

function filterRole(people: PersonRow[], role: PersonRole) {
  return people.filter((p) => p.role === role)
}

const corporatePeopleOverrides: Partial<Record<PeoplePageFocus, Partial<PeoplePageConfig>>> = {
  Student: {
    title: 'Employees',
    subtitle:
      'Manage employee accounts, department and team placement, and portal access.',
    inviteLabel: 'Add Employee',
    inviteTitle: 'Add Employee',
    inviteDescription:
      'Send an invitation. The employee account stays pending until they activate their profile.',
    searchPlaceholder: 'Search employees by name, email or department...',
    emptyMessage: 'No employees match your search.',
    getStats: (people) => {
      const employees = filterRole(people, 'Student')
      return [
        { label: 'Total Employees', value: employees.length, icon: <Users size={STAT} /> },
        { label: 'Active', value: countByStatus(employees, 'active'), icon: <Users size={STAT} /> },
        {
          label: 'Pending Activation',
          value: countByStatus(employees, 'invited'),
          sub: 'Awaiting activation',
          icon: <MailPlus size={STAT} />,
        },
        {
          label: 'Suspended',
          value: countByStatus(employees, 'suspended'),
          icon: <Shield size={STAT} />,
        },
      ]
    },
  },
  Instructor: {
    title: 'Trainers',
    subtitle:
      'People who deliver training. Assign one or many training modules per trainer.',
    inviteLabel: 'Add Trainer',
    inviteTitle: 'Add Trainer',
    inviteDescription:
      'Create a trainer account and assign the training modules they will deliver.',
    searchPlaceholder: 'Search trainers by name, email or training module...',
    emptyMessage: 'No trainers match your search.',
    getStats: (people, courses: CourseRecord[] = []) => {
      const trainers = filterRole(people, 'Instructor')
      const staffed = courses.filter(
        (c) => c.instructorId || (c.instructor && c.instructor !== 'Unassigned'),
      ).length
      return [
        { label: 'Total Trainers', value: trainers.length, icon: <Presentation size={STAT} /> },
        { label: 'Active', value: countByStatus(trainers, 'active'), icon: <Users size={STAT} /> },
        {
          label: 'Pending Invites',
          value: countByStatus(trainers, 'invited'),
          sub: 'Not yet activated',
          icon: <MailPlus size={STAT} />,
        },
        {
          label: 'Training Modules Staffed',
          value: staffed,
          sub: 'With an assigned trainer',
          icon: <Briefcase size={STAT} />,
        },
      ]
    },
  },
  Admin: {
    title: 'Administrators',
    subtitle:
      'Control organization admin accounts, permissions and platform configuration access.',
    inviteDescription:
      'Grant administrative access to organization settings. Admins can manage employees, reports and integrations.',
    searchPlaceholder: 'Search administrators by name, email or department...',
  },
}

export function getPeoplePageConfigForEdition(focus: PeoplePageFocus): PeoplePageConfig {
  const base = peoplePageConfigs[focus]
  if (!isCorporateEdition()) return base
  const override = corporatePeopleOverrides[focus]
  if (!override) return base
  return { ...base, ...override }
}

export function usePeoplePageConfigForEdition(focus: PeoplePageFocus): PeoplePageConfig {
  return useMemo(() => getPeoplePageConfigForEdition(focus), [focus])
}

export function useHideCampusFiltersInEdition(): boolean {
  return isCorporateEdition()
}

export function useCorporateFieldLabels() {
  return useMemo(() => {
    if (!isCorporateEdition()) {
      return {
        student: 'Student',
        students: 'Students',
        course: 'Course',
        courses: 'Courses',
        enrollment: 'Enrollment',
        instructor: 'Instructor',
        campus: 'Campus',
        program: 'Program',
      }
    }
    return {
      student: 'Employee',
      students: 'Employees',
      course: 'Training',
      courses: 'Training modules',
      enrollment: 'Assignment',
      instructor: 'Trainer',
      campus: 'Location',
      program: 'Job role',
    }
  }, [])
}

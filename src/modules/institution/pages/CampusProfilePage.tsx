import { InstitutionHero } from '../components/InstitutionHero'
import { DepartmentGrid } from '../components/DepartmentGrid'
import { ProgramList } from '../components/ProgramList'
import { LeadershipList } from '../components/LeadershipList'
import { AcademicCalendarWidget } from '../components/AcademicCalendarWidget'
import type {
  InstitutionEntity,
  Department,
  Program,
  Leader,
  CalendarEvent,
} from '../types'

const mockCampus: InstitutionEntity = {
  id: '1',
  name: 'Main Campus — Addis Ababa',
  subtitle: 'College of Computing, Business & Sciences · Established 2011',
  status: 'active',
  departmentsCount: 6,
  programsCount: 18,
  studentsCount: 2066,
  facultyCount: 142,
  completionRate: 94,
}

const mockDepartments: Department[] = [
  {
    id: 'd1',
    name: 'Computer Science & IT',
    headName: 'Dr. Aaron Selassie',
    studentsCount: 840,
    facultyCount: 42,
    icon: '💻',
  },
  {
    id: 'd2',
    name: 'Business Administration',
    headName: 'Dr. Martha Bekele',
    studentsCount: 620,
    facultyCount: 35,
    icon: '📊',
  },
  {
    id: 'd3',
    name: 'Engineering & Technology',
    headName: 'Prof. Elias Hailu',
    studentsCount: 410,
    facultyCount: 38,
    icon: '⚙️',
  },
  {
    id: 'd4',
    name: 'Social Sciences',
    headName: 'Dr. Tigist Assefa',
    studentsCount: 196,
    facultyCount: 27,
    icon: '🌍',
  },
]

const mockPrograms: Program[] = [
  {
    id: 'p1',
    level: 'BSc',
    name: 'Software Engineering',
    subtitle: 'Undergraduate Program · 4 Years',
    enrolledCount: 350,
  },
  {
    id: 'p2',
    level: 'MSc',
    name: 'Data Science & AI',
    subtitle: 'Postgraduate Program · 2 Years',
    enrolledCount: 85,
  },
  {
    id: 'p3',
    level: 'BA',
    name: 'International Business',
    subtitle: 'Undergraduate Program · 3 Years',
    enrolledCount: 240,
  },
  {
    id: 'p4',
    level: 'PhD',
    name: 'Computer Science',
    subtitle: 'Doctoral Program · 3-5 Years',
    enrolledCount: 15,
  },
]

const mockLeaders: Leader[] = [
  {
    id: 'l1',
    name: 'Dr. Aaron Selassie',
    role: 'Dean of Computing & IT',
    initials: 'AS',
  },
  {
    id: 'l2',
    name: 'Prof. Elias Hailu',
    role: 'Vice President of Academic Affairs',
    initials: 'EH',
  },
  {
    id: 'l3',
    name: 'Wzro. Kidist Yohannes',
    role: 'Registrar Director',
    initials: 'KY',
  },
]

const mockEvents: CalendarEvent[] = [
  {
    id: 'e1',
    day: '12',
    month: 'AUG',
    title: 'Fall Semester Registration',
    subtitle: 'Undergraduate & Postgraduate cohorts',
  },
  {
    id: 'e2',
    day: '05',
    month: 'SEP',
    title: 'Orientation & Induction Day',
    subtitle: 'Freshman and transfer student meetups',
  },
  {
    id: 'e3',
    day: '18',
    month: 'OCT',
    title: 'Mid-term Assessment Week',
    subtitle: 'Continuous assessment tests (CAT)',
  },
]

export function CampusProfilePage() {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <InstitutionHero
        entity={mockCampus}
        onEdit={() => console.log('Edit Campus')}
        onAddProgram={() => console.log('Add Program')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        {/* Left Column: Departments & Programs */}
        <div className="lg:col-span-2 flex flex-col gap-6 md:gap-8">
          <DepartmentGrid
            departments={mockDepartments}
            onAddDepartment={() => console.log('Add Department')}
          />
          <ProgramList
            programs={mockPrograms}
            onViewAll={() => console.log('View all programs')}
          />
        </div>

        {/* Right Column: Leadership & Academic Calendar */}
        <div className="flex flex-col gap-6 md:gap-8">
          <LeadershipList leaders={mockLeaders} />
          <AcademicCalendarWidget
            events={mockEvents}
            onViewFullCalendar={() => console.log('View full calendar')}
          />
        </div>
      </div>
    </div>
  )
}

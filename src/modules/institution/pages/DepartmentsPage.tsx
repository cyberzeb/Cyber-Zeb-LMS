import { useMemo, useState } from 'react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { DepartmentCard } from '../components/DepartmentCard'
import type { Department } from '../types'

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
  {
    id: 'd5',
    name: 'Health & Life Sciences',
    headName: 'Dr. Meron Tesfaye',
    studentsCount: 312,
    facultyCount: 29,
    icon: '🧬',
  },
  {
    id: 'd6',
    name: 'Arts & Humanities',
    headName: 'Wzro. Sara Girma',
    studentsCount: 148,
    facultyCount: 21,
    icon: '🎨',
  },
]

export function DepartmentsPage() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q === '') return mockDepartments
    return mockDepartments.filter(
      (d) => d.name.toLowerCase().includes(q) || d.headName.toLowerCase().includes(q),
    )
  }, [query])

  const totals = useMemo(() => {
    const students = mockDepartments.reduce((sum, d) => sum + d.studentsCount, 0)
    const faculty = mockDepartments.reduce((sum, d) => sum + d.facultyCount, 0)
    return { total: mockDepartments.length, students, faculty }
  }, [])

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Departments"
        subtitle="Organize faculties, schools and departments and assign their academic leadership."
        actions={
          <>
            <Button variant="secondary">Manage Heads</Button>
            <Button variant="primary">+ Add Department</Button>
          </>
        }
      />

      <GlassCard className="grid grid-cols-3 divide-x divide-divider/40">
        <StatBlock label="Departments" value={totals.total} icon="🏛️" />
        <StatBlock
          label="Total Students"
          value={totals.students.toLocaleString()}
          icon="👥"
          iconBg="bg-info-bg"
        />
        <StatBlock label="Faculty & Staff" value={totals.faculty} icon="🧑‍🏫" />
      </GlassCard>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h2 className="text-[15px] font-extrabold text-navy-900">All Departments</h2>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search departments or heads..."
          className="md:w-80"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
          {filtered.map((dept) => (
            <DepartmentCard
              key={dept.id}
              name={dept.name}
              headName={dept.headName}
              studentsCount={dept.studentsCount}
              facultyCount={dept.facultyCount}
              icon={dept.icon}
            />
          ))}
        </div>
      ) : (
        <GlassCard className="p-10 text-center text-secondary-text text-[13.5px] font-medium">
          No departments match your search.
        </GlassCard>
      )}
    </div>
  )
}

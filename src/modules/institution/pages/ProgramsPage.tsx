import { useMemo, useState } from 'react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { SearchInput } from '../../../shared/components/SearchInput'
import { ProgramsTable } from '../components/ProgramsTable'
import type { ProgramRow } from '../types'

const mockPrograms: ProgramRow[] = [
  {
    id: 'p1',
    code: 'BSC-SE',
    name: 'Software Engineering',
    level: 'Undergraduate',
    department: 'Computer Science & IT',
    duration: '4 Years',
    enrolledCount: 350,
    courseCount: 42,
    status: 'active',
  },
  {
    id: 'p2',
    code: 'MSC-DS',
    name: 'Data Science & AI',
    level: 'Postgraduate',
    department: 'Computer Science & IT',
    duration: '2 Years',
    enrolledCount: 85,
    courseCount: 18,
    status: 'active',
  },
  {
    id: 'p3',
    code: 'BA-IB',
    name: 'International Business',
    level: 'Undergraduate',
    department: 'Business Administration',
    duration: '3 Years',
    enrolledCount: 240,
    courseCount: 30,
    status: 'active',
  },
  {
    id: 'p4',
    code: 'PHD-CS',
    name: 'Computer Science',
    level: 'Doctoral',
    department: 'Computer Science & IT',
    duration: '3–5 Years',
    enrolledCount: 15,
    courseCount: 8,
    status: 'active',
  },
  {
    id: 'p5',
    code: 'BSC-CE',
    name: 'Civil Engineering',
    level: 'Undergraduate',
    department: 'Engineering & Technology',
    duration: '5 Years',
    enrolledCount: 180,
    courseCount: 46,
    status: 'active',
  },
  {
    id: 'p6',
    code: 'CERT-CYB',
    name: 'Cybersecurity Essentials',
    level: 'Certificate',
    department: 'Computer Science & IT',
    duration: '6 Months',
    enrolledCount: 128,
    courseCount: 6,
    status: 'active',
  },
  {
    id: 'p7',
    code: 'MBA',
    name: 'Master of Business Administration',
    level: 'Postgraduate',
    department: 'Business Administration',
    duration: '2 Years',
    enrolledCount: 62,
    courseCount: 16,
    status: 'draft',
  },
  {
    id: 'p8',
    code: 'CERT-DM',
    name: 'Digital Marketing',
    level: 'Certificate',
    department: 'Business Administration',
    duration: '4 Months',
    enrolledCount: 0,
    courseCount: 5,
    status: 'draft',
  },
  {
    id: 'p9',
    code: 'BA-SOC',
    name: 'Sociology',
    level: 'Undergraduate',
    department: 'Social Sciences',
    duration: '3 Years',
    enrolledCount: 96,
    courseCount: 24,
    status: 'archived',
  },
]

const tabs = ['All', 'Undergraduate', 'Postgraduate', 'Doctoral', 'Certificate']

export function ProgramsPage() {
  const [activeTab, setActiveTab] = useState('All')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    return mockPrograms.filter((p) => {
      const matchesTab = activeTab === 'All' || p.level === activeTab
      const matchesQuery =
        query.trim() === '' ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.code.toLowerCase().includes(query.toLowerCase()) ||
        p.department.toLowerCase().includes(query.toLowerCase())
      return matchesTab && matchesQuery
    })
  }, [activeTab, query])

  const totals = useMemo(() => {
    const active = mockPrograms.filter((p) => p.status === 'active').length
    const enrolled = mockPrograms.reduce((sum, p) => sum + p.enrolledCount, 0)
    const courses = mockPrograms.reduce((sum, p) => sum + p.courseCount, 0)
    return { total: mockPrograms.length, active, enrolled, courses }
  }, [])

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Academic Programs"
        subtitle="Manage degree programs, certificates and their curricula across all departments."
        actions={
          <>
            <Button variant="secondary">Import Programs</Button>
            <Button variant="primary">+ Add Program</Button>
          </>
        }
      />

      <GlassCard className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-divider/40">
        <StatBlock label="Total Programs" value={totals.total} icon="🎓" />
        <StatBlock label="Active" value={totals.active} sub="Currently enrolling" icon="✅" />
        <StatBlock
          label="Students Enrolled"
          value={totals.enrolled.toLocaleString()}
          icon="👥"
          iconBg="bg-info-bg"
        />
        <StatBlock label="Linked Courses" value={totals.courses} icon="📚" iconBg="bg-warning-bg" />
      </GlassCard>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search programs, codes, departments..."
          className="md:w-80"
        />
      </div>

      {filtered.length > 0 ? (
        <ProgramsTable programs={filtered} onManage={(p) => console.log('Manage program', p.id)} />
      ) : (
        <GlassCard className="p-10 text-center text-secondary-text text-[13.5px] font-medium">
          No programs match your filters.
        </GlassCard>
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { SearchInput } from '../../../shared/components/SearchInput'
import { Modal } from '../../../shared/components/Modal'
import { FormField } from '../../../shared/components/FormField'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useLocalStorageState, createId } from '../../../shared/hooks/useLocalStorageState'
import { CourseCard } from '../components/CourseCard'
import type { CourseSummary } from '../types'

const seedCourses: CourseSummary[] = [
  {
    id: 'c1',
    code: 'CS-201',
    title: 'Data Structures & Algorithms',
    instructor: 'Dr. Aaron Selassie',
    department: 'Computer Science & IT',
    level: 'Undergraduate',
    enrolledCount: 312,
    moduleCount: 12,
    status: 'published',
    progressPercent: 100,
    icon: '🧮',
  },
  {
    id: 'c2',
    code: 'CS-340',
    title: 'Machine Learning Foundations',
    instructor: 'Prof. Elias Hailu',
    department: 'Computer Science & IT',
    level: 'Postgraduate',
    enrolledCount: 148,
    moduleCount: 10,
    status: 'published',
    progressPercent: 100,
    icon: '🤖',
  },
  {
    id: 'c3',
    code: 'BUS-110',
    title: 'Principles of Management',
    instructor: 'Dr. Martha Bekele',
    department: 'Business Administration',
    level: 'Undergraduate',
    enrolledCount: 220,
    moduleCount: 8,
    status: 'published',
    progressPercent: 100,
    icon: '📈',
  },
  {
    id: 'c4',
    code: 'CYB-501',
    title: 'Network Security & Defense',
    instructor: 'Wzro. Kidist Yohannes',
    department: 'Computer Science & IT',
    level: 'Certificate',
    enrolledCount: 96,
    moduleCount: 6,
    status: 'published',
    progressPercent: 100,
    icon: '🛡️',
  },
  {
    id: 'c5',
    code: 'ENG-220',
    title: 'Structural Analysis',
    instructor: 'Prof. Elias Hailu',
    department: 'Engineering & Technology',
    level: 'Undergraduate',
    enrolledCount: 84,
    moduleCount: 14,
    status: 'draft',
    progressPercent: 65,
    icon: '🏗️',
  },
  {
    id: 'c6',
    code: 'DS-410',
    title: 'Deep Learning with Python',
    instructor: 'Dr. Aaron Selassie',
    department: 'Computer Science & IT',
    level: 'Postgraduate',
    enrolledCount: 0,
    moduleCount: 9,
    status: 'draft',
    progressPercent: 40,
    icon: '🧠',
  },
  {
    id: 'c7',
    code: 'MKT-115',
    title: 'Digital Marketing Strategy',
    instructor: 'Dr. Martha Bekele',
    department: 'Business Administration',
    level: 'Certificate',
    enrolledCount: 0,
    moduleCount: 5,
    status: 'draft',
    progressPercent: 20,
    icon: '📣',
  },
  {
    id: 'c8',
    code: 'SOC-101',
    title: 'Introduction to Sociology',
    instructor: 'Dr. Tigist Assefa',
    department: 'Social Sciences',
    level: 'Undergraduate',
    enrolledCount: 60,
    moduleCount: 10,
    status: 'archived',
    progressPercent: 100,
    icon: '🌍',
  },
]

const tabs = ['All', 'Published', 'Draft', 'Archived']
const departmentOptions = [
  'Computer Science & IT',
  'Business Administration',
  'Engineering & Technology',
  'Social Sciences',
  'Health & Life Sciences',
  'Arts & Humanities',
]
const levelOptions = ['Undergraduate', 'Postgraduate', 'Doctoral', 'Certificate']
const iconOptions = ['📘', '🧮', '🤖', '📈', '🛡️', '🏗️', '🧠', '🌍', '🔬', '💡']

const emptyForm = {
  title: '',
  code: '',
  instructor: '',
  department: departmentOptions[0],
  level: levelOptions[0],
  icon: iconOptions[0],
}

export function CoursesPage() {
  const { notify } = useToast()
  const [courses, setCourses] = useLocalStorageState<CourseSummary[]>(
    'berana:courses',
    seedCourses,
  )
  const [activeTab, setActiveTab] = useState('All')
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchesTab = activeTab === 'All' || c.status === activeTab.toLowerCase()
      const q = query.trim().toLowerCase()
      const matchesQuery =
        q === '' ||
        c.title.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q)
      return matchesTab && matchesQuery
    })
  }, [courses, activeTab, query])

  const totals = useMemo(() => {
    const published = courses.filter((c) => c.status === 'published').length
    const drafts = courses.filter((c) => c.status === 'draft').length
    const enrolled = courses.reduce((sum, c) => sum + c.enrolledCount, 0)
    return { total: courses.length, published, drafts, enrolled }
  }, [courses])

  const openModal = () => {
    setForm(emptyForm)
    setModalOpen(true)
  }

  const handleCreate = () => {
    if (!form.title.trim() || !form.code.trim()) {
      notify('Please provide a course title and code.', 'error')
      return
    }
    const newCourse: CourseSummary = {
      id: createId('course'),
      title: form.title.trim(),
      code: form.code.trim().toUpperCase(),
      instructor: form.instructor.trim() || 'Unassigned',
      department: form.department,
      level: form.level,
      icon: form.icon,
      enrolledCount: 0,
      moduleCount: 0,
      status: 'draft',
      progressPercent: 0,
    }
    setCourses((prev) => [newCourse, ...prev])
    setModalOpen(false)
    notify(`Course “${newCourse.title}” created as a draft.`)
  }

  const handleDelete = (course: CourseSummary) => {
    setCourses((prev) => prev.filter((c) => c.id !== course.id))
    notify(`Course “${course.title}” deleted.`, 'info')
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Course Catalog"
        subtitle="Author, publish and monitor the courses delivered across your institution."
        actions={
          <>
            <Button variant="secondary" onClick={() => notify('Course templates library is coming soon.', 'info')}>
              Course Templates
            </Button>
            <Button variant="primary" onClick={openModal}>
              + Create Course
            </Button>
          </>
        }
      />

      <GlassCard className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-divider/40">
        <StatBlock label="Total Courses" value={totals.total} icon="📚" />
        <StatBlock label="Published" value={totals.published} sub="Live for learners" icon="✅" />
        <StatBlock label="In Draft" value={totals.drafts} icon="📝" iconBg="bg-warning-bg" />
        <StatBlock
          label="Total Enrollments"
          value={totals.enrolled.toLocaleString()}
          icon="👥"
          iconBg="bg-info-bg"
        />
      </GlassCard>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search courses, codes, instructors..."
          className="md:w-80"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onOpen={(c) => notify(`Opening “${c.title}” — the authoring view is next up.`, 'info')}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <GlassCard className="p-10 text-center text-secondary-text text-[13.5px] font-medium">
          No courses match your filters.
        </GlassCard>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        icon="📚"
        title="Create Course"
        description="Set up a new course. It will be saved as a draft."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Create Course
            </Button>
          </>
        }
      >
        <FormField
          label="Course Title"
          value={form.title}
          onChange={(v) => setForm({ ...form, title: v })}
          placeholder="e.g. Data Structures & Algorithms"
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Course Code"
            value={form.code}
            onChange={(v) => setForm({ ...form, code: v })}
            placeholder="e.g. CS-201"
          />
          <FormField
            label="Instructor"
            value={form.instructor}
            onChange={(v) => setForm({ ...form, instructor: v })}
            placeholder="e.g. Dr. Aaron Selassie"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Department"
            type="select"
            value={form.department}
            options={departmentOptions}
            onChange={(v) => setForm({ ...form, department: v })}
          />
          <FormField
            label="Level"
            type="select"
            value={form.level}
            options={levelOptions}
            onChange={(v) => setForm({ ...form, level: v })}
          />
        </div>
        <FormField
          label="Icon"
          type="select"
          value={form.icon}
          options={iconOptions}
          onChange={(v) => setForm({ ...form, icon: v })}
        />
      </Modal>
    </div>
  )
}

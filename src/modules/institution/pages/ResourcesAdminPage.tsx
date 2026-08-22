import { useMemo, useState, type ReactNode } from 'react'
import { BookOpen, ExternalLink, FileDown, FileText, Layers3, Library, PlayCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useCourses } from '../hooks/useCourses'
import { toAdminLibraryResources } from '../../../shared/storage/resourceUtils'
import type { ResourceKind } from '../../students/types'

const kindFilters: Array<'All' | ResourceKind> = ['All', 'Syllabus', 'Lecture Notes', 'Reading', 'Video']

const kindIcons: Record<ResourceKind, ReactNode> = {
  Syllabus: <BookOpen size={16} />,
  'Lecture Notes': <FileText size={16} />,
  Reading: <Layers3 size={16} />,
  Video: <PlayCircle size={16} />,
}

export function ResourcesAdminPage() {
  const { courses } = useCourses()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [kindFilter, setKindFilter] = useState<'All' | ResourceKind>('All')
  const [courseFilter, setCourseFilter] = useState('all')

  const allResources = useMemo(() => toAdminLibraryResources(courses), [courses])

  const courseOptions = useMemo(
    () => [
      { value: 'all', label: 'All courses' },
      ...courses.map((c) => ({ value: c.id, label: `${c.code} — ${c.title}` })),
    ],
    [courses],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allResources.filter((resource) => {
      const matchesKind = kindFilter === 'All' || resource.kind === kindFilter
      const matchesCourse = courseFilter === 'all' || resource.courseId === courseFilter
      const matchesQuery =
        q === '' ||
        resource.title.toLowerCase().includes(q) ||
        resource.courseCode.toLowerCase().includes(q) ||
        resource.courseTitle.toLowerCase().includes(q) ||
        resource.instructor.toLowerCase().includes(q)
      return matchesKind && matchesCourse && matchesQuery
    })
  }, [allResources, kindFilter, courseFilter, query])

  const stats = useMemo(
    () => ({
      total: allResources.length,
      courses: new Set(allResources.map((r) => r.courseId)).size,
      syllabus: allResources.filter((r) => r.kind === 'Syllabus').length,
      video: allResources.filter((r) => r.kind === 'Video').length,
    }),
    [allResources],
  )

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Library & Resources"
        subtitle="Browse downloadable materials across all courses. Manage attachments from the course catalog."
        actions={
          <Button variant="primary" onClick={() => navigate('/admin/courses')}>
            <BookOpen size={15} />
            Course Catalog
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatBlock
          label="Total resources"
          value={stats.total}
          sub="Files & links"
          icon={<Library size={17} />}
          iconBg="bg-navy-50 text-navy-600"
        />
        <StatBlock
          label="Courses with files"
          value={stats.courses}
          sub="In the library"
          icon={<BookOpen size={17} />}
          iconBg="bg-navy-900 text-white"
        />
        <StatBlock
          label="Syllabi"
          value={stats.syllabus}
          sub="Course outlines"
          icon={<FileText size={17} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Videos"
          value={stats.video}
          sub="Recorded content"
          icon={<PlayCircle size={17} />}
          iconBg="bg-success-bg text-success"
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by title, course, or instructor…"
            className="flex-1"
          />
          <SelectMenu
            value={courseFilter}
            onChange={setCourseFilter}
            options={courseOptions}
            className="w-full lg:w-64"
          />
        </div>

        <FilterTabs
          tabs={kindFilters}
          active={kindFilter}
          onChange={(tab) => setKindFilter(tab as 'All' | ResourceKind)}
        />
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <Library size={32} className="mx-auto text-navy-300 mb-3" />
          <p className="text-[14px] font-semibold text-navy-900">
            {allResources.length === 0 ? 'No resources in the library yet' : 'No resources match your filters'}
          </p>
          <p className="text-[12.5px] text-secondary-text mt-1">
            Add materials in the course catalog under Media & Resources.
          </p>
          <Button variant="primary" className="mt-4" onClick={() => navigate('/admin/courses')}>
            Go to Course Catalog
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((resource) => (
            <GlassCard
              key={resource.id}
              className="p-0 overflow-hidden hover:shadow-md transition-shadow border-l-4 border-l-lemon-500"
            >
              <div className="p-5 flex gap-4">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-navy-900 text-white flex items-center justify-center">
                  {kindIcons[resource.kind]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill label={resource.kind} tone="info" />
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text">
                      {resource.courseCode}
                    </span>
                    <StatusPill
                      label={resource.courseStatus}
                      tone={resource.courseStatus === 'published' ? 'success' : 'neutral'}
                    />
                  </div>
                  <h3 className="mt-1.5 text-[15px] font-bold text-navy-900 leading-snug">{resource.title}</h3>
                  <p className="mt-1 text-[12px] text-secondary-text">
                    {resource.courseTitle} · {resource.instructor}
                  </p>
                  <p className="mt-1 text-[12px] text-secondary-text">
                    {resource.size} · {resource.updatedAt}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {resource.url && resource.url !== '#' ? (
                      <a href={resource.url} target="_blank" rel="noreferrer">
                        <Button variant="primary" size="sm">
                          <FileDown size={13} />
                          Open
                        </Button>
                      </a>
                    ) : (
                      <Button variant="secondary" size="sm" disabled>
                        <FileDown size={13} />
                        No file URL
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => navigate('/admin/courses')}>
                      <ExternalLink size={13} />
                      Edit in catalog
                    </Button>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}

export default ResourcesAdminPage

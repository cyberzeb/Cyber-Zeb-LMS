import { useMemo } from 'react'
import { BookOpen, FileDown, FileText, PlayCircle, Search } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { ResourceLibraryCard } from '../components/ResourceLibraryCard'
import { StudentPageError, StudentPageLoading } from '../components/StudentPageStates'
import { useStudentDashboard } from '../hooks/useStudentDashboard'

export function StudentResourcesPage() {
  const { data, isLoading, isError } = useStudentDashboard()

  const stats = useMemo(() => {
    if (!data) return { total: 0, syllabus: 0, notes: 0, video: 0 }
    return {
      total: data.resources.length,
      syllabus: data.resources.filter((r) => r.kind === 'Syllabus').length,
      notes: data.resources.filter((r) => r.kind === 'Lecture Notes').length,
      video: data.resources.filter((r) => r.kind === 'Video').length,
    }
  }, [data])

  if (isLoading) return <StudentPageLoading />
  if (isError || !data) return <StudentPageError message="Failed to load resources." />

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Library"
        subtitle="Syllabi, lecture notes, readings, and videos for your enrolled modules."
        actions={
          <>
            <Button variant="secondary">
              <Search size={15} />
              Search
            </Button>
            <Button variant="primary">
              <FileDown size={15} />
              Download all
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatBlock
          label="Total files"
          value={stats.total}
          sub="Available to download"
          icon={<BookOpen size={17} />}
          iconBg="bg-navy-50 text-navy-600"
        />
        <StatBlock
          label="Syllabi"
          value={stats.syllabus}
          sub="Course outlines"
          icon={<BookOpen size={17} />}
          iconBg="bg-navy-900 text-white"
        />
        <StatBlock
          label="Lecture notes"
          value={stats.notes}
          sub="Slides & handouts"
          icon={<FileText size={17} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Videos"
          value={stats.video}
          sub="Recorded sessions"
          icon={<PlayCircle size={17} />}
          iconBg="bg-success-bg text-success"
        />
      </div>

      <ResourceLibraryCard resources={data.resources} />
    </div>
  )
}

export default StudentResourcesPage

import { useMemo, useState } from 'react'
import { Clock, FileText, MessageSquareText, UploadCloud } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { AssignmentDropboxCard } from '../components/AssessmentCards'
import { StudentPageError, StudentPageLoading } from '../components/StudentPageStates'
import { useStudentDashboard } from '../hooks/useStudentDashboard'

const tabs = ['All', 'Ready to submit', 'Submitted', 'Awaiting review']

export function StudentAssignmentsPage() {
  const { data, isLoading, isError } = useStudentDashboard()
  const [activeTab, setActiveTab] = useState('All')

  const stats = useMemo(() => {
    if (!data) return { ready: 0, submitted: 0, review: 0 }
    return {
      ready: data.assignments.filter((a) => a.status === 'Ready to submit').length,
      submitted: data.assignments.filter((a) => a.status === 'Submitted').length,
      review: data.assignments.filter((a) => a.status === 'Awaiting review').length,
    }
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return []
    if (activeTab === 'All') return data.assignments
    return data.assignments.filter((a) => a.status === activeTab)
  }, [data, activeTab])

  if (isLoading) return <StudentPageLoading />
  if (isError || !data) return <StudentPageError message="Failed to load assignments." />

  const nextDue = data.assignments.find((a) => a.status === 'Ready to submit')

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Assignment Dropboxes"
        subtitle="Upload coursework, track submissions, and read instructor feedback."
        actions={
          <Button variant="primary">
            <UploadCloud size={15} />
            {nextDue ? `Upload: ${nextDue.title.split(' ').slice(0, 2).join(' ')}…` : 'Upload assignment'}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBlock
          label="Due soon"
          value={stats.ready}
          sub="Waiting for your upload"
          icon={<Clock size={17} />}
          iconBg="bg-lemon-100 text-lemon-800"
        />
        <StatBlock
          label="Submitted"
          value={stats.submitted}
          sub="In instructor queue"
          icon={<UploadCloud size={17} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Under review"
          value={stats.review}
          sub="Feedback may be ready"
          icon={<MessageSquareText size={17} />}
          iconBg="bg-warning-bg text-warning"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <span className="text-[12px] text-secondary-text">
          <FileText size={13} className="inline mr-1 -mt-0.5" />
          {filtered.length} assignment{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      <AssignmentDropboxCard assignments={filtered} />
    </div>
  )
}

export default StudentAssignmentsPage

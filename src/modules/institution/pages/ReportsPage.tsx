import { useState } from 'react'
import { FileText, Clock, CheckCircle2, TrendingUp, Plus, CalendarClock } from 'lucide-react'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { Modal } from '../../../shared/components/Modal'
import { FormField } from '../../../shared/components/FormField'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useLocalStorageState, createId } from '../../../shared/hooks/useLocalStorageState'
import { ReportCategoryCard } from '../components/ReportCategoryCard'
import { GeneratedReportsList } from '../components/GeneratedReportsList'
import { MiniBarChart } from '../components/MiniBarChart'
import type { ReportCategory, GeneratedReport, TrendPoint } from '../types'

const STAT = 17

const categories: ReportCategory[] = [
  {
    id: 'r1',
    title: 'Academic Performance',
    description: 'Grades, GPA distribution, progression and transcripts.',
    icon: '🎓',
    reportCount: 12,
  },
  {
    id: 'r2',
    title: 'Attendance',
    description: 'Class and session attendance, absences and risk alerts.',
    icon: '📅',
    reportCount: 8,
  },
  {
    id: 'r3',
    title: 'Financial',
    description: 'Invoices, payments, refunds and revenue reconciliation.',
    icon: '💳',
    reportCount: 10,
  },
  {
    id: 'r4',
    title: 'Engagement',
    description: 'Logins, activity, course completion and content usage.',
    icon: '📈',
    reportCount: 9,
  },
  {
    id: 'r5',
    title: 'Compliance & Audit',
    description: 'Access logs, policy acknowledgment and audit trails.',
    icon: '🛡️',
    reportCount: 6,
  },
  {
    id: 'r6',
    title: 'Instructor Activity',
    description: 'Teaching load, grading turnaround and responsiveness.',
    icon: '🧑‍🏫',
    reportCount: 7,
  },
]

const enrollmentTrend: TrendPoint[] = [
  { label: 'Mar', value: 1720 },
  { label: 'Apr', value: 1810 },
  { label: 'May', value: 1890 },
  { label: 'Jun', value: 1940 },
  { label: 'Jul', value: 2005 },
  { label: 'Aug', value: 2066 },
]

const completionTrend: TrendPoint[] = [
  { label: 'CS', value: 94 },
  { label: 'Bus', value: 88 },
  { label: 'Eng', value: 81 },
  { label: 'Soc', value: 76 },
  { label: 'Cert', value: 92 },
]

const seedReports: GeneratedReport[] = [
  {
    id: 'g1',
    name: 'Fall Semester Grade Distribution',
    category: 'Academic Performance',
    generatedOn: 'Aug 1, 2026',
    format: 'PDF',
    status: 'ready',
  },
  {
    id: 'g2',
    name: 'Monthly Attendance Summary — July',
    category: 'Attendance',
    generatedOn: 'Jul 31, 2026',
    format: 'Excel',
    status: 'ready',
  },
  {
    id: 'g3',
    name: 'Q2 Revenue Reconciliation',
    category: 'Financial',
    generatedOn: 'Jul 30, 2026',
    format: 'Excel',
    status: 'ready',
  },
  {
    id: 'g4',
    name: 'Learner Engagement Heatmap',
    category: 'Engagement',
    generatedOn: 'In progress',
    format: 'CSV',
    status: 'processing',
  },
  {
    id: 'g5',
    name: 'Weekly Audit Trail Export',
    category: 'Compliance & Audit',
    generatedOn: 'Scheduled · Aug 5',
    format: 'PDF',
    status: 'scheduled',
  },
]

const categoryOptions = categories.map((c) => c.title)
const formatOptions: GeneratedReport['format'][] = ['PDF', 'Excel', 'CSV']

const emptyForm = {
  name: '',
  category: categoryOptions[0],
  format: 'PDF' as GeneratedReport['format'],
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function ReportsPage() {
  const { notify } = useToast()
  const [reports, setReports] = useLocalStorageState<GeneratedReport[]>(
    'berana:reports',
    seedReports,
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const openModal = () => {
    setForm(emptyForm)
    setModalOpen(true)
  }

  const handleGenerate = () => {
    if (!form.name.trim()) {
      notify('Please give the report a name.', 'error')
      return
    }
    const id = createId('report')
    const newReport: GeneratedReport = {
      id,
      name: form.name.trim(),
      category: form.category,
      generatedOn: 'Generating…',
      format: form.format,
      status: 'processing',
    }
    setReports((prev) => [newReport, ...prev])
    setModalOpen(false)
    notify('Report generation started…', 'info')

    // Simulate async generation completing.
    window.setTimeout(() => {
      setReports((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: 'ready', generatedOn: todayLabel() } : r,
        ),
      )
      notify(`“${newReport.name}” is ready to download.`)
    }, 1800)
  }

  const handleDownload = (report: GeneratedReport) => {
    notify(`Downloading “${report.name}” (${report.format})…`)
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Generate, schedule and export academic, financial and operational insights."
        actions={
          <>
            <Button variant="secondary" onClick={() => notify('Scheduled delivery unlocks with the backend.', 'info')}>
              <CalendarClock size={15} />
              Schedule
            </Button>
            <Button variant="primary" onClick={openModal}>
              <Plus size={16} />
              New Report
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatBlock label="Reports Generated" value="1,284" sub="This year" icon={<FileText size={STAT} />} />
        <StatBlock label="Scheduled" value="14" sub="Auto-delivery" icon={<Clock size={STAT} />} />
        <StatBlock label="Avg. Completion" value="86%" icon={<CheckCircle2 size={STAT} />} />
        <StatBlock
          label="Active Learners"
          value="2,066"
          sub="+3% vs last month"
          icon={<TrendingUp size={STAT} />}
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-stretch">
        <MiniBarChart
          title="Enrollment Growth"
          subtitle="Active learners over the last 6 months"
          data={enrollmentTrend}
        />
        <MiniBarChart
          title="Completion Rate by Department"
          subtitle="Course completion percentage"
          data={completionTrend}
          unit="%"
        />
      </div>

      <div>
        <h2 className="text-[15px] font-extrabold text-navy-900 mb-4">Report Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
          {categories.map((category) => (
            <ReportCategoryCard
              key={category.id}
              category={category}
              onOpen={(c) => {
                setForm({ ...emptyForm, category: c.title, name: `${c.title} Report` })
                setModalOpen(true)
              }}
            />
          ))}
        </div>
      </div>

      <GeneratedReportsList reports={reports} onDownload={handleDownload} />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        icon={<FileText size={18} />}
        title="New Report"
        description="Generate a report from your institution data."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleGenerate}>
              Generate Report
            </Button>
          </>
        }
      >
        <FormField
          label="Report Name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          placeholder="e.g. Fall Semester Grade Distribution"
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Category"
            type="select"
            value={form.category}
            options={categoryOptions}
            onChange={(v) => setForm({ ...form, category: v })}
          />
          <FormField
            label="Format"
            type="select"
            value={form.format}
            options={formatOptions}
            onChange={(v) => setForm({ ...form, format: v as GeneratedReport['format'] })}
          />
        </div>
      </Modal>
    </div>
  )
}

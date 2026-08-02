import { UploadCloud } from 'lucide-react'
import { AssignmentDropboxCard } from '../components/AssessmentCards'
import { useStudentDashboard } from '../hooks/useStudentDashboard'

export function StudentAssignmentsPage() {
  const { data, isLoading, isError } = useStudentDashboard()

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-navy-200 border-t-lemon-500" />
      </div>
    )
  }

  if (isError || !data) {
    return <div className="rounded-2xl border border-danger/20 bg-danger-bg p-5 text-danger">Failed to load assignments.</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-gradient-to-br from-navy-900 via-navy-700 to-[#202a4c] p-6 text-white">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lemon-200">Assignment dropboxes</p>
        <h1 className="mt-2 text-3xl font-extrabold">Secure uploads</h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-6 text-navy-200">
          Submit homework, essays, and projects directly to your instructors.
        </p>
        <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-lemon-500 px-4 py-2 text-[12px] font-bold text-navy-900">
          <UploadCloud size={14} />
          Upload assignment
        </button>
      </div>

      <AssignmentDropboxCard assignments={data.assignments} />
    </div>
  )
}

export default StudentAssignmentsPage
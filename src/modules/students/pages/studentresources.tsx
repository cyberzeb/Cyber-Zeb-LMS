import { FileDown, Search } from 'lucide-react'
import { ResourceLibraryCard } from '../components/ResourceLibraryCard'
import { useStudentDashboard } from '../hooks/useStudentDashboard'

export function StudentResourcesPage() {
  const { data, isLoading, isError } = useStudentDashboard()

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-navy-200 border-t-lemon-500" />
      </div>
    )
  }

  if (isError || !data) {
    return <div className="rounded-2xl border border-danger/20 bg-danger-bg p-5 text-danger">Failed to load resources.</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-gradient-to-br from-navy-900 via-navy-700 to-[#202a4c] p-6 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lemon-200">Course content & resources</p>
            <h1 className="mt-2 text-3xl font-extrabold">Digital library</h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-navy-200">
              Browse syllabi, lecture notes, readings, and instructional videos for your modules.
            </p>
          </div>

          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[12px] font-semibold text-white">
              <Search size={14} />
              Search resources
            </button>
            <button className="inline-flex items-center gap-2 rounded-full bg-lemon-500 px-4 py-2 text-[12px] font-bold text-navy-900">
              <FileDown size={14} />
              Download all
            </button>
          </div>
        </div>
      </div>

      <ResourceLibraryCard resources={data.resources} />
    </div>
  )
}

export default StudentResourcesPage
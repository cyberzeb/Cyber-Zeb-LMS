import { useMemo, useState } from 'react'
import { ArrowLeft, GraduationCap, Users } from 'lucide-react'

import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { TranscriptView } from '../../../shared/components/academics/TranscriptView'
import { buildTranscript, readTranscriptSources, type Transcript } from '../../../shared/academics/transcript'
import { usePeople } from '../hooks/usePeople'
import { useOrgStructure } from '../hooks/useOrgStructure'

const STAT = 17

/** Registrar view: student records, GPA and official transcripts. */
export function TranscriptsPage() {
  const { people } = usePeople()
  const { departments } = useOrgStructure()
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [openStudentId, setOpenStudentId] = useState<string | null>(null)

  const students = useMemo(
    () => people.filter((p) => p.role === 'Student' && p.status !== 'invited'),
    [people],
  )

  // One pass over the shared collections builds every student's record.
  const records = useMemo(() => {
    const sources = readTranscriptSources()
    return students.map((student) => ({ student, transcript: buildTranscript(student, sources) }))
  }, [students])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return records.filter(({ student }) => {
      if (departmentFilter && student.department !== departmentFilter) return false
      if (!term) return true
      return (
        student.name.toLowerCase().includes(term) ||
        (student.email ?? '').toLowerCase().includes(term) ||
        student.id.toLowerCase().includes(term)
      )
    })
  }, [records, search, departmentFilter])

  const stats = useMemo(() => {
    const withGpa = records.filter((r) => r.transcript.cumulativeGpa !== null)
    const average =
      withGpa.length > 0
        ? withGpa.reduce((sum, r) => sum + (r.transcript.cumulativeGpa ?? 0), 0) / withGpa.length
        : null
    return {
      students: records.length,
      graded: withGpa.length,
      average: average === null ? '—' : average.toFixed(2),
      atRisk: withGpa.filter((r) => (r.transcript.cumulativeGpa ?? 0) < 2).length,
    }
  }, [records])

  const open = openStudentId ? records.find((r) => r.student.id === openStudentId) : null

  if (open) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title={`Transcript — ${open.student.name}`}
          subtitle={`${open.student.department || 'No program'} · ${open.student.email ?? open.student.id}`}
          actions={
            <Button variant="secondary" onClick={() => setOpenStudentId(null)}>
              <ArrowLeft size={15} />
              Back to students
            </Button>
          }
        />
        <TranscriptView transcript={open.transcript} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Transcripts & Academic Records"
        subtitle="Student records with GPA, credits earned and academic standing."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock label="Students" value={stats.students} icon={<Users size={STAT} />} />
        <StatBlock label="With grades" value={stats.graded} icon={<GraduationCap size={STAT} />} />
        <StatBlock label="Average GPA" value={stats.average} />
        <StatBlock label="Below 2.00" value={stats.atRisk} sub="Academic probation" />
      </div>

      <GlassCard className="p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[220px]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email or ID" />
        </div>
        <SelectMenu
          value={departmentFilter}
          options={[
            { value: '', label: 'All departments' },
            ...departments.map((d: { name: string }) => ({ value: d.name, label: d.name })),
          ]}
          onChange={setDepartmentFilter}
        />
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-[11px] uppercase tracking-wide text-secondary-text bg-navy-50/60 dark:bg-white/5">
              <tr>
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Program</th>
                <th className="px-5 py-3 font-medium">Cumulative GPA</th>
                <th className="px-5 py-3 font-medium">Credits</th>
                <th className="px-5 py-3 font-medium">Standing</th>
                <th className="px-5 py-3 font-medium text-right">Transcript</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ student, transcript }: { student: typeof students[number]; transcript: Transcript }) => (
                <tr key={student.id} className="border-b border-divider last:border-0">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-navy-900">{student.name}</div>
                    <div className="text-[12px] text-secondary-text">{student.email ?? student.id}</div>
                  </td>
                  <td className="px-5 py-3 text-secondary-text">{student.department || '—'}</td>
                  <td className="px-5 py-3 font-semibold text-navy-900">
                    {transcript.cumulativeGpa === null ? '—' : transcript.cumulativeGpa.toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-navy-900">
                    {transcript.creditsEarned}/{transcript.creditsAttempted}
                  </td>
                  <td className="px-5 py-3">
                    {transcript.standing ? (
                      <StatusPill
                        label={transcript.standing}
                        tone={
                          transcript.standing === 'Academic Probation'
                            ? 'danger'
                            : transcript.standing === 'Academic Warning'
                              ? 'warning'
                              : 'success'
                        }
                      />
                    ) : (
                      <span className="text-secondary-text">No grades yet</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="secondary" size="sm" onClick={() => setOpenStudentId(student.id)}>
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-secondary-text">
                    No students match this search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}

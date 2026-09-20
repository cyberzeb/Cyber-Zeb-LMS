import { useMemo } from 'react'

import { PageHeader } from '../../../shared/components/PageHeader'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { TranscriptView } from '../../../shared/components/academics/TranscriptView'
import { buildTranscript } from '../../../shared/academics/transcript'
import { useLinkedStudent } from '../hooks/useLinkedStudent'

export function GuardianGradesPage() {
  const { student } = useLinkedStudent()
  const transcript = useMemo(() => (student ? buildTranscript(student) : null), [student])

  if (!student || !transcript) {
    return (
      <GlassCard className="p-6 text-[13px] text-secondary-text">
        No student is linked to your account yet. Ask the registrar to link one.
      </GlassCard>
    )
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Grades & Transcript"
        subtitle={`Academic record for ${student.name} — grades by term, GPA and credits earned.`}
      />
      <TranscriptView transcript={transcript} />
    </div>
  )
}

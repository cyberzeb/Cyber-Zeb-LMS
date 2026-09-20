import { useMemo } from 'react'

import { PageHeader } from '../../../shared/components/PageHeader'
import { TranscriptView } from '../../../shared/components/academics/TranscriptView'
import { buildTranscript } from '../../../shared/academics/transcript'
import { getSessionPerson } from '../../../shared/storage/session'
import { StudentPageError } from '../components/StudentPageStates'

export function StudentTranscriptPage() {
  const person = getSessionPerson()
  const transcript = useMemo(() => (person ? buildTranscript(person) : null), [person])

  if (!person || !transcript) return <StudentPageError message="Sign in to view your transcript." />

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Academic Transcript"
        subtitle="Your grades by term, GPA and credits earned — download a copy as PDF."
      />
      <TranscriptView transcript={transcript} />
    </div>
  )
}

export default StudentTranscriptPage

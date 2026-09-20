import { Download, GraduationCap } from 'lucide-react'

import { Button } from '../Button'
import { StatBlock } from '../StatBlock'
import { StatusPill } from '../StatusPill'
import { GlassCard } from '../../layout/GlassCard'
import { exportTranscriptPdf } from '../../academics/exportTranscript'
import type { Transcript } from '../../academics/transcript'

/** Academic record shared by the student portal, the registrar and the guardian portal. */
export function TranscriptView({ transcript }: { transcript: Transcript }) {
  const hasGrades = transcript.cumulativeGpa !== null

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock
          label="Cumulative GPA"
          value={hasGrades ? transcript.cumulativeGpa!.toFixed(2) : '—'}
          sub={transcript.standing ?? 'No graded work yet'}
          icon={<GraduationCap size={17} />}
        />
        <StatBlock label="Credits earned" value={transcript.creditsEarned} sub={`of ${transcript.creditsAttempted} attempted`} />
        <StatBlock label="Terms on record" value={transcript.terms.length} />
        <StatBlock
          label="Courses graded"
          value={transcript.terms.reduce(
            (sum, term) => sum + term.courses.filter((c) => c.status === 'graded').length,
            0,
          )}
        />
      </div>

      <div className="flex justify-end">
        <Button variant="secondary" onClick={() => exportTranscriptPdf(transcript)}>
          <Download size={15} />
          Download transcript (PDF)
        </Button>
      </div>

      {transcript.terms.length === 0 ? (
        <GlassCard className="p-6 text-[13px] text-secondary-text">
          No enrollments yet, so there is nothing on the transcript.
        </GlassCard>
      ) : (
        transcript.terms.map((term) => (
          <GlassCard key={term.termId} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-b border-divider">
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-extrabold text-navy-900">{term.termName}</h3>
                {term.isCurrent && <StatusPill label="Current term" tone="info" />}
              </div>
              <div className="text-[12.5px] font-semibold text-secondary-text">
                Term GPA{' '}
                <span className="text-navy-900">{term.gpa === null ? '—' : term.gpa.toFixed(2)}</span>
                {' · '}
                {term.creditsEarned}/{term.creditsAttempted} credits
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="text-left text-[11px] uppercase tracking-wide text-secondary-text bg-navy-50/60 dark:bg-white/5">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Course</th>
                    <th className="px-5 py-2.5 font-medium">Instructor</th>
                    <th className="px-5 py-2.5 font-medium">Credits</th>
                    <th className="px-5 py-2.5 font-medium">Score</th>
                    <th className="px-5 py-2.5 font-medium">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {term.courses.map((course) => (
                    <tr key={course.enrollmentId} className="border-b border-divider last:border-0">
                      <td className="px-5 py-2.5">
                        <div className="font-semibold text-navy-900">{course.code}</div>
                        <div className="text-[12px] text-secondary-text">{course.title}</div>
                      </td>
                      <td className="px-5 py-2.5 text-secondary-text">{course.instructor}</td>
                      <td className="px-5 py-2.5 text-navy-900">{course.credits || '—'}</td>
                      <td className="px-5 py-2.5 text-navy-900">
                        {course.percent === null ? '—' : `${course.percent}%`}
                      </td>
                      <td className="px-5 py-2.5">
                        {course.status === 'graded' ? (
                          <StatusPill
                            label={course.letter ?? '—'}
                            tone={course.passed ? 'success' : 'danger'}
                          />
                        ) : (
                          <StatusPill label="In progress" tone="neutral" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        ))
      )}
    </div>
  )
}

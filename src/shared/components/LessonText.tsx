/**
 * Lesson text with light formatting: paragraphs, "- " bullet lists, "1. "
 * numbered lists and **bold**. Built from React elements (never raw HTML), so
 * lesson content cannot inject markup.
 */
import type { ReactNode } from 'react'

function inline(text: string, keyBase: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={`${keyBase}-${i}`} className="font-semibold text-navy-900">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  )
}

export function LessonText({ text, className = '' }: { text: string; className?: string }) {
  const blocks: ReactNode[] = []
  const lines = text.replace(/\r/g, '').split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line) {
      i += 1
      continue
    }
    if (/^[-*] /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*] /.test(lines[i].trim())) items.push(lines[i++].trim().slice(2))
      blocks.push(
        <ul key={`ul-${i}`} className="list-disc space-y-1 pl-5">
          {items.map((item, j) => (
            <li key={j}>{inline(item, `ul-${i}-${j}`)}</li>
          ))}
        </ul>,
      )
      continue
    }
    if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i].trim())) items.push(lines[i++].trim().replace(/^\d+\. /, ''))
      blocks.push(
        <ol key={`ol-${i}`} className="list-decimal space-y-1 pl-5">
          {items.map((item, j) => (
            <li key={j}>{inline(item, `ol-${i}-${j}`)}</li>
          ))}
        </ol>,
      )
      continue
    }
    const para: string[] = []
    while (i < lines.length && lines[i].trim() && !/^([-*] |\d+\. )/.test(lines[i].trim())) para.push(lines[i++].trim())
    blocks.push(<p key={`p-${i}`}>{inline(para.join(' '), `p-${i}`)}</p>)
  }
  return <div className={`flex flex-col gap-3 text-[14px] leading-relaxed text-navy-800 ${className}`}>{blocks}</div>
}

import { useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'

import type { PersonRow } from '../types'

interface Props {
  students: PersonRow[]
  value: string[]
  onChange: (ids: string[]) => void
  label?: string
}

/** Pick one or more students (a guardian's children), with search. */
export function StudentMultiPicker({ students, value, onChange, label = 'Linked students' }: Props) {
  const [query, setQuery] = useState('')
  const selected = new Set(value)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? students.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.department.toLowerCase().includes(q))
      : students
    // Selected students first, so they stay visible while searching.
    return [...list].sort((a, b) => Number(selected.has(b.id)) - Number(selected.has(a.id)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, query, value])

  function toggle(id: string) {
    onChange(selected.has(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-navy-900">
        {label} <span className="font-normal text-secondary-text">({value.length} selected)</span>
      </span>
      <div className="rounded-lg border border-divider">
        <div className="flex items-center gap-2 border-b border-divider px-3 py-2">
          <Search size={14} className="text-secondary-text" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students by name, email or department"
            className="w-full bg-transparent text-[13px] text-navy-900 outline-none"
            aria-label="Search students"
          />
        </div>
        <div className="max-h-52 overflow-y-auto p-1">
          {visible.map((s) => {
            const on = selected.has(s.id)
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                aria-pressed={on}
                className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors cursor-pointer ${
                  on ? 'bg-lemon-500/10' : 'hover:bg-canvas'
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    on ? 'border-lemon-500 bg-lemon-500 text-[#020810]' : 'border-divider'
                  }`}
                >
                  {on ? <Check size={11} strokeWidth={3} /> : null}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-navy-900">{s.name}</span>
                  <span className="block truncate text-[11.5px] text-secondary-text">
                    {s.department} · {s.email}
                  </span>
                </span>
              </button>
            )
          })}
          {visible.length === 0 ? (
            <p className="px-2.5 py-4 text-center text-[12px] text-secondary-text">No students match.</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

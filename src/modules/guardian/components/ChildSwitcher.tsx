import { Monogram } from '../../../shared/components/Monogram'
import { useLinkedStudent } from '../hooks/useLinkedStudent'

/** Choose which child the portal shows. Only rendered for guardians of several students. */
export function ChildSwitcher() {
  const { students, student, selectStudent } = useLinkedStudent()
  if (students.length < 2) return null
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2" role="tablist" aria-label="Choose a child">
      <span className="mr-1 text-[12px] font-bold text-secondary-text">Viewing:</span>
      {students.map((s) => {
        const active = s.id === student?.id
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => selectStudent(s.id)}
            className={`inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-[12.5px] font-semibold transition-colors cursor-pointer ${
              active
                ? 'border-lemon-500 bg-lemon-500/15 text-lemon-700 dark:text-lemon-500'
                : 'border-divider text-secondary-text hover:border-lemon-500/50 hover:text-navy-900'
            }`}
          >
            <Monogram label={s.name} size="sm" />
            {s.name}
          </button>
        )
      })}
    </div>
  )
}

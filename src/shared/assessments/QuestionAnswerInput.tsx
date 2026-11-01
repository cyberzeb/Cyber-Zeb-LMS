import { ArrowDown, ArrowUp, Check } from 'lucide-react'
import type { QuestionRecord, QuizAnswer } from '../../modules/institution/types/assessments'
import { blankCount, splitBlanks, wordCount } from './questionTypes'

interface QuestionAnswerInputProps {
  /** The student view of the question (no answer key). */
  question: QuestionRecord
  value: QuizAnswer | undefined
  onChange: (value: QuizAnswer) => void
  disabled?: boolean
}

const optionBase =
  'flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[13px] text-left transition-colors cursor-pointer'
const optionIdle = 'border-divider hover:border-lemon-500/50 hover:bg-lemon-50/40 dark:hover:bg-lemon-500/5'
const optionActive = 'border-lemon-500 bg-lemon-50 dark:bg-lemon-500/10 font-semibold text-navy-900'
const inputClass =
  'bg-white dark:bg-navy-50 border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 placeholder:text-secondary-text focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25'

/** The answer control a student sees for one question, shaped by its format. */
export function QuestionAnswerInput({ question, value, onChange, disabled }: QuestionAnswerInputProps) {
  switch (question.type) {
    case 'mcq': {
      const letters = 'ABCDEFGHIJ'
      return (
        <div className="flex flex-col gap-2" role="radiogroup">
          {(question.options ?? []).map((option, i) => {
            const active = value === option
            return (
              <button
                key={`${option}-${i}`}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                onClick={() => onChange(option)}
                className={`${optionBase} ${active ? optionActive : optionIdle}`}
              >
                <span
                  className={`w-6 h-6 shrink-0 rounded-full border flex items-center justify-center text-[11px] font-bold ${
                    active ? 'bg-lemon-500 border-lemon-500 text-navy-900' : 'border-divider text-secondary-text'
                  }`}
                >
                  {letters[i] ?? i + 1}
                </span>
                <span>{option}</span>
              </button>
            )
          })}
        </div>
      )
    }

    case 'multi-select': {
      const chosen = Array.isArray(value) ? value : []
      return (
        <div className="flex flex-col gap-2">
          <p className="text-[11.5px] text-secondary-text">Select all that apply.</p>
          {(question.options ?? []).map((option, i) => {
            const active = chosen.includes(option)
            return (
              <button
                key={`${option}-${i}`}
                type="button"
                role="checkbox"
                aria-checked={active}
                disabled={disabled}
                onClick={() => onChange(active ? chosen.filter((c) => c !== option) : [...chosen, option])}
                className={`${optionBase} ${active ? optionActive : optionIdle}`}
              >
                <span
                  className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center ${
                    active ? 'bg-lemon-500 border-lemon-500 text-navy-900' : 'border-divider'
                  }`}
                >
                  {active ? <Check size={13} strokeWidth={3} /> : null}
                </span>
                <span>{option}</span>
              </button>
            )
          })}
        </div>
      )
    }

    case 'true-false':
      return (
        <div className="grid grid-cols-2 gap-3 max-w-sm" role="radiogroup">
          {['True', 'False'].map((option) => {
            const active = value === option
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                onClick={() => onChange(option)}
                className={`rounded-xl border py-3 text-[14px] font-bold transition-colors cursor-pointer ${
                  active ? optionActive : `${optionIdle} text-navy-700`
                }`}
              >
                {option}
              </button>
            )
          })}
        </div>
      )

    case 'numeric':
      return (
        <div className="flex items-center gap-2 max-w-xs">
          <input
            type="number"
            inputMode="decimal"
            step="any"
            disabled={disabled}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Your answer"
            className={`${inputClass} w-full`}
          />
          {question.unit ? <span className="text-[13px] font-semibold text-secondary-text">{question.unit}</span> : null}
        </div>
      )

    case 'fill-blank': {
      const parts = splitBlanks(question.stem)
      const count = question.blankCount ?? blankCount(question.stem)
      const given = Array.isArray(value) ? value : Array.from({ length: count }, () => '')
      return (
        <p className="text-[14px] leading-[2.4] text-navy-900">
          {parts.map((part, i) => (
            <span key={i}>
              {part}
              {i < count ? (
                <input
                  type="text"
                  disabled={disabled}
                  aria-label={`Blank ${i + 1}`}
                  value={given[i] ?? ''}
                  onChange={(e) => {
                    const next = Array.from({ length: count }, (_, j) => given[j] ?? '')
                    next[i] = e.target.value
                    onChange(next)
                  }}
                  className={`${inputClass} inline-block w-36 mx-1 py-1 text-center`}
                />
              ) : null}
            </span>
          ))}
        </p>
      )
    }

    case 'matching': {
      const lefts = question.matchLeft ?? []
      const rights = question.matchRight ?? []
      const given = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
      const used = new Set(Object.values(given))
      return (
        <div className="flex flex-col gap-2">
          {lefts.map((left) => (
            <div key={left} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="rounded-lg nested-panel-strong px-3 py-2 text-[13px] font-semibold text-navy-900">{left}</div>
              <span className="hidden sm:block text-secondary-text text-[12px]">→</span>
              <select
                disabled={disabled}
                value={given[left] ?? ''}
                onChange={(e) => onChange({ ...given, [left]: e.target.value })}
                className={`${inputClass} w-full dark:[color-scheme:dark]`}
              >
                <option value="">Choose a match…</option>
                {rights.map((right) => (
                  <option key={right} value={right} disabled={used.has(right) && given[left] !== right}>
                    {right}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )
    }

    case 'ordering': {
      const order = Array.isArray(value) && value.length ? value : question.orderShuffled ?? []
      const move = (from: number, to: number) => {
        if (to < 0 || to >= order.length) return
        const next = [...order]
        const [item] = next.splice(from, 1)
        next.splice(to, 0, item)
        onChange(next)
      }
      return (
        <div className="flex flex-col gap-2">
          <p className="text-[11.5px] text-secondary-text">Use the arrows to put the items in the right order.</p>
          {order.map((item, i) => (
            <div key={item} className="flex items-center gap-2 rounded-xl border border-divider px-3 py-2">
              <span className="w-6 h-6 rounded-full bg-navy-50 text-navy-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-[13px] text-navy-900 flex-1">{item}</span>
              <button
                type="button"
                disabled={disabled || i === 0}
                onClick={() => move(i, i - 1)}
                aria-label={`Move ${item} up`}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-secondary-text hover:bg-navy-50 hover:text-navy-900 disabled:opacity-30 cursor-pointer"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                disabled={disabled || i === order.length - 1}
                onClick={() => move(i, i + 1)}
                aria-label={`Move ${item} down`}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-secondary-text hover:bg-navy-50 hover:text-navy-900 disabled:opacity-30 cursor-pointer"
              >
                <ArrowDown size={14} />
              </button>
            </div>
          ))}
        </div>
      )
    }

    case 'essay': {
      const text = typeof value === 'string' ? value : ''
      const words = wordCount(text)
      const over = Boolean(question.wordLimit && words > question.wordLimit)
      return (
        <div className="flex flex-col gap-1.5">
          <textarea
            disabled={disabled}
            value={text}
            onChange={(e) => onChange(e.target.value)}
            rows={7}
            placeholder="Write your answer…"
            className={`${inputClass} w-full resize-y leading-relaxed`}
          />
          <div className={`text-[11.5px] text-right ${over ? 'text-danger font-semibold' : 'text-secondary-text'}`}>
            {words} word{words === 1 ? '' : 's'}
            {question.wordLimit ? ` / ${question.wordLimit}` : ''}
          </div>
        </div>
      )
    }

    default:
      return (
        <input
          type="text"
          disabled={disabled}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer"
          className={`${inputClass} w-full max-w-md`}
        />
      )
  }
}

/** Question text, except fill-in-the-blank, whose text holds the inputs. */
export function QuestionStem({ question, index }: { question: QuestionRecord; index?: number }) {
  if (question.type === 'fill-blank') {
    return index !== undefined ? (
      <p className="text-[12px] font-bold text-secondary-text">Question {index + 1} · Fill in the blanks</p>
    ) : null
  }
  return (
    <p className="text-[14px] font-bold text-navy-900 leading-snug">
      {index !== undefined ? `${index + 1}. ` : ''}
      {question.stem}
    </p>
  )
}

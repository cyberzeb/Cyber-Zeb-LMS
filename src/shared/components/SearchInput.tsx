import { Search } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={15}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/70 dark:bg-navy-50 border border-divider rounded-full pl-10 pr-3 py-2 text-[13px] text-navy-900 placeholder:text-secondary-text shadow-sm transition-all focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25 focus:bg-navy-50 dark:focus:bg-[#111b2e]"
      />
    </div>
  )
}

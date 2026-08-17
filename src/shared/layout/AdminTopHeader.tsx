import { useEffect, useRef, useState } from 'react'
import { Bell, Building2, ChevronDown, MessageSquare, Search } from 'lucide-react'
import type { Campus } from '../../modules/institution/types'

interface AdminTopHeaderProps {
  userName: string
  userRole: string
  breadcrumb?: string
  institutionName?: string
  campuses?: Campus[]
  selectedCampusId?: string | 'all'
  onCampusChange?: (campusId: string | 'all') => void
}

export function AdminTopHeader({
  userName,
  userRole,
  breadcrumb,
  institutionName = 'Berana University',
  campuses = [],
  selectedCampusId = 'all',
  onCampusChange,
}: AdminTopHeaderProps) {
  const [search, setSearch] = useState('')
  const [campusMenuOpen, setCampusMenuOpen] = useState(false)
  const campusMenuRef = useRef<HTMLDivElement>(null)

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const selectedLabel =
    selectedCampusId === 'all'
      ? 'All Campuses'
      : (campuses.find((c) => c.id === selectedCampusId)?.name ?? 'All Campuses')

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (campusMenuRef.current && !campusMenuRef.current.contains(event.target as Node)) {
        setCampusMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="shrink-0 h-14 bg-[#0a1020] border-b border-white/[0.08] flex items-center gap-4 px-5">
      <div className="hidden lg:flex items-center gap-2 min-w-[140px] text-[12px] text-navy-200">
        <span className="font-semibold text-white">{institutionName}</span>
        {breadcrumb ? (
          <>
            <span className="text-white/20">/</span>
            <span>{breadcrumb}</span>
          </>
        ) : null}
      </div>

      {campuses.length > 0 && onCampusChange ? (
        <div className="relative shrink-0" ref={campusMenuRef}>
          <button
            type="button"
            onClick={() => setCampusMenuOpen((open) => !open)}
            className="hidden md:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-[11.5px] text-navy-200 hover:bg-white/[0.06] hover:text-white transition-colors max-w-[180px]"
          >
            <Building2 size={14} className="shrink-0" />
            <span className="truncate">{selectedLabel}</span>
            <ChevronDown size={14} className="shrink-0" />
          </button>

          {campusMenuOpen ? (
            <div className="absolute top-full left-0 mt-1.5 w-64 rounded-xl border border-white/15 bg-[#1a2338] shadow-xl z-50 py-1.5">
              <button
                type="button"
                onClick={() => {
                  onCampusChange('all')
                  setCampusMenuOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-[12px] hover:bg-white/10 transition-colors ${
                  selectedCampusId === 'all'
                    ? 'text-lemon-500 font-semibold'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                All Campuses
              </button>
              <div className="my-1 border-t border-white/10" />
              {campuses.map((campus) => (
                <button
                  key={campus.id}
                  type="button"
                  onClick={() => {
                    onCampusChange(campus.id)
                    setCampusMenuOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-[12px] hover:bg-white/10 transition-colors ${
                    selectedCampusId === campus.id
                      ? 'text-lemon-500 font-semibold'
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  <span className="block truncate">{campus.name}</span>
                  {campus.status === 'pending' ? (
                    <span className="text-[10px] text-warning uppercase font-bold">Pending</span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex-1 max-w-xl mx-auto relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-200 pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses, students, reports..."
          className="w-full h-9 bg-white/[0.06] border border-white/10 rounded-lg pl-9 pr-20 text-[12.5px] text-white placeholder:text-navy-200/70 focus:outline-none focus:border-lemon-500/40 focus:ring-1 focus:ring-lemon-500/20"
        />
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-white/10 bg-white/[0.04] text-[10px] text-navy-200 font-medium">
          Ctrl + K
        </kbd>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          className="relative w-9 h-9 rounded-lg flex items-center justify-center text-navy-200 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-lemon-500 border border-[#0a1020]" />
        </button>
        <button
          type="button"
          className="relative w-9 h-9 rounded-lg flex items-center justify-center text-navy-200 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Messages"
        >
          <MessageSquare size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-info border border-[#0a1020]" />
        </button>

        <button
          type="button"
          className="hidden sm:flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-[12px] text-navy-200 hover:bg-white/[0.06] hover:text-white transition-colors"
        >
          English
          <ChevronDown size={14} />
        </button>

        <div className="flex items-center gap-2 pl-2 ml-1 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-lemon-500 text-navy-900 flex items-center justify-center text-[10px] font-bold shrink-0">
            {initials}
          </div>
          <div className="hidden md:block min-w-0">
            <div className="text-[12px] font-semibold text-white leading-tight truncate">{userName}</div>
            <div className="text-[10px] text-navy-200 leading-tight truncate">{userRole}</div>
          </div>
          <ChevronDown size={14} className="hidden md:block text-navy-200 shrink-0" />
        </div>
      </div>
    </header>
  )
}

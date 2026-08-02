import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface NavItem {
  label: string
  to?: string
  active?: boolean
  icon?: ReactNode
}

interface NavSection {
  title: string
  items: NavItem[]
}

interface SidebarProps {
  sections: NavSection[]
  userName: string
  userRole: string
}

export function Sidebar({ sections, userName, userRole }: SidebarProps) {
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside className="w-62 shrink-0 bg-gradient-to-b from-navy-900 via-navy-900 to-[#10162b] text-white p-4 flex flex-col gap-1.5 min-h-screen border-r border-white/5 relative">
      {/* ambient lemon glow */}
      <div className="absolute -left-10 top-24 w-40 h-40 rounded-full bg-lemon-500/10 blur-3xl pointer-events-none" />

      <div className="relative flex items-center gap-2.5 px-2.5 pb-6">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-lemon-200 to-lemon-500 flex items-center justify-center font-extrabold text-navy-900 text-sm shadow-[0_4px_14px_rgba(168,212,0,0.4)]">
          B
        </div>
        <div>
          <div className="font-bold text-sm tracking-tight">Berana LMS</div>
          <div className="text-[10px] text-navy-200 uppercase tracking-wider">Cyber-Zeb</div>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.title} className="relative">
          <div className="text-[10px] text-navy-200/80 uppercase tracking-[0.15em] font-semibold mx-3 mt-3.5 mb-2">
            {section.title}
          </div>
          {section.items.map((item) => {
            const rowClass = `group relative flex items-center gap-2.5 pl-3.5 pr-3 py-2 rounded-xl text-[13.5px] cursor-pointer transition-all duration-200
                ${item.active
                  ? 'bg-white/10 text-lemon-500 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                  : 'text-[#c9cfe0] hover:bg-white/[0.06] hover:text-white'
                }`
            const indicator = (
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-full bg-lemon-500 transition-all duration-200
                  ${item.active ? 'h-5 opacity-100' : 'h-0 opacity-0 group-hover:h-3 group-hover:opacity-60'}`}
              />
            )
            const leading = item.icon ? (
              <span
                className={`shrink-0 transition-colors ${item.active ? 'text-lemon-500' : 'text-navy-200 group-hover:text-white'}`}
              >
                {item.icon}
              </span>
            ) : (
              <span
                className={`w-1.5 h-1.5 rounded-full transition-colors ${item.active ? 'bg-lemon-500' : 'bg-navy-500 group-hover:bg-navy-200'}`}
              />
            )

            if (item.to) {
              return (
                <Link key={item.label} to={item.to} className={rowClass}>
                  {indicator}
                  {leading}
                  {item.label}
                </Link>
              )
            }

            return (
              <div key={item.label} className={rowClass}>
                {indicator}
                {leading}
                {item.label}
              </div>
            )
          })}
        </div>
      ))}

      <div className="relative mt-auto flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.07] border border-white/5">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-lemon-200 to-lemon-500 text-navy-900 flex items-center justify-center font-bold text-xs shadow-sm">
          {initials}
        </div>
        <div>
          <div className="text-[12.5px] font-semibold">{userName}</div>
          <div className="text-[10.5px] text-navy-200">{userRole}</div>
        </div>
      </div>
    </aside>
  )
}

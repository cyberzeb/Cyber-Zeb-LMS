import { Link } from 'react-router-dom'

interface NavItem {
  label: string
  to?: string
  active?: boolean
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
    <aside className="w-62 shrink-0 bg-gradient-to-b from-navy-900 to-[#141b30] text-white p-4 flex flex-col gap-1.5 min-h-screen">
      <div className="flex items-center gap-2.5 px-2.5 pb-6">
        <div className="w-7.5 h-7.5 rounded-lg bg-lemon-500 flex items-center justify-center font-extrabold text-navy-900 text-sm">
          B
        </div>
        <div>
          <div className="font-bold text-sm">Berana LMS</div>
          <div className="text-[10px] text-navy-200 uppercase tracking-wider">Cyber-Zeb</div>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.title}>
          <div className="text-[10px] text-navy-200 uppercase tracking-wider mx-3 mt-3.5 mb-1.5">
            {section.title}
          </div>
          {section.items.map((item) => {
            const rowClass = `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] cursor-pointer
                ${item.active
                  ? 'bg-lemon-500/15 text-lemon-500 font-semibold'
                  : 'text-[#dfe3ef] hover:bg-white/5'
                }`
            const dot = (
              <span
                className={`w-1.5 h-1.5 rounded-full ${item.active ? 'bg-lemon-500' : 'bg-navy-500'}`}
              />
            )

            if (item.to) {
              return (
                <Link key={item.label} to={item.to} className={rowClass}>
                  {dot}
                  {item.label}
                </Link>
              )
            }

            return (
              <div key={item.label} className={rowClass}>
                {dot}
                {item.label}
              </div>
            )
          })}
        </div>
      ))}

      <div className="mt-auto flex items-center gap-2.5 p-3 rounded-lg bg-white/5">
        <div className="w-8 h-8 rounded-full bg-lemon-500 text-navy-900 flex items-center justify-center font-bold text-xs">
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

import { Link, useLocation } from 'react-router-dom'
import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { Activity, HardDrive } from 'lucide-react'

interface NavItem {
  label: string
  to?: string
  active?: boolean
  icon?: ReactNode
  badge?: number
}

interface NavSection {
  title: string
  items: NavItem[]
}

interface SidebarProps {
  sections: NavSection[]
  brandLogoSrc?: string
  brandName?: string
  brandSubtitle?: string
  showSystemStatus?: boolean
}

export function Sidebar({
  sections,
  brandLogoSrc,
  brandName = 'Brana LMS',
  brandSubtitle = 'Cyber-Zeb',
  showSystemStatus = true,
}: SidebarProps) {
  const location = useLocation()
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToActiveItem = useCallback(() => {
    const container = scrollRef.current
    if (!container) return
    const activeItem = container.querySelector<HTMLElement>('[data-nav-active="true"]')
    if (!activeItem) return
    activeItem.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const frame = requestAnimationFrame(scrollToActiveItem)
    return () => cancelAnimationFrame(frame)
  }, [location.pathname, scrollToActiveItem])

  return (
    <aside
      className="group/sidebar shrink-0 bg-admin-sidebar text-white flex flex-col h-screen sticky top-0 border-r border-white/[0.06] w-[72px] hover:w-64 transition-[width] duration-300 ease-in-out overflow-hidden"
      onMouseEnter={scrollToActiveItem}
    >
      <div className="shrink-0 flex items-center justify-center group-hover/sidebar:justify-start px-3 py-4 gap-0 group-hover/sidebar:gap-2.5 border-b border-white/[0.06] transition-all duration-300">
        {brandLogoSrc ? (
          <div className="w-9 h-9 shrink-0 rounded-lg bg-white flex items-center justify-center overflow-hidden">
            <img src={brandLogoSrc} alt={`${brandName} logo`} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-9 h-9 shrink-0 rounded-lg bg-lemon-500 flex items-center justify-center font-extrabold text-navy-900 text-sm">
            B
          </div>
        )}
        <div className="min-w-0 overflow-hidden max-w-0 opacity-0 group-hover/sidebar:max-w-[10rem] group-hover/sidebar:opacity-100 transition-all duration-300">
          <div className="font-bold text-[13px] tracking-tight whitespace-nowrap">{brandName}</div>
          <div className="text-[10px] text-navy-300 uppercase tracking-wider whitespace-nowrap">{brandSubtitle}</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto app-scroll px-2 py-2">
        {sections.map((section) => (
          <div key={section.title} className="relative">
            <div className="text-[9px] text-navy-300 uppercase tracking-[0.14em] font-semibold mx-2 mt-3 mb-1.5 overflow-hidden max-h-0 opacity-0 group-hover/sidebar:max-h-6 group-hover/sidebar:opacity-100 transition-all duration-300">
              {section.title}
            </div>
            {section.items.map((item) => {
              const rowClass = `group/item relative flex items-center justify-center group-hover/sidebar:justify-start px-2.5 group-hover/sidebar:px-3 py-2 rounded-lg text-[13px] cursor-pointer transition-colors duration-150
                  ${item.active
                    ? 'bg-lemon-500/15 text-lemon-500 font-semibold'
                    : 'text-navy-200 hover:bg-white/[0.06] hover:text-white'
                  }`
              const indicator = (
                <span
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full bg-lemon-500 hidden group-hover/sidebar:block
                    ${item.active ? 'h-5' : 'h-0 group-hover/item:h-3'}`}
                />
              )
              const leading = item.icon ? (
                <span className={`shrink-0 ${item.active ? 'text-lemon-500' : 'text-navy-200 group-hover/item:text-white'}`}>
                  {item.icon}
                </span>
              ) : null
              const label = (
                <span className="overflow-hidden max-w-0 opacity-0 group-hover/sidebar:max-w-[12rem] group-hover/sidebar:opacity-100 group-hover/sidebar:ml-2.5 whitespace-nowrap transition-all duration-300 flex items-center gap-2">
                  {item.label}
                  {item.badge && item.badge > 0 ? (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-lemon-500 text-navy-900 text-[10px] font-extrabold flex items-center justify-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </span>
              )

              if (item.to) {
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={rowClass}
                    title={item.label}
                    data-nav-active={item.active ? 'true' : undefined}
                  >
                    {indicator}
                    {leading}
                    {label}
                  </Link>
                )
              }

              return (
                <div key={item.label} className={rowClass} title={item.label}>
                  {indicator}
                  {leading}
                  {label}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-white/[0.06] py-1.5 px-1.5">
        {showSystemStatus ? (
          <div className="overflow-hidden max-h-0 opacity-0 group-hover/sidebar:max-h-16 group-hover/sidebar:opacity-100 transition-all duration-300 px-1.5 space-y-1">
            <div>
              <div className="flex items-center justify-between text-[9px] text-navy-300">
                <span className="flex items-center gap-1"><HardDrive size={10} /> Storage</span>
                <span className="text-white font-medium">68%</span>
              </div>
              <div className="h-0.5 mt-0.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-[68%] rounded-full bg-lemon-500" />
              </div>
            </div>
            <div className="flex items-center justify-between text-[9px]">
              <span className="flex items-center gap-1 text-navy-300"><Activity size={10} /> Platform</span>
              <span className="text-success font-medium">Operational</span>
            </div>
          </div>
        ) : null}
        <div className="flex justify-center group-hover/sidebar:justify-start px-1 pt-1">
          <span className="text-[8px] text-navy-300/70 leading-tight overflow-hidden max-w-0 opacity-0 group-hover/sidebar:max-w-full group-hover/sidebar:opacity-100 transition-all duration-300">
            © 2026 Berana LMS · Cyber-Zeb Consulting
          </span>
        </div>
      </div>
    </aside>
  )
}

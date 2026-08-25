import { useLanguage } from '../i18n/LanguageProvider'

interface FilterTabsProps {
  tabs: string[]
  active: string
  onChange: (tab: string) => void
}

export function FilterTabs({ tabs, active, onChange }: FilterTabsProps) {
  const { tx } = useLanguage()
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = tab === active
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold cursor-pointer transition-all duration-200 border active:scale-[0.97]
              ${isActive
                ? 'bg-lemon-500/15 text-lemon-500 border-lemon-500/40 shadow-[0_0_0_1px_rgba(163,207,69,0.15)]'
                : 'bg-white/70 dark:bg-navy-50 text-secondary-text border-divider hover:text-navy-900 hover:border-navy-200 hover:bg-navy-50 dark:hover:bg-[#111b2e]'
              }`}
          >
            {tx(tab)}
          </button>
        )
      })}
    </div>
  )
}

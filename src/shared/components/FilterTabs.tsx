interface FilterTabsProps {
  tabs: string[]
  active: string
  onChange: (tab: string) => void
}

export function FilterTabs({ tabs, active, onChange }: FilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = tab === active
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold cursor-pointer transition-colors border
              ${isActive
                ? 'bg-navy-900 text-white border-navy-900'
                : 'bg-white/60 text-secondary-text border-divider hover:text-navy-900 hover:border-navy-200'
              }`}
          >
            {tab}
          </button>
        )
      })}
    </div>
  )
}

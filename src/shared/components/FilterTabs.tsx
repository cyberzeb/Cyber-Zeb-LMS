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
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold cursor-pointer transition-all duration-200 border active:scale-[0.97]
              ${isActive
                ? 'bg-gradient-to-b from-navy-700 to-navy-900 text-white border-navy-900 shadow-[0_2px_10px_rgba(27,35,64,0.25)]'
                : 'bg-white/70 text-secondary-text border-divider hover:text-navy-900 hover:border-navy-200 hover:bg-white'
              }`}
          >
            {tab}
          </button>
        )
      })}
    </div>
  )
}

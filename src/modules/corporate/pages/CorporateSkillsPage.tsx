import { useMemo, useState } from 'react'
import { Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { PageHeader } from '../../../shared/components/PageHeader'
import { Button } from '../../../shared/components/Button'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useSkills } from '../hooks/useSkills'
import { CorporateSkillFormModal } from '../components/CorporateSkillFormModal'
import type { Skill, SkillCategory } from '../types'

const STAT = 17
const categories: SkillCategory[] = ['technical', 'leadership', 'compliance', 'soft-skills', 'safety', 'other']

export function CorporateSkillsPage() {
  const { notify } = useToast()
  const { skills, createSkill, updateSkill, deleteSkill } = useSkills()
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; skill: Skill | null }>({
    open: false,
    mode: 'create',
    skill: null,
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return skills.filter((skill) => {
      const matchesCategory = categoryFilter === 'all' || skill.category === categoryFilter
      const matchesQuery =
        q === '' ||
        skill.name.toLowerCase().includes(q) ||
        skill.description.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [skills, query, categoryFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skills"
        subtitle="Maintain your organization's skill catalog for roles, training, and compliance."
        actions={
          <Button onClick={() => setModal({ open: true, mode: 'create', skill: null })}>
            <Plus size={15} />
            Add skill
          </Button>
        }
      />

      <StatBlock icon={<Sparkles size={STAT} />} label="Active skills" value={skills.filter((s) => s.status === 'active').length} />

      <GlassCard className="p-4 flex flex-wrap gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search skills…" className="flex-1 min-w-[200px]" />
        <SelectMenu
          value={categoryFilter}
          options={[{ value: 'all', label: 'All categories' }, ...categories.map((c) => ({ value: c, label: c }))]}
          onChange={setCategoryFilter}
        />
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((skill) => (
          <GlassCard key={skill.id} className="p-4">
            <div className="flex justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-bold text-navy-900">{skill.name}</h3>
                  <StatusPill label={skill.status} tone={skill.status === 'active' ? 'success' : 'neutral'} />
                </div>
                <p className="text-[11px] text-secondary-text uppercase mt-1">{skill.category}</p>
                <p className="text-[12px] text-secondary-text mt-2">{skill.description}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setModal({ open: true, mode: 'edit', skill })}>
                  <Pencil size={14} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { deleteSkill(skill.id); notify('Skill removed.', 'success') }}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <CorporateSkillFormModal
        open={modal.open}
        mode={modal.mode}
        skill={modal.skill}
        onClose={() => setModal({ open: false, mode: 'create', skill: null })}
        onSave={(values) => {
          if (modal.mode === 'create') {
            createSkill(values)
            notify('Skill created.', 'success')
          } else if (modal.skill) {
            updateSkill(modal.skill.id, values)
            notify('Skill updated.', 'success')
          }
          setModal({ open: false, mode: 'create', skill: null })
        }}
      />
    </div>
  )
}

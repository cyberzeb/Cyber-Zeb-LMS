import { useMemo, useState, useEffect } from 'react'
import {
  GraduationCap,
  CheckCircle2,
  Users,
  Award,
  Clock3,
  Plus,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  Eye,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { SearchInput } from '../../../shared/components/SearchInput'
import { StatusPill, type StatusTone } from '../../../shared/components/StatusPill'
import { Modal } from '../../../shared/components/Modal'
import { FormField } from '../../../shared/components/FormField'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useApiCollection } from '../../../shared/hooks/useApiCollection'
import { STORAGE_KEYS } from '../../../shared/storage/keys'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import {
  seedTrainingDivisions,
  seedTrainingPrograms,
} from '../data/trainingSeedData'
import type {
  DeliveryMode,
  TrainingDivision,
  TrainingProgram,
  TrainingProgramLevel,
  TrainingProgramStatus,
} from '../types'

const STAT_ICON_SIZE = 17

const statusTabs = ['All', 'Active', 'Draft', 'Archived']

const statusMap: Record<TrainingProgramStatus, { label: string; tone: StatusTone }> = {
  active: { label: 'Active', tone: 'success' },
  draft: { label: 'Draft', tone: 'warning' },
  archived: { label: 'Archived', tone: 'neutral' },
}

const levelColors: Record<TrainingProgramLevel, string> = {
  Foundational: 'bg-info-bg text-info ring-1 ring-info/20',
  Intermediate: 'bg-lemon-500/15 text-lemon-700 dark:text-lemon-400 ring-1 ring-lemon-500/30',
  Advanced: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/30',
  Executive: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/30',
}

const levelOptions: TrainingProgramLevel[] = [
  'Foundational',
  'Intermediate',
  'Advanced',
  'Executive',
]

const deliveryModeOptions: DeliveryMode[] = [
  'in-person',
  'online',
  'hybrid',
  'blended',
]

interface ProgramFormData {
  id?: string
  code: string
  name: string
  divisionId: string
  level: TrainingProgramLevel
  deliveryMode: DeliveryMode
  durationWeeks: number
  totalHours: number
  credentialType: string
  targetAudience: string
  skills: string
  leadTrainer: string
  description: string
  status: TrainingProgramStatus
}

const initialFormState: ProgramFormData = {
  code: '',
  name: '',
  divisionId: 'div-comp',
  level: 'Intermediate',
  deliveryMode: 'blended',
  durationWeeks: 6,
  totalHours: 40,
  credentialType: 'Professional Certificate of Completion',
  targetAudience: 'Banking Associates & Specialists',
  skills: 'Risk Analysis, Compliance Directives, Operations',
  leadTrainer: 'Dr. Martha Bekele',
  description: '',
  status: 'active',
}

export function TrainingProgramsPage() {
  const { notify } = useToast()

  const [programs, setPrograms] = useApiCollection<TrainingProgram[]>(
    STORAGE_KEYS.trainingPrograms,
    seedTrainingPrograms,
  )

  const [divisions] = useApiCollection<TrainingDivision[]>(
    STORAGE_KEYS.trainingDivisions,
    seedTrainingDivisions,
  )

  // Ensure initial seed is rendered if storage collection is empty
  useEffect(() => {
    if (!programs || programs.length === 0) {
      setPrograms(seedTrainingPrograms)
    }
  }, [programs, setPrograms])

  const [activeTab, setActiveTab] = useState('All')
  const [query, setQuery] = useState('')
  const [selectedDivision, setSelectedDivision] = useState('all')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(null)
  const [form, setForm] = useState<ProgramFormData>(initialFormState)

  const [detailsProgram, setDetailsProgram] = useState<TrainingProgram | null>(null)
  const [deleteConfirmProgram, setDeleteConfirmProgram] = useState<TrainingProgram | null>(null)

  // Division map for quick lookup
  const divisionMap = useMemo(() => {
    const map = new Map<string, string>()
    divisions.forEach((d) => map.set(d.id, d.name))
    return map
  }, [divisions])

  // Program list enriched with divisionName
  const enrichedPrograms = useMemo(() => {
    return (programs || []).map((p) => ({
      ...p,
      divisionName: p.divisionName || divisionMap.get(p.divisionId) || 'General Banking',
      level: p.level || 'Intermediate',
      enrolledCount: p.enrolledCount ?? 0,
      activeCohortsCount: p.activeCohortsCount ?? 0,
      completionRate: p.completionRate ?? 0,
    }))
  }, [programs, divisionMap])

  // KPIs
  const stats = useMemo(() => {
    const total = enrichedPrograms.length
    const active = enrichedPrograms.filter((p) => p.status === 'active').length
    const totalEnrolled = enrichedPrograms.reduce((sum, p) => sum + (p.enrolledCount || 0), 0)
    const activeWithRate = enrichedPrograms.filter((p) => p.status === 'active' && p.completionRate)
    const avgCompletion =
      activeWithRate.length > 0
        ? Math.round(
            activeWithRate.reduce((sum, p) => sum + (p.completionRate || 0), 0) /
              activeWithRate.length,
          )
        : 92
    const totalHours = enrichedPrograms.reduce((sum, p) => sum + (p.totalHours || 0), 0)

    return { total, active, totalEnrolled, avgCompletion, totalHours }
  }, [enrichedPrograms])

  // Filtered Programs
  const filteredPrograms = useMemo(() => {
    return enrichedPrograms.filter((p) => {
      const matchesTab =
        activeTab === 'All' || p.status.toLowerCase() === activeTab.toLowerCase()

      const matchesDivision =
        selectedDivision === 'all' || p.divisionId === selectedDivision

      const matchesLevel =
        selectedLevel === 'all' || p.level === selectedLevel

      const q = query.trim().toLowerCase()
      const matchesQuery =
        q === '' ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.divisionName?.toLowerCase().includes(q) ||
        p.credentialType.toLowerCase().includes(q) ||
        p.leadTrainer?.toLowerCase().includes(q) ||
        p.skills?.some((s) => s.toLowerCase().includes(q))

      return matchesTab && matchesDivision && matchesLevel && matchesQuery
    })
  }, [enrichedPrograms, activeTab, selectedDivision, selectedLevel, query])

  const openCreateModal = () => {
    setEditingProgram(null)
    setForm({
      ...initialFormState,
      divisionId: divisions[0]?.id || 'div-comp',
    })
    setIsEditModalOpen(true)
  }

  const openEditModal = (program: TrainingProgram) => {
    setEditingProgram(program)
    setForm({
      id: program.id,
      code: program.code,
      name: program.name,
      divisionId: program.divisionId,
      level: program.level || 'Intermediate',
      deliveryMode: program.deliveryMode || 'blended',
      durationWeeks: program.durationWeeks,
      totalHours: program.totalHours,
      credentialType: program.credentialType,
      targetAudience: program.targetAudience || 'Banking Professionals',
      skills: (program.skills || []).join(', '),
      leadTrainer: program.leadTrainer || 'Dr. Martha Bekele',
      description: program.description,
      status: program.status,
    })
    setIsEditModalOpen(true)
  }

  const handleSaveProgram = () => {
    if (!form.name.trim() || !form.code.trim()) {
      notify('Please specify both a Program Code and Program Name.', 'error')
      return
    }

    const divisionName = divisionMap.get(form.divisionId) || 'General Banking'
    const skillsList = form.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    if (editingProgram) {
      // Update existing
      setPrograms((prev) =>
        prev.map((p) =>
          p.id === editingProgram.id
            ? {
                ...p,
                code: form.code.trim().toUpperCase(),
                name: form.name.trim(),
                divisionId: form.divisionId,
                divisionName,
                level: form.level,
                deliveryMode: form.deliveryMode,
                durationWeeks: Number(form.durationWeeks) || 4,
                totalHours: Number(form.totalHours) || 30,
                credentialType: form.credentialType.trim(),
                targetAudience: form.targetAudience.trim(),
                skills: skillsList,
                leadTrainer: form.leadTrainer.trim(),
                description: form.description.trim(),
                status: form.status,
                updatedAt: new Date().toISOString(),
              }
            : p,
        ),
      )
      notify(`Program "${form.name}" has been updated.`, 'success')
    } else {
      // Create new
      const newProgram: TrainingProgram = {
        id: createId('tp'),
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        divisionId: form.divisionId,
        divisionName,
        level: form.level,
        deliveryMode: form.deliveryMode,
        durationWeeks: Number(form.durationWeeks) || 4,
        totalHours: Number(form.totalHours) || 30,
        credentialType: form.credentialType.trim(),
        targetAudience: form.targetAudience.trim(),
        skills: skillsList,
        leadTrainer: form.leadTrainer.trim(),
        description: form.description.trim(),
        status: form.status,
        enrolledCount: 0,
        activeCohortsCount: 0,
        completionRate: 0,
        modulesCount: 4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setPrograms((prev) => [newProgram, ...prev])
      notify(`New training program "${newProgram.name}" created successfully.`, 'success')
    }

    setIsEditModalOpen(false)
  }

  const handleDeleteProgram = () => {
    if (!deleteConfirmProgram) return
    setPrograms((prev) => prev.filter((p) => p.id !== deleteConfirmProgram.id))
    notify(`Program "${deleteConfirmProgram.name}" has been removed.`, 'success')
    setDeleteConfirmProgram(null)
    if (detailsProgram?.id === deleteConfirmProgram.id) {
      setDetailsProgram(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Training Programs"
        subtitle="Design, structure, and track organizational learning curriculums and professional certifications."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setPrograms(seedTrainingPrograms)
                notify('Reset to standard Horizon Bank demo programs.', 'info')
              }}
            >
              Reset Demo Data
            </Button>
            <Button onClick={openCreateModal}>
              <Plus size={16} />
              New Program
            </Button>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatBlock
          label="Total Programs"
          value={stats.total}
          sub="Catalog curriculum"
          icon={<GraduationCap size={STAT_ICON_SIZE} />}
          iconBg="bg-lemon-500/15 text-lemon-700 dark:text-lemon-400"
          trend="up"
          trendValue="+12%"
        />
        <StatBlock
          label="Active Tracks"
          value={stats.active}
          sub="Currently running"
          icon={<CheckCircle2 size={STAT_ICON_SIZE} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Enrolled Learners"
          value={stats.totalEnrolled.toLocaleString()}
          sub="Across all cohorts"
          icon={<Users size={STAT_ICON_SIZE} />}
          iconBg="bg-purple-500/15 text-purple-700 dark:text-purple-400"
          trend="up"
          trendValue="+18%"
        />
        <StatBlock
          label="Avg. Completion"
          value={`${stats.avgCompletion}%`}
          sub="Successful certification"
          icon={<Award size={STAT_ICON_SIZE} />}
          iconBg="bg-amber-500/15 text-amber-700 dark:text-amber-400"
        />
        <StatBlock
          label="Curriculum Hours"
          value={`${stats.totalHours} hrs`}
          sub="Structured learning"
          icon={<Clock3 size={STAT_ICON_SIZE} />}
          iconBg="bg-navy-50 text-navy-700"
        />
      </div>

      {/* Controls: Search, Filters & View Toggle */}
      <GlassCard className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterTabs
            tabs={statusTabs}
            active={activeTab}
            onChange={setActiveTab}
          />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg cursor-pointer transition-all border ${
                viewMode === 'grid'
                  ? 'bg-lemon-500/20 text-lemon-600 border-lemon-500/40'
                  : 'text-secondary-text border-divider hover:text-navy-900 hover:bg-navy-50'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg cursor-pointer transition-all border ${
                viewMode === 'table'
                  ? 'bg-lemon-500/20 text-lemon-600 border-lemon-500/40'
                  : 'text-secondary-text border-divider hover:text-navy-900 hover:bg-navy-50'
              }`}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-divider/60">
          <div className="md:col-span-2">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search by program name, code, division, trainer, or skills..."
            />
          </div>

          <div>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="w-full bg-white dark:bg-navy-50 border border-divider rounded-full px-4 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 cursor-pointer"
            >
              <option value="all">All Divisions</option>
              {divisions.map((div) => (
                <option key={div.id} value={div.id}>
                  {div.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full bg-white dark:bg-navy-50 border border-divider rounded-full px-4 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 cursor-pointer"
            >
              <option value="all">All Levels</option>
              {levelOptions.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl} Level
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Program Results */}
      {filteredPrograms.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-lemon-500/10 text-lemon-600 flex items-center justify-center mx-auto mb-3">
            <GraduationCap size={24} />
          </div>
          <h3 className="text-base font-bold text-navy-900">No training programs found</h3>
          <p className="text-sm text-secondary-text mt-1 max-w-md mx-auto">
            No programs match your search or filter criteria. Try adjusting your query or reset the filters.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setQuery('')
                setActiveTab('All')
                setSelectedDivision('all')
                setSelectedLevel('all')
              }}
            >
              Reset Filters
            </Button>
            <Button onClick={openCreateModal}>
              <Plus size={14} />
              Create Program
            </Button>
          </div>
        </GlassCard>
      ) : viewMode === 'grid' ? (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrograms.map((program) => {
            const status = statusMap[program.status]
            return (
              <GlassCard
                key={program.id}
                className="p-5 flex flex-col justify-between hover:shadow-lg transition-all border-divider/70 hover:border-lemon-500/40 group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full ${
                        levelColors[program.level || 'Intermediate']
                      }`}
                    >
                      {program.level}
                    </span>
                    <StatusPill label={status.label} tone={status.tone} />
                  </div>

                  {/* Title & Code */}
                  <div className="mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[11.5px] font-mono font-bold text-lemon-600 dark:text-lemon-400">
                        {program.code}
                      </span>
                      <span className="text-[11px] text-secondary-text uppercase tracking-wider">
                        • {program.deliveryMode || 'Blended'}
                      </span>
                    </div>
                    <h3
                      onClick={() => setDetailsProgram(program)}
                      className="text-[15px] font-bold text-navy-900 mt-1 line-clamp-2 cursor-pointer hover:text-lemon-600 transition-colors"
                    >
                      {program.name}
                    </h3>
                  </div>

                  {/* Division */}
                  <p className="text-[12px] font-medium text-navy-700/80 mb-2.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-lemon-500" />
                    {program.divisionName}
                  </p>

                  {/* Description */}
                  <p className="text-[12.5px] text-secondary-text line-clamp-2 leading-relaxed mb-4">
                    {program.description}
                  </p>

                  {/* Skills tags */}
                  {program.skills && program.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {program.skills.slice(0, 3).map((skill, i) => (
                        <span
                          key={i}
                          className="text-[10.5px] px-2 py-0.5 rounded bg-navy-50 text-navy-700 font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {program.skills.length > 3 && (
                        <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-navy-50 text-secondary-text font-medium">
                          +{program.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 border-t border-b border-divider/60 text-center my-3 bg-navy-50/40 rounded-lg">
                    <div>
                      <div className="text-[13px] font-bold text-navy-900">
                        {program.durationWeeks}w / {program.totalHours}h
                      </div>
                      <div className="text-[10.5px] text-secondary-text">Duration</div>
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-navy-900">
                        {program.enrolledCount}
                      </div>
                      <div className="text-[10.5px] text-secondary-text">Enrolled</div>
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-navy-900">
                        {program.activeCohortsCount}
                      </div>
                      <div className="text-[10.5px] text-secondary-text">Cohorts</div>
                    </div>
                  </div>

                  {/* Completion Rate Progress */}
                  {program.completionRate ? (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-secondary-text font-medium">Completion Rate</span>
                        <span className="font-bold text-navy-900">{program.completionRate}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-navy-50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-lemon-500 rounded-full transition-all"
                          style={{ width: `${program.completionRate}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {/* Trainer & Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-divider/40">
                    <div className="text-[11.5px] text-secondary-text truncate max-w-[150px]">
                      <span className="font-medium text-navy-900">{program.leadTrainer || 'Instructor Assigned'}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDetailsProgram(program)}
                        className="p-1.5 text-secondary-text hover:text-navy-900 hover:bg-navy-50 rounded-md transition-all cursor-pointer"
                        title="View Details"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => openEditModal(program)}
                        className="p-1.5 text-secondary-text hover:text-lemon-600 hover:bg-lemon-500/10 rounded-md transition-all cursor-pointer"
                        title="Edit Program"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmProgram(program)}
                        className="p-1.5 text-secondary-text hover:text-danger hover:bg-danger-bg rounded-md transition-all cursor-pointer"
                        title="Delete Program"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      ) : (
        /* Table View */
        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-divider bg-navy-50/60 text-secondary-text text-[11.5px] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Program & Code</th>
                  <th className="py-3 px-4">Division</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Enrolled</th>
                  <th className="py-3 px-4">Cohorts</th>
                  <th className="py-3 px-4">Completion</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/50">
                {filteredPrograms.map((program) => {
                  const status = statusMap[program.status]
                  return (
                    <tr
                      key={program.id}
                      onClick={() => setDetailsProgram(program)}
                      className="hover:bg-navy-50/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-navy-900">{program.name}</div>
                        <div className="text-[11.5px] text-secondary-text mt-0.5">
                          <span className="font-mono font-semibold text-lemon-600">
                            {program.code}
                          </span>{' '}
                          · {program.credentialType}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-navy-700 font-medium">
                        {program.divisionName}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md ${
                            levelColors[program.level || 'Intermediate']
                          }`}
                        >
                          {program.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-navy-900">
                        {program.durationWeeks} weeks ({program.totalHours} hrs)
                      </td>
                      <td className="py-3 px-4 font-semibold text-navy-900">
                        {program.enrolledCount}
                      </td>
                      <td className="py-3 px-4 text-navy-900">
                        {program.activeCohortsCount}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-navy-900">{program.completionRate}%</span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusPill label={status.label} tone={status.tone} />
                      </td>
                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(program)}
                            className="p-1.5 text-secondary-text hover:text-lemon-600 rounded hover:bg-navy-50 cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmProgram(program)}
                            className="p-1.5 text-secondary-text hover:text-danger rounded hover:bg-danger-bg cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Program Details Modal */}
      {detailsProgram && (
        <Modal
          open={Boolean(detailsProgram)}
          title={detailsProgram.name}
          description={`${detailsProgram.code} · ${detailsProgram.divisionName}`}
          icon={<BookOpen size={20} />}
          size="lg"
          onClose={() => setDetailsProgram(null)}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[12px] text-secondary-text">
                Lead Trainer: <strong>{detailsProgram.leadTrainer}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const prog = detailsProgram
                    setDetailsProgram(null)
                    openEditModal(prog)
                  }}
                >
                  <Edit2 size={14} />
                  Edit Program
                </Button>
                <Button onClick={() => setDetailsProgram(null)}>Close</Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-navy-900">
            {/* Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-navy-50/60 p-3 rounded-lg text-center">
              <div>
                <div className="text-[11px] text-secondary-text uppercase font-semibold">Level</div>
                <div className="text-[13px] font-bold mt-1 text-navy-900">{detailsProgram.level}</div>
              </div>
              <div>
                <div className="text-[11px] text-secondary-text uppercase font-semibold">Delivery</div>
                <div className="text-[13px] font-bold mt-1 capitalize text-navy-900">
                  {detailsProgram.deliveryMode || 'Blended'}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-secondary-text uppercase font-semibold">Duration</div>
                <div className="text-[13px] font-bold mt-1 text-navy-900">
                  {detailsProgram.durationWeeks} wks ({detailsProgram.totalHours} hrs)
                </div>
              </div>
              <div>
                <div className="text-[11px] text-secondary-text uppercase font-semibold">Completion</div>
                <div className="text-[13px] font-bold mt-1 text-navy-900">
                  {detailsProgram.completionRate}%
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-[12px] font-bold text-secondary-text uppercase tracking-wider mb-1">
                Curriculum Overview
              </h4>
              <p className="text-[13px] leading-relaxed text-navy-800">
                {detailsProgram.description}
              </p>
            </div>

            {/* Target Audience */}
            {detailsProgram.targetAudience && (
              <div>
                <h4 className="text-[12px] font-bold text-secondary-text uppercase tracking-wider mb-1">
                  Target Audience
                </h4>
                <p className="text-[13px] text-navy-800">{detailsProgram.targetAudience}</p>
              </div>
            )}

            {/* Credential */}
            <div>
              <h4 className="text-[12px] font-bold text-secondary-text uppercase tracking-wider mb-1">
                Certification Awarded
              </h4>
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-divider bg-lemon-500/5">
                <Award size={18} className="text-lemon-600" />
                <span className="text-[13px] font-semibold text-navy-900">
                  {detailsProgram.credentialType}
                </span>
              </div>
            </div>

            {/* Competencies / Skills */}
            {detailsProgram.skills && detailsProgram.skills.length > 0 && (
              <div>
                <h4 className="text-[12px] font-bold text-secondary-text uppercase tracking-wider mb-1.5">
                  Target Skills & Competencies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {detailsProgram.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[11.5px] px-2.5 py-1 rounded-full bg-navy-50 text-navy-800 font-medium border border-divider/60"
                    >
                      <Sparkles size={12} className="text-lemon-600" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Live Cohort & Learner Stats */}
            <div className="pt-2 border-t border-divider flex items-center justify-between text-[12px] text-secondary-text">
              <span>
                Enrolled Learners: <strong className="text-navy-900">{detailsProgram.enrolledCount}</strong>
              </span>
              <span>
                Active Cohorts: <strong className="text-navy-900">{detailsProgram.activeCohortsCount}</strong>
              </span>
              <span>
                Modules: <strong className="text-navy-900">{detailsProgram.modulesCount || 6}</strong>
              </span>
            </div>
          </div>
        </Modal>
      )}

      {/* New / Edit Program Modal */}
      {isEditModalOpen && (
        <Modal
          open={isEditModalOpen}
          title={editingProgram ? 'Edit Training Program' : 'Create New Training Program'}
          description="Define the curriculum metadata, certification, hours, and competencies for this program."
          icon={<GraduationCap size={20} />}
          size="lg"
          onClose={() => setIsEditModalOpen(false)}
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProgram}>
                {editingProgram ? 'Save Changes' : 'Create Program'}
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Program Code"
              value={form.code}
              onChange={(val) => setForm((f) => ({ ...f, code: val }))}
              placeholder="e.g. AML-201"
              hint="Unique program identifier (e.g. AML-201, BNK-101)"
            />

            <FormField
              label="Program Name"
              value={form.name}
              onChange={(val) => setForm((f) => ({ ...f, name: val }))}
              placeholder="e.g. Anti-Money Laundering & Financial Crime"
            />

            <FormField
              label="Training Division"
              type="select"
              value={divisions.find((d) => d.id === form.divisionId)?.name || ''}
              options={divisions.map((d) => d.name)}
              onChange={(val) => {
                const matched = divisions.find((d) => d.name === val)
                if (matched) setForm((f) => ({ ...f, divisionId: matched.id }))
              }}
            />

            <FormField
              label="Target Level"
              type="select"
              value={form.level}
              options={levelOptions}
              onChange={(val) => setForm((f) => ({ ...f, level: val as TrainingProgramLevel }))}
            />

            <FormField
              label="Delivery Mode"
              type="select"
              value={form.deliveryMode}
              options={deliveryModeOptions}
              onChange={(val) => setForm((f) => ({ ...f, deliveryMode: val as DeliveryMode }))}
            />

            <FormField
              label="Lead Trainer / Instructor"
              value={form.leadTrainer}
              onChange={(val) => setForm((f) => ({ ...f, leadTrainer: val }))}
              placeholder="e.g. Dr. Martha Bekele"
            />

            <FormField
              label="Duration (Weeks)"
              type="number"
              value={String(form.durationWeeks)}
              onChange={(val) => setForm((f) => ({ ...f, durationWeeks: Number(val) || 1 }))}
            />

            <FormField
              label="Total Training Hours"
              type="number"
              value={String(form.totalHours)}
              onChange={(val) => setForm((f) => ({ ...f, totalHours: Number(val) || 1 }))}
            />

            <div className="md:col-span-2">
              <FormField
                label="Certification / Credential Awarded"
                value={form.credentialType}
                onChange={(val) => setForm((f) => ({ ...f, credentialType: val }))}
                placeholder="e.g. Professional AML Specialist Certificate (NBE Compliant)"
              />
            </div>

            <div className="md:col-span-2">
              <FormField
                label="Target Audience"
                value={form.targetAudience}
                onChange={(val) => setForm((f) => ({ ...f, targetAudience: val }))}
                placeholder="e.g. Compliance Officers, Tellers, Risk Analysts"
              />
            </div>

            <div className="md:col-span-2">
              <FormField
                label="Key Skills & Competencies (comma-separated)"
                value={form.skills}
                onChange={(val) => setForm((f) => ({ ...f, skills: val }))}
                placeholder="e.g. AML/CFT Directives, Sanctions Screening, KYC"
              />
            </div>

            <div className="md:col-span-2">
              <FormField
                label="Program Description"
                type="textarea"
                value={form.description}
                onChange={(val) => setForm((f) => ({ ...f, description: val }))}
                placeholder="Detail the curriculum goals, practical case studies, and assessment requirements..."
              />
            </div>

            <FormField
              label="Status"
              type="select"
              value={form.status}
              options={['active', 'draft', 'archived']}
              onChange={(val) => setForm((f) => ({ ...f, status: val as TrainingProgramStatus }))}
            />
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmProgram && (
        <Modal
          open={Boolean(deleteConfirmProgram)}
          title="Delete Training Program"
          description={`Are you sure you want to remove "${deleteConfirmProgram.name}"? This action cannot be undone.`}
          icon={<Trash2 size={20} className="text-danger" />}
          onClose={() => setDeleteConfirmProgram(null)}
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="secondary" onClick={() => setDeleteConfirmProgram(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteProgram}>
                Delete Program
              </Button>
            </div>
          }
        >
          <p className="text-[13px] text-secondary-text">
            Deleting this program will remove it from active training catalog views. All cohort records associated with code <strong>{deleteConfirmProgram.code}</strong> should be reviewed.
          </p>
        </Modal>
      )}
    </div>
  )
}

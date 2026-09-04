import { useMemo, useState, useEffect } from 'react'
import {
  Layers,
  CheckCircle2,
  Users,
  Calendar,
  Clock3,
  Plus,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  Eye,
  MapPin,
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
  seedCohorts,
  seedTrainingPrograms,
  seedTrainers,
} from '../data/trainingSeedData'
import type {
  Cohort,
  CohortStatus,
  DeliveryMode,
  Trainer,
  TrainingProgram,
} from '../types'

const STAT_ICON_SIZE = 17

const statusTabs = ['All', 'Active', 'Upcoming', 'Completed']

const statusMap: Record<CohortStatus, { label: string; tone: StatusTone }> = {
  active: { label: 'Active', tone: 'success' },
  upcoming: { label: 'Upcoming', tone: 'info' },
  completed: { label: 'Completed', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
}

const deliveryModeColors: Record<DeliveryMode, string> = {
  'in-person': 'bg-navy-50 text-navy-700 ring-1 ring-navy-900/10',
  online: 'bg-info-bg text-info ring-1 ring-info/20',
  hybrid: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/30',
  blended: 'bg-lemon-500/15 text-lemon-700 dark:text-lemon-400 ring-1 ring-lemon-500/30',
}

interface CohortFormData {
  id?: string
  programId: string
  name: string
  code: string
  startDate: string
  endDate: string
  seatCapacity: number
  deliveryMode: DeliveryMode
  status: CohortStatus
  trainerId: string
  location: string
  schedule: string
}

const initialFormState: CohortFormData = {
  programId: 'tp-101',
  name: '',
  code: '',
  startDate: '2026-03-15',
  endDate: '2026-04-30',
  seatCapacity: 35,
  deliveryMode: 'blended',
  status: 'upcoming',
  trainerId: 'tr-1',
  location: 'Head Office Training Suite',
  schedule: 'Mon & Wed, 5:30 PM - 7:30 PM',
}

export function CohortsPage() {
  const { notify } = useToast()

  const [cohorts, setCohorts] = useApiCollection<Cohort[]>(
    STORAGE_KEYS.cohorts,
    seedCohorts,
  )

  const [programs] = useApiCollection<TrainingProgram[]>(
    STORAGE_KEYS.trainingPrograms,
    seedTrainingPrograms,
  )

  const [trainers] = useApiCollection<Trainer[]>(
    STORAGE_KEYS.trainers,
    seedTrainers,
  )

  // Auto-seed if empty
  useEffect(() => {
    if (!cohorts || cohorts.length === 0) {
      setCohorts(seedCohorts)
    }
  }, [cohorts, setCohorts])

  const [activeTab, setActiveTab] = useState('All')
  const [query, setQuery] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('all')
  const [selectedDelivery, setSelectedDelivery] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null)
  const [form, setForm] = useState<CohortFormData>(initialFormState)

  const [detailsCohort, setDetailsCohort] = useState<Cohort | null>(null)
  const [deleteConfirmCohort, setDeleteConfirmCohort] = useState<Cohort | null>(null)

  // Map helpers
  const programMap = useMemo(() => {
    const map = new Map<string, TrainingProgram>()
    programs.forEach((p) => map.set(p.id, p))
    return map
  }, [programs])

  const trainerMap = useMemo(() => {
    const map = new Map<string, Trainer>()
    trainers.forEach((t) => map.set(t.id, t))
    return map
  }, [trainers])

  // Enriched cohorts
  const enrichedCohorts = useMemo(() => {
    return (cohorts || []).map((c) => {
      const prog = programMap.get(c.programId)
      const trn = c.trainerId ? trainerMap.get(c.trainerId) : undefined
      return {
        ...c,
        programName: c.programName || prog?.name || 'Professional Program',
        programCode: c.programCode || prog?.code || 'TRN',
        trainerName: c.trainerName || trn?.name || 'Dr. Martha Bekele',
        progress: c.progress ?? 0,
      }
    })
  }, [cohorts, programMap, trainerMap])

  // KPIs
  const stats = useMemo(() => {
    const total = enrichedCohorts.length
    const active = enrichedCohorts.filter((c) => c.status === 'active').length
    const totalEnrolled = enrichedCohorts.reduce((sum, c) => sum + (c.enrolledCount || 0), 0)
    const totalCapacity = enrichedCohorts.reduce((sum, c) => sum + (c.seatCapacity || 0), 0)
    const utilization =
      totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 85
    const completed = enrichedCohorts.filter((c) => c.status === 'completed').length

    return { total, active, totalEnrolled, totalCapacity, utilization, completed }
  }, [enrichedCohorts])

  // Filtered
  const filteredCohorts = useMemo(() => {
    return enrichedCohorts.filter((c) => {
      const matchesTab =
        activeTab === 'All' || c.status.toLowerCase() === activeTab.toLowerCase()

      const matchesProg =
        selectedProgram === 'all' || c.programId === selectedProgram

      const matchesDelivery =
        selectedDelivery === 'all' || c.deliveryMode === selectedDelivery

      const q = query.trim().toLowerCase()
      const matchesQuery =
        q === '' ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.programName?.toLowerCase().includes(q) ||
        c.trainerName?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q)

      return matchesTab && matchesProg && matchesDelivery && matchesQuery
    })
  }, [enrichedCohorts, activeTab, selectedProgram, selectedDelivery, query])

  const openCreateModal = () => {
    setEditingCohort(null)
    setForm({
      ...initialFormState,
      programId: programs[0]?.id || 'tp-101',
      trainerId: trainers[0]?.id || 'tr-1',
    })
    setIsEditModalOpen(true)
  }

  const openEditModal = (cohort: Cohort) => {
    setEditingCohort(cohort)
    setForm({
      id: cohort.id,
      programId: cohort.programId,
      name: cohort.name,
      code: cohort.code,
      startDate: cohort.startDate,
      endDate: cohort.endDate,
      seatCapacity: cohort.seatCapacity,
      deliveryMode: cohort.deliveryMode,
      status: cohort.status,
      trainerId: cohort.trainerId || trainers[0]?.id || 'tr-1',
      location: cohort.location || 'Head Office Training Center',
      schedule: cohort.schedule || 'Mon & Wed, 5:30 PM - 7:30 PM',
    })
    setIsEditModalOpen(true)
  }

  const handleSaveCohort = () => {
    if (!form.name.trim() || !form.code.trim()) {
      notify('Please provide both a Cohort Code and Name.', 'error')
      return
    }

    const prog = programMap.get(form.programId)
    const trn = trainerMap.get(form.trainerId)

    if (editingCohort) {
      setCohorts((prev) =>
        prev.map((c) =>
          c.id === editingCohort.id
            ? {
                ...c,
                programId: form.programId,
                programName: prog?.name || c.programName,
                programCode: prog?.code || c.programCode,
                name: form.name.trim(),
                code: form.code.trim().toUpperCase(),
                startDate: form.startDate,
                endDate: form.endDate,
                seatCapacity: Number(form.seatCapacity) || 30,
                deliveryMode: form.deliveryMode,
                status: form.status,
                trainerId: form.trainerId,
                trainerName: trn?.name || c.trainerName,
                location: form.location.trim(),
                schedule: form.schedule.trim(),
                updatedAt: new Date().toISOString(),
              }
            : c,
        ),
      )
      notify(`Cohort "${form.name}" has been updated.`, 'success')
    } else {
      const newCohort: Cohort = {
        id: createId('coh'),
        programId: form.programId,
        programName: prog?.name || 'Professional Program',
        programCode: prog?.code || 'PRG',
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        startDate: form.startDate,
        endDate: form.endDate,
        seatCapacity: Number(form.seatCapacity) || 30,
        enrolledCount: 0,
        deliveryMode: form.deliveryMode,
        status: form.status,
        trainerId: form.trainerId,
        trainerName: trn?.name || 'Dr. Martha Bekele',
        location: form.location.trim(),
        schedule: form.schedule.trim(),
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setCohorts((prev) => [newCohort, ...prev])
      notify(`New cohort "${newCohort.name}" created successfully.`, 'success')
    }

    setIsEditModalOpen(false)
  }

  const handleDeleteCohort = () => {
    if (!deleteConfirmCohort) return
    setCohorts((prev) => prev.filter((c) => c.id !== deleteConfirmCohort.id))
    notify(`Cohort "${deleteConfirmCohort.name}" has been deleted.`, 'success')
    setDeleteConfirmCohort(null)
    if (detailsCohort?.id === deleteConfirmCohort.id) {
      setDetailsCohort(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Training Cohorts"
        subtitle="Schedule and monitor class intakes, room allocation, seats, syllabus progress, and trainer assignments."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setCohorts(seedCohorts)
                notify('Reset to default Horizon Bank cohort demo data.', 'info')
              }}
            >
              Reset Demo Data
            </Button>
            <Button onClick={openCreateModal}>
              <Plus size={16} />
              New Cohort
            </Button>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatBlock
          label="Total Cohorts"
          value={stats.total}
          sub="Planned & active intakes"
          icon={<Layers size={STAT_ICON_SIZE} />}
          iconBg="bg-lemon-500/15 text-lemon-700 dark:text-lemon-400"
          trend="up"
          trendValue="+14%"
        />
        <StatBlock
          label="Active Cohorts"
          value={stats.active}
          sub="Currently in session"
          icon={<CheckCircle2 size={STAT_ICON_SIZE} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Trainees Enrolled"
          value={stats.totalEnrolled}
          sub={`Capacity: ${stats.totalCapacity}`}
          icon={<Users size={STAT_ICON_SIZE} />}
          iconBg="bg-purple-500/15 text-purple-700 dark:text-purple-400"
        />
        <StatBlock
          label="Seat Utilization"
          value={`${stats.utilization}%`}
          sub="Capacity utilization"
          icon={<Sparkles size={STAT_ICON_SIZE} />}
          iconBg="bg-amber-500/15 text-amber-700 dark:text-amber-400"
          trend="up"
          trendValue="+6%"
        />
        <StatBlock
          label="Completed"
          value={stats.completed}
          sub="Graduated batches"
          icon={<Clock3 size={STAT_ICON_SIZE} />}
          iconBg="bg-navy-50 text-navy-700"
        />
      </div>

      {/* Search & Filter Bar */}
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
              title="Cards View"
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
              placeholder="Search by cohort name, code, program, or trainer..."
            />
          </div>

          <div>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full bg-white dark:bg-navy-50 border border-divider rounded-full px-4 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 cursor-pointer"
            >
              <option value="all">All Programs</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedDelivery}
              onChange={(e) => setSelectedDelivery(e.target.value)}
              className="w-full bg-white dark:bg-navy-50 border border-divider rounded-full px-4 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 cursor-pointer"
            >
              <option value="all">All Delivery Modes</option>
              <option value="in-person">In-Person</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
              <option value="blended">Blended</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Cohorts Results */}
      {filteredCohorts.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-lemon-500/10 text-lemon-600 flex items-center justify-center mx-auto mb-3">
            <Layers size={24} />
          </div>
          <h3 className="text-base font-bold text-navy-900">No cohorts found</h3>
          <p className="text-sm text-secondary-text mt-1 max-w-md mx-auto">
            No training cohorts match your filter criteria. Try clearing the search or reset filters.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setQuery('')
                setActiveTab('All')
                setSelectedProgram('all')
                setSelectedDelivery('all')
              }}
            >
              Reset Filters
            </Button>
            <Button onClick={openCreateModal}>
              <Plus size={14} />
              Schedule Cohort
            </Button>
          </div>
        </GlassCard>
      ) : viewMode === 'grid' ? (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCohorts.map((cohort) => {
            const status = statusMap[cohort.status]
            const utilization = Math.round(
              (cohort.enrolledCount / (cohort.seatCapacity || 1)) * 100,
            )
            return (
              <GlassCard
                key={cohort.id}
                className="p-5 flex flex-col justify-between hover:shadow-lg transition-all border-divider/70 hover:border-lemon-500/40 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                        deliveryModeColors[cohort.deliveryMode || 'blended']
                      }`}
                    >
                      {cohort.deliveryMode}
                    </span>
                    <StatusPill label={status.label} tone={status.tone} />
                  </div>

                  <div className="mb-2">
                    <span className="text-[11px] font-mono font-bold text-lemon-600 dark:text-lemon-400">
                      {cohort.code}
                    </span>
                    <h3
                      onClick={() => setDetailsCohort(cohort)}
                      className="text-[15px] font-bold text-navy-900 mt-0.5 line-clamp-2 cursor-pointer hover:text-lemon-600 transition-colors"
                    >
                      {cohort.name}
                    </h3>
                  </div>

                  <p className="text-[12px] font-medium text-navy-700/80 mb-3 flex items-center gap-1.5">
                    <BookOpen size={13} className="text-secondary-text" />
                    <span className="truncate">{cohort.programName}</span>
                  </p>

                  <div className="space-y-1.5 text-[12px] text-secondary-text mb-4 bg-navy-50/50 p-2.5 rounded-lg border border-divider/50">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-secondary-text shrink-0" />
                      <span>
                        {cohort.startDate} → {cohort.endDate}
                      </span>
                    </div>
                    {cohort.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-secondary-text shrink-0" />
                        <span className="truncate">{cohort.location}</span>
                      </div>
                    )}
                    {cohort.schedule && (
                      <div className="flex items-center gap-2">
                        <Clock3 size={13} className="text-secondary-text shrink-0" />
                        <span className="truncate">{cohort.schedule}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  {/* Progress & Seats */}
                  <div className="space-y-2 py-2.5 border-t border-b border-divider/60 my-2">
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-secondary-text">Learner Seats</span>
                        <span className="font-bold text-navy-900">
                          {cohort.enrolledCount} / {cohort.seatCapacity} ({utilization}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-navy-50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        />
                      </div>
                    </div>

                    {cohort.progress !== undefined && (
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-secondary-text">Curriculum Progress</span>
                          <span className="font-bold text-navy-900">{cohort.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-navy-50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-lemon-500 rounded-full"
                            style={{ width: `${cohort.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Trainer & Action Menu */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-[11.5px] text-secondary-text truncate max-w-[160px]">
                      Trainer: <strong className="text-navy-900">{cohort.trainerName}</strong>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDetailsCohort(cohort)}
                        className="p-1.5 text-secondary-text hover:text-navy-900 hover:bg-navy-50 rounded-md transition-all cursor-pointer"
                        title="View Details"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => openEditModal(cohort)}
                        className="p-1.5 text-secondary-text hover:text-lemon-600 hover:bg-lemon-500/10 rounded-md transition-all cursor-pointer"
                        title="Edit Cohort"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmCohort(cohort)}
                        className="p-1.5 text-secondary-text hover:text-danger hover:bg-danger-bg rounded-md transition-all cursor-pointer"
                        title="Delete Cohort"
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
                  <th className="py-3 px-4">Cohort & Code</th>
                  <th className="py-3 px-4">Program</th>
                  <th className="py-3 px-4">Delivery</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Seats</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Trainer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/50">
                {filteredCohorts.map((cohort) => {
                  const status = statusMap[cohort.status]
                  return (
                    <tr
                      key={cohort.id}
                      onClick={() => setDetailsCohort(cohort)}
                      className="hover:bg-navy-50/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-navy-900">{cohort.name}</div>
                        <div className="text-[11.5px] font-mono text-lemon-600 font-semibold">
                          {cohort.code}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-navy-800">
                        {cohort.programName}
                      </td>
                      <td className="py-3 px-4 capitalize">
                        <span
                          className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md ${
                            deliveryModeColors[cohort.deliveryMode || 'blended']
                          }`}
                        >
                          {cohort.deliveryMode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-secondary-text">
                        {cohort.startDate} → {cohort.endDate}
                      </td>
                      <td className="py-3 px-4 font-semibold text-navy-900">
                        {cohort.enrolledCount} / {cohort.seatCapacity}
                      </td>
                      <td className="py-3 px-4 font-bold text-navy-900">
                        {cohort.progress}%
                      </td>
                      <td className="py-3 px-4 text-navy-900 font-medium">
                        {cohort.trainerName}
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
                            onClick={() => openEditModal(cohort)}
                            className="p-1.5 text-secondary-text hover:text-lemon-600 rounded hover:bg-navy-50 cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmCohort(cohort)}
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

      {/* Cohort Details Modal */}
      {detailsCohort && (
        <Modal
          open={Boolean(detailsCohort)}
          title={detailsCohort.name}
          description={`${detailsCohort.code} · ${detailsCohort.programName}`}
          icon={<Layers size={20} />}
          size="lg"
          onClose={() => setDetailsCohort(null)}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[12px] text-secondary-text">
                Assigned Trainer: <strong>{detailsCohort.trainerName}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const c = detailsCohort
                    setDetailsCohort(null)
                    openEditModal(c)
                  }}
                >
                  <Edit2 size={14} />
                  Edit Cohort
                </Button>
                <Button onClick={() => setDetailsCohort(null)}>Close</Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-navy-900">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-navy-50/60 p-3 rounded-lg text-center">
              <div>
                <div className="text-[11px] text-secondary-text uppercase font-semibold">Delivery</div>
                <div className="text-[13px] font-bold mt-1 capitalize">{detailsCohort.deliveryMode}</div>
              </div>
              <div>
                <div className="text-[11px] text-secondary-text uppercase font-semibold">Seats Filled</div>
                <div className="text-[13px] font-bold mt-1">
                  {detailsCohort.enrolledCount} / {detailsCohort.seatCapacity}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-secondary-text uppercase font-semibold">Status</div>
                <div className="text-[13px] font-bold mt-1 capitalize">{detailsCohort.status}</div>
              </div>
              <div>
                <div className="text-[11px] text-secondary-text uppercase font-semibold">Progress</div>
                <div className="text-[13px] font-bold mt-1">{detailsCohort.progress}%</div>
              </div>
            </div>

            <div>
              <h4 className="text-[12px] font-bold text-secondary-text uppercase tracking-wider mb-1">
                Schedule & Location
              </h4>
              <div className="p-3 bg-navy-50/40 rounded-lg border border-divider/60 space-y-1 text-[13px]">
                <p>
                  <strong>Dates:</strong> {detailsCohort.startDate} to {detailsCohort.endDate}
                </p>
                <p>
                  <strong>Class Schedule:</strong> {detailsCohort.schedule || 'Scheduled sessions'}
                </p>
                <p>
                  <strong>Facility:</strong> {detailsCohort.location || 'Virtual / In-person Hub'}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-[12px] font-bold text-secondary-text uppercase tracking-wider mb-1">
                Curriculum Track
              </h4>
              <p className="text-[13px] leading-relaxed text-navy-800">
                This intake delivers the official curriculum for <strong>{detailsCohort.programName}</strong>. All enrolled participants attend scheduled interactive lectures, complete hands-on simulation modules, and sit for certification assessment.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* New / Edit Cohort Modal */}
      {isEditModalOpen && (
        <Modal
          open={isEditModalOpen}
          title={editingCohort ? 'Edit Training Cohort' : 'Schedule New Cohort'}
          description="Configure cohort intake dates, seating capacity, facility location, and trainer allocation."
          icon={<Layers size={20} />}
          size="lg"
          onClose={() => setIsEditModalOpen(false)}
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCohort}>
                {editingCohort ? 'Save Changes' : 'Schedule Cohort'}
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Cohort Code"
              value={form.code}
              onChange={(val) => setForm((f) => ({ ...f, code: val }))}
              placeholder="e.g. COH-AML-26C"
            />

            <FormField
              label="Cohort Intake Name"
              value={form.name}
              onChange={(val) => setForm((f) => ({ ...f, name: val }))}
              placeholder="e.g. Summer 2026 AML Fast-Track"
            />

            <FormField
              label="Training Program"
              type="select"
              value={programs.find((p) => p.id === form.programId)?.name || ''}
              options={programs.map((p) => p.name)}
              onChange={(val) => {
                const matched = programs.find((p) => p.name === val)
                if (matched) setForm((f) => ({ ...f, programId: matched.id }))
              }}
            />

            <FormField
              label="Assigned Trainer"
              type="select"
              value={trainers.find((t) => t.id === form.trainerId)?.name || ''}
              options={trainers.map((t) => t.name)}
              onChange={(val) => {
                const matched = trainers.find((t) => t.name === val)
                if (matched) setForm((f) => ({ ...f, trainerId: matched.id }))
              }}
            />

            <FormField
              label="Start Date"
              value={form.startDate}
              onChange={(val) => setForm((f) => ({ ...f, startDate: val }))}
              placeholder="YYYY-MM-DD"
            />

            <FormField
              label="End Date"
              value={form.endDate}
              onChange={(val) => setForm((f) => ({ ...f, endDate: val }))}
              placeholder="YYYY-MM-DD"
            />

            <FormField
              label="Seat Capacity"
              type="number"
              value={String(form.seatCapacity)}
              onChange={(val) => setForm((f) => ({ ...f, seatCapacity: Number(val) || 10 }))}
            />

            <FormField
              label="Delivery Mode"
              type="select"
              value={form.deliveryMode}
              options={['in-person', 'online', 'hybrid', 'blended']}
              onChange={(val) => setForm((f) => ({ ...f, deliveryMode: val as DeliveryMode }))}
            />

            <div className="md:col-span-2">
              <FormField
                label="Facility / Room Location"
                value={form.location}
                onChange={(val) => setForm((f) => ({ ...f, location: val }))}
                placeholder="e.g. Head Office Training Center · Room 402"
              />
            </div>

            <div className="md:col-span-2">
              <FormField
                label="Schedule & Meeting Times"
                value={form.schedule}
                onChange={(val) => setForm((f) => ({ ...f, schedule: val }))}
                placeholder="e.g. Mon & Wed, 5:30 PM - 7:30 PM"
              />
            </div>

            <FormField
              label="Status"
              type="select"
              value={form.status}
              options={['upcoming', 'active', 'completed', 'cancelled']}
              onChange={(val) => setForm((f) => ({ ...f, status: val as CohortStatus }))}
            />
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmCohort && (
        <Modal
          open={Boolean(deleteConfirmCohort)}
          title="Delete Cohort"
          description={`Are you sure you want to delete "${deleteConfirmCohort.name}"?`}
          icon={<Trash2 size={20} className="text-danger" />}
          onClose={() => setDeleteConfirmCohort(null)}
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="secondary" onClick={() => setDeleteConfirmCohort(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteCohort}>
                Delete Cohort
              </Button>
            </div>
          }
        >
          <p className="text-[13px] text-secondary-text">
            Deleting this cohort will unassign all current class sessions. Ensure that learner progress has been archived.
          </p>
        </Modal>
      )}
    </div>
  )
}

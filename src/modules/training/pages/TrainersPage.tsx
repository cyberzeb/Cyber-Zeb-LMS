import { useMemo, useState, useEffect } from 'react'
import {
  UserCheck,
  CheckCircle2,
  Star,
  Layers,
  Award,
  Plus,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  Eye,
  Mail,
  Phone,
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
import { Monogram } from '../../../shared/components/Monogram'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useApiCollection } from '../../../shared/hooks/useApiCollection'
import { STORAGE_KEYS } from '../../../shared/storage/keys'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import {
  seedTrainers,
  seedTrainingDivisions,
} from '../data/trainingSeedData'
import type {
  Trainer,
  TrainerStatus,
  TrainingDivision,
} from '../types'

const STAT_ICON_SIZE = 17

const statusTabs = ['All', 'Active', 'Available', 'On-Leave']

const statusMap: Record<TrainerStatus, { label: string; tone: StatusTone }> = {
  active: { label: 'Active', tone: 'success' },
  available: { label: 'Available', tone: 'info' },
  'on-leave': { label: 'On Leave', tone: 'warning' },
}

interface TrainerFormData {
  id?: string
  name: string
  email: string
  phone: string
  specialization: string
  divisionId: string
  status: TrainerStatus
  rating: number
  bio: string
  certifications: string
}

const initialFormState: TrainerFormData = {
  name: '',
  email: '',
  phone: '+251 911 000 000',
  specialization: 'AML / CFT & Regulatory Compliance',
  divisionId: 'div-comp',
  status: 'active',
  rating: 4.9,
  bio: '',
  certifications: 'CAMS Certified, ICA Anti-Money Laundering Diploma',
}

export function TrainersPage() {
  const { notify } = useToast()

  const [trainers, setTrainers] = useApiCollection<Trainer[]>(
    STORAGE_KEYS.trainers,
    seedTrainers,
  )

  const [divisions] = useApiCollection<TrainingDivision[]>(
    STORAGE_KEYS.trainingDivisions,
    seedTrainingDivisions,
  )

  // Auto-seed if empty
  useEffect(() => {
    if (!trainers || trainers.length === 0) {
      setTrainers(seedTrainers)
    }
  }, [trainers, setTrainers])

  const [activeTab, setActiveTab] = useState('All')
  const [query, setQuery] = useState('')
  const [selectedDivision, setSelectedDivision] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null)
  const [form, setForm] = useState<TrainerFormData>(initialFormState)

  const [detailsTrainer, setDetailsTrainer] = useState<Trainer | null>(null)
  const [deleteConfirmTrainer, setDeleteConfirmTrainer] = useState<Trainer | null>(null)

  const divisionMap = useMemo(() => {
    const map = new Map<string, string>()
    divisions.forEach((d) => map.set(d.id, d.name))
    return map
  }, [divisions])

  // KPIs
  const stats = useMemo(() => {
    const total = trainers.length
    const active = trainers.filter((t) => t.status === 'active').length
    const totalCohorts = trainers.reduce((sum, t) => sum + (t.activeCohortsCount || 0), 0)
    const totalLearners = trainers.reduce((sum, t) => sum + (t.totalLearnersTrained || 0), 0)
    const avgRating =
      trainers.length > 0
        ? (
            trainers.reduce((sum, t) => sum + (t.rating || 4.5), 0) /
            trainers.length
          ).toFixed(1)
        : '4.9'

    return { total, active, totalCohorts, totalLearners, avgRating }
  }, [trainers])

  // Filtered
  const filteredTrainers = useMemo(() => {
    return (trainers || []).filter((t) => {
      const matchesTab =
        activeTab === 'All' ||
        t.status.toLowerCase().replace('-', '') ===
          activeTab.toLowerCase().replace('-', '')

      const matchesDiv =
        selectedDivision === 'all' || t.divisionId === selectedDivision

      const q = query.trim().toLowerCase()
      const matchesQuery =
        q === '' ||
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.specialization.toLowerCase().includes(q) ||
        t.divisionName?.toLowerCase().includes(q)

      return matchesTab && matchesDiv && matchesQuery
    })
  }, [trainers, activeTab, selectedDivision, query])

  const openCreateModal = () => {
    setEditingTrainer(null)
    setForm({
      ...initialFormState,
      divisionId: divisions[0]?.id || 'div-comp',
    })
    setIsEditModalOpen(true)
  }

  const openEditModal = (trainer: Trainer) => {
    setEditingTrainer(trainer)
    setForm({
      id: trainer.id,
      name: trainer.name,
      email: trainer.email,
      phone: trainer.phone || '+251 911 000 000',
      specialization: trainer.specialization,
      divisionId: trainer.divisionId,
      status: trainer.status,
      rating: trainer.rating || 4.9,
      bio: trainer.bio || '',
      certifications: (trainer.certifications || []).join(', '),
    })
    setIsEditModalOpen(true)
  }

  const handleSaveTrainer = () => {
    if (!form.name.trim() || !form.email.trim()) {
      notify('Please enter both trainer name and email address.', 'error')
      return
    }

    const divName = divisionMap.get(form.divisionId) || 'Regulatory Compliance'
    const certs = form.certifications
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)

    if (editingTrainer) {
      setTrainers((prev) =>
        prev.map((t) =>
          t.id === editingTrainer.id
            ? {
                ...t,
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                phone: form.phone.trim(),
                specialization: form.specialization.trim(),
                divisionId: form.divisionId,
                divisionName: divName,
                status: form.status,
                rating: Number(form.rating) || 4.9,
                bio: form.bio.trim(),
                certifications: certs,
                updatedAt: new Date().toISOString(),
              }
            : t,
        ),
      )
      notify(`Trainer profile "${form.name}" has been updated.`, 'success')
    } else {
      const newTrainer: Trainer = {
        id: createId('tr'),
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        specialization: form.specialization.trim(),
        divisionId: form.divisionId,
        divisionName: divName,
        activeCohortsCount: 1,
        totalLearnersTrained: 0,
        rating: Number(form.rating) || 4.9,
        status: form.status,
        bio: form.bio.trim(),
        certifications: certs,
        joinedDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setTrainers((prev) => [newTrainer, ...prev])
      notify(`New trainer "${newTrainer.name}" registered successfully.`, 'success')
    }

    setIsEditModalOpen(false)
  }

  const handleDeleteTrainer = () => {
    if (!deleteConfirmTrainer) return
    setTrainers((prev) => prev.filter((t) => t.id !== deleteConfirmTrainer.id))
    notify(`Trainer "${deleteConfirmTrainer.name}" has been removed.`, 'success')
    setDeleteConfirmTrainer(null)
    if (detailsTrainer?.id === deleteConfirmTrainer.id) {
      setDetailsTrainer(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Trainers & Instructors"
        subtitle="Manage certified instructors, cohort allocations, learner satisfaction ratings, and master faculty credentials."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setTrainers(seedTrainers)
                notify('Reset to default Horizon Bank trainer demo data.', 'info')
              }}
            >
              Reset Demo Data
            </Button>
            <Button onClick={openCreateModal}>
              <Plus size={16} />
              Add Trainer
            </Button>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatBlock
          label="Total Faculty"
          value={stats.total}
          sub="Certified instructors"
          icon={<UserCheck size={STAT_ICON_SIZE} />}
          iconBg="bg-lemon-500/15 text-lemon-700 dark:text-lemon-400"
          trend="up"
          trendValue="+10%"
        />
        <StatBlock
          label="Active Instructors"
          value={stats.active}
          sub="Currently teaching"
          icon={<CheckCircle2 size={STAT_ICON_SIZE} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Cohorts Assigned"
          value={stats.totalCohorts}
          sub="Active class intakes"
          icon={<Layers size={STAT_ICON_SIZE} />}
          iconBg="bg-purple-500/15 text-purple-700 dark:text-purple-400"
        />
        <StatBlock
          label="Avg Rating"
          value={`${stats.avgRating} ★`}
          sub="Learner evaluation score"
          icon={<Star size={STAT_ICON_SIZE} />}
          iconBg="bg-amber-500/15 text-amber-700 dark:text-amber-400"
        />
        <StatBlock
          label="Trained Learners"
          value={stats.totalLearners.toLocaleString()}
          sub="Historical trainees"
          icon={<Award size={STAT_ICON_SIZE} />}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-divider/60">
          <div className="md:col-span-2">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search by trainer name, email, specialization, or division..."
            />
          </div>

          <div>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="w-full bg-white dark:bg-navy-50 border border-divider rounded-full px-4 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 cursor-pointer"
            >
              <option value="all">All Divisions</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Trainers Results */}
      {filteredTrainers.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-lemon-500/10 text-lemon-600 flex items-center justify-center mx-auto mb-3">
            <UserCheck size={24} />
          </div>
          <h3 className="text-base font-bold text-navy-900">No trainers found</h3>
          <p className="text-sm text-secondary-text mt-1 max-w-md mx-auto">
            No instructors match your search criteria. Try clearing the search or reset filters.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setQuery('')
                setActiveTab('All')
                setSelectedDivision('all')
              }}
            >
              Reset Filters
            </Button>
            <Button onClick={openCreateModal}>
              <Plus size={14} />
              Add Trainer
            </Button>
          </div>
        </GlassCard>
      ) : viewMode === 'grid' ? (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrainers.map((trainer) => {
            const status = statusMap[trainer.status]
            return (
              <GlassCard
                key={trainer.id}
                className="p-5 flex flex-col justify-between hover:shadow-lg transition-all border-divider/70 hover:border-lemon-500/40 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <Monogram label={trainer.name} size="md" />
                      <div>
                        <h3
                          onClick={() => setDetailsTrainer(trainer)}
                          className="text-[14.5px] font-bold text-navy-900 cursor-pointer hover:text-lemon-600 transition-colors"
                        >
                          {trainer.name}
                        </h3>
                        <p className="text-[12px] text-lemon-700 dark:text-lemon-400 font-medium">
                          {trainer.specialization}
                        </p>
                      </div>
                    </div>
                    <StatusPill label={status.label} tone={status.tone} />
                  </div>

                  <p className="text-[12px] text-secondary-text mb-2.5">
                    <strong>Division:</strong> {trainer.divisionName}
                  </p>

                  <p className="text-[12.5px] text-secondary-text line-clamp-2 leading-relaxed mb-3">
                    {trainer.bio}
                  </p>

                  {/* Certifications chips */}
                  {trainer.certifications && trainer.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {trainer.certifications.slice(0, 2).map((cert, i) => (
                        <span
                          key={i}
                          className="text-[10.5px] px-2 py-0.5 rounded bg-navy-50 text-navy-700 font-medium border border-divider/50"
                        >
                          {cert}
                        </span>
                      ))}
                      {trainer.certifications.length > 2 && (
                        <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-navy-50 text-secondary-text font-medium">
                          +{trainer.certifications.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  {/* Stats Strip */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 border-t border-b border-divider/60 text-center my-2 bg-navy-50/40 rounded-lg">
                    <div>
                      <div className="text-[13px] font-bold text-navy-900 flex items-center justify-center gap-1">
                        <Star size={12} className="text-amber-500 fill-amber-500" />
                        {trainer.rating}
                      </div>
                      <div className="text-[10.5px] text-secondary-text">Rating</div>
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-navy-900">
                        {trainer.activeCohortsCount}
                      </div>
                      <div className="text-[10.5px] text-secondary-text">Cohorts</div>
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-navy-900">
                        {trainer.totalLearnersTrained}
                      </div>
                      <div className="text-[10.5px] text-secondary-text">Learners</div>
                    </div>
                  </div>

                  {/* Contact & Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-[11.5px] text-secondary-text truncate max-w-[160px]">
                      <Mail size={12} className="inline mr-1 text-secondary-text" />
                      {trainer.email}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDetailsTrainer(trainer)}
                        className="p-1.5 text-secondary-text hover:text-navy-900 hover:bg-navy-50 rounded-md transition-all cursor-pointer"
                        title="View Details"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => openEditModal(trainer)}
                        className="p-1.5 text-secondary-text hover:text-lemon-600 hover:bg-lemon-500/10 rounded-md transition-all cursor-pointer"
                        title="Edit Trainer"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmTrainer(trainer)}
                        className="p-1.5 text-secondary-text hover:text-danger hover:bg-danger-bg rounded-md transition-all cursor-pointer"
                        title="Delete Trainer"
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
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Specialization</th>
                  <th className="py-3 px-4">Division</th>
                  <th className="py-3 px-4">Active Cohorts</th>
                  <th className="py-3 px-4">Learners Trained</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/50">
                {filteredTrainers.map((trainer) => {
                  const status = statusMap[trainer.status]
                  return (
                    <tr
                      key={trainer.id}
                      onClick={() => setDetailsTrainer(trainer)}
                      className="hover:bg-navy-50/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Monogram label={trainer.name} size="sm" />
                          <div>
                            <div className="font-bold text-navy-900">{trainer.name}</div>
                            <div className="text-[11.5px] text-secondary-text">{trainer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-lemon-700 dark:text-lemon-400">
                        {trainer.specialization}
                      </td>
                      <td className="py-3 px-4 text-navy-800 font-medium">
                        {trainer.divisionName}
                      </td>
                      <td className="py-3 px-4 font-semibold text-navy-900">
                        {trainer.activeCohortsCount}
                      </td>
                      <td className="py-3 px-4 font-semibold text-navy-900">
                        {trainer.totalLearnersTrained}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-navy-900 flex items-center gap-1">
                          <Star size={13} className="text-amber-500 fill-amber-500" />
                          {trainer.rating}
                        </span>
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
                            onClick={() => openEditModal(trainer)}
                            className="p-1.5 text-secondary-text hover:text-lemon-600 rounded hover:bg-navy-50 cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmTrainer(trainer)}
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

      {/* Details Modal */}
      {detailsTrainer && (
        <Modal
          open={Boolean(detailsTrainer)}
          title={detailsTrainer.name}
          description={`${detailsTrainer.specialization} · ${detailsTrainer.divisionName}`}
          icon={<UserCheck size={20} />}
          size="lg"
          onClose={() => setDetailsTrainer(null)}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[12px] text-secondary-text">
                Faculty Since: <strong>{detailsTrainer.joinedDate}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const t = detailsTrainer
                    setDetailsTrainer(null)
                    openEditModal(t)
                  }}
                >
                  <Edit2 size={14} />
                  Edit Trainer
                </Button>
                <Button onClick={() => setDetailsTrainer(null)}>Close</Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-navy-900">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-navy-50/60 p-3 rounded-lg text-center">
              <div>
                <div className="text-[11px] text-secondary-text uppercase font-semibold">Rating</div>
                <div className="text-[13px] font-bold mt-1 text-navy-900 flex items-center justify-center gap-1">
                  <Star size={13} className="text-amber-500 fill-amber-500" />
                  {detailsTrainer.rating} / 5.0
                </div>
              </div>
              <div>
                <div className="text-[11px] text-secondary-text uppercase font-semibold">Active Cohorts</div>
                <div className="text-[13px] font-bold mt-1 text-navy-900">
                  {detailsTrainer.activeCohortsCount}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-secondary-text uppercase font-semibold">Learners Trained</div>
                <div className="text-[13px] font-bold mt-1 text-navy-900">
                  {detailsTrainer.totalLearnersTrained}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-secondary-text uppercase font-semibold">Status</div>
                <div className="text-[13px] font-bold mt-1 capitalize text-navy-900">
                  {detailsTrainer.status}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[12px] font-bold text-secondary-text uppercase tracking-wider mb-1">
                Faculty Biography
              </h4>
              <p className="text-[13px] leading-relaxed text-navy-800">
                {detailsTrainer.bio}
              </p>
            </div>

            {/* Certifications */}
            {detailsTrainer.certifications && detailsTrainer.certifications.length > 0 && (
              <div>
                <h4 className="text-[12px] font-bold text-secondary-text uppercase tracking-wider mb-1.5">
                  Professional Certifications
                </h4>
                <div className="flex flex-wrap gap-2">
                  {detailsTrainer.certifications.map((cert, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[11.5px] px-2.5 py-1 rounded-full bg-navy-50 text-navy-800 font-medium border border-divider/60"
                    >
                      <Sparkles size={12} className="text-lemon-600" />
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 bg-navy-50/40 rounded-lg border border-divider/60 space-y-1 text-[13px]">
              <p>
                <strong>Email:</strong> {detailsTrainer.email}
              </p>
              <p>
                <strong>Phone:</strong> {detailsTrainer.phone || '+251 911 000 000'}
              </p>
              <p>
                <strong>Training Division:</strong> {detailsTrainer.divisionName}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* New / Edit Trainer Modal */}
      {isEditModalOpen && (
        <Modal
          open={isEditModalOpen}
          title={editingTrainer ? 'Edit Trainer Profile' : 'Register New Trainer'}
          description="Maintain instructor details, faculty division, specializations, and credentials."
          icon={<UserCheck size={20} />}
          size="lg"
          onClose={() => setIsEditModalOpen(false)}
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTrainer}>
                {editingTrainer ? 'Save Changes' : 'Register Trainer'}
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Full Name"
              value={form.name}
              onChange={(val) => setForm((f) => ({ ...f, name: val }))}
              placeholder="e.g. Dr. Martha Bekele"
            />

            <FormField
              label="Email Address"
              value={form.email}
              onChange={(val) => setForm((f) => ({ ...f, email: val }))}
              placeholder="e.g. martha.bekele@horizonbank.et"
            />

            <FormField
              label="Specialization"
              value={form.specialization}
              onChange={(val) => setForm((f) => ({ ...f, specialization: val }))}
              placeholder="e.g. AML / CFT & Regulatory Compliance"
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
              label="Phone Number"
              value={form.phone}
              onChange={(val) => setForm((f) => ({ ...f, phone: val }))}
              placeholder="+251 911 234 567"
            />

            <FormField
              label="Evaluation Rating (1.0 - 5.0)"
              type="number"
              value={String(form.rating)}
              onChange={(val) => setForm((f) => ({ ...f, rating: Number(val) || 4.9 }))}
            />

            <div className="md:col-span-2">
              <FormField
                label="Certifications (comma-separated)"
                value={form.certifications}
                onChange={(val) => setForm((f) => ({ ...f, certifications: val }))}
                placeholder="e.g. CAMS Certified, ICA Anti-Money Laundering Diploma"
              />
            </div>

            <div className="md:col-span-2">
              <FormField
                label="Biography & Experience"
                type="textarea"
                value={form.bio}
                onChange={(val) => setForm((f) => ({ ...f, bio: val }))}
                placeholder="Detail professional background, past banking projects, and teaching credentials..."
              />
            </div>

            <FormField
              label="Status"
              type="select"
              value={form.status}
              options={['active', 'available', 'on-leave']}
              onChange={(val) => setForm((f) => ({ ...f, status: val as TrainerStatus }))}
            />
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmTrainer && (
        <Modal
          open={Boolean(deleteConfirmTrainer)}
          title="Remove Trainer"
          description={`Are you sure you want to remove "${deleteConfirmTrainer.name}"?`}
          icon={<Trash2 size={20} className="text-danger" />}
          onClose={() => setDeleteConfirmTrainer(null)}
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="secondary" onClick={() => setDeleteConfirmTrainer(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteTrainer}>
                Remove Trainer
              </Button>
            </div>
          }
        >
          <p className="text-[13px] text-secondary-text">
            This will unassign this instructor from upcoming cohorts and archive their profile.
          </p>
        </Modal>
      )}
    </div>
  )
}

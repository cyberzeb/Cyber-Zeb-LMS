import { useMemo, useState, useEffect } from 'react'
import {
  Users,
  CheckCircle2,
  Award,
  TrendingUp,
  Plus,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  Eye,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  Layers,
  Sparkles,
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
  seedCohorts,
  seedLearners,
  seedTrainingPrograms,
} from '../data/trainingSeedData'
import type {
  Cohort,
  Learner,
  LearnerStatus,
  TrainingProgram,
} from '../types'

const STAT_ICON_SIZE = 17

const statusTabs = ['All', 'Active', 'Graduated', 'On-Leave']

const statusMap: Record<LearnerStatus, { label: string; tone: StatusTone }> = {
  active: { label: 'Active', tone: 'success' },
  graduated: { label: 'Graduated', tone: 'info' },
  'on-leave': { label: 'On Leave', tone: 'warning' },
  inactive: { label: 'Inactive', tone: 'neutral' },
}

interface LearnerFormData {
  id?: string
  name: string
  email: string
  phone: string
  jobTitle: string
  department: string
  branch: string
  enrolledCohortId: string
  completionProgress: number
  attendanceRate: number
  status: LearnerStatus
}

const initialFormState: LearnerFormData = {
  name: '',
  email: '',
  phone: '+251 911 000 000',
  jobTitle: 'Junior Banking Associate',
  department: 'Branch Operations',
  branch: 'Bole Branch',
  enrolledCohortId: 'coh-101',
  completionProgress: 0,
  attendanceRate: 100,
  status: 'active',
}

const branches = [
  'Head Office — Addis Ababa',
  'Bole Branch',
  'Bole VIP Lounge',
  'Hawassa Regional Office',
  'Mexico Branch',
  'Piazza Branch',
  'Kazanchis Branch',
]

export function LearnersPage() {
  const { notify } = useToast()

  const [learners, setLearners] = useApiCollection<Learner[]>(
    STORAGE_KEYS.learners,
    seedLearners,
  )

  const [cohorts] = useApiCollection<Cohort[]>(
    STORAGE_KEYS.cohorts,
    seedCohorts,
  )

  const [programs] = useApiCollection<TrainingProgram[]>(
    STORAGE_KEYS.trainingPrograms,
    seedTrainingPrograms,
  )

  // Auto-seed if empty
  useEffect(() => {
    if (!learners || learners.length === 0) {
      setLearners(seedLearners)
    }
  }, [learners, setLearners])

  const [activeTab, setActiveTab] = useState('All')
  const [query, setQuery] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedCohort, setSelectedCohort] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingLearner, setEditingLearner] = useState<Learner | null>(null)
  const [form, setForm] = useState<LearnerFormData>(initialFormState)

  const [detailsLearner, setDetailsLearner] = useState<Learner | null>(null)
  const [deleteConfirmLearner, setDeleteConfirmLearner] = useState<Learner | null>(null)

  const cohortMap = useMemo(() => {
    const map = new Map<string, Cohort>()
    cohorts.forEach((c) => map.set(c.id, c))
    return map
  }, [cohorts])

  // KPIs
  const stats = useMemo(() => {
    const total = learners.length
    const active = learners.filter((l) => l.status === 'active').length
    const graduated = learners.filter((l) => l.status === 'graduated').length
    const avgProgress =
      learners.length > 0
        ? Math.round(
            learners.reduce((sum, l) => sum + (l.completionProgress || 0), 0) /
              learners.length,
          )
        : 85
    const avgAttendance =
      learners.length > 0
        ? Math.round(
            learners.reduce((sum, l) => sum + (l.attendanceRate || 0), 0) /
              learners.length,
          )
        : 95

    return { total, active, graduated, avgProgress, avgAttendance }
  }, [learners])

  // Filtered
  const filteredLearners = useMemo(() => {
    return (learners || []).filter((l) => {
      const matchesTab =
        activeTab === 'All' ||
        l.status.toLowerCase().replace('-', '') ===
          activeTab.toLowerCase().replace('-', '')

      const matchesBranch =
        selectedBranch === 'all' || l.branch === selectedBranch

      const matchesCohort =
        selectedCohort === 'all' || l.enrolledCohortId === selectedCohort

      const q = query.trim().toLowerCase()
      const matchesQuery =
        q === '' ||
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.jobTitle.toLowerCase().includes(q) ||
        l.department.toLowerCase().includes(q) ||
        l.branch?.toLowerCase().includes(q) ||
        l.cohortName?.toLowerCase().includes(q) ||
        l.programName?.toLowerCase().includes(q)

      return matchesTab && matchesBranch && matchesCohort && matchesQuery
    })
  }, [learners, activeTab, selectedBranch, selectedCohort, query])

  const openCreateModal = () => {
    setEditingLearner(null)
    setForm({
      ...initialFormState,
      enrolledCohortId: cohorts[0]?.id || 'coh-101',
    })
    setIsEditModalOpen(true)
  }

  const openEditModal = (learner: Learner) => {
    setEditingLearner(learner)
    setForm({
      id: learner.id,
      name: learner.name,
      email: learner.email,
      phone: learner.phone || '+251 911 000 000',
      jobTitle: learner.jobTitle,
      department: learner.department,
      branch: learner.branch || branches[0],
      enrolledCohortId: learner.enrolledCohortId || cohorts[0]?.id || 'coh-101',
      completionProgress: learner.completionProgress,
      attendanceRate: learner.attendanceRate,
      status: learner.status,
    })
    setIsEditModalOpen(true)
  }

  const handleSaveLearner = () => {
    if (!form.name.trim() || !form.email.trim()) {
      notify('Please enter both a learner name and email.', 'error')
      return
    }

    const coh = cohortMap.get(form.enrolledCohortId)

    if (editingLearner) {
      setLearners((prev) =>
        prev.map((l) =>
          l.id === editingLearner.id
            ? {
                ...l,
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                phone: form.phone.trim(),
                jobTitle: form.jobTitle.trim(),
                department: form.department.trim(),
                branch: form.branch,
                enrolledCohortId: form.enrolledCohortId,
                cohortName: coh?.name || l.cohortName,
                programName: coh?.programName || l.programName,
                enrolledProgramId: coh?.programId || l.enrolledProgramId,
                completionProgress: Number(form.completionProgress) || 0,
                attendanceRate: Number(form.attendanceRate) || 100,
                status: form.status,
                updatedAt: new Date().toISOString(),
              }
            : l,
        ),
      )
      notify(`Learner "${form.name}" has been updated.`, 'success')
    } else {
      const newLearner: Learner = {
        id: createId('lrn'),
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        jobTitle: form.jobTitle.trim(),
        department: form.department.trim(),
        branch: form.branch,
        enrolledCohortId: form.enrolledCohortId,
        cohortName: coh?.name || 'Spring Intake',
        programName: coh?.programName || 'Banking Program',
        enrolledProgramId: coh?.programId || 'tp-101',
        completionProgress: Number(form.completionProgress) || 0,
        attendanceRate: Number(form.attendanceRate) || 100,
        status: form.status,
        joinedDate: new Date().toISOString().split('T')[0],
        certificationsCount: form.status === 'graduated' ? 1 : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setLearners((prev) => [newLearner, ...prev])
      notify(`New learner "${newLearner.name}" enrolled successfully.`, 'success')
    }

    setIsEditModalOpen(false)
  }

  const handleDeleteLearner = () => {
    if (!deleteConfirmLearner) return
    setLearners((prev) => prev.filter((l) => l.id !== deleteConfirmLearner.id))
    notify(`Learner "${deleteConfirmLearner.name}" has been removed.`, 'success')
    setDeleteConfirmLearner(null)
    if (detailsLearner?.id === deleteConfirmLearner.id) {
      setDetailsLearner(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Training Learners"
        subtitle="Manage employee learners, track cohort enrollment, syllabus progress, and certification completion."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setLearners(seedLearners)
                notify('Reset to default Horizon Bank learner demo data.', 'info')
              }}
            >
              Reset Demo Data
            </Button>
            <Button onClick={openCreateModal}>
              <Plus size={16} />
              Enroll Learner
            </Button>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatBlock
          label="Total Learners"
          value={stats.total}
          sub="Registered employees"
          icon={<Users size={STAT_ICON_SIZE} />}
          iconBg="bg-lemon-500/15 text-lemon-700 dark:text-lemon-400"
          trend="up"
          trendValue="+18%"
        />
        <StatBlock
          label="Active in Training"
          value={stats.active}
          sub="Current cohort students"
          icon={<CheckCircle2 size={STAT_ICON_SIZE} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Avg Progress"
          value={`${stats.avgProgress}%`}
          sub="Course completion"
          icon={<TrendingUp size={STAT_ICON_SIZE} />}
          iconBg="bg-purple-500/15 text-purple-700 dark:text-purple-400"
        />
        <StatBlock
          label="Avg Attendance"
          value={`${stats.avgAttendance}%`}
          sub="Session punctuality"
          icon={<Sparkles size={STAT_ICON_SIZE} />}
          iconBg="bg-amber-500/15 text-amber-700 dark:text-amber-400"
        />
        <StatBlock
          label="Graduated / Certified"
          value={stats.graduated}
          sub="Certified professionals"
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-divider/60">
          <div className="md:col-span-2">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search by learner name, email, job title, branch, or cohort..."
            />
          </div>

          <div>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-white dark:bg-navy-50 border border-divider rounded-full px-4 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 cursor-pointer"
            >
              <option value="all">All Branches & Locations</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              className="w-full bg-white dark:bg-navy-50 border border-divider rounded-full px-4 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 cursor-pointer"
            >
              <option value="all">All Cohorts</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Learners Results */}
      {filteredLearners.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-lemon-500/10 text-lemon-600 flex items-center justify-center mx-auto mb-3">
            <Users size={24} />
          </div>
          <h3 className="text-base font-bold text-navy-900">No learners found</h3>
          <p className="text-sm text-secondary-text mt-1 max-w-md mx-auto">
            No employees match your search criteria. Try clearing the search or reset filters.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setQuery('')
                setActiveTab('All')
                setSelectedBranch('all')
                setSelectedCohort('all')
              }}
            >
              Reset Filters
            </Button>
            <Button onClick={openCreateModal}>
              <Plus size={14} />
              Enroll Learner
            </Button>
          </div>
        </GlassCard>
      ) : viewMode === 'grid' ? (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLearners.map((learner) => {
            const status = statusMap[learner.status]
            return (
              <GlassCard
                key={learner.id}
                className="p-5 flex flex-col justify-between hover:shadow-lg transition-all border-divider/70 hover:border-lemon-500/40 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <Monogram label={learner.name} size="md" />
                      <div>
                        <h3
                          onClick={() => setDetailsLearner(learner)}
                          className="text-[14.5px] font-bold text-navy-900 cursor-pointer hover:text-lemon-600 transition-colors"
                        >
                          {learner.name}
                        </h3>
                        <p className="text-[12px] text-secondary-text">{learner.jobTitle}</p>
                      </div>
                    </div>
                    <StatusPill label={status.label} tone={status.tone} />
                  </div>

                  <div className="space-y-1 text-[12px] text-secondary-text mb-3">
                    <div className="flex items-center gap-2">
                      <Building2 size={13} className="text-secondary-text shrink-0" />
                      <span className="truncate">{learner.branch || 'Head Office'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-secondary-text shrink-0" />
                      <span className="truncate">{learner.email}</span>
                    </div>
                  </div>

                  <div className="bg-navy-50/50 p-2.5 rounded-lg border border-divider/50 space-y-1 mb-3">
                    <div className="text-[11px] font-semibold text-secondary-text uppercase">
                      Current Track
                    </div>
                    <div className="text-[12.5px] font-bold text-navy-900 truncate">
                      {learner.programName}
                    </div>
                    <div className="text-[11.5px] text-lemon-700 dark:text-lemon-400 font-medium truncate">
                      Cohort: {learner.cohortName}
                    </div>
                  </div>
                </div>

                <div>
                  {/* Progress & Attendance */}
                  <div className="space-y-2 py-2 border-t border-divider/60">
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-secondary-text">Course Progress</span>
                        <span className="font-bold text-navy-900">{learner.completionProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-navy-50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-lemon-500 rounded-full"
                          style={{ width: `${learner.completionProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11.5px] pt-1">
                      <span className="text-secondary-text">Attendance Rate</span>
                      <span className="font-bold text-navy-900">{learner.attendanceRate}%</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-divider/40">
                    <span className="text-[11px] text-secondary-text">
                      Certificates: <strong>{learner.certificationsCount || 0}</strong>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDetailsLearner(learner)}
                        className="p-1.5 text-secondary-text hover:text-navy-900 hover:bg-navy-50 rounded-md transition-all cursor-pointer"
                        title="View Profile"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => openEditModal(learner)}
                        className="p-1.5 text-secondary-text hover:text-lemon-600 hover:bg-lemon-500/10 rounded-md transition-all cursor-pointer"
                        title="Edit Learner"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmLearner(learner)}
                        className="p-1.5 text-secondary-text hover:text-danger hover:bg-danger-bg rounded-md transition-all cursor-pointer"
                        title="Delete"
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
                  <th className="py-3 px-4">Learner</th>
                  <th className="py-3 px-4">Role & Branch</th>
                  <th className="py-3 px-4">Enrolled Cohort</th>
                  <th className="py-3 px-4">Program</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/50">
                {filteredLearners.map((learner) => {
                  const status = statusMap[learner.status]
                  return (
                    <tr
                      key={learner.id}
                      onClick={() => setDetailsLearner(learner)}
                      className="hover:bg-navy-50/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Monogram label={learner.name} size="sm" />
                          <div>
                            <div className="font-bold text-navy-900">{learner.name}</div>
                            <div className="text-[11.5px] text-secondary-text">{learner.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-navy-900">{learner.jobTitle}</div>
                        <div className="text-[11.5px] text-secondary-text">{learner.branch}</div>
                      </td>
                      <td className="py-3 px-4 text-lemon-700 dark:text-lemon-400 font-medium">
                        {learner.cohortName}
                      </td>
                      <td className="py-3 px-4 text-navy-800">
                        {learner.programName}
                      </td>
                      <td className="py-3 px-4 font-bold text-navy-900">
                        {learner.completionProgress}%
                      </td>
                      <td className="py-3 px-4 font-medium text-navy-900">
                        {learner.attendanceRate}%
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
                            onClick={() => openEditModal(learner)}
                            className="p-1.5 text-secondary-text hover:text-lemon-600 rounded hover:bg-navy-50 cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmLearner(learner)}
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
      {detailsLearner && (
        <Modal
          open={Boolean(detailsLearner)}
          title={detailsLearner.name}
          description={`${detailsLearner.jobTitle} · ${detailsLearner.branch}`}
          icon={<Users size={20} />}
          size="lg"
          onClose={() => setDetailsLearner(null)}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[12px] text-secondary-text">
                Enrolled Cohort: <strong>{detailsLearner.cohortName}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const l = detailsLearner
                    setDetailsLearner(null)
                    openEditModal(l)
                  }}
                >
                  <Edit2 size={14} />
                  Edit Learner
                </Button>
                <Button onClick={() => setDetailsLearner(null)}>Close</Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-navy-900">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-navy-50/60 p-3 rounded-lg text-center">
              <div>
                <div className="text-[11px] text-secondary-text uppercase font-semibold">Progress</div>
                <div className="text-[13px] font-bold mt-1 text-navy-900">
                  {detailsLearner.completionProgress}%
                </div>
              </div>
              <div>
                <div className="text-[11px] text-secondary-text uppercase font-semibold">Attendance</div>
                <div className="text-[13px] font-bold mt-1 text-navy-900">
                  {detailsLearner.attendanceRate}%
                </div>
              </div>
              <div>
                <div className="text-[11px] text-secondary-text uppercase font-semibold">Status</div>
                <div className="text-[13px] font-bold mt-1 capitalize text-navy-900">
                  {detailsLearner.status}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-secondary-text uppercase font-semibold">Certifications</div>
                <div className="text-[13px] font-bold mt-1 text-navy-900">
                  {detailsLearner.certificationsCount || 0}
                </div>
              </div>
            </div>

            <div className="p-3 bg-navy-50/40 rounded-lg border border-divider/60 space-y-1.5 text-[13px]">
              <p>
                <strong>Email:</strong> {detailsLearner.email}
              </p>
              <p>
                <strong>Phone:</strong> {detailsLearner.phone || '+251 911 000 000'}
              </p>
              <p>
                <strong>Department:</strong> {detailsLearner.department}
              </p>
              <p>
                <strong>Assigned Branch:</strong> {detailsLearner.branch}
              </p>
              <p>
                <strong>Program:</strong> {detailsLearner.programName}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* New / Edit Modal */}
      {isEditModalOpen && (
        <Modal
          open={isEditModalOpen}
          title={editingLearner ? 'Edit Learner Profile' : 'Enroll New Learner'}
          description="Register employees into specialized training cohorts and assign learning tracks."
          icon={<Users size={20} />}
          size="lg"
          onClose={() => setIsEditModalOpen(false)}
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveLearner}>
                {editingLearner ? 'Save Changes' : 'Enroll Learner'}
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Full Name"
              value={form.name}
              onChange={(val) => setForm((f) => ({ ...f, name: val }))}
              placeholder="e.g. Dawit Haile"
            />

            <FormField
              label="Bank Email"
              value={form.email}
              onChange={(val) => setForm((f) => ({ ...f, email: val }))}
              placeholder="e.g. dawit.haile@horizonbank.et"
            />

            <FormField
              label="Job Role / Title"
              value={form.jobTitle}
              onChange={(val) => setForm((f) => ({ ...f, jobTitle: val }))}
              placeholder="e.g. Commercial Credit Underwriter"
            />

            <FormField
              label="Operating Branch"
              type="select"
              value={form.branch}
              options={branches}
              onChange={(val) => setForm((f) => ({ ...f, branch: val }))}
            />

            <FormField
              label="Assigned Cohort"
              type="select"
              value={cohorts.find((c) => c.id === form.enrolledCohortId)?.name || ''}
              options={cohorts.map((c) => c.name)}
              onChange={(val) => {
                const matched = cohorts.find((c) => c.name === val)
                if (matched) setForm((f) => ({ ...f, enrolledCohortId: matched.id }))
              }}
            />

            <FormField
              label="Phone Number"
              value={form.phone}
              onChange={(val) => setForm((f) => ({ ...f, phone: val }))}
              placeholder="+251 911 234 567"
            />

            <FormField
              label="Syllabus Progress (%)"
              type="number"
              value={String(form.completionProgress)}
              onChange={(val) => setForm((f) => ({ ...f, completionProgress: Number(val) || 0 }))}
            />

            <FormField
              label="Attendance Rate (%)"
              type="number"
              value={String(form.attendanceRate)}
              onChange={(val) => setForm((f) => ({ ...f, attendanceRate: Number(val) || 0 }))}
            />

            <FormField
              label="Status"
              type="select"
              value={form.status}
              options={['active', 'graduated', 'on-leave', 'inactive']}
              onChange={(val) => setForm((f) => ({ ...f, status: val as LearnerStatus }))}
            />
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmLearner && (
        <Modal
          open={Boolean(deleteConfirmLearner)}
          title="Remove Learner"
          description={`Are you sure you want to remove "${deleteConfirmLearner.name}"?`}
          icon={<Trash2 size={20} className="text-danger" />}
          onClose={() => setDeleteConfirmLearner(null)}
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="secondary" onClick={() => setDeleteConfirmLearner(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteLearner}>
                Remove Learner
              </Button>
            </div>
          }
        >
          <p className="text-[13px] text-secondary-text">
            This will remove this employee from cohort roster and training records.
          </p>
        </Modal>
      )}
    </div>
  )
}

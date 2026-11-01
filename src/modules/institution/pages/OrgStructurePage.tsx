import { useMemo, useState } from 'react'
import { Building2, Network } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../shared/components/Button'
import { FormField } from '../../../shared/components/FormField'
import { Modal } from '../../../shared/components/Modal'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { IdentityStatusCard } from '../components/IdentityStatusCard'
import { OrgStructureTree } from '../components/OrgStructureTree'
import { SetupProgressCard } from '../components/SetupProgressCard'
import { useCampusContext } from '../context/CampusContext'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import type { CampusRecord } from '../types'

const STAT = 17

const emptyCampusForm = {
  name: '',
  code: '',
  address: '',
  subtitle: '',
}

export function OrgStructurePage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { notify } = useToast()
  const {
    campuses,
    departments,
    activeCampuses,
    addCampus,
    updateCampus,
    activateCampus,
    ssoProviders,
    setupSteps,
    setupPercent,
    institutionName,
  } = useCampusContext()

  const [campusModalOpen, setCampusModalOpen] = useState(false)
  const [editingCampus, setEditingCampus] = useState<CampusRecord | null>(null)
  const [campusForm, setCampusForm] = useState(emptyCampusForm)

  const totals = useMemo(() => {
    const pending = campuses.filter((c) => c.status === 'pending').length
    return {
      campuses: campuses.length,
      active: activeCampuses.length,
      departments: departments.length,
      pending,
    }
  }, [campuses, activeCampuses.length, departments.length])

  const openAddCampusModal = () => {
    setEditingCampus(null)
    setCampusForm(emptyCampusForm)
    setCampusModalOpen(true)
  }

  const openEditCampusModal = (campus: CampusRecord) => {
    setEditingCampus(campus)
    setCampusForm({
      name: campus.name,
      code: campus.code,
      address: campus.address,
      subtitle: campus.subtitle,
    })
    setCampusModalOpen(true)
  }

  const handleSaveCampus = () => {
    if (!campusForm.name.trim() || !campusForm.code.trim()) {
      notify('Campus name and code are required.', 'error')
      return
    }

    if (editingCampus) {
      updateCampus(editingCampus.id, campusForm)
      notify(`Campus “${campusForm.name.trim()}” updated.`)
    } else {
      addCampus(campusForm)
      notify(`Campus “${campusForm.name.trim()}” added. Activate it when ready.`)
    }
    setCampusModalOpen(false)
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Organization Structure"
        subtitle={t('page.org.sub', { name: institutionName })}
        actions={
          <Button variant="primary" onClick={openAddCampusModal}>
            <Building2 size={16} />
            Add Campus
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
        <StatBlock label="Campuses" value={totals.campuses} icon={<Building2 size={STAT} />} />
        <StatBlock label="Departments" value={totals.departments} icon={<Network size={STAT} />} />
        <StatBlock
          label="Setup Progress"
          value={`${setupPercent}%`}
          sub={`${totals.pending} campus pending`}
          icon={<Network size={STAT} />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
        <SetupProgressCard
          steps={setupSteps}
          percent={setupPercent}
          onStepClick={(step) => {
            if (step.href) navigate(step.href)
          }}
        />
        <IdentityStatusCard
          providers={ssoProviders}
          onConfigure={() => navigate('/admin/settings')}
        />
      </div>

      <OrgStructureTree
        campuses={campuses}
        departments={departments}
        onAddCampus={openAddCampusModal}
        onCampusClick={(campusId) => navigate(`/admin/institution/profile/${campusId}`)}
        onEditCampus={(campus) => openEditCampusModal(campus)}
        onActivateCampus={(campusId) => {
          activateCampus(campusId)
          notify('Campus activated. Add its departments next.', 'info')
        }}
        onManageDepartments={(campusId) => {
          const params = new URLSearchParams({ campus: campusId })
          navigate(`/admin/institution/departments?${params.toString()}`)
        }}
      />

      <Modal
        open={campusModalOpen}
        onClose={() => setCampusModalOpen(false)}
        icon={<Building2 size={18} />}
        title={editingCampus ? 'Edit Campus' : 'Add Campus'}
        description={
          editingCampus
            ? 'Update campus details. Its departments stay linked.'
            : 'New campuses start as pending until you activate them.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setCampusModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveCampus}>
              {editingCampus ? 'Save Changes' : 'Add Campus'}
            </Button>
          </>
        }
      >
        <FormField
          label="Campus Name"
          value={campusForm.name}
          onChange={(v) => setCampusForm({ ...campusForm, name: v })}
          placeholder="e.g. Bole Campus"
        />
        <FormField
          label="Campus Code"
          value={campusForm.code}
          onChange={(v) => setCampusForm({ ...campusForm, code: v })}
          placeholder="e.g. BOLE"
          hint="Short code used in reports and filters."
        />
        <FormField
          label="Address"
          value={campusForm.address}
          onChange={(v) => setCampusForm({ ...campusForm, address: v })}
          placeholder="City, region, country"
        />
        <FormField
          label="Subtitle"
          value={campusForm.subtitle}
          onChange={(v) => setCampusForm({ ...campusForm, subtitle: v })}
          placeholder="e.g. Extension campus"
        />
      </Modal>

    </div>
  )
}

import { useMemo, useState } from 'react'
import { Building2, GraduationCap, Network } from 'lucide-react'
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
import type { CampusRecord } from '../types'

const STAT = 17

const emptyCampusForm = {
  name: '',
  code: '',
  address: '',
  subtitle: '',
}

const emptyCollegeForm = {
  name: '',
  deanName: '',
  description: '',
  campusId: '',
}

export function OrgStructurePage() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const {
    campuses,
    colleges,
    departments,
    activeCampuses,
    addCampus,
    updateCampus,
    activateCampus,
    addCollege,
    ssoProviders,
    setupSteps,
    setupPercent,
    institutionName,
  } = useCampusContext()

  const [campusModalOpen, setCampusModalOpen] = useState(false)
  const [collegeModalOpen, setCollegeModalOpen] = useState(false)
  const [editingCampus, setEditingCampus] = useState<CampusRecord | null>(null)
  const [campusForm, setCampusForm] = useState(emptyCampusForm)
  const [collegeForm, setCollegeForm] = useState(emptyCollegeForm)

  const totals = useMemo(() => {
    const pending = campuses.filter((c) => c.status === 'pending').length
    return {
      campuses: campuses.length,
      active: activeCampuses.length,
      colleges: colleges.length,
      departments: departments.length,
      pending,
    }
  }, [campuses, activeCampuses.length, colleges.length, departments.length])

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

  const openAddCollegeModal = (campusId: string) => {
    setCollegeForm({ ...emptyCollegeForm, campusId })
    setCollegeModalOpen(true)
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

  const handleSaveCollege = () => {
    if (!collegeForm.name.trim() || !collegeForm.campusId) {
      notify('College name and campus are required.', 'error')
      return
    }
    addCollege(collegeForm)
    setCollegeModalOpen(false)
    notify(`College “${collegeForm.name.trim()}” added.`)
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Organization Structure"
        subtitle={`Configure campuses, colleges and departments for ${institutionName}.`}
        actions={
          <Button variant="primary" onClick={openAddCampusModal}>
            <Building2 size={16} />
            Add Campus
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatBlock label="Campuses" value={totals.campuses} icon={<Building2 size={STAT} />} />
        <StatBlock label="Colleges" value={totals.colleges} icon={<GraduationCap size={STAT} />} />
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
        colleges={colleges}
        departments={departments}
        onAddCampus={openAddCampusModal}
        onAddCollege={openAddCollegeModal}
        onCampusClick={(campusId) => navigate(`/admin/institution/profile/${campusId}`)}
        onEditCampus={(campus) => openEditCampusModal(campus)}
        onActivateCampus={(campusId) => {
          activateCampus(campusId)
          notify('Campus activated. Add colleges and departments next.', 'info')
        }}
        onManageDepartments={(campusId, collegeId) => {
          const params = new URLSearchParams({ campus: campusId })
          if (collegeId) params.set('college', collegeId)
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
            ? 'Update campus details. Colleges and departments stay linked.'
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

      <Modal
        open={collegeModalOpen}
        onClose={() => setCollegeModalOpen(false)}
        icon={<GraduationCap size={18} />}
        title="Add College"
        description="Colleges group related departments under a campus."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCollegeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveCollege}>
              Add College
            </Button>
          </>
        }
      >
        <FormField
          label="College Name"
          value={collegeForm.name}
          onChange={(v) => setCollegeForm({ ...collegeForm, name: v })}
          placeholder="e.g. College of Computing & IT"
        />
        <FormField
          label="Dean"
          value={collegeForm.deanName}
          onChange={(v) => setCollegeForm({ ...collegeForm, deanName: v })}
          placeholder="e.g. Dr. Aaron Selassie"
        />
        <FormField
          label="Description"
          type="textarea"
          value={collegeForm.description}
          onChange={(v) => setCollegeForm({ ...collegeForm, description: v })}
          placeholder="Brief overview of the college..."
        />
      </Modal>
    </div>
  )
}

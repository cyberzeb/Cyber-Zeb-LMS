import { Award } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import type { CertificateTemplate } from '../types'

export interface IssueCertificateForm {
  studentId: string
  courseId: string
  templateId: string
  issueDate: string
  expirationDate: string
}

interface CertificateIssueModalProps {
  open: boolean
  form: IssueCertificateForm
  studentOptions: { value: string; label: string; hint?: string }[]
  courseOptions: { value: string; label: string; hint?: string }[]
  templates: CertificateTemplate[]
  onClose: () => void
  onChange: (form: IssueCertificateForm) => void
  onSubmit: () => void
}

export function CertificateIssueModal({
  open,
  form,
  studentOptions,
  courseOptions,
  templates,
  onClose,
  onChange,
  onSubmit,
}: CertificateIssueModalProps) {
  const templateOptions = templates.map((t) => ({ value: t.id, label: t.name }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<Award size={18} />}
      title="Issue Certificate"
      description="Manually issue a certificate to a student for a completed course."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={!form.studentId || !form.courseId || !form.templateId || !form.issueDate}
          >
            Issue Certificate
          </Button>
        </>
      }
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-semibold text-navy-900">Student</span>
        <SelectMenu
          value={form.studentId}
          onChange={(v) => onChange({ ...form, studentId: v })}
          placeholder="Select student"
          options={studentOptions}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-semibold text-navy-900">Course</span>
        <SelectMenu
          value={form.courseId}
          onChange={(v) => onChange({ ...form, courseId: v })}
          placeholder="Select course"
          options={courseOptions}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-semibold text-navy-900">Certificate template</span>
        <SelectMenu
          value={form.templateId}
          onChange={(v) => onChange({ ...form, templateId: v })}
          placeholder="Select template"
          options={templateOptions}
        />
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Issue date</span>
          <input
            type="date"
            value={form.issueDate}
            onChange={(e) => onChange({ ...form, issueDate: e.target.value })}
            className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-navy-900">Expiration date (optional)</span>
          <input
            type="date"
            value={form.expirationDate}
            onChange={(e) => onChange({ ...form, expirationDate: e.target.value })}
            className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25"
          />
        </label>
      </div>
    </Modal>
  )
}

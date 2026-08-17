import { useRef, useState } from 'react'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { bulkImportStudents, parseStudentCsv, type StudentImportInput } from '../api/peopleApi'
import type { Campus, Department, PersonRow } from '../types'

interface StudentImportModalProps {
  open: boolean
  campuses: Campus[]
  departments: Department[]
  existingPeople: PersonRow[]
  onClose: () => void
  onImported: (imported: PersonRow[], updated: PersonRow[]) => void
}

const SAMPLE_CSV_URL = '/samples/students-import-sample.csv'

export function StudentImportModal({
  open,
  campuses,
  departments,
  existingPeople,
  onClose,
  onImported,
}: StudentImportModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [previewRows, setPreviewRows] = useState<StudentImportInput[]>([])
  const [parseErrors, setParseErrors] = useState<{ row: number; message: string }[]>([])
  const [importing, setImporting] = useState(false)
  const [resultMessage, setResultMessage] = useState('')

  const reset = () => {
    setFileName('')
    setPreviewRows([])
    setParseErrors([])
    setResultMessage('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFile = async (file: File) => {
    setResultMessage('')
    setFileName(file.name)
    const text = await file.text()
    const { rows, errors } = parseStudentCsv(text)
    setPreviewRows(rows)
    setParseErrors(errors)
  }

  const handleImport = async () => {
    if (previewRows.length === 0) return
    setImporting(true)
    setResultMessage('')
    try {
      const result = await bulkImportStudents(previewRows, campuses, departments, existingPeople)
      const allErrors = [...parseErrors, ...result.errors]
      if (result.imported.length === 0 && result.updated.length === 0 && allErrors.length > 0) {
        setResultMessage(`Import failed. ${allErrors.length} row(s) had errors.`)
        setParseErrors(allErrors)
        return
      }
      onImported(result.imported, result.updated)
      const parts = [
        result.imported.length > 0 ? `${result.imported.length} added` : '',
        result.updated.length > 0 ? `${result.updated.length} updated` : '',
        allErrors.length > 0 ? `${allErrors.length} skipped with errors` : '',
      ].filter(Boolean)
      setResultMessage(`Import complete: ${parts.join(', ')}.`)
      if (allErrors.length === 0) {
        setTimeout(handleClose, 900)
      } else {
        setParseErrors(allErrors)
      }
    } finally {
      setImporting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      icon={<FileSpreadsheet size={18} />}
      title="Bulk Import Students"
      description="Upload a CSV file. Campus and department are validated against your org structure."
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={importing}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={importing || previewRows.length === 0}
          >
            {importing ? 'Importing…' : `Import ${previewRows.length} row(s)`}
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />
        <Button variant="secondary" onClick={() => inputRef.current?.click()}>
          <Upload size={15} />
          Choose CSV
        </Button>
        <a
          href={SAMPLE_CSV_URL}
          download
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-info hover:underline"
        >
          <Download size={14} />
          Download sample CSV
        </a>
      </div>

      {fileName ? (
        <p className="text-[12px] text-secondary-text">
          Selected file: <span className="font-semibold text-navy-900">{fileName}</span>
        </p>
      ) : null}

      <div className="rounded-xl border border-divider bg-navy-50/50 p-3 text-[11.5px] text-secondary-text leading-relaxed">
        Required columns: <code className="text-navy-900">name, email, campus, department</code>.
        Optional: <code className="text-navy-900">status</code> (active, invited, suspended).
        Campus accepts code (MAIN) or name. Department must exist on that campus.
      </div>

      {previewRows.length > 0 ? (
        <div className="rounded-xl border border-divider overflow-hidden">
          <div className="px-3 py-2 bg-white border-b border-divider text-[11px] font-bold uppercase tracking-wider text-secondary-text">
            Preview ({previewRows.length} valid rows)
          </div>
          <div className="max-h-40 overflow-y-auto app-scroll divide-y divide-divider/50">
            {previewRows.slice(0, 8).map((row, i) => (
              <div key={`${row.email}-${i}`} className="px-3 py-2 text-[12px] grid grid-cols-2 gap-1">
                <span className="font-semibold text-navy-900 truncate">{row.name}</span>
                <span className="text-secondary-text truncate">{row.email}</span>
                <span className="text-secondary-text">{row.campus}</span>
                <span className="text-secondary-text truncate">{row.department}</span>
              </div>
            ))}
            {previewRows.length > 8 ? (
              <div className="px-3 py-2 text-[11px] text-secondary-text">
                +{previewRows.length - 8} more rows…
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {parseErrors.length > 0 ? (
        <div className="rounded-xl border border-danger/30 bg-danger-bg/40 p-3">
          <p className="text-[12px] font-semibold text-danger mb-1.5">Validation issues</p>
          <ul className="text-[11.5px] text-danger space-y-1 max-h-28 overflow-y-auto app-scroll">
            {parseErrors.map((err) => (
              <li key={`${err.row}-${err.message}`}>
                Row {err.row}: {err.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {resultMessage ? (
        <p className="text-[12px] font-semibold text-success">{resultMessage}</p>
      ) : null}
    </Modal>
  )
}

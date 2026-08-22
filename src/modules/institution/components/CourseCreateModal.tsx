import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  BookOpen,
  Film,
  FolderOpen,
  Layers,
  Plus,
  Settings2,
  Trash2,
  Upload,
  X,
  FileEdit,
} from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { FormField } from '../../../shared/components/FormField'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { ToggleRow } from './settings/ToggleRow'
import { courseLevelOptions, UNASSIGNED_DEPARTMENT } from '../data/courseSeedData'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { getEligibleCourseInstructors } from '../utils/courseAssignmentUtils'
import {
  computeCourseProgress,
  courseDeliveryModeOptions,
  courseLanguageOptions,
  courseLessonTypeOptions,
  courseResourceTypeOptions,
  courseVisibilityOptions,
  createEmptyCourseForm,
  createEmptyLesson,
  createEmptyModule,
  createEmptyResource,
  createEmptyVideo,
  courseRecordToFormInput,
} from '../data/courseFormOptions'
import type { CourseCreateInput, CourseModule, CourseRecord, Department, PersonRow } from '../types'

interface CourseCreateModalProps {
  open: boolean
  course?: CourseRecord | null
  onClose: () => void
  onCreate: (input: CourseCreateInput) => void
  onUpdate?: (courseId: string, input: CourseCreateInput) => void
  variant?: 'admin' | 'instructor'
  departments?: Department[]
  instructors?: PersonRow[]
}

const tabs = ['Basics', 'Curriculum', 'Media & Resources', 'Settings']

const statusOptions = ['Draft', 'Published', 'Archived']

const statusToForm = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
} as const

const statusFromForm: Record<string, CourseCreateInput['status']> = {
  Draft: 'draft',
  Published: 'published',
  Archived: 'archived',
}

const inputClass =
  'w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 placeholder:text-secondary-text focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25 transition-all'

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-wider text-secondary-text pt-1">
      {children}
    </div>
  )
}

export function CourseCreateModal({
  open,
  course = null,
  onClose,
  onCreate,
  onUpdate,
  variant = 'admin',
  departments = [],
  instructors = [],
}: CourseCreateModalProps) {
  const isInstructor = variant === 'instructor'
  const isAdmin = !isInstructor
  const isEdit = course != null
  const thumbnailRef = useRef<HTMLInputElement>(null)
  const resourceFileRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState('Basics')
  const [form, setForm] = useState<CourseCreateInput>(() => createEmptyCourseForm())
  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState('')
  const [pendingResourceId, setPendingResourceId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setForm(course ? courseRecordToFormInput(course) : createEmptyCourseForm())
    setTagInput('')
    setError('')
    setActiveTab('Basics')
    setPendingResourceId(null)
  }, [open, course])

  const progressPreview = useMemo(() => computeCourseProgress(form), [form])

  const instructorOptions = useMemo(
    () => getEligibleCourseInstructors(instructors),
    [instructors],
  )

  const departmentOptions = useMemo(() => {
    const names = departments.map((d) => d.name).sort((a, b) => a.localeCompare(b))
    return names.length > 0 ? names : [UNASSIGNED_DEPARTMENT]
  }, [departments])

  const updateForm = (patch: Partial<CourseCreateInput>) => {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (!tag) return
    if (form.tags?.includes(tag)) {
      setTagInput('')
      return
    }
    updateForm({ tags: [...(form.tags ?? []), tag] })
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    updateForm({ tags: (form.tags ?? []).filter((t) => t !== tag) })
  }

  const updateModule = (moduleId: string, patch: Partial<CourseModule>) => {
    updateForm({
      modules: (form.modules ?? []).map((m) => (m.id === moduleId ? { ...m, ...patch } : m)),
    })
  }

  const removeModule = (moduleId: string) => {
    updateForm({
      modules: (form.modules ?? []).filter((m) => m.id !== moduleId),
      videos: (form.videos ?? []).map((v) =>
        v.moduleId === moduleId ? { ...v, moduleId: '' } : v,
      ),
    })
  }

  const handleThumbnailPick = (file: File) => {
    const url = URL.createObjectURL(file)
    updateForm({ thumbnailUrl: url })
  }

  const handleResourceFilePick = (resourceId: string, file: File) => {
    updateForm({
      resources: (form.resources ?? []).map((r) =>
        r.id === resourceId
          ? { ...r, fileName: file.name, url: URL.createObjectURL(file), title: r.title || file.name }
          : r,
      ),
    })
    setPendingResourceId(null)
  }

  const validate = (): string | null => {
    if (!form.title.trim()) return 'Course title is required.'
    if (!form.code.trim()) return 'Course code is required.'
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      return 'End date must be after the start date.'
    }
    return null
  }

  const handleSubmit = () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    const payload: CourseCreateInput = {
      ...form,
      title: form.title.trim(),
      code: form.code.trim(),
      status: isInstructor ? 'draft' : form.status,
      tags: form.tags ?? [],
      modules: form.modules ?? [],
      videos: form.videos ?? [],
      resources: form.resources ?? [],
    }
    if (isEdit && course && onUpdate) {
      onUpdate(course.id, payload)
    } else {
      onCreate(payload)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      icon={isEdit ? <FileEdit size={18} /> : <BookOpen size={18} />}
      title={isEdit ? 'Manage Course' : isInstructor ? 'Propose New Course' : 'Create Course'}
      description={
        isEdit
          ? isAdmin
            ? `Edit ${course?.code ?? 'this course'}. Assign the teaching instructor per course — not by department.`
            : `Edit content and settings for ${course?.code ?? 'this course'}.`
          : isInstructor
            ? 'Submit a course proposal for admin review. You can continue building content while approval is pending.'
            : 'Define course content and assign a teaching instructor for this specific course.'
      }
      footer={
        <div className="flex items-center justify-between w-full gap-4">
          <div className="hidden sm:flex items-center gap-2 text-[12px] text-secondary-text">
            <span className="font-semibold text-navy-700">Content readiness</span>
            <div className="w-24 h-1.5 bg-navy-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-lemon-500 rounded-full transition-all"
                style={{ width: `${progressPreview}%` }}
              />
            </div>
            <span className="font-bold text-navy-900">{progressPreview}%</span>
          </div>
          <div className="flex gap-2.5 ml-auto">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {isEdit ? 'Save Changes' : isInstructor ? 'Submit for Approval' : 'Create Course'}
            </Button>
          </div>
        </div>
      }
    >
      <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {error && (
        <div className="text-[12.5px] text-danger font-medium bg-danger-bg border border-danger/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {activeTab === 'Basics' && (
        <div className="flex flex-col gap-4">
          <SectionLabel>Identity</SectionLabel>
          <FormField
            label="Course Title"
            value={form.title}
            onChange={(v) => updateForm({ title: v })}
            placeholder="e.g. Data Structures & Algorithms"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Course Code"
              value={form.code}
              onChange={(v) => updateForm({ code: v })}
              placeholder="e.g. CS-201"
            />
            <FormField
              label="Level"
              type="select"
              value={form.level}
              options={[...courseLevelOptions]}
              onChange={(v) => updateForm({ level: v })}
            />
          </div>

          {isAdmin ? (
            <>
              <SectionLabel>Course Assignment</SectionLabel>
              <p className="text-[12px] text-secondary-text -mt-2">
                Pick who teaches this course. Instructors can teach courses outside their home department.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Academic Department"
                  type="select"
                  value={form.department ?? UNASSIGNED_DEPARTMENT}
                  options={departmentOptions}
                  onChange={(v) => updateForm({ department: v })}
                  hint="Organizational unit for this course catalog entry."
                />
                <div>
                  <label className="block text-[12px] font-semibold text-navy-900 mb-1.5">
                    Teaching Instructor
                  </label>
                  <SelectMenu
                    value={form.instructorId ?? ''}
                    onChange={(instructorId) => updateForm({ instructorId })}
                    placeholder="Unassigned"
                    options={[
                      { value: '', label: 'Unassigned' },
                      ...instructorOptions.map((person) => ({
                        value: person.id,
                        label: person.name,
                        hint: person.department || 'No home department',
                      })),
                    ]}
                  />
                </div>
              </div>
            </>
          ) : null}

          <SectionLabel>Overview</SectionLabel>
          <FormField
            label="Short Description"
            type="textarea"
            value={form.shortDescription ?? ''}
            onChange={(v) => updateForm({ shortDescription: v })}
            placeholder="One-line summary shown in catalogs and search results."
            hint="Max ~160 characters recommended."
          />
          <FormField
            label="Full Description"
            type="textarea"
            value={form.description ?? ''}
            onChange={(v) => updateForm({ description: v })}
            placeholder="Describe what learners will study, who the course is for, and expected outcomes."
          />

          <SectionLabel>Structure</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <FormField
              label="Credit Hours"
              type="number"
              value={String(form.credits ?? 3)}
              onChange={(v) => updateForm({ credits: Math.max(0, Number(v) || 0) })}
            />
            <FormField
              label="Duration (weeks)"
              type="number"
              value={String(form.durationWeeks ?? 12)}
              onChange={(v) => updateForm({ durationWeeks: Math.max(1, Number(v) || 1) })}
            />
            <FormField
              label="Delivery Mode"
              type="select"
              value={form.deliveryMode ?? 'Instructor-led'}
              options={[...courseDeliveryModeOptions]}
              onChange={(v) => updateForm({ deliveryMode: v as CourseCreateInput['deliveryMode'] })}
            />
            <FormField
              label="Language"
              type="select"
              value={form.language ?? 'English'}
              options={courseLanguageOptions}
              onChange={(v) => updateForm({ language: v })}
            />
          </div>

          <SectionLabel>Tags</SectionLabel>
          <div className="flex flex-wrap gap-2 min-h-[32px]">
            {(form.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-navy-50 text-navy-800 text-[11.5px] font-semibold border border-divider"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-secondary-text hover:text-danger cursor-pointer"
                  aria-label={`Remove ${tag}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag()
                }
              }}
              placeholder="Add tag and press Enter"
              className={`${inputClass} flex-1`}
            />
            <Button variant="secondary" onClick={addTag}>
              Add
            </Button>
          </div>

          <SectionLabel>Cover Image</SectionLabel>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {form.thumbnailUrl ? (
              <div className="relative w-full sm:w-40 h-24 rounded-xl overflow-hidden border border-divider bg-navy-50">
                <img
                  src={form.thumbnailUrl}
                  alt="Course thumbnail preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => updateForm({ thumbnailUrl: '' })}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-white/90 text-secondary-text hover:text-danger flex items-center justify-center cursor-pointer"
                  aria-label="Remove thumbnail"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => thumbnailRef.current?.click()}
                className="w-full sm:w-40 h-24 rounded-xl border-2 border-dashed border-divider hover:border-lemon-500/50 bg-navy-50/50 flex flex-col items-center justify-center gap-1.5 text-secondary-text hover:text-navy-900 transition-colors cursor-pointer"
              >
                <Upload size={18} />
                <span className="text-[11px] font-semibold">Upload cover</span>
              </button>
            )}
            <input
              ref={thumbnailRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleThumbnailPick(file)
                e.target.value = ''
              }}
            />
            <div className="text-[11.5px] text-secondary-text leading-relaxed flex-1">
              Recommended 16:9 image for course cards and the learner catalog. JPG or PNG, up to 5 MB.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Curriculum' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[13px] font-bold text-navy-900">
                <Layers size={15} className="text-lemon-700" />
                Course Modules
              </div>
              <p className="text-[11.5px] text-secondary-text mt-0.5">
                Organize content into modules with lessons, quizzes and assignments.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => updateForm({ modules: [...(form.modules ?? []), createEmptyModule()] })}
            >
              <Plus size={14} />
              Add Module
            </Button>
          </div>

          {(form.modules ?? []).length === 0 ? (
            <div className="text-center py-8 text-[13px] text-secondary-text border border-dashed border-divider rounded-xl bg-navy-50/30">
              No modules yet. Add your first module to structure the course.
            </div>
          ) : (
            (form.modules ?? []).map((mod, modIndex) => (
              <div
                key={mod.id}
                className="border border-divider rounded-xl p-4 soft-surface flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-semibold text-navy-900">
                        Module {modIndex + 1} Title
                      </span>
                      <input
                        type="text"
                        value={mod.title}
                        onChange={(e) => updateModule(mod.id, { title: e.target.value })}
                        placeholder="e.g. Introduction & Setup"
                        className={inputClass}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 sm:col-span-1">
                      <span className="text-[12px] font-semibold text-navy-900">Description</span>
                      <input
                        type="text"
                        value={mod.description ?? ''}
                        onChange={(e) => updateModule(mod.id, { description: e.target.value })}
                        placeholder="Brief module overview"
                        className={inputClass}
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeModule(mod.id)}
                    className="text-secondary-text hover:text-danger p-1.5 rounded-lg hover:bg-danger-bg cursor-pointer shrink-0"
                    aria-label="Remove module"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="border-t border-divider/60 pt-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-secondary-text">
                      Lessons ({mod.lessons.length})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateModule(mod.id, {
                          lessons: [...mod.lessons, createEmptyLesson()],
                        })
                      }
                      className="text-[11.5px] font-bold text-lemon-800 hover:text-lemon-900 cursor-pointer flex items-center gap-1"
                    >
                      <Plus size={12} /> Add lesson
                    </button>
                  </div>

                  {mod.lessons.length === 0 ? (
                    <p className="text-[11.5px] text-secondary-text italic py-1">
                      No lessons in this module yet.
                    </p>
                  ) : (
                    mod.lessons.map((lesson, lessonIndex) => (
                      <div
                        key={lesson.id}
                        className="grid grid-cols-1 sm:grid-cols-[1fr_120px_80px_auto] gap-2 items-end bg-navy-50/50 rounded-lg p-2.5"
                      >
                        <label className="flex flex-col gap-1">
                          <span className="text-[10.5px] font-semibold text-secondary-text">
                            Lesson {lessonIndex + 1}
                          </span>
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) =>
                              updateModule(mod.id, {
                                lessons: mod.lessons.map((l) =>
                                  l.id === lesson.id ? { ...l, title: e.target.value } : l,
                                ),
                              })
                            }
                            placeholder="Lesson title"
                            className={inputClass}
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-[10.5px] font-semibold text-secondary-text">Type</span>
                          <select
                            value={lesson.type}
                            onChange={(e) =>
                              updateModule(mod.id, {
                                lessons: mod.lessons.map((l) =>
                                  l.id === lesson.id
                                    ? { ...l, type: e.target.value as typeof lesson.type }
                                    : l,
                                ),
                              })
                            }
                            className={`${inputClass} cursor-pointer capitalize`}
                          >
                            {courseLessonTypeOptions.map((t) => (
                              <option key={t} value={t}>
                                {t.replace('-', ' ')}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-[10.5px] font-semibold text-secondary-text">Min</span>
                          <input
                            type="number"
                            min={1}
                            value={lesson.durationMinutes}
                            onChange={(e) =>
                              updateModule(mod.id, {
                                lessons: mod.lessons.map((l) =>
                                  l.id === lesson.id
                                    ? { ...l, durationMinutes: Math.max(1, Number(e.target.value) || 1) }
                                    : l,
                                ),
                              })
                            }
                            className={inputClass}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            updateModule(mod.id, {
                              lessons: mod.lessons.filter((l) => l.id !== lesson.id),
                            })
                          }
                          className="text-secondary-text hover:text-danger p-2 rounded-lg hover:bg-danger-bg cursor-pointer mb-0.5"
                          aria-label="Remove lesson"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}

          <SectionLabel>Prerequisites & Outcomes</SectionLabel>
          <FormField
            label="Prerequisites"
            type="textarea"
            value={form.prerequisites ?? ''}
            onChange={(v) => updateForm({ prerequisites: v })}
            placeholder="Required prior courses, skills or reading."
          />
          <FormField
            label="Learning Outcomes"
            type="textarea"
            value={form.learningOutcomes ?? ''}
            onChange={(v) => updateForm({ learningOutcomes: v })}
            placeholder="What learners will be able to do after completing this course."
          />
        </div>
      )}

      {activeTab === 'Media & Resources' && (
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 text-[13px] font-bold text-navy-900">
                <Film size={15} className="text-lemon-700" />
                Video Lectures
              </div>
              <Button
                variant="secondary"
                onClick={() => updateForm({ videos: [...(form.videos ?? []), createEmptyVideo()] })}
              >
                <Plus size={14} />
                Add Video
              </Button>
            </div>

            {(form.videos ?? []).length === 0 ? (
              <div className="text-[12px] text-secondary-text py-4 text-center border border-dashed border-divider rounded-lg">
                Upload or link lecture recordings, welcome videos and demos.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {(form.videos ?? []).map((video) => (
                  <div
                    key={video.id}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-divider rounded-xl p-3 soft-surface"
                  >
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-semibold text-navy-900">Title</span>
                      <input
                        type="text"
                        value={video.title}
                        onChange={(e) =>
                          updateForm({
                            videos: (form.videos ?? []).map((v) =>
                              v.id === video.id ? { ...v, title: e.target.value } : v,
                            ),
                          })
                        }
                        placeholder="e.g. Week 1 — Course Introduction"
                        className={inputClass}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-semibold text-navy-900">Video URL</span>
                      <input
                        type="url"
                        value={video.url}
                        onChange={(e) =>
                          updateForm({
                            videos: (form.videos ?? []).map((v) =>
                              v.id === video.id ? { ...v, url: e.target.value } : v,
                            ),
                          })
                        }
                        placeholder="https://… or YouTube/Vimeo link"
                        className={inputClass}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-semibold text-navy-900">Linked Module</span>
                      <select
                        value={video.moduleId ?? ''}
                        onChange={(e) =>
                          updateForm({
                            videos: (form.videos ?? []).map((v) =>
                              v.id === video.id ? { ...v, moduleId: e.target.value } : v,
                            ),
                          })
                        }
                        className={`${inputClass} cursor-pointer`}
                      >
                        <option value="">No module</option>
                        {(form.modules ?? []).map((m, i) => (
                          <option key={m.id} value={m.id}>
                            {m.title.trim() || `Module ${i + 1}`}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex gap-2 items-end">
                      <label className="flex flex-col gap-1.5 flex-1">
                        <span className="text-[12px] font-semibold text-navy-900">Duration (min)</span>
                        <input
                          type="number"
                          min={1}
                          value={video.durationMinutes}
                          onChange={(e) =>
                            updateForm({
                              videos: (form.videos ?? []).map((v) =>
                                v.id === video.id
                                  ? { ...v, durationMinutes: Math.max(1, Number(e.target.value) || 1) }
                                  : v,
                              ),
                            })
                          }
                          className={inputClass}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          updateForm({
                            videos: (form.videos ?? []).filter((v) => v.id !== video.id),
                          })
                        }
                        className="text-secondary-text hover:text-danger p-2 rounded-lg hover:bg-danger-bg cursor-pointer mb-0.5"
                        aria-label="Remove video"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 text-[13px] font-bold text-navy-900">
                <FolderOpen size={15} className="text-lemon-700" />
                Downloadable Resources
              </div>
              <Button
                variant="secondary"
                onClick={() =>
                  updateForm({ resources: [...(form.resources ?? []), createEmptyResource()] })
                }
              >
                <Plus size={14} />
                Add Resource
              </Button>
            </div>

            {(form.resources ?? []).length === 0 ? (
              <div className="text-[12px] text-secondary-text py-4 text-center border border-dashed border-divider rounded-lg">
                Attach PDFs, slide decks, worksheets and external links for learners.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {(form.resources ?? []).map((resource) => (
                  <div
                    key={resource.id}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-divider rounded-xl p-3 soft-surface"
                  >
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-semibold text-navy-900">Resource Title</span>
                      <input
                        type="text"
                        value={resource.title}
                        onChange={(e) =>
                          updateForm({
                            resources: (form.resources ?? []).map((r) =>
                              r.id === resource.id ? { ...r, title: e.target.value } : r,
                            ),
                          })
                        }
                        placeholder="e.g. Lecture Slides — Week 1"
                        className={inputClass}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-semibold text-navy-900">Type</span>
                      <select
                        value={resource.type}
                        onChange={(e) =>
                          updateForm({
                            resources: (form.resources ?? []).map((r) =>
                              r.id === resource.id
                                ? { ...r, type: e.target.value as typeof resource.type }
                                : r,
                            ),
                          })
                        }
                        className={`${inputClass} cursor-pointer capitalize`}
                      >
                        {courseResourceTypeOptions.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1.5 sm:col-span-2">
                      <span className="text-[12px] font-semibold text-navy-900">URL or File</span>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={resource.url}
                          onChange={(e) =>
                            updateForm({
                              resources: (form.resources ?? []).map((r) =>
                                r.id === resource.id ? { ...r, url: e.target.value } : r,
                              ),
                            })
                          }
                          placeholder="https://… or upload a file"
                          className={`${inputClass} flex-1`}
                        />
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setPendingResourceId(resource.id)
                            resourceFileRef.current?.click()
                          }}
                        >
                          <Upload size={14} />
                          Upload
                        </Button>
                      </div>
                      {resource.fileName && (
                        <span className="text-[11px] text-navy-700 font-medium">
                          Attached: {resource.fileName}
                        </span>
                      )}
                    </label>
                    <div className="sm:col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          updateForm({
                            resources: (form.resources ?? []).filter((r) => r.id !== resource.id),
                          })
                        }
                        className="text-[12px] font-semibold text-secondary-text hover:text-danger cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 size={13} /> Remove resource
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <input
              ref={resourceFileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file && pendingResourceId) handleResourceFilePick(pendingResourceId, file)
                e.target.value = ''
              }}
            />
          </div>

          <FormField
            label="Syllabus Document URL"
            value={form.syllabusUrl ?? ''}
            onChange={(v) => updateForm({ syllabusUrl: v })}
            placeholder="Link to official syllabus PDF or page"
            hint="Learners and admins can download the full syllabus from the course page."
          />
        </div>
      )}

      {activeTab === 'Settings' && (
        <div className="flex flex-col gap-4">
          <SectionLabel>Publication</SectionLabel>
          {isInstructor ? (
            <div className="rounded-xl border border-info/30 bg-info-bg/40 p-4 text-[12px] text-navy-800 leading-relaxed">
              Instructor proposals are saved as <strong>drafts</strong> and sent to the institution admin for
              approval. You cannot publish directly — an admin will review and approve before the course goes live.
            </div>
          ) : (
            <FormField
              label="Catalog Status"
              type="select"
              value={statusToForm[form.status ?? 'draft']}
              options={statusOptions}
              onChange={(v) => updateForm({ status: statusFromForm[v] ?? 'draft' })}
              hint="Draft courses are hidden from learners until published."
            />
          )}

          <SectionLabel>Enrollment</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Max Enrollment"
              type="number"
              value={String(form.maxEnrollment ?? 120)}
              onChange={(v) => updateForm({ maxEnrollment: Math.max(0, Number(v) || 0) })}
              hint="0 = unlimited"
            />
            <FormField
              label="Visibility"
              type="select"
              value={form.visibility ?? 'private'}
              options={courseVisibilityOptions}
              onChange={(v) => updateForm({ visibility: v as CourseCreateInput['visibility'] })}
            />
          </div>

          <div className="rounded-xl border border-divider bg-navy-50/30 p-4 flex flex-col gap-1">
            <ToggleRow
              label="Allow self-enrollment"
              description="Learners can enroll without admin approval."
              enabled={form.allowSelfEnrollment ?? false}
              onToggle={() => updateForm({ allowSelfEnrollment: !form.allowSelfEnrollment })}
            />
            <ToggleRow
              label="Issue certificate on completion"
              description="Automatically generate a certificate when requirements are met."
              enabled={form.certificateEnabled ?? true}
              onToggle={() => updateForm({ certificateEnabled: !form.certificateEnabled })}
            />
            <ToggleRow
              label="Discussion forum"
              description="Enable course-wide Q&A and peer discussion."
              enabled={form.discussionForumEnabled ?? true}
              onToggle={() => updateForm({ discussionForumEnabled: !form.discussionForumEnabled })}
            />
          </div>

          <SectionLabel>Schedule</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-navy-900">Start Date</span>
              <input
                type="date"
                value={form.startDate ?? ''}
                onChange={(e) => updateForm({ startDate: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-navy-900">End Date</span>
              <input
                type="date"
                value={form.endDate ?? ''}
                onChange={(e) => updateForm({ endDate: e.target.value })}
                className={inputClass}
              />
            </label>
          </div>

          <SectionLabel>Assessment</SectionLabel>
          <FormField
            label="Grading Policy"
            type="textarea"
            value={form.gradingPolicy ?? ''}
            onChange={(v) => updateForm({ gradingPolicy: v })}
            placeholder="e.g. Assignments 40%, Quizzes 20%, Final exam 40%. Passing grade: 60%."
          />

          <div className="rounded-xl border border-lemon-500/20 bg-lemon-50/50 p-4 flex items-start gap-3">
            <Settings2 size={16} className="text-lemon-800 shrink-0 mt-0.5" />
            <div className="text-[12px] text-navy-800 leading-relaxed">
              {isEdit ? (
                <>
                  Changes apply immediately to the catalog. Content readiness:{' '}
                  <strong>{progressPreview}%</strong>.
                </>
              ) : isInstructor ? (
                <>
                  Your proposal will be submitted with <strong>pending approval</strong> status. Current
                  content readiness: <strong>{progressPreview}%</strong>.
                </>
              ) : (
                <>
                  The course will be saved as a <strong>draft</strong>. Publish it from Settings when
                  content is ready. Current readiness: <strong>{progressPreview}%</strong>.
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

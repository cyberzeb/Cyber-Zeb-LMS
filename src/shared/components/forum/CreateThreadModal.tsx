import { useMemo, useState } from 'react'
import { MessageSquarePlus, Users } from 'lucide-react'
import { Button } from '../Button'
import { FormField } from '../FormField'
import { Modal } from '../Modal'
import { Monogram } from '../Monogram'
import type { ForumPersonOption, ForumThreadFormInput } from '../../types/forum'

interface CreateThreadModalProps {
  open: boolean
  onClose: () => void
  inviteOptions: ForumPersonOption[]
  onSubmit: (input: ForumThreadFormInput) => void
}

export function CreateThreadModal({ open, onClose, inviteOptions, onSubmit }: CreateThreadModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState('')

  const filteredOptions = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return inviteOptions
    return inviteOptions.filter(
      (person) =>
        person.name.toLowerCase().includes(normalized) ||
        person.email.toLowerCase().includes(normalized),
    )
  }, [inviteOptions, search])

  const reset = () => {
    setTitle('')
    setDescription('')
    setSelectedIds([])
    setSearch('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const toggleMember = (personId: string) => {
    setSelectedIds((prev) =>
      prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId],
    )
  }

  const handleSubmit = () => {
    if (!title.trim()) return
    onSubmit({
      title,
      description,
      memberIds: selectedIds,
    })
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      title="Create thread"
      description="Start a focused discussion and invite classmates or colleagues."
      icon={<MessageSquarePlus size={18} />}
      size="lg"
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!title.trim()}>
            Create thread
          </Button>
        </>
      }
    >
      <FormField
        label="Thread title"
        value={title}
        onChange={setTitle}
        placeholder="e.g. Study group for midterm review"
      />
      <FormField
        label="Description"
        value={description}
        onChange={setDescription}
        type="textarea"
        placeholder="What is this thread about?"
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-semibold text-navy-900">Invite members</span>
          <span className="text-[11px] text-secondary-text">{selectedIds.length} selected</span>
        </div>
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search people to invite..."
          className="w-full bg-white border border-divider rounded-lg px-3 py-2 text-[13px] text-navy-900 placeholder:text-secondary-text focus:outline-none focus:border-lemon-500/50 focus:ring-2 focus:ring-lemon-500/25 transition-all"
        />
        <div className="max-h-56 overflow-y-auto app-scroll rounded-xl border border-divider divide-y divide-divider">
          {filteredOptions.length === 0 ? (
            <div className="p-6 text-center text-[12.5px] text-secondary-text">
              <Users size={24} className="mx-auto mb-2 text-navy-300" />
              No people match your search.
            </div>
          ) : (
            filteredOptions.map((person) => {
              const selected = selectedIds.includes(person.id)
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => toggleMember(person.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    selected ? 'bg-lemon-50' : 'hover:bg-navy-50'
                  }`}
                >
                  <Monogram label={person.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-navy-900 truncate">{person.name}</p>
                    <p className="text-[11px] text-secondary-text truncate">
                      {person.role} · {person.email}
                    </p>
                  </div>
                  <span
                    className={`w-5 h-5 rounded-md border flex items-center justify-center text-[11px] font-bold ${
                      selected
                        ? 'bg-lemon-500 border-lemon-500 text-navy-900'
                        : 'border-divider text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </Modal>
  )
}

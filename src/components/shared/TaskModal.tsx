import { useEffect, useMemo, useState } from 'react'
import { Modal } from './Modal'
import type { Task, TaskStatus } from '../../hooks/useTasks'
import { useContacts } from '../../hooks/useContacts'

type TaskModalProps = {
  open: boolean
  task: Task | null
  onClose: () => void
  onSave: (taskId: string, patch: Partial<Task>) => Promise<void>
}

const statusOptions: Array<{ label: string; value: TaskStatus }> = [
  { label: 'To Do', value: 'toDo' },
  { label: 'In Progress', value: 'inProgress' },
  { label: 'Awaiting Reply', value: 'awaitingReply' },
  { label: 'Done', value: 'done' },
]

const taskTypeOptions = [
  { label: 'None', value: '' },
  { label: 'Admin', value: 'admin' },
  { label: 'Outreach', value: 'outreach' },
  { label: 'Client Work', value: 'client_work' },
  { label: 'Business Development', value: 'business_development' },
  { label: 'Schedule', value: 'schedule' },
  { label: 'Other', value: 'other' },
]

function dateInputValue(value?: string | null) {
  if (!value) return ''

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function FieldIcon({ type }: { type: 'date' | 'contact' | 'status' | 'type' | 'time' | 'file' }) {
  if (type === 'date') {
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="2.5" y="3" width="11" height="10" rx="2" />
        <path d="M2.5 6h11M5.5 2v2.5M10.5 2v2.5" strokeLinecap="round" />
      </svg>
    )
  }

  if (type === 'contact') {
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="8" cy="5.6" r="2.6" />
        <path d="M3 14c0-3 2.2-5 5-5s5 2 5 5" strokeLinecap="round" />
      </svg>
    )
  }

  if (type === 'status') {
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="8" cy="8" r="5.5" />
      </svg>
    )
  }

  if (type === 'type') {
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="3" width="10" height="10" rx="2" />
        <path d="M5.5 6h5M5.5 9h3.5" strokeLinecap="round" />
      </svg>
    )
  }

  if (type === 'file') {
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M5 2.5h4.5L13 6v7.5H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" />
        <path d="M9.5 2.5V6H13M6 9h4M6 11.5h3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 4.8V8l2.4 1.3" strokeLinecap="round" />
    </svg>
  )
}

function TaskHeaderIcon() {
  return (
    <svg viewBox="0 0 18 18" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2.5" y="2.5" width="13" height="13" rx="3" />
      <path d="M5.7 9.3l2.2 2.2 4.7-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function fileSizeLabel(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function TaskModal({ open, task, onClose, onSave }: TaskModalProps) {
  const { contacts } = useContacts()

  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<TaskStatus>('toDo')
  const [taskType, setTaskType] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [minutes, setMinutes] = useState(30)
  const [contactId, setContactId] = useState('')
  const [contactSearch, setContactSearch] = useState('')
  const [contactPickerOpen, setContactPickerOpen] = useState(false)
  const [starred, setStarred] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isNew = !task?.id

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase()

    return contacts
      .filter((contact) => {
        if (!q) return true

        return (
          contact.name.toLowerCase().includes(q) ||
          (contact.email ?? '').toLowerCase().includes(q) ||
          (contact.company ?? '').toLowerCase().includes(q) ||
          (contact.role ?? '').toLowerCase().includes(q)
        )
      })
      .slice(0, 8)
  }, [contacts, contactSearch])

  useEffect(() => {
    if (!task) return

    setTitle(task.title ?? '')
    setNotes(task.notes ?? '')
    setStatus(task.status ?? 'toDo')
    setTaskType(task.task_type ?? '')
    setDueDate(dateInputValue(task.due_date))
    setMinutes(task.estimated_minutes ?? 30)
    setContactId(task.contact_id ?? '')

    const linkedContact = contacts.find((contact) => contact.id === task.contact_id)
    setContactSearch(linkedContact?.name ?? '')

    setStarred(Boolean(task.starred))
    setSelectedFiles([])
    setErrorMessage(null)
  }, [task, contacts])

  if (!task) return null

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMessage('Task title is required.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      await onSave(task.id, {
        title: title.trim(),
        notes: notes.trim() || null,
        status,
        task_type: taskType || null,
        due_date: dueDate || null,
        estimated_minutes: minutes || 30,
        contact_id: contactId || null,
        starred,
      })

      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? 'New Task' : 'Edit Task'}
      hideHeader
      maxWidthClassName="max-w-3xl"
      contentClassName="rounded-2xl shadow-2xl"
    >
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        <div className="flex items-center justify-between bg-[var(--tasks)] px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-white">
              <TaskHeaderIcon />
            </div>

            <h2 className="font-serif text-2xl font-medium">
              {isNew ? 'New Task' : 'Edit Task'}
            </h2>
          </div>

          <button
            type="button"
            aria-label="Close task modal"
            onClick={onClose}
            className="rounded-full p-2 text-white/75 transition hover:bg-white/15 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="max-h-[64vh] overflow-y-auto bg-[var(--bg)] px-6 py-6">
          {errorMessage && (
            <div className="mb-4 rounded-xl border border-[rgba(201,136,142,0.25)] bg-[rgba(201,136,142,0.08)] px-4 py-3 text-sm text-[#a85c64]">
              {errorMessage}
            </div>
          )}

          <div className="mx-auto max-w-2xl">
            <div className="mb-5 flex items-start gap-3 border-b border-[var(--border)] pb-4">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Task title..."
                className="min-w-0 flex-1 bg-transparent font-serif text-2xl font-medium text-[var(--text)] outline-none placeholder:text-[#c8cfd8]"
              />

              <button
                type="button"
                aria-label="Voice note"
                className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(193,152,173,0.16)] text-[var(--tasks)]"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="5.2" y="2" width="5.6" height="8" rx="2.8" />
                  <path d="M3.5 8.2a4.5 4.5 0 0 0 9 0M8 12.8v1.4" strokeLinecap="round" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => setStarred((value) => !value)}
                aria-label={starred ? 'Unstar task' : 'Star task'}
                className={`mt-0.5 text-2xl leading-none transition ${
                  starred ? 'text-[#f0c040]' : 'text-[#cfd6df] hover:text-[#b8c1cc]'
                }`}
              >
                {starred ? '★' : '☆'}
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid gap-5">
                <div className="grid items-center gap-3 md:grid-cols-[150px_1fr]">
                  <div className="flex items-center gap-3 text-[var(--muted)]">
                    <span className="text-[var(--tasks)]">
                      <FieldIcon type="date" />
                    </span>
                    <span className="text-sm font-medium">Due Date</span>
                  </div>

                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className="w-full rounded-full border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--tasks)] focus:ring-2 focus:ring-[rgba(193,152,173,0.14)]"
                  />
                </div>

                <div className="grid items-center gap-3 md:grid-cols-[150px_1fr]">
                  <div className="flex items-center gap-3 text-[var(--muted)]">
                    <span className="text-[#8ba5a8]">
                      <FieldIcon type="contact" />
                    </span>
                    <span className="text-sm font-medium">Contact</span>
                  </div>

                  <div className="relative">
                    <input
                      value={contactSearch}
                      onFocus={() => setContactPickerOpen(true)}
                      onBlur={() => {
                        window.setTimeout(() => setContactPickerOpen(false), 150)
                      }}
                      onChange={(event) => {
                        setContactSearch(event.target.value)
                        setContactId('')
                        setContactPickerOpen(true)
                      }}
                      placeholder="Search contacts..."
                      className="w-full rounded-full border border-[var(--border)] bg-white px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-[var(--tasks)] focus:ring-2 focus:ring-[rgba(193,152,173,0.14)]"
                    />

                    {contactSearch && (
                      <button
                        type="button"
                        aria-label="Clear linked contact"
                        onMouseDown={(event) => {
                          event.preventDefault()
                          setContactSearch('')
                          setContactId('')
                          setContactPickerOpen(false)
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-1.5 py-0.5 text-xs text-[var(--muted)] hover:bg-black/[0.05]"
                      >
                        ×
                      </button>
                    )}

                    {contactPickerOpen && (
                      <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-64 overflow-y-auto rounded-xl border border-[var(--border)] bg-white p-1 shadow-xl">
                        <button
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault()
                            setContactSearch('')
                            setContactId('')
                            setContactPickerOpen(false)
                          }}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--muted)] hover:bg-[var(--bg)]"
                        >
                          No linked contact
                        </button>

                        {filteredContacts.length === 0 ? (
                          <div className="px-3 py-3 text-sm text-[var(--muted)]">
                            No matching contacts found.
                          </div>
                        ) : (
                          filteredContacts.map((contact) => (
                            <button
                              key={contact.id}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault()
                                setContactId(contact.id)
                                setContactSearch(contact.name)
                                setContactPickerOpen(false)
                              }}
                              className="w-full rounded-lg px-3 py-2 text-left hover:bg-[var(--bg)]"
                            >
                              <span className="block text-sm font-medium text-[var(--text)]">
                                {contact.name}
                              </span>
                              <span className="block truncate text-xs text-[var(--muted)]">
                                {[contact.role, contact.company, contact.email]
                                  .filter(Boolean)
                                  .join(' · ') || 'No details'}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid items-center gap-3 md:grid-cols-[150px_1fr]">
                  <div className="flex items-center gap-3 text-[var(--muted)]">
                    <span className="text-[var(--tasks)]">
                      <FieldIcon type="status" />
                    </span>
                    <span className="text-sm font-medium">Status</span>
                  </div>

                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as TaskStatus)}
                    className="w-full rounded-full border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--tasks)] focus:ring-2 focus:ring-[rgba(193,152,173,0.14)]"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid items-center gap-3 md:grid-cols-[150px_1fr]">
                  <div className="flex items-center gap-3 text-[var(--muted)]">
                    <span className="text-[#6684a1]">
                      <FieldIcon type="type" />
                    </span>
                    <span className="text-sm font-medium">Task Type</span>
                  </div>

                  <select
                    value={taskType}
                    onChange={(event) => setTaskType(event.target.value)}
                    className="w-full rounded-full border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--tasks)] focus:ring-2 focus:ring-[rgba(193,152,173,0.14)]"
                  >
                    {taskTypeOptions.map((option) => (
                      <option key={option.value || 'none'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid items-center gap-3 md:grid-cols-[150px_1fr]">
                  <div className="flex items-center gap-3 text-[var(--muted)]">
                    <span className="text-[#6684a1]">
                      <FieldIcon type="time" />
                    </span>
                    <span className="text-sm font-medium">Est. Time</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={minutes}
                      onChange={(event) => setMinutes(Number(event.target.value))}
                      className="w-24 rounded-full border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--tasks)] focus:ring-2 focus:ring-[rgba(193,152,173,0.14)]"
                    />
                    <span className="text-sm text-[var(--muted)]">minutes</span>
                  </div>
                </div>

                <div className="grid items-start gap-3 md:grid-cols-[150px_1fr]">
                  <div className="flex items-center gap-3 pt-2 text-[var(--muted)]">
                    <span className="text-[#6684a1]">
                      <FieldIcon type="file" />
                    </span>
                    <span className="text-sm font-medium">File Upload</span>
                  </div>

                  <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-4">
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl bg-[var(--bg)] px-4 py-5 text-center transition hover:bg-black/[0.03]">
                      <span className="text-sm font-medium text-[var(--text)]">
                        Choose file
                      </span>
                      <span className="mt-1 text-xs text-[var(--muted)]">
                        File storage will be connected in the next backend pass.
                      </span>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                          setSelectedFiles(Array.from(event.target.files ?? []))
                        }}
                      />
                    </label>

                    {selectedFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {selectedFiles.map((file) => (
                          <div
                            key={`${file.name}-${file.size}`}
                            className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs"
                          >
                            <span className="min-w-0 truncate text-[var(--text)]">
                              {file.name}
                            </span>
                            <span className="ml-3 shrink-0 text-[var(--muted)]">
                              {fileSizeLabel(file.size)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="mb-2 block text-sm font-medium text-[var(--text)]">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={5}
                  placeholder="Add notes..."
                  className="w-full resize-y rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--tasks)] focus:ring-2 focus:ring-[rgba(193,152,173,0.14)]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-white px-6 py-4">
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-sm text-[var(--muted)] transition hover:bg-black/[0.04]"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="rounded-xl bg-[var(--jamie)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            disabled={isSaving}
            onClick={() => void handleSave()}
          >
            {isSaving ? 'Saving...' : isNew ? 'Create Task' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

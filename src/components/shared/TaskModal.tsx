import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import type { Task, TaskStatus } from '../../hooks/useTasks'

type TaskModalProps = {
  open: boolean
  task: Task | null
  onClose: () => void
  onSave: (taskId: string, patch: Partial<Task>) => Promise<void>
}

const statusOptions: Array<{ label: string; value: TaskStatus }> = [
  { label: 'To do', value: 'toDo' },
  { label: 'In progress', value: 'inProgress' },
  { label: 'Awaiting reply', value: 'awaitingReply' },
  { label: 'Done', value: 'done' },
]

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
      {children}
    </label>
  )
}

export function TaskModal({ open, task, onClose, onSave }: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<TaskStatus>('toDo')
  const [taskType, setTaskType] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [minutes, setMinutes] = useState(30)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isNew = !task?.id

  useEffect(() => {
    if (!task) return

    setTitle(task.title)
    setNotes(task.notes ?? '')
    setStatus(task.status)
    setTaskType(task.task_type ?? '')
    setDueDate(task.due_date ?? '')
    setMinutes(task.estimated_minutes ?? 30)
    setErrorMessage(null)
  }, [task])

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
        task_type: taskType.trim() || null,
        due_date: dueDate || null,
        estimated_minutes: minutes,
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
          <div>
            <h2 className="font-serif text-2xl font-medium">
              {isNew ? 'New Task' : 'Edit Task'}
            </h2>
            <p className="mt-1 text-sm text-white/75">
              Capture the task, due date, status, and any working notes.
            </p>
          </div>

          <button
            type="button"
            aria-label="Close task modal"
            onClick={onClose}
            className="rounded-full p-2 text-white/75 transition hover:bg-white/15 hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="max-h-[62vh] overflow-y-auto bg-[var(--bg)] p-5">
          {errorMessage && (
            <div className="mb-4 rounded-xl border border-[rgba(201,136,142,0.25)] bg-[rgba(201,136,142,0.08)] px-4 py-3 text-sm text-[#a85c64]">
              {errorMessage}
            </div>
          )}

          <div className="space-y-5">
            <section>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9f6e89]">
                  Task Details
                </p>
                <div className="h-px flex-1 bg-[rgba(193,152,173,0.25)]" />
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-white p-4">
                <FieldLabel>Task title</FieldLabel>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="What needs to get done?"
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 font-serif text-lg outline-none transition focus:border-[var(--tasks)] focus:ring-2 focus:ring-[rgba(193,152,173,0.14)]"
                />
              </div>
            </section>

            <section>
              <div className="grid gap-3 rounded-xl border border-[var(--border)] bg-white p-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as TaskStatus)}
                    className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--tasks)] focus:ring-2 focus:ring-[rgba(193,152,173,0.14)]"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>Task type</FieldLabel>
                  <input
                    value={taskType}
                    onChange={(event) => setTaskType(event.target.value)}
                    placeholder="Follow-up, admin, content..."
                    className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--tasks)] focus:ring-2 focus:ring-[rgba(193,152,173,0.14)]"
                  />
                </div>

                <div>
                  <FieldLabel>Due date</FieldLabel>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--tasks)] focus:ring-2 focus:ring-[rgba(193,152,173,0.14)]"
                  />
                </div>

                <div>
                  <FieldLabel>Estimated minutes</FieldLabel>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={minutes}
                    onChange={(event) => setMinutes(Number(event.target.value))}
                    className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--tasks)] focus:ring-2 focus:ring-[rgba(193,152,173,0.14)]"
                  />
                </div>
              </div>
            </section>

            <section>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9f6e89]">
                  Notes
                </p>
                <div className="h-px flex-1 bg-[rgba(193,152,173,0.25)]" />
              </div>

              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={7}
                placeholder="Add context, links, next steps, or anything Jamie should remember..."
                className="w-full resize-y rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm leading-6 outline-none transition focus:border-[var(--tasks)] focus:ring-2 focus:ring-[rgba(193,152,173,0.14)]"
              />
            </section>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-white px-5 py-4">
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-sm text-[var(--muted)] transition hover:bg-black/[0.04]"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="rounded-lg bg-[var(--tasks)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            disabled={isSaving}
            onClick={() => void handleSave()}
          >
            {isSaving ? 'Saving...' : isNew ? 'Create Task' : 'Save Task'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Modal } from '../shared/Modal'
import { TaskCard } from '../shared/TaskCard'
import type { Task } from '../../hooks/useTasks'
import type {
  ContactInteraction,
  ContactInteractionUpdateInput,
  InteractionActionItem,
  InteractionActionItemUpdateInput,
} from '../../hooks/useContactInteractions'

type MutationResult<T> = Promise<{
  data: T | null
  error: { message?: string } | Error | null
}>

type Props = {
  open: boolean
  interaction: ContactInteraction | null
  contactId: string | null
  contactName: string
  actionItems: InteractionActionItem[]
  meetingTasks: Task[]
  onClose: () => void
  onSave: (
    interactionId: string,
    patch: ContactInteractionUpdateInput,
  ) => MutationResult<ContactInteraction>
  onArchive: (interactionId: string) => MutationResult<ContactInteraction>
  onCreateActionItem: (
    interactionId: string,
    text: string,
  ) => MutationResult<InteractionActionItem>
  onUpdateActionItem: (
    actionItemId: string,
    patch: InteractionActionItemUpdateInput,
  ) => MutationResult<InteractionActionItem>
  onArchiveActionItem: (actionItemId: string) => MutationResult<InteractionActionItem>
  onCreateTaskFromActionItem: (
    actionItem: InteractionActionItem,
    interaction: ContactInteraction,
  ) => MutationResult<Task>
  onEditTask: (task: Task) => void
  onArchiveTask: (task: Task) => Promise<void> | void
  onQuickUpdateTask: (task: Task, patch: Partial<Task>) => Promise<void> | void
  onStarTask: (task: Task) => Promise<void> | void
  onToggleTask: (task: Task) => Promise<void> | void
}

function dateInputValue(value?: string | null) {
  if (!value) return ''

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function datetimeLocalValue(value?: string | null) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function isoFromDatetimeLocal(value: string) {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  return date.toISOString()
}

function formatMeetingMeta(interaction: ContactInteraction) {
  const dateLabel = interaction.interaction_date
    ? new Date(`${interaction.interaction_date}T00:00:00`).toLocaleDateString([], {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No date set'

  const start = interaction.start_time
    ? new Date(interaction.start_time).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null

  const end = interaction.end_time
    ? new Date(interaction.end_time).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null

  if (start && end) return `${dateLabel} · ${start} – ${end}`
  if (start) return `${dateLabel} · ${start}`

  return dateLabel
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
      {children}
    </label>
  )
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-[var(--meeting)] focus:ring-2 focus:ring-[rgba(100,132,161,0.12)]"
      />
    </div>
  )
}

export function MeetingInteractionModal({
  open,
  interaction,
  contactId,
  contactName,
  actionItems,
  meetingTasks,
  onClose,
  onSave,
  onArchive,
  onCreateActionItem,
  onUpdateActionItem,
  onArchiveActionItem,
  onCreateTaskFromActionItem,
  onEditTask,
  onArchiveTask,
  onQuickUpdateTask,
  onStarTask,
  onToggleTask,
}: Props) {
  const [title, setTitle] = useState('')
  const [interactionDate, setInteractionDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [prepNotes, setPrepNotes] = useState('')
  const [duringMeetingNotes, setDuringMeetingNotes] = useState('')
  const [fathomUrl, setFathomUrl] = useState('')
  const [postMeetingSummary, setPostMeetingSummary] = useState('')

  const [newActionItem, setNewActionItem] = useState('')
  const [actionItemDrafts, setActionItemDrafts] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [creatingTaskForActionItemId, setCreatingTaskForActionItemId] = useState<string | null>(
    null,
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!interaction || !open) return

    setTitle(interaction.title ?? '')
    setInteractionDate(dateInputValue(interaction.interaction_date))
    setStartTime(datetimeLocalValue(interaction.start_time))
    setEndTime(datetimeLocalValue(interaction.end_time))
    setPrepNotes(interaction.prep_notes ?? '')
    setDuringMeetingNotes(interaction.during_meeting_notes ?? '')
    setFathomUrl(interaction.fathom_url ?? '')
    setPostMeetingSummary(interaction.post_meeting_summary ?? '')
    setNewActionItem('')
    setCreatingTaskForActionItemId(null)
    setErrorMessage(null)

    const drafts: Record<string, string> = {}
    actionItems.forEach((item) => {
      drafts[item.id] = item.text
    })
    setActionItemDrafts(drafts)
    }, [interaction?.id, open])

  const sortedActionItems = useMemo(
    () =>
      [...actionItems].sort((a, b) =>
        (a.created_at ?? '').localeCompare(b.created_at ?? ''),
      ),
    [actionItems],
  )

  const taskById = useMemo(
    () => new Map(meetingTasks.map((task) => [task.id, task])),
    [meetingTasks],
  )

  if (!interaction) return null

  const handleSave = async () => {
    setIsSaving(true)
    setErrorMessage(null)

    const { error } = await onSave(interaction.id, {
      title: title.trim() || 'Untitled meeting',
      interaction_date: interactionDate || null,
      start_time: isoFromDatetimeLocal(startTime),
      end_time: isoFromDatetimeLocal(endTime),
      prep_notes: prepNotes || null,
      during_meeting_notes: duringMeetingNotes || null,
      fathom_url: fathomUrl || null,
      post_meeting_summary: postMeetingSummary || null,
    })

    setIsSaving(false)

    if (error) {
      setErrorMessage(error.message || 'Something went wrong while saving this meeting.')
      return
    }

    onClose()
  }

  const handleArchive = async () => {
    setIsSaving(true)
    setErrorMessage(null)

    const { error } = await onArchive(interaction.id)

    setIsSaving(false)

    if (error) {
      setErrorMessage(error.message || 'Something went wrong while archiving this meeting.')
      return
    }

    onClose()
  }

  const handleAddActionItem = async () => {
    if (!newActionItem.trim()) return

    setErrorMessage(null)

    const { error } = await onCreateActionItem(interaction.id, newActionItem.trim())

    if (error) {
      setErrorMessage(error.message || 'Action item could not be added.')
      return
    }

    setNewActionItem('')
  }

  const handleSaveActionItem = async (actionItem: InteractionActionItem) => {
    const nextText = actionItemDrafts[actionItem.id]?.trim()

    if (!nextText) {
      setErrorMessage('Action item text cannot be empty.')
      return
    }

    if (nextText === actionItem.text) return

    const { error } = await onUpdateActionItem(actionItem.id, {
      text: nextText,
    })

    if (error) {
      setErrorMessage(error.message || 'Action item could not be updated.')
    }
  }

  const handleArchiveActionItem = async (actionItemId: string) => {
    const { error } = await onArchiveActionItem(actionItemId)

    if (error) {
      setErrorMessage(error.message || 'Action item could not be archived.')
    }
  }

  const handleCreateTaskFromActionItem = async (actionItem: InteractionActionItem) => {
    setCreatingTaskForActionItemId(actionItem.id)
    setErrorMessage(null)

    const { error } = await onCreateTaskFromActionItem(actionItem, interaction)

    setCreatingTaskForActionItemId(null)

    if (error) {
      setErrorMessage(error.message || 'Task could not be created from this action item.')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={interaction.title || 'Meeting Interaction'}
      hideHeader
      maxWidthClassName="max-w-5xl"
      contentClassName="rounded-2xl shadow-2xl"
    >
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        <div className="bg-[var(--meeting)] px-5 py-4 text-white">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white/80">Meeting Dossier</p>
              <h2 className="mt-1 font-serif text-2xl font-medium">
                {title.trim() || 'Untitled meeting'}
              </h2>
              <p className="mt-1 text-sm text-white/75">
                {contactName} · {formatMeetingMeta(interaction)}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-white/80 transition hover:bg-white/15 hover:text-white"
              aria-label="Close meeting dossier"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="max-h-[72vh] space-y-5 overflow-y-auto bg-[var(--bg)] p-5">
          {errorMessage && (
            <div className="rounded-xl border border-[rgba(201,136,142,0.25)] bg-[rgba(201,136,142,0.08)] px-4 py-3 text-sm text-[#a85c64]">
              {errorMessage}
            </div>
          )}

          <section className="rounded-xl border border-[var(--border)] bg-white p-4">
            <p className="font-serif text-xl">Meeting overview</p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <FieldLabel>Meeting title</FieldLabel>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Client check-in"
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--meeting)] focus:ring-2 focus:ring-[rgba(100,132,161,0.12)]"
                />
              </div>

              <div>
                <FieldLabel>Date</FieldLabel>
                <input
                  type="date"
                  value={interactionDate}
                  onChange={(event) => setInteractionDate(event.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--meeting)] focus:ring-2 focus:ring-[rgba(100,132,161,0.12)]"
                />
              </div>

              <div>
                <FieldLabel>Start time</FieldLabel>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--meeting)] focus:ring-2 focus:ring-[rgba(100,132,161,0.12)]"
                />
              </div>

              <div>
                <FieldLabel>End time</FieldLabel>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--meeting)] focus:ring-2 focus:ring-[rgba(100,132,161,0.12)]"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-white p-4">
            <p className="font-serif text-xl">Prep notes</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Capture anything you want to remember before the conversation.
            </p>

            <div className="mt-4">
              <Textarea
                label="Prep notes"
                value={prepNotes}
                onChange={setPrepNotes}
                placeholder="Questions to ask, context to revisit, goals for the conversation..."
                rows={6}
              />
            </div>
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-white p-4">
            <p className="font-serif text-xl">During-meeting notes</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Freeform notes you take live during the conversation.
            </p>

            <div className="mt-4">
              <Textarea
                label="During meeting"
                value={duringMeetingNotes}
                onChange={setDuringMeetingNotes}
                placeholder="Take notes during the meeting..."
                rows={8}
              />
            </div>
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-white p-4">
            <p className="font-serif text-xl">Post-meeting notes</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Store the Fathom link, summary, and key context you want to keep.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <FieldLabel>Fathom URL</FieldLabel>
                <input
                  value={fathomUrl}
                  onChange={(event) => setFathomUrl(event.target.value)}
                  placeholder="https://app.fathom.video/call/..."
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--meeting)] focus:ring-2 focus:ring-[rgba(100,132,161,0.12)]"
                />
              </div>

              <Textarea
                label="Summary"
                value={postMeetingSummary}
                onChange={setPostMeetingSummary}
                placeholder="Brief meeting summary..."
                rows={6}
              />
            </div>
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-white p-4">
            <p className="font-serif text-xl">Action items</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Capture follow-up actions from the meeting and turn them into editable tasks.
            </p>

            <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] bg-[#faf9f8] p-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={newActionItem}
                  onChange={(event) => setNewActionItem(event.target.value)}
                  placeholder="Add an action item..."
                  className="flex-1 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--meeting)]"
                />

                <button
                  type="button"
                  onClick={() => void handleAddActionItem()}
                  className="rounded-lg bg-[var(--meeting)] px-4 py-2 text-sm font-semibold text-white"
                >
                  + Add
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {sortedActionItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] bg-[#faf9f8] p-5 text-sm text-[var(--muted)]">
                  No action items added yet.
                </div>
              ) : (
                sortedActionItems.map((item) => {
                  const linkedTask = item.task_id ? taskById.get(item.task_id) ?? null : null

                  return (
                    <article
                      key={item.id}
                      className="rounded-xl border border-[var(--border)] bg-[#faf9f8] p-3"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        <input
                          value={actionItemDrafts[item.id] ?? item.text}
                          onChange={(event) =>
                            setActionItemDrafts((prev) => ({
                              ...prev,
                              [item.id]: event.target.value,
                            }))
                          }
                          className="flex-1 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--meeting)]"
                        />

                        <button
                          type="button"
                          onClick={() => void handleSaveActionItem(item)}
                          className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-black/[0.03]"
                        >
                          Save
                        </button>

                        {!item.task_id && (
                          <button
                            type="button"
                            onClick={() => void handleCreateTaskFromActionItem(item)}
                            disabled={
                              creatingTaskForActionItemId === item.id ||
                              !contactId
                            }
                            className="rounded-lg bg-[rgba(193,152,173,0.18)] px-3 py-2 text-xs font-semibold text-[#9f6e89] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {creatingTaskForActionItemId === item.id
                              ? 'Creating...'
                              : 'Create Task'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => void handleArchiveActionItem(item.id)}
                          className="rounded-lg px-3 py-2 text-xs font-medium text-[var(--muted)] hover:bg-black/[0.03]"
                        >
                          Archive
                        </button>
                      </div>

                      {item.task_id && !linkedTask && (
                        <div className="mt-3 rounded-lg bg-[rgba(143,167,144,0.12)] px-3 py-2 text-xs font-medium text-[#6f8d70]">
                          Task created.
                        </div>
                      )}

                      {linkedTask && (
                        <div className="mt-3">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                            Linked task
                          </p>

                          <TaskCard
                            task={linkedTask}
                            contactName={contactName}
                            contactId={contactId}
                            onEdit={onEditTask}
                            onArchive={onArchiveTask}
                            onQuickUpdate={onQuickUpdateTask}
                            onStar={onStarTask}
                            onToggle={onToggleTask}
                          />
                        </div>
                      )}
                    </article>
                  )
                })
              )}
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] bg-white px-5 py-4">
          <button
            type="button"
            onClick={() => void handleArchive()}
            disabled={isSaving}
            className="text-sm text-[var(--muted)] transition hover:text-[#a85c64] disabled:opacity-50"
          >
            Archive interaction
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-[var(--muted)] transition hover:bg-black/[0.04]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="rounded-lg bg-[var(--meeting)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

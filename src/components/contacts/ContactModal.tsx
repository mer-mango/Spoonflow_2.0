import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Modal } from '../shared/Modal'
import type { Contact, ContactUpdateInput } from '../../hooks/useContacts'
import { useTasks, type Task } from '../../hooks/useTasks'
import { TaskCard } from '../shared/TaskCard'
import { TaskModal } from '../shared/TaskModal'

type MutationResult = {
  error: { message?: string } | Error | null
}

type EditableContactFields = ContactUpdateInput & {
  name: string
}

type Props = {
  open: boolean
  contact: Contact | null
  onClose: () => void
  onCreate: (payload: EditableContactFields) => Promise<MutationResult>
  onUpdate: (contactId: string, patch: ContactUpdateInput) => Promise<MutationResult>
  onTasksChanged?: () => Promise<unknown> | void
}

type Tab = 'information' | 'interactions' | 'notes' | 'tasks' | 'nurture'
type ContactTaskView = 'active' | 'done'
type NurtureLogEntry = {
  id: string
  contactId: string
  createdAt: string
  entry: string
  nextNurtureDate: string | null
  frequencyDays: number | null
}

const nurtureOptions = [
  { label: 'None', value: '' },
  { label: '2 weeks', value: '14' },
  { label: '4 weeks', value: '28' },
  { label: '6 weeks', value: '42' },
  { label: '8 weeks', value: '56' },
  { label: '10 weeks', value: '70' },
  { label: '12 weeks', value: '84' },
]

function makeInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function dateInputValue(value?: string | null) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function isoFromDateInput(value: string) {
  if (!value) return null

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12, 0, 0, 0)

  return date.toISOString()
}
function addDaysDateInput(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function nurtureLogStorageKey(contactId: string) {
  return `spoonflow_nurture_logs_${contactId}`
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
function text(value?: string | null) {
  return value ?? ''
}

function isActiveTask(task: Task) {
  return task.status !== 'done' && !task.archived
}

function isDoneTask(task: Task) {
  return task.status === 'done' && !task.archived
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
      {children}
    </label>
  )
}

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6d8c90]">
        {children}
      </p>
      <div className="h-px flex-1 bg-[rgba(109,140,144,0.22)]" />
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--meeting)] focus:ring-2 focus:ring-[rgba(100,132,161,0.12)]"
      />
    </div>
  )
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
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

function blankTaskForContact(contactId: string): Task {
  return {
    id: '',
    title: '',
    notes: null,
    status: 'toDo',
    task_type: null,
    due_date: null,
    estimated_minutes: 30,
    starred: false,
    archived: false,
    contact_id: contactId,
    goal_id: null,
    content_item_id: null,
    meeting_id: null,
  }
}

export function ContactModal({
  open,
  contact,
  onClose,
  onCreate,
  onUpdate,
  onTasksChanged,
}: Props) {
  const { tasks, createTask, updateTask, archiveTask } = useTasks()

  const isNew = !contact
  const [activeTab, setActiveTab] = useState<Tab>('information')
  const [contactTaskView, setContactTaskView] = useState<ContactTaskView>('active')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [website, setWebsite] = useState('')
  const [schedulingLink, setSchedulingLink] = useState('')
  const [city, setCity] = useState('')
  const [stateValue, setStateValue] = useState('')
  const [fromNote, setFromNote] = useState('')
  const [about, setAbout] = useState('')
  const [notes, setNotes] = useState('')
  const [nurtureFrequencyDays, setNurtureFrequencyDays] = useState('')
  const [nextNurtureDate, setNextNurtureDate] = useState('')
  const [starred, setStarred] = useState(false)

  const contactTasks = useMemo(
    () => tasks.filter((task) => task.contact_id === contact?.id && !task.archived),
    [tasks, contact?.id],
  )

  const activeContactTasks = useMemo(
    () => contactTasks.filter(isActiveTask),
    [contactTasks],
  )

  const doneContactTasks = useMemo(
    () => contactTasks.filter(isDoneTask),
    [contactTasks],
  )

  const visibleContactTasks =
    contactTaskView === 'active' ? activeContactTasks : doneContactTasks

  const displayName = name.trim() || 'New Contact'
  const displayRole = [role, company].filter(Boolean).join(' · ')
  const avatarColor = contact?.color || '#8ba5a8'
  const avatarInitials = contact?.initials || makeInitials(displayName)

  useEffect(() => {
    if (!open) return

    setActiveTab('information')
    setContactTaskView('active')
    setErrorMessage(null)
    setSelectedTask(null)

    setName(contact?.name ?? '')
    setRole(text(contact?.role))
    setCompany(text(contact?.company))
    setEmail(text(contact?.email))
    setLinkedinUrl(text(contact?.linkedin_url))
    setWebsite(text(contact?.website))
    setSchedulingLink(text(contact?.scheduling_link))
    setCity(text(contact?.city))
    setStateValue(text(contact?.state))
    setFromNote(text(contact?.from_note))
    setAbout(text(contact?.about))
    setNotes(text(contact?.notes))
    setNurtureFrequencyDays(
      contact?.nurture_frequency_days ? String(contact.nurture_frequency_days) : '',
    )
    setNextNurtureDate(dateInputValue(contact?.next_nurture_date))
    setStarred(Boolean(contact?.starred))
  }, [open, contact])

  const buildPayload = (): EditableContactFields => ({
    name: displayName,
    role: role || null,
    company: company || null,
    email: email || null,
    linkedin_url: linkedinUrl || null,
    website: website || null,
    scheduling_link: schedulingLink || null,
    city: city || null,
    state: stateValue || null,
    from_note: fromNote || null,
    about: about || null,
    notes: notes || null,
    nurture_frequency_days: nurtureFrequencyDays ? Number(nurtureFrequencyDays) : null,
    next_nurture_date: isoFromDateInput(nextNurtureDate),
    starred,
    color: contact?.color || '#8ba5a8',
    initials: makeInitials(displayName),
  })

  const handleSave = async () => {
    if (!displayName.trim()) {
      setErrorMessage('Contact name is required.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    const payload = buildPayload()
    const result =
      isNew || !contact ? await onCreate(payload) : await onUpdate(contact.id, payload)

    setIsSaving(false)

    if (result.error) {
      setErrorMessage(result.error.message || 'Something went wrong while saving this contact.')
      return
    }

    onClose()
  }

  const handleContactTaskSave = async (taskId: string, patch: Partial<Task>) => {
    if (taskId) {
      const { error } = await updateTask(taskId, patch)

      if (error) {
        setErrorMessage(`Task save failed: ${error.message}`)
        return
      }

      void onTasksChanged?.()
      return
    }

    if (!contact?.id) {
      setErrorMessage('Save this contact before adding tasks.')
      return
    }

    const { error } = await createTask({
      title: patch.title || 'Untitled task',
      notes: patch.notes ?? null,
      status: patch.status ?? 'toDo',
      task_type: patch.task_type ?? null,
      due_date: patch.due_date ?? null,
      estimated_minutes: patch.estimated_minutes ?? 30,
      starred: patch.starred ?? false,
      archived: false,
      contact_id: patch.contact_id ?? contact.id,
      goal_id: patch.goal_id ?? null,
      content_item_id: patch.content_item_id ?? null,
      meeting_id: patch.meeting_id ?? null,
    })

    if (error) {
      setErrorMessage(`Task create failed: ${error.message}`)
      return
    }

    void onTasksChanged?.()
  }

  const tabs: Array<{ id: Tab; label: string; count?: number }> = [
    { id: 'information', label: 'Information' },
    { id: 'interactions', label: 'Interactions' },
    { id: 'notes', label: 'Notes' },
    { id: 'tasks', label: 'Tasks', count: activeContactTasks.length },
    { id: 'nurture', label: 'Nurture' },
  ]

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isNew ? 'New Contact' : contact?.name ?? 'Contact'}
        hideHeader
        maxWidthClassName="max-w-4xl"
        contentClassName="rounded-2xl shadow-2xl"
      >
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
          <div
            className="flex items-center gap-4 px-5 py-4 text-white"
            style={{ backgroundColor: avatarColor }}
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/30 bg-white/15 text-base font-semibold">
              {contact?.image_url ? (
                <img src={contact.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                avatarInitials
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate font-serif text-2xl font-medium">{displayName}</h2>
              <p className="mt-1 truncate text-sm text-white/75">
                {displayRole || 'Add role, company, and relationship details'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStarred((value) => !value)}
              className="rounded-full bg-white/15 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/25"
            >
              {starred ? '★ Starred' : '☆ Star'}
            </button>

            <button
              type="button"
              aria-label="Close contact modal"
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

          <div className="flex overflow-x-auto border-b border-[var(--border)] bg-white px-5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-3 py-3 text-sm transition ${
                  activeTab === tab.id
                    ? 'border-[var(--jamie)] font-medium text-[var(--jamie)]'
                    : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {tab.label}
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span className="rounded-full bg-[rgba(193,152,173,0.18)] px-1.5 py-0.5 text-[10px] text-[#9f6e89]">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="max-h-[62vh] overflow-y-auto bg-[var(--bg)] p-5">
            {errorMessage && (
              <div className="mb-4 rounded-xl border border-[rgba(201,136,142,0.25)] bg-[rgba(201,136,142,0.08)] px-4 py-3 text-sm text-[#a85c64]">
                {errorMessage}
              </div>
            )}

            {activeTab === 'information' && (
              <div className="space-y-5">
                <section>
                  <SectionHeader>Overview</SectionHeader>

                  <div className="grid gap-3 rounded-xl border border-[var(--border)] bg-white p-4 md:grid-cols-2">
                    <Input
                      label="Full name"
                      value={name}
                      onChange={setName}
                      placeholder="Jane Smith"
                    />
                    <Input
                      label="Role / Title"
                      value={role}
                      onChange={setRole}
                      placeholder="Director of..."
                    />
                    <Input
                      label="Company"
                      value={company}
                      onChange={setCompany}
                      placeholder="Company"
                    />
                    <Input
                      label="From / how you know them"
                      value={fromNote}
                      onChange={setFromNote}
                      placeholder="Referral, LinkedIn, conference..."
                    />
                  </div>
                </section>

                <section>
                  <SectionHeader>About</SectionHeader>

                  <Textarea
                    label="Brief description"
                    value={about}
                    onChange={setAbout}
                    placeholder="What should you remember about this person?"
                    rows={4}
                  />
                </section>

                <section>
                  <SectionHeader>Contact info</SectionHeader>

                  <div className="grid gap-3 rounded-xl border border-[var(--border)] bg-white p-4 md:grid-cols-2">
                    <Input
                      label="Email"
                      value={email}
                      onChange={setEmail}
                      placeholder="jane@example.com"
                      type="email"
                    />
                    <Input
                      label="LinkedIn URL"
                      value={linkedinUrl}
                      onChange={setLinkedinUrl}
                      placeholder="https://linkedin.com/in/..."
                    />
                    <Input
                      label="Website"
                      value={website}
                      onChange={setWebsite}
                      placeholder="https://..."
                    />
                    <Input
                      label="Scheduling link"
                      value={schedulingLink}
                      onChange={setSchedulingLink}
                      placeholder="https://calendly.com/..."
                    />
                  </div>
                </section>

                <section>
                  <SectionHeader>Location</SectionHeader>

                  <div className="grid gap-3 rounded-xl border border-[var(--border)] bg-white p-4 md:grid-cols-2">
                    <Input label="City" value={city} onChange={setCity} placeholder="City" />
                    <Input
                      label="State"
                      value={stateValue}
                      onChange={setStateValue}
                      placeholder="State"
                    />
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'interactions' && (
              <div className="rounded-xl border border-dashed border-[var(--border)] bg-white p-8 text-center">
                <p className="font-serif text-xl text-[var(--text)]">No interactions yet</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
                  This tab will eventually auto-populate from Google Calendar meetings, Fathom
                  notes, and post-meeting debriefs.
                </p>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-3">
                <div>
                  <p className="font-serif text-xl">
                    Notes{displayName ? ` for ${displayName.split(' ')[0]}` : ''}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Freeform notes, context, and reminders for this contact.
                  </p>
                </div>

                <Textarea
                  label="Notes"
                  value={notes}
                  onChange={setNotes}
                  placeholder="Start writing notes about this contact..."
                  rows={12}
                />
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-xl">Tasks</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Tasks linked to this contact. These also appear on the main Tasks page.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex rounded-lg border border-[var(--border)] bg-white p-[3px]">
                      {(['active', 'done'] as const).map((view) => (
                        <button
                          key={view}
                          type="button"
                          onClick={() => setContactTaskView(view)}
                          className={`rounded-md px-3 py-1.5 text-xs capitalize ${
                            contactTaskView === view
                              ? 'bg-[var(--tasks)] text-white'
                              : 'text-[var(--muted)] hover:bg-[#f5f3f0]'
                          }`}
                        >
                          {view === 'active'
                            ? `Active (${activeContactTasks.length})`
                            : `Done (${doneContactTasks.length})`}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={!contact?.id}
                      onClick={() => {
                        if (!contact?.id) {
                          setErrorMessage('Save this contact before adding tasks.')
                          return
                        }

                        setSelectedTask(blankTaskForContact(contact.id))
                      }}
                      className="rounded-lg bg-[rgba(193,152,173,0.18)] px-3 py-2 text-xs font-semibold text-[#9f6e89] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      + New Task
                    </button>
                  </div>
                </div>

                {visibleContactTasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--border)] bg-white p-6 text-sm text-[var(--muted)]">
                    {contactTaskView === 'active'
                      ? 'No active tasks linked to this contact.'
                      : 'No done tasks linked to this contact yet.'}
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {visibleContactTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        contactName={contact?.name ?? null}
                        contactId={contact?.id ?? null}
                        onEdit={(item) => setSelectedTask(item)}
                        onArchive={async (item) => {
                          const { error } = await archiveTask(item.id)

                          if (error) {
                            setErrorMessage(`Task archive failed: ${error.message}`)
                            return
                          }

                          void onTasksChanged?.()
                        }}
                        onQuickUpdate={async (item, patch) => {
                          const { error } = await updateTask(item.id, patch)

                          if (error) {
                            setErrorMessage(`Task update failed: ${error.message}`)
                            return
                          }

                          void onTasksChanged?.()
                        }}
                        onStar={async (item) => {
                          const { error } = await updateTask(item.id, {
                            starred: !item.starred,
                          })

                          if (error) {
                            setErrorMessage(`Task update failed: ${error.message}`)
                            return
                          }

                          void onTasksChanged?.()
                        }}
                        onToggle={async (item) => {
                          const { error } = await updateTask(item.id, {
                            status: item.status === 'done' ? 'toDo' : 'done',
                          })

                          if (error) {
                            setErrorMessage(`Task update failed: ${error.message}`)
                            return
                          }

                          void onTasksChanged?.()
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'nurture' && (
              <div className="space-y-5">
                <section className="rounded-xl border border-[var(--border)] bg-white p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-serif text-xl">Nurture schedule</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Set how often this contact should resurface for follow-up.
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <FieldLabel>Frequency</FieldLabel>
                        <select
                          value={nurtureFrequencyDays}
                          onChange={(event) => setNurtureFrequencyDays(event.target.value)}
                          className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--nurture)]"
                        >
                          {nurtureOptions.map((option) => (
                            <option key={option.label} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <Input
                        label="Next nurture date"
                        value={nextNurtureDate}
                        onChange={setNextNurtureDate}
                        type="date"
                      />
                    </div>
                  </div>
                </section>

                <div className="rounded-xl border border-dashed border-[rgba(143,167,144,0.35)] bg-[rgba(143,167,144,0.08)] p-5 text-sm text-[#6f8d70]">
                  Nurture reminders will show up on the Today page once the nurture engine is
                  connected.
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border)] bg-white px-5 py-4">
            <button
              type="button"
              className="text-xs text-[#c8c5c0] transition hover:text-[var(--muted)]"
            >
              Archive contact
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
                className="rounded-lg bg-[var(--jamie)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : isNew ? 'Create Contact' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <TaskModal
        open={Boolean(selectedTask)}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onSave={handleContactTaskSave}
      />
    </>
  )
}

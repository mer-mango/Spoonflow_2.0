import { useMemo, useState } from 'react'
import { Modal } from '../shared/Modal'
import type { Task } from '../../hooks/useTasks'

type WizardStep = 'overview' | 'todos' | 'meetings' | 'start'

type WizardMeeting = {
  id: string
  title: string
  startTime: string
  endTime: string
  calendarId?: string | null
}

type WizardNurtureContact = {
  id: string
  name: string
  email?: string | null
  company?: string | null
  next_nurture_date?: string | null
  nurture_frequency_days?: number | null
}

type Props = {
  open: boolean
  onClose: () => void
  todayLabel: string
  todayKey: string
  meetings: WizardMeeting[]
  tasks: Task[]
  nurtureContacts: WizardNurtureContact[]
  contactById: Map<string, string>
  onOpenTask: (task: Task) => void
  onUpdateTask: (task: Task, patch: Partial<Task>) => Promise<void> | void
  onArchiveTask: (task: Task) => Promise<void> | void
  onOpenNurture: (contactId: string) => void
}

const steps: Array<{ id: WizardStep; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'todos', label: 'To-Dos' },
  { id: 'meetings', label: 'Meetings' },
  { id: 'start', label: 'Start' },
]

function dateKeyFromDateValue(value?: string | null) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  try {
    const date = new Date(value)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  } catch {
    return null
  }
}

function isTodayDate(value: string | null | undefined, todayKey: string) {
  return dateKeyFromDateValue(value) === todayKey
}

function isOverdueDate(value: string | null | undefined, todayKey: string) {
  const dateKey = dateKeyFromDateValue(value)
  if (!dateKey) return false

  return dateKey < todayKey
}

function formatDateLabel(value?: string | null) {
  const dateKey = dateKeyFromDateValue(value)

  if (!dateKey) return 'No date'

  return new Date(`${dateKey}T00:00:00`).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
}

function formatMeetingTime(startTime: string, endTime: string) {
  const start = new Date(startTime).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })

  const end = new Date(endTime).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })

  return `${start} – ${end}`
}

function taskStatusLabel(status: Task['status']) {
  if (status === 'toDo') return 'To Do'
  if (status === 'inProgress') return 'In Progress'
  if (status === 'awaitingReply') return 'Awaiting Reply'
  return 'Done'
}

function statusPillClass(status: Task['status']) {
  if (status === 'toDo') return 'bg-[rgba(201,136,142,0.13)] text-[#b66b73]'
  if (status === 'inProgress') return 'bg-[rgba(212,167,122,0.18)] text-[#b57943]'
  if (status === 'awaitingReply') return 'bg-[#f4efe3] text-[#9a7b3f]'

  return 'bg-[rgba(143,167,144,0.18)] text-[#6f8d70]'
}

function nurtureFrequencyLabel(days?: number | null) {
  if (!days) return '—'

  const weeks = Math.round(days / 7)

  if (weeks >= 1 && days % 7 === 0) {
    return `${weeks} wks`
  }

  return `${days}d`
}

function StepPills({
  activeStep,
  setStep,
}: {
  activeStep: WizardStep
  setStep: (step: WizardStep) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((step) => (
        <button
          key={step.id}
          type="button"
          onClick={() => setStep(step.id)}
          className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
            activeStep === step.id
              ? 'bg-white text-[var(--jamie)]'
              : 'bg-white/15 text-white/80 hover:bg-white/25'
          }`}
        >
          {step.label}
        </button>
      ))}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string
  value: number | string
  color: string
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 font-serif text-3xl" style={{ color }}>
        {value}
      </p>
    </div>
  )
}

function SectionShell({
  title,
  description,
  count,
  countClassName,
  children,
}: {
  title: string
  description: string
  count: number
  countClassName: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h4 className="font-serif text-xl text-[var(--text)]">{title}</h4>
          <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
        </div>

        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${countClassName}`}>
          {count}
        </span>
      </div>

      {children}
    </section>
  )
}

function TaskTriageRow({
  task,
  todayKey,
  contactName,
  onOpen,
  onUpdate,
  onArchive,
}: {
  task: Task
  todayKey: string
  contactName?: string | null
  onOpen: () => void
  onUpdate: (patch: Partial<Task>) => Promise<void> | void
  onArchive: () => Promise<void> | void
}) {
  const overdue = isOverdueDate(task.due_date, todayKey)
  const dueToday = isTodayDate(task.due_date, todayKey)

  return (
    <article className="rounded-xl border border-[var(--border)] bg-[#faf9f8] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold text-[var(--text)]">{task.title}</p>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                overdue
                  ? 'bg-[rgba(201,136,142,0.13)] text-[#b66b73]'
                  : dueToday
                    ? 'bg-[rgba(193,152,173,0.14)] text-[#9f6e89]'
                    : 'bg-[#f5f3f0] text-[var(--muted)]'
              }`}
            >
              {overdue
                ? `! Overdue · ${formatDateLabel(task.due_date)}`
                : dueToday
                  ? `Due today · ${formatDateLabel(task.due_date)}`
                  : formatDateLabel(task.due_date)}
            </span>

            {contactName && (
              <span className="rounded-full bg-[rgba(139,165,168,0.16)] px-2 py-0.5 text-[10px] font-medium text-[#6f8f92]">
                {contactName}
              </span>
            )}

            {task.starred && (
              <span className="rounded-full bg-[#fff5c9] px-2 py-0.5 text-[10px] font-medium text-[#9d7f22]">
                Priority
              </span>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={() => void onUpdate({ starred: !task.starred })}
          className="rounded-full px-2 py-1 text-xs text-[#d2a72e] transition hover:bg-[#fff8dc]"
          title={task.starred ? 'Remove priority' : 'Mark priority'}
        >
          {task.starred ? '★' : '☆'}
        </button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_140px_auto]">
        <select
          value={task.status}
          onChange={(event) =>
            void onUpdate({
              status: event.target.value as Task['status'],
            })
          }
          className={`rounded-lg border-0 px-3 py-2 text-xs font-semibold outline-none ${statusPillClass(
            task.status,
          )}`}
        >
          <option value="toDo">{taskStatusLabel('toDo')}</option>
          <option value="inProgress">{taskStatusLabel('inProgress')}</option>
          <option value="awaitingReply">{taskStatusLabel('awaitingReply')}</option>
          <option value="done">{taskStatusLabel('done')}</option>
        </select>

        <input
          type="date"
          value={task.due_date ?? ''}
          onChange={(event) =>
            void onUpdate({
              due_date: event.target.value || null,
            })
          }
          className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--tasks)]"
        />

        <button
          type="button"
          onClick={() => void onArchive()}
          className="rounded-lg px-3 py-2 text-xs font-medium text-[var(--muted)] transition hover:bg-[#f5f3f0]"
        >
          Archive
        </button>
      </div>
    </article>
  )
}

export function PlanMyDayWizard({
  open,
  onClose,
  todayLabel,
  todayKey,
  meetings,
  tasks,
  nurtureContacts,
  contactById,
  onOpenTask,
  onUpdateTask,
  onArchiveTask,
  onOpenNurture,
}: Props) {
  const [step, setStep] = useState<WizardStep>('overview')

  const dueTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (task.archived || task.status === 'done') return false

        return isOverdueDate(task.due_date, todayKey) || isTodayDate(task.due_date, todayKey)
      }),
    [tasks, todayKey],
  )

  const contentDueCount = 0
  const stepIndex = steps.findIndex((item) => item.id === step)
  const canGoBack = stepIndex > 0
  const canGoForward = stepIndex < steps.length - 1

  const goBack = () => {
    const previous = steps[stepIndex - 1]
    if (previous) setStep(previous.id)
  }

  const goForward = () => {
    const next = steps[stepIndex + 1]
    if (next) setStep(next.id)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Plan My Day"
      maxWidthClassName="max-w-5xl"
      contentClassName="rounded-2xl shadow-2xl"
    >
      <div className="overflow-hidden rounded-2xl bg-[var(--bg)]">
        <header className="border-b border-[var(--border)] bg-[var(--jamie)] px-5 py-4 text-white">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl font-medium">Plan My Day</h2>
              <p className="mt-1 text-sm text-white/75">{todayLabel}</p>
            </div>

            <StepPills activeStep={step} setStep={setStep} />
          </div>
        </header>

        <div className="max-h-[68vh] overflow-y-auto p-5">
          {step === 'overview' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-serif text-2xl text-[var(--text)]">Today at a glance</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  A quick look at what is already asking for your attention today.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard label="Meetings" value={meetings.length} color="#6484a1" />
                <SummaryCard label="Tasks" value={dueTasks.length} color="#c198ad" />
                <SummaryCard label="Content" value={contentDueCount} color="#e2b7be" />
                <SummaryCard label="Nurtures" value={nurtureContacts.length} color="#8fa790" />
              </div>
            </div>
          )}

          {step === 'todos' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-serif text-2xl text-[var(--text)]">To-Do triage</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Review what needs attention today across tasks, content, and nurture.
                </p>
              </div>

              <SectionShell
                title="Tasks"
                description="Tasks due today or overdue."
                count={dueTasks.length}
                countClassName="bg-[rgba(193,152,173,0.16)] text-[#9f6e89]"
              >
                {dueTasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--border)] bg-[#faf9f8] p-5 text-sm text-[var(--muted)]">
                    No overdue or due-today tasks.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dueTasks.map((task) => (
                      <TaskTriageRow
                        key={task.id}
                        task={task}
                        todayKey={todayKey}
                        contactName={task.contact_id ? contactById.get(task.contact_id) ?? null : null}
                        onOpen={() => onOpenTask(task)}
                        onUpdate={(patch) => onUpdateTask(task, patch)}
                        onArchive={() => onArchiveTask(task)}
                      />
                    ))}
                  </div>
                )}
              </SectionShell>

              <SectionShell
                title="Content"
                description="Content due today or overdue."
                count={contentDueCount}
                countClassName="bg-[rgba(226,183,190,0.22)] text-[#c98291]"
              >
                <div className="rounded-xl border border-dashed border-[var(--border)] bg-[#faf9f8] p-5 text-sm text-[var(--muted)]">
                  Content due dates will show here once the Content page is wired into Plan My Day.
                </div>
              </SectionShell>

              <SectionShell
                title="Nurtures"
                description="Relationship follow-ups due today or overdue."
                count={nurtureContacts.length}
                countClassName="bg-[rgba(143,167,144,0.18)] text-[#6f8d70]"
              >
                {nurtureContacts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--border)] bg-[#faf9f8] p-5 text-sm text-[var(--muted)]">
                    No nurture follow-ups due.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {nurtureContacts.map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => onOpenNurture(contact.id)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[#faf9f8] px-3 py-2 text-left transition hover:bg-white"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--text)]">
                            {contact.name}
                          </p>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {nurtureFrequencyLabel(contact.nurture_frequency_days)} · due{' '}
                            {formatDateLabel(contact.next_nurture_date)}
                          </p>
                        </div>

                        <span className="rounded-full bg-[rgba(143,167,144,0.18)] px-2 py-1 text-[10.5px] font-medium text-[#6f8d70]">
                          Open nurture
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </SectionShell>
            </div>
          )}

          {step === 'meetings' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-serif text-2xl text-[var(--text)]">Meeting prep</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Review today’s meetings and flag where prep belongs. Prep notes will live in the contact profile’s Interactions tab once that template is built.
                </p>
              </div>

              {meetings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] bg-white p-6 text-sm text-[var(--muted)]">
                  No meetings on your calendar today.
                </div>
              ) : (
                <div className="space-y-2">
                  {meetings.map((meeting) => (
                    <article
                      key={`${meeting.id}-${meeting.startTime}`}
                      className="rounded-xl border border-[var(--border)] bg-white p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-[#6484a1]">
                            {formatMeetingTime(meeting.startTime, meeting.endTime)}
                          </p>
                          <p className="mt-1 font-serif text-xl text-[var(--text)]">
                            {meeting.title}
                          </p>
                        </div>

                        <span className="rounded-full bg-[#f5f3f0] px-3 py-1 text-[11px] font-medium text-[var(--muted)]">
                          Prep in Interactions coming next
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'start' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-serif text-2xl text-[var(--text)]">
                  You’re ready to shape the day
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  You’ve reviewed your to-dos and meetings. Now head back to Today and manually shape your timeline.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard label="Meetings" value={meetings.length} color="#6484a1" />
                <SummaryCard label="Tasks" value={dueTasks.length} color="#c198ad" />
                <SummaryCard label="Content" value={contentDueCount} color="#e2b7be" />
                <SummaryCard label="Nurtures" value={nurtureContacts.length} color="#8fa790" />
              </div>

              <section className="rounded-xl border border-[var(--border)] bg-white p-4">
                <p className="font-serif text-xl">Next step</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Use the Today timeline to add blocks like Tasks, Content, Nurture, Email, Break, PT, or Wind Down.
                </p>
              </section>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] bg-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-[var(--muted)] transition hover:bg-black/[0.04]"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {canGoBack && (
              <button
                type="button"
                onClick={goBack}
                className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-black/[0.03]"
              >
                Back
              </button>
            )}

            {canGoForward ? (
              <button
                type="button"
                onClick={goForward}
                className="rounded-lg bg-[var(--jamie)] px-5 py-2 text-sm font-semibold text-white"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-[var(--jamie)] px-5 py-2 text-sm font-semibold text-white"
              >
                Start Day
              </button>
            )}
          </div>
        </footer>
      </div>
    </Modal>
  )
}

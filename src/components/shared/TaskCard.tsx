import type { Task } from '../../hooks/useTasks'

type TaskCardProps = {
  task: Task
  contactName?: string | null
  contactId?: string | null
  selected?: boolean
  onSelect?: (task: Task) => void
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onArchive?: (task: Task) => void
  onDelete?: (task: Task) => void
  onStar?: (task: Task) => void
  onContactClick?: (contactId: string) => void
  showContact?: boolean
  showGoal?: boolean
}

const taskTypeLabels: Record<string, string> = {
  admin: 'Admin',
  outreach: 'Outreach',
  client_work: 'Client Work',
  business_development: 'Business Development',
  schedule: 'Schedule',
  other: 'Other',
}

function statusLabel(status: Task['status']) {
  if (status === 'toDo') return 'To Do'
  if (status === 'inProgress') return 'In Progress'
  if (status === 'awaitingReply') return 'Awaiting Reply'
  return 'Done'
}

function statusBadgeClass(status: Task['status']) {
  if (status === 'toDo') return 'bg-[rgba(193,152,173,0.2)] text-[#9f6e89]'
  if (status === 'inProgress') return 'bg-[rgba(100,132,161,0.16)] text-[#6684a1]'
  if (status === 'awaitingReply') return 'bg-[#eee9e1] text-[#7f786f]'
  return 'bg-[rgba(143,167,144,0.18)] text-[#6f8d70]'
}

function dateBoxParts(date: string | null) {
  if (!date) {
    return {
      day: 'NO',
      date: 'DATE',
      overdue: false,
      hasDate: false,
    }
  }

  const parsed = new Date(`${date}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return {
    day: parsed.toLocaleDateString([], { weekday: 'short' }).toUpperCase(),
    date: `${parsed.getMonth() + 1}/${parsed.getDate()}`,
    overdue: parsed.getTime() < today.getTime(),
    hasDate: true,
  }
}

function dueDateLabel(date: string | null) {
  if (!date) return 'No due date'

  const parsed = new Date(`${date}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const diff = Math.round((parsed.getTime() - today.getTime()) / 86400000)

  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'

  return parsed.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
}

function ArchiveIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-[16px] w-[16px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="2.2" y="5" width="11.6" height="8.2" rx="1.6" />
      <path d="M2.8 3h10.4v2H2.8zM6.2 8.2h3.6" strokeLinecap="round" />
    </svg>
  )
}

function ContactIcon() {
  return (
    <svg
      viewBox="0 0 10 10"
      className="h-2.5 w-2.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      aria-hidden="true"
    >
      <circle cx="5" cy="3.5" r="1.7" />
      <path d="M1.5 9c0-2 1.5-3.2 3.5-3.2S8.5 7 8.5 9" strokeLinecap="round" />
    </svg>
  )
}

export function TaskCard({
  task,
  contactName,
  contactId,
  selected = false,
  onSelect,
  onEdit,
  onArchive,
  onDelete,
  onStar,
  onContactClick,
}: TaskCardProps) {
  const done = task.status === 'done'
  const dateParts = dateBoxParts(task.due_date)
  const linkedContactId = contactId ?? task.contact_id

  const handleArchiveOrDelete = () => {
    if (onArchive) {
      onArchive(task)
      return
    }

    if (onDelete) {
      onDelete(task)
    }
  }

  return (
    <article
      className={`group grid cursor-pointer grid-cols-[58px_1fr_40px] overflow-hidden rounded-[12px] border-[0.5px] border-[var(--border)] bg-white transition hover:shadow-[0_2px_10px_rgba(0,0,0,0.08)] ${
        done ? 'opacity-60' : ''
      }`}
      onClick={() => onEdit(task)}
    >
      <div
        className={`flex min-h-[88px] flex-col items-center justify-center px-1 text-center text-white ${
          !dateParts.hasDate
            ? 'bg-[#d8d5cf]'
            : dateParts.overdue
              ? 'bg-[#c9888e]'
              : 'bg-[var(--tasks)]'
        }`}
      >
        <span className="text-[9px] font-semibold uppercase leading-none tracking-[0.08em]">
          {dateParts.day}
        </span>
        <span className="mt-1 text-[13px] font-bold leading-none">
          {dateParts.date}
        </span>
      </div>

      <div className="min-w-0 px-4 py-3.5">
        <div className="flex items-start gap-3">
          <button
            type="button"
            aria-label={task.starred ? 'Unstar task' : 'Star task'}
            className={`mt-[1px] flex h-6 w-6 shrink-0 items-center justify-center text-[19px] leading-none transition ${
              task.starred
                ? 'text-[#f0c040]'
                : 'text-[#d8d5cf] hover:text-[#b8b3aa]'
            }`}
            onClick={(event) => {
              event.stopPropagation()
              onStar?.(task)
            }}
          >
            {task.starred ? '★' : '☆'}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start gap-3">
              <h3
                className={`min-w-0 flex-1 truncate text-[18px] font-semibold leading-snug ${
                  done ? 'line-through text-[var(--muted)]' : 'text-[var(--text)]'
                }`}
              >
                {task.title}
              </h3>

              <button
                type="button"
                className={`mt-[4px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-[1.4px] transition ${
                  selected
                    ? 'border-[var(--tasks)] bg-[var(--tasks)] opacity-100'
                    : 'border-[#c8c5c0] bg-white opacity-0 hover:border-[var(--tasks)] group-hover:opacity-100'
                }`}
                onClick={(event) => {
                  event.stopPropagation()
                  onSelect?.(task)
                }}
                aria-label={selected ? 'Deselect task' : 'Select task'}
                title={selected ? 'Deselect task' : 'Select task'}
              >
                {selected ? <span className="text-[10px] leading-none text-white">✓</span> : null}
              </button>
            </div>

            {task.notes && (
              <p className="mt-1 line-clamp-1 text-[12px] text-[var(--muted)]">
                {task.notes}
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${statusBadgeClass(task.status)}`}>
                {statusLabel(task.status)}
              </span>

              {contactName && (
                <button
                  type="button"
                  className={`inline-flex items-center gap-1 rounded-full bg-[rgba(139,165,168,0.16)] px-2.5 py-1 text-[10.5px] font-medium text-[#6f8f92] ${
                    onContactClick && linkedContactId
                      ? 'transition hover:bg-[rgba(139,165,168,0.24)] hover:text-[#54777a]'
                      : ''
                  }`}
                  onClick={(event) => {
                    event.stopPropagation()

                    if (onContactClick && linkedContactId) {
                      onContactClick(linkedContactId)
                    }
                  }}
                  title={linkedContactId ? 'Open contact profile' : undefined}
                >
                  <ContactIcon />
                  {contactName}
                </button>
              )}

              {task.task_type && (
                <span className="rounded-full bg-[#f3f2ef] px-2.5 py-1 text-[10.5px] font-medium text-[#8a867f]">
                  {taskTypeLabels[task.task_type] ?? task.task_type}
                </span>
              )}

              <span
                className={`rounded-full px-2.5 py-1 text-[10.5px] font-medium ${
                  dateParts.overdue
                    ? 'bg-[rgba(201,136,142,0.13)] text-[#c9888e]'
                    : 'bg-[#f3f2ef] text-[var(--muted)]'
                }`}
              >
                {dateParts.overdue ? '⚠ ' : ''}
                {dueDateLabel(task.due_date)}
              </span>

              <span className="rounded-full bg-[#f3f2ef] px-2.5 py-1 text-[10.5px] font-medium text-[var(--muted)]">
                {task.estimated_minutes}m
              </span>
            </div>
          </div>
        </div>
      </div>

      {(onArchive || onDelete) && (
        <button
          type="button"
          className="flex items-start justify-center px-3 pt-[19px] text-[#bbb6ad] opacity-0 transition hover:text-[var(--tasks)] group-hover:opacity-80"
          onClick={(event) => {
            event.stopPropagation()
            handleArchiveOrDelete()
          }}
          aria-label={onArchive ? 'Archive task' : 'Delete task'}
          title={onArchive ? 'Archive task' : 'Delete task'}
        >
          <ArchiveIcon />
        </button>
      )}
    </article>
  )
}

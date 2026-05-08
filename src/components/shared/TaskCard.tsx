import { Badge } from './Badge'
import type { Task } from '../../hooks/useTasks'
import { useContacts } from '../../hooks/useContacts'

type TaskCardProps = {
  task: Task
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onArchive?: (task: Task) => void
  onDelete?: (task: Task) => void
  onStar?: (task: Task) => void
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

function statusVariant(status: Task['status']) {
  if (status === 'toDo') return 'todo'
  if (status === 'inProgress') return 'inProgress'
  if (status === 'awaitingReply') return 'awaitingReply'
  return 'done'
}

function dateBoxParts(date: string | null) {
  if (!date) {
    return {
      day: 'NO',
      date: 'DATE',
      overdue: false,
    }
  }

  const parsed = new Date(`${date}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const overdue = parsed.getTime() < today.getTime()

  return {
    day: parsed.toLocaleDateString([], { weekday: 'short' }).toUpperCase(),
    date: `${parsed.getMonth() + 1}/${parsed.getDate()}`,
    overdue,
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
      className="h-4 w-4"
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

export function TaskCard({
  task,
  onToggle,
  onEdit,
  onArchive,
  onDelete,
  onStar,
}: TaskCardProps) {
  const { contacts } = useContacts()
  const done = task.status === 'done'
  const dateParts = dateBoxParts(task.due_date)
  const linkedContact = task.contact_id
    ? contacts.find((contact) => contact.id === task.contact_id)
    : null

  return (
    <article
      className={`group grid cursor-pointer grid-cols-[58px_1fr_auto] overflow-hidden rounded-[10px] border-[0.5px] border-[var(--border)] bg-white transition hover:shadow-[0_2px_10px_rgba(0,0,0,0.08)] ${
        done ? 'opacity-60' : ''
      }`}
      onClick={() => onEdit(task)}
    >
      <div
        className={`flex min-h-[76px] flex-col items-center justify-center px-1 text-center text-white ${
          dateParts.overdue ? 'bg-[#c9888e]' : 'bg-[var(--tasks)]'
        } ${!task.due_date ? 'bg-[#d8d5cf]' : ''}`}
      >
        <span className="text-[9px] font-semibold uppercase leading-none tracking-[0.08em]">
          {dateParts.day}
        </span>
        <span className="mt-1 text-[13px] font-bold leading-none">
          {dateParts.date}
        </span>
      </div>

      <div className="min-w-0 p-3">
        <div className="flex items-start gap-2">
          <button
            type="button"
            className={`mt-0.5 flex h-5 w-5 min-w-5 items-center justify-center rounded border-[1.5px] ${
              done
                ? 'border-[var(--done)] bg-[var(--done)]'
                : 'border-[#c8c5c0] bg-white'
            }`}
            onClick={(event) => {
              event.stopPropagation()
              onToggle(task)
            }}
            aria-label="Toggle task status"
          >
            {done ? <span className="text-[11px] text-white">✓</span> : null}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start gap-2">
              <h3
                className={`min-w-0 flex-1 truncate text-[13px] font-medium leading-snug ${
                  done ? 'line-through text-[var(--muted)]' : 'text-[var(--text)]'
                }`}
              >
                {task.title}
              </h3>

              <button
                type="button"
                aria-label={task.starred ? 'Unstar task' : 'Star task'}
                className={`shrink-0 text-[16px] leading-none transition ${
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
            </div>

            {task.notes && (
              <p className="mt-1 line-clamp-1 text-[11.5px] text-[var(--muted)]">
                {task.notes}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge label={statusLabel(task.status)} variant={statusVariant(task.status)} />

              {linkedContact && (
                <span className="inline-flex items-center gap-1 rounded bg-[rgba(139,165,168,0.16)] px-2 py-1 text-[10.5px] font-medium text-[#6f8f92]">
                  <svg
                    viewBox="0 0 10 10"
                    className="h-2.5 w-2.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  >
                    <circle cx="5" cy="3.5" r="1.7" />
                    <path d="M1.5 9c0-2 1.5-3.2 3.5-3.2S8.5 7 8.5 9" strokeLinecap="round" />
                  </svg>
                  {linkedContact.name}
                </span>
              )}

              {task.task_type && (
                <Badge
                  label={taskTypeLabels[task.task_type] ?? task.task_type}
                  variant="tasks"
                />
              )}

              <span
                className={`rounded px-2 py-1 text-[10.5px] ${
                  dateParts.overdue
                    ? 'bg-[rgba(201,136,142,0.13)] text-[#c9888e]'
                    : 'bg-[#f5f3f0] text-[var(--muted)]'
                }`}
              >
                {dateParts.overdue ? '⚠ ' : ''}
                {dueDateLabel(task.due_date)}
              </span>

              <span className="rounded bg-[#f5f3f0] px-2 py-1 text-[10.5px] text-[var(--muted)]">
                {task.estimated_minutes}m
              </span>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="flex items-center px-3 text-[#bbb6ad] opacity-80 transition hover:text-[var(--tasks)]"
        onClick={(event) => {
          event.stopPropagation()

          if (onArchive) {
            onArchive(task)
            return
          }

          onDelete?.(task)
        }}
        aria-label="Archive task"
        title="Archive task"
      >
        <ArchiveIcon />
      </button>
    </article>
  )
}

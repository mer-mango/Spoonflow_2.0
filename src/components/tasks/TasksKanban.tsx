import type { Task } from '../../hooks/useTasks'

type KanbanColumn = {
  id: string
  label: string
  tasks: Task[]
}

type TasksKanbanProps = {
  columns: KanbanColumn[]
  selectedTaskIds: string[]
  onSelectTask: (task: Task) => void
  getContactName: (contactId?: string | null) => string | null
  onContactClick: (contactId: string) => void
  onEditTask: (task: Task) => void
  onArchiveTask: (task: Task) => Promise<void> | void
  onQuickUpdateTask: (task: Task, patch: Partial<Task>) => Promise<void> | void
  onStarTask: (task: Task) => Promise<void> | void
}

const taskTypeLabels: Record<string, string> = {
  admin: 'Admin',
  outreach: 'Outreach',
  client_work: 'Client Work',
  business_development: 'Business Dev',
  schedule: 'Schedule',
  other: 'Other',
}

function kanbanHeaderClasses(columnId: string) {
  if (columnId === 'toDo') {
    return {
      header: 'bg-[rgba(201,136,142,0.13)]',
      label: 'text-[#b66b73]',
      count: 'bg-[rgba(201,136,142,0.18)] text-[#b66b73]',
    }
  }

  if (columnId === 'inProgress') {
    return {
      header: 'bg-[rgba(212,167,122,0.16)]',
      label: 'text-[#b57943]',
      count: 'bg-[rgba(212,167,122,0.22)] text-[#b57943]',
    }
  }

  if (columnId === 'awaitingReply') {
    return {
      header: 'bg-[#f4efe3]',
      label: 'text-[#9a7b3f]',
      count: 'bg-[#eadfbd] text-[#9a7b3f]',
    }
  }

  if (columnId === 'done') {
    return {
      header: 'bg-[rgba(143,167,144,0.16)]',
      label: 'text-[#6f8d70]',
      count: 'bg-[rgba(143,167,144,0.22)] text-[#6f8d70]',
    }
  }

  return {
    header: 'bg-[rgba(193,152,173,0.12)]',
    label: 'text-[#9f6e89]',
    count: 'bg-[rgba(193,152,173,0.18)] text-[#9f6e89]',
  }
}

function statusPillClass(status: Task['status']) {
  if (status === 'toDo') return 'bg-[rgba(193,152,173,0.16)] text-[#9f6e89]'
  if (status === 'inProgress') return 'bg-[rgba(212,167,122,0.18)] text-[#b57943]'
  if (status === 'awaitingReply') return 'bg-[#eee9e1] text-[#7f786f]'
  return 'bg-[rgba(143,167,144,0.18)] text-[#6f8d70]'
}

function dateKeyFromDateValue(value?: string | null) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function todayDateKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDueLabel(value?: string | null) {
  const dateKey = dateKeyFromDateValue(value)
  if (!dateKey) return 'No due date'

  return new Date(`${dateKey}T00:00:00`).toLocaleDateString([], {
    month: 'numeric',
    day: 'numeric',
  })
}

function isOverdueDate(value?: string | null) {
  const dateKey = dateKeyFromDateValue(value)
  if (!dateKey) return false

  return dateKey < todayDateKey()
}

function isTodayDate(value?: string | null) {
  return dateKeyFromDateValue(value) === todayDateKey()
}

function taskTypeLabel(value?: string | null) {
  if (!value) return null
  return taskTypeLabels[value] ?? value
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

function KanbanTaskCard({
  task,
  selected,
  contactName,
  onSelectTask,
  onContactClick,
  onEditTask,
  onArchiveTask,
  onQuickUpdateTask,
  onStarTask,
}: {
  task: Task
  selected: boolean
  contactName: string | null
  onSelectTask: (task: Task) => void
  onContactClick: (contactId: string) => void
  onEditTask: (task: Task) => void
  onArchiveTask: (task: Task) => Promise<void> | void
  onQuickUpdateTask: (task: Task, patch: Partial<Task>) => Promise<void> | void
  onStarTask: (task: Task) => Promise<void> | void
}) {
  const overdue = task.status !== 'done' && isOverdueDate(task.due_date)
  const dueToday = isTodayDate(task.due_date)
  const typeLabel = taskTypeLabel(task.task_type)

  let dueLine = task.due_date ? `Due ${formatDueLabel(task.due_date)}` : 'No due date'
  let dueLineClass = 'text-[10.5px] font-medium text-[var(--muted)]'
  let dateInputClass = 'bg-[#f5f2ef] text-[var(--muted)]'

  if (overdue) {
    dueLine = `Overdue · ${formatDueLabel(task.due_date)}`
    dueLineClass = 'text-[10.5px] font-semibold text-[#c9888e]'
    dateInputClass = 'bg-[rgba(201,136,142,0.13)] text-[#c9888e]'
  } else if (dueToday) {
    dueLine = `Due today · ${formatDueLabel(task.due_date)}`
    dueLineClass = 'text-[10.5px] font-semibold text-[#9f6e89]'
    dateInputClass = 'bg-[rgba(193,152,173,0.14)] text-[#9f6e89]'
  }

  return (
    <article className="group rounded-[11px] border-[0.5px] border-[var(--border)] bg-white px-3 py-2.5 transition hover:shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label={task.starred ? 'Unstar task' : 'Star task'}
          className={`mt-[1px] shrink-0 text-[16px] leading-none transition ${
            task.starred
              ? 'text-[#f0c040]'
              : 'text-[#d8d5cf] hover:text-[#b8b3aa]'
          }`}
          onClick={() => void onStarTask(task)}
        >
          {task.starred ? '★' : '☆'}
        </button>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            className="block w-full whitespace-normal break-words text-left text-[12px] font-medium leading-[1.35] text-[var(--text)] transition hover:text-[var(--tasks)]"
            onClick={() => onEditTask(task)}
          >
            {task.title}
          </button>

          <p className={`mt-0.5 ${dueLineClass}`}>{dueLine}</p>
        </div>

        <button
          type="button"
          className={`mt-[2px] flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded border-[1.4px] transition ${
            selected
              ? 'border-[var(--tasks)] bg-[var(--tasks)] opacity-100'
              : 'border-[#c8c5c0] bg-white opacity-0 hover:border-[var(--tasks)] group-hover:opacity-100'
          }`}
          onClick={() => onSelectTask(task)}
          aria-label={selected ? 'Deselect task' : 'Select task'}
          title={selected ? 'Deselect task' : 'Select task'}
        >
          {selected ? <span className="text-[9px] leading-none text-white">✓</span> : null}
        </button>
      </div>

      {task.notes && (
        <p className="mt-1 line-clamp-1 pl-[22px] text-[10.5px] text-[var(--muted)]">
          {task.notes}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-[22px]">
        <select
          value={task.status}
          onChange={(event) =>
            void onQuickUpdateTask(task, {
              status: event.target.value as Task['status'],
            })
          }
          className={`h-[22px] rounded-full border-0 px-2 py-0.5 text-[10px] font-medium outline-none ${statusPillClass(
            task.status,
          )}`}
          title="Edit status"
        >
          <option value="toDo">To Do</option>
          <option value="inProgress">In Progress</option>
          <option value="awaitingReply">Awaiting Reply</option>
          <option value="done">Done</option>
        </select>

        {contactName && task.contact_id && (
          <button
            type="button"
            className="inline-flex h-[22px] items-center gap-1 rounded-full bg-[rgba(139,165,168,0.16)] px-2 py-0.5 text-[10px] font-medium text-[#6f8f92] transition hover:bg-[rgba(139,165,168,0.24)] hover:text-[#54777a]"
            onClick={() => onContactClick(task.contact_id!)}
            title="Open contact profile"
          >
            <ContactIcon />
            {contactName}
          </button>
        )}

        {typeLabel && (
          <span className="rounded-full bg-[#f3f2ef] px-2 py-0.5 text-[10px] font-medium text-[#8a867f]">
            {typeLabel}
          </span>
        )}

        <input
          type="date"
          value={task.due_date ?? ''}
          onChange={(event) =>
            void onQuickUpdateTask(task, {
              due_date: event.target.value || null,
            })
          }
          className={`h-[22px] max-w-[112px] rounded-full border-0 px-2 py-0.5 text-[10px] font-medium outline-none ${dateInputClass}`}
          title="Edit due date"
        />

        <select
          value={String(task.estimated_minutes ?? 30)}
          onChange={(event) =>
            void onQuickUpdateTask(task, {
              estimated_minutes: Number(event.target.value),
            })
          }
          className="h-[22px] rounded-full border-0 bg-[#f3f2ef] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)] outline-none"
          title="Edit estimated time"
        >
          <option value="5">5m</option>
          <option value="10">10m</option>
          <option value="15">15m</option>
          <option value="20">20m</option>
          <option value="30">30m</option>
          <option value="45">45m</option>
          <option value="60">1h</option>
          <option value="90">1.5h</option>
          <option value="120">2h</option>
        </select>
      </div>

      <div className="mt-1.5 flex justify-end pl-[22px]">
        <button
          type="button"
          onClick={() => void onArchiveTask(task)}
          className="text-[10px] font-medium text-[var(--muted)] opacity-0 transition hover:text-[#a85c64] group-hover:opacity-100"
        >
          Archive
        </button>
      </div>
    </article>
  )
}

export function TasksKanban({
  columns,
  selectedTaskIds,
  onSelectTask,
  getContactName,
  onContactClick,
  onEditTask,
  onArchiveTask,
  onQuickUpdateTask,
  onStarTask,
}: TasksKanbanProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {columns.map((column) => {
        const headerColors = kanbanHeaderClasses(String(column.id))

        return (
          <section
            key={column.id}
            className="w-[345px] min-w-[345px] shrink-0 rounded-xl border-[0.5px] border-[var(--border)] bg-white/70"
          >
            <header
              className={`mb-2 flex items-center justify-between rounded-[9px] px-3 py-2.5 ${headerColors.header}`}
            >
              <h2 className={`font-['Poppins'] text-[12px] font-semibold ${headerColors.label}`}>
                {column.label}
              </h2>

              <span
                className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${headerColors.count}`}
              >
                {column.tasks.length}
              </span>
            </header>

            <div className="space-y-2 px-1 pb-1">
              {column.tasks.map((task) => (
                <KanbanTaskCard
                  key={task.id}
                  task={task}
                  selected={selectedTaskIds.includes(task.id)}
                  contactName={getContactName(task.contact_id)}
                  onSelectTask={onSelectTask}
                  onContactClick={onContactClick}
                  onEditTask={onEditTask}
                  onArchiveTask={onArchiveTask}
                  onQuickUpdateTask={onQuickUpdateTask}
                  onStarTask={onStarTask}
                />
              ))}

              {column.tasks.length === 0 && (
                <div className="rounded-[9px] border-[0.5px] border-dashed border-[var(--border)] bg-white p-3 text-center text-[11.5px] text-[#c8c5c0]">
                  No tasks
                </div>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

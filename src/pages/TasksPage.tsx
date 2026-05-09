import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { TaskCard } from '../components/shared/TaskCard'
import { TaskModal } from '../components/shared/TaskModal'
import { useToast } from '../components/shared/Toast'
import { useContacts } from '../hooks/useContacts'
import { useTasks, type Task, type TaskStatus } from '../hooks/useTasks'

type ViewMode = 'list' | 'kanban'

type FilterMode =
  | 'open'
  | 'all'
  | 'done'
  | 'overdue'
  | 'starred'
  | 'awaitingReply'
  | 'noDueDate'
  | 'linkedContact'
  | 'unlinked'

type SortMode =
  | 'dueDate'
  | 'createdDate'
  | 'updatedDate'
  | 'starred'
  | 'title'
  | 'estimatedTime'

type KanbanGroupBy = 'status' | 'taskType'

type BulkTaskType =
  | ''
  | 'admin'
  | 'outreach'
  | 'client_work'
  | 'business_development'
  | 'schedule'
  | 'other'

const statusColumns: Array<{ id: TaskStatus; label: string }> = [
  { id: 'toDo', label: 'To Do' },
  { id: 'inProgress', label: 'In Progress' },
  { id: 'awaitingReply', label: 'Awaiting Reply' },
  { id: 'done', label: 'Done' },
]

const taskTypeColumns = [
  { id: 'admin', label: 'Admin' },
  { id: 'outreach', label: 'Outreach' },
  { id: 'client_work', label: 'Client Work' },
  { id: 'business_development', label: 'Business Development' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'other', label: 'Other' },
  { id: 'none', label: 'No Type' },
]

function blankTask(): Task {
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
    contact_id: null,
    goal_id: null,
    content_item_id: null,
    meeting_id: null,
  }
}

function isOverdue(task: Task) {
  if (!task.due_date || task.status === 'done') return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const due = new Date(`${task.due_date}T00:00:00`)
  due.setHours(0, 0, 0, 0)

  return due.getTime() < today.getTime()
}

function sortTasks(tasks: Task[], sortMode: SortMode) {
  return [...tasks].sort((a, b) => {
    if (sortMode === 'title') {
      return a.title.localeCompare(b.title)
    }

    if (sortMode === 'estimatedTime') {
      return (a.estimated_minutes ?? 0) - (b.estimated_minutes ?? 0)
    }

    if (sortMode === 'starred') {
      if (a.starred !== b.starred) return a.starred ? -1 : 1
      return a.title.localeCompare(b.title)
    }

    if (sortMode === 'createdDate') {
      return (b.created_at ?? '').localeCompare(a.created_at ?? '')
    }

    if (sortMode === 'updatedDate') {
      return (b.updated_at ?? '').localeCompare(a.updated_at ?? '')
    }

    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
    if (a.due_date && !b.due_date) return -1
    if (!a.due_date && b.due_date) return 1

    return (b.created_at ?? '').localeCompare(a.created_at ?? '')
  })
}

export function TasksPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()

  const {
    tasks,
    openTasks,
    isLoading,
    updateTask,
    archiveTask,
    createTask,
    bulkUpdateTasks,
    bulkArchiveTasks,
  } = useTasks()

  const { contacts } = useContacts()
  const { notify } = useToast()

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filter, setFilter] = useState<FilterMode>('open')
  const [sortMode, setSortMode] = useState<SortMode>('dueDate')
  const [kanbanGroupBy, setKanbanGroupBy] = useState<KanbanGroupBy>('status')
  const [bulkTaskType, setBulkTaskType] = useState<BulkTaskType>('')

  const contactById = useMemo(() => {
    const map = new Map<string, string>()

    contacts.forEach((contact) => {
      map.set(contact.id, contact.name)
    })

    return map
  }, [contacts])

  useEffect(() => {
    const isNewTaskRoute = location.pathname === '/tasks/new'

    if (isNewTaskRoute) {
      setSelectedTask(blankTask())
      return
    }

    if (params.id && tasks.length > 0) {
      const match = tasks.find((task) => task.id === params.id)

      if (match) {
        setSelectedTask(match)
        return
      }
    }

    if (location.pathname === '/tasks') {
      setSelectedTask(null)
    }
  }, [location.pathname, params.id, tasks])

  const filteredAndSortedTasks = useMemo(() => {
    const filtered = tasks
      .filter((task) => {
        if (filter === 'done') return task.status === 'done'
        if (filter === 'open') return task.status !== 'done'
        if (filter === 'overdue') return isOverdue(task)
        if (filter === 'starred') return task.starred
        if (filter === 'awaitingReply') return task.status === 'awaitingReply'
        if (filter === 'noDueDate') return !task.due_date
        if (filter === 'linkedContact') return Boolean(task.contact_id)
        if (filter === 'unlinked') return !task.contact_id

        return true
      })
      .filter((task) => {
        const q = query.trim().toLowerCase()
        if (!q) return true

        const contactName = task.contact_id ? contactById.get(task.contact_id) ?? '' : ''

        return (
          task.title.toLowerCase().includes(q) ||
          (task.notes ?? '').toLowerCase().includes(q) ||
          (task.task_type ?? '').toLowerCase().includes(q) ||
          contactName.toLowerCase().includes(q)
        )
      })

    return sortTasks(filtered, sortMode)
  }, [tasks, filter, query, sortMode, contactById])

  useEffect(() => {
    setSelectedTaskIds((prev) =>
      prev.filter((id) => filteredAndSortedTasks.some((task) => task.id === id)),
    )
  }, [filteredAndSortedTasks])

  const selectedCount = selectedTaskIds.length

  const closeTaskModal = () => {
    setSelectedTask(null)

    if (location.pathname.startsWith('/tasks/')) {
      navigate('/tasks')
    }
  }

  const handleOpenTask = (task: Task) => {
    setSelectedTask(task)
    navigate(`/tasks/${task.id}`)
  }

  const toggleTaskSelection = (task: Task) => {
    setSelectedTaskIds((prev) =>
      prev.includes(task.id)
        ? prev.filter((id) => id !== task.id)
        : [...prev, task.id],
    )
  }

  const clearSelectedTasks = () => {
    setSelectedTaskIds([])
    setBulkTaskType('')
  }

  const handleBulkArchive = async () => {
    const { error } = await bulkArchiveTasks(selectedTaskIds)

    if (error) {
      notify(`Bulk archive failed: ${error.message}`)
      return
    }

    notify(`${selectedCount} task${selectedCount === 1 ? '' : 's'} archived`)
    clearSelectedTasks()
  }

  const handleBulkStatus = async (status: TaskStatus) => {
    const { error } = await bulkUpdateTasks(selectedTaskIds, { status })

    if (error) {
      notify(`Bulk update failed: ${error.message}`)
      return
    }

    notify(`${selectedCount} task${selectedCount === 1 ? '' : 's'} updated`)
    clearSelectedTasks()
  }

  const handleBulkTaskType = async (taskType: BulkTaskType) => {
    setBulkTaskType(taskType)

    if (!taskType) return

    const { error } = await bulkUpdateTasks(selectedTaskIds, {
      task_type: taskType,
    })

    if (error) {
      notify(`Bulk task type update failed: ${error.message}`)
      return
    }

    notify(`${selectedCount} task${selectedCount === 1 ? '' : 's'} updated`)
    clearSelectedTasks()
  }

  const renderTaskCard = (task: Task) => (
   <TaskCard
  key={task.id}
  task={task}
  selected={selectedTaskIds.includes(task.id)}
  onSelect={toggleTaskSelection}
  contactName={task.contact_id ? contactById.get(task.contact_id) ?? null : null}
  contactId={task.contact_id}
  onContactClick={(contactId) => {
    navigate(`/contacts/${contactId}`)
  }}
  onEdit={handleOpenTask}
  onArchive={async (item) => {
    const { error } = await archiveTask(item.id)

    if (error) {
      notify(`Task archive failed: ${error.message}`)
      return
    }

    notify('Task archived')
  }}
  onQuickUpdate={async (item, patch) => {
    const { error } = await updateTask(item.id, patch)

    if (error) {
      notify(`Task update failed: ${error.message}`)
    }
  }}
  onStar={async (item) => {
    const { error } = await updateTask(item.id, {
      starred: !item.starred,
    })

    if (error) {
      notify(`Task update failed: ${error.message}`)
    }
  }}

        if (error) {
          notify(`Task update failed: ${error.message}`)
        }
      }}
      onToggle={async (item) => {
        const nextStatus: TaskStatus = item.status === 'done' ? 'toDo' : 'done'

        const { error } = await updateTask(item.id, {
          status: nextStatus,
        })

        if (error) {
          notify(`Task update failed: ${error.message}`)
        }
      }}
    />
  )

  const kanbanColumns =
    kanbanGroupBy === 'status'
      ? statusColumns.map((column) => ({
          id: column.id,
          label: column.label,
          tasks: filteredAndSortedTasks.filter((task) => task.status === column.id),
        }))
      : taskTypeColumns.map((column) => ({
          id: column.id,
          label: column.label,
          tasks: filteredAndSortedTasks.filter((task) =>
            column.id === 'none' ? !task.task_type : task.task_type === column.id,
          ),
        }))

  return (
    <section className="overflow-hidden rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--bg)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-[0.5px] border-[var(--border)] bg-white px-5 py-4">
        <div>
          <h1 className="font-serif text-[22px] font-medium tracking-[-0.4px]">
            Tasks
          </h1>
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">
            {openTasks.length} active task{openTasks.length === 1 ? '' : 's'}
          </p>
        </div>

        <button
          type="button"
          className="rounded-full bg-[var(--tasks)] px-4 py-2 text-[11.5px] font-medium text-white"
          onClick={() => {
            setSelectedTask(blankTask())
            navigate('/tasks/new')
          }}
        >
          + New Task
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b-[0.5px] border-[var(--border)] bg-[var(--bg)] px-5 py-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tasks..."
          className="min-w-[220px] flex-1 rounded-[8px] border-[0.5px] border-[var(--border)] bg-white px-3 py-2 text-[12px] outline-none focus:border-[rgba(193,152,173,0.5)]"
        />

        <div className="flex rounded-lg border-[0.5px] border-[var(--border)] bg-white p-[3px]">
          {(['list', 'kanban'] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded-md px-3 py-1.5 text-[11.5px] capitalize ${
                viewMode === item
                  ? 'bg-[var(--tasks)] text-white'
                  : 'text-[var(--muted)] hover:bg-[#f5f3f0]'
              }`}
              onClick={() => setViewMode(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as FilterMode)}
          className="rounded-[8px] border-[0.5px] border-[var(--border)] bg-white px-3 py-2 text-[12px] text-[var(--text)] outline-none focus:border-[rgba(193,152,173,0.5)]"
        >
          <option value="open">Active</option>
          <option value="all">All</option>
          <option value="done">Done</option>
          <option value="overdue">Overdue</option>
          <option value="starred">Starred</option>
          <option value="awaitingReply">Awaiting reply</option>
          <option value="noDueDate">No due date</option>
          <option value="linkedContact">Linked to contact</option>
          <option value="unlinked">Unlinked</option>
        </select>

        <select
          value={sortMode}
          onChange={(event) => setSortMode(event.target.value as SortMode)}
          className="rounded-[8px] border-[0.5px] border-[var(--border)] bg-white px-3 py-2 text-[12px] text-[var(--text)] outline-none focus:border-[rgba(193,152,173,0.5)]"
        >
          <option value="dueDate">Sort: Due date</option>
          <option value="createdDate">Sort: Created date</option>
          <option value="updatedDate">Sort: Updated date</option>
          <option value="starred">Sort: Starred</option>
          <option value="title">Sort: Title A–Z</option>
          <option value="estimatedTime">Sort: Estimated time</option>
        </select>

        {viewMode === 'kanban' && (
          <select
            value={kanbanGroupBy}
            onChange={(event) => setKanbanGroupBy(event.target.value as KanbanGroupBy)}
            className="rounded-[8px] border-[0.5px] border-[var(--border)] bg-white px-3 py-2 text-[12px] text-[var(--text)] outline-none focus:border-[rgba(193,152,173,0.5)]"
          >
            <option value="status">Board by: Status</option>
            <option value="taskType">Board by: Task Type</option>
          </select>
        )}

        <span className="ml-auto text-[11.5px] text-[var(--muted)]">
          {filteredAndSortedTasks.length} shown
        </span>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b-[0.5px] border-[rgba(193,152,173,0.25)] bg-[rgba(193,152,173,0.08)] px-5 py-3">
          <span className="text-[12px] font-semibold text-[#9f6e89]">
            {selectedCount} selected
          </span>

          <button
            type="button"
            className="rounded-full bg-white px-3 py-1.5 text-[11.5px] font-medium text-[var(--text)] shadow-sm transition hover:bg-[#f7f4f2]"
            onClick={() => void handleBulkStatus('done')}
          >
            Mark done
          </button>

          <button
            type="button"
            className="rounded-full bg-white px-3 py-1.5 text-[11.5px] font-medium text-[var(--text)] shadow-sm transition hover:bg-[#f7f4f2]"
            onClick={() => void handleBulkStatus('toDo')}
          >
            Mark active
          </button>

          <button
            type="button"
            className="rounded-full bg-white px-3 py-1.5 text-[11.5px] font-medium text-[var(--text)] shadow-sm transition hover:bg-[#f7f4f2]"
            onClick={() => void handleBulkStatus('awaitingReply')}
          >
            Awaiting reply
          </button>

          <select
            value={bulkTaskType}
            onChange={(event) => void handleBulkTaskType(event.target.value as BulkTaskType)}
            className="rounded-full border border-white bg-white px-3 py-1.5 text-[11.5px] font-medium text-[var(--text)] shadow-sm outline-none"
          >
            <option value="">Change type...</option>
            <option value="admin">Admin</option>
            <option value="outreach">Outreach</option>
            <option value="client_work">Client Work</option>
            <option value="business_development">Business Development</option>
            <option value="schedule">Schedule</option>
            <option value="other">Other</option>
          </select>

          <button
            type="button"
            className="rounded-full bg-white px-3 py-1.5 text-[11.5px] font-medium text-[#a85c64] shadow-sm transition hover:bg-[#fbf3f4]"
            onClick={() => void handleBulkArchive()}
          >
            Archive
          </button>

          <button
            type="button"
            className="ml-auto rounded-full px-3 py-1.5 text-[11.5px] font-medium text-[var(--muted)] transition hover:bg-white"
            onClick={clearSelectedTasks}
          >
            Clear
          </button>
        </div>
      )}

      <div className="p-4">
        {isLoading ? (
          <p className="text-[12px] text-[var(--muted)]">Loading tasks…</p>
        ) : viewMode === 'list' ? (
          <div className="grid gap-2">
            {filteredAndSortedTasks.map((task) => renderTaskCard(task))}

            {filteredAndSortedTasks.length === 0 && (
              <p className="rounded-[9px] border-[0.5px] border-dashed border-[var(--border)] bg-white p-4 text-center text-[12px] text-[#c8c5c0]">
                No tasks here.
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-3 overflow-x-auto pb-2 md:grid-cols-2 xl:grid-cols-4">
            {kanbanColumns.map((column) => (
              <section
                key={column.id}
                className="min-w-[260px] rounded-xl border-[0.5px] border-[var(--border)] bg-white/70"
              >
                <header className="flex items-center justify-between border-b-[0.5px] border-[var(--border)] px-3 py-3">
                  <h2 className="font-serif text-[16px] font-medium text-[var(--text)]">
                    {column.label}
                  </h2>
                  <span className="rounded-full bg-[rgba(193,152,173,0.16)] px-2 py-1 text-[10.5px] font-medium text-[#9f6e89]">
                    {column.tasks.length}
                  </span>
                </header>

                <div className="grid gap-2 p-2">
                  {column.tasks.map((task) => renderTaskCard(task))}

                  {column.tasks.length === 0 && (
                    <div className="rounded-[9px] border-[0.5px] border-dashed border-[var(--border)] bg-white p-4 text-center text-[12px] text-[#c8c5c0]">
                      No tasks
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <TaskModal
        open={Boolean(selectedTask)}
        task={selectedTask}
        onClose={closeTaskModal}
        onSave={async (id, patch) => {
          const result = id
            ? await updateTask(id, patch)
            : await createTask({
                title: patch.title || 'Untitled task',
                notes: patch.notes ?? null,
                status: patch.status ?? 'toDo',
                task_type: patch.task_type ?? null,
                due_date: patch.due_date ?? null,
                estimated_minutes: patch.estimated_minutes ?? 30,
                starred: patch.starred ?? false,
                archived: false,
                contact_id: patch.contact_id ?? null,
                goal_id: patch.goal_id ?? null,
                content_item_id: patch.content_item_id ?? null,
                meeting_id: patch.meeting_id ?? null,
              })

          if (result.error) {
            notify(`Task save failed: ${result.error.message}`)
            return
          }

          notify('Task saved')
        }}
      />
    </section>
  )
}

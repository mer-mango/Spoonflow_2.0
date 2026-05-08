import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { TaskCard } from '../components/shared/TaskCard'
import { TaskModal } from '../components/shared/TaskModal'
import { useToast } from '../components/shared/Toast'
import { useTasks, type Task, type TaskStatus } from '../hooks/useTasks'

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
  }
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
    deleteTask,
    createTask,
  } = useTasks()

  const { notify } = useToast()

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'open' | 'all' | 'done' | 'overdue'>('open')

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

  const visibleTasks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return tasks
      .filter((task) => {
        if (filter === 'done') return task.status === 'done'
        if (filter === 'open') return task.status !== 'done'

        if (filter === 'overdue') {
          if (!task.due_date || task.status === 'done') return false

          const due = new Date(`${task.due_date}T00:00:00`)
          due.setHours(0, 0, 0, 0)

          return due.getTime() < today.getTime()
        }

        return true
      })
      .filter((task) => {
        const q = query.trim().toLowerCase()
        if (!q) return true

        return (
          task.title.toLowerCase().includes(q) ||
          (task.notes ?? '').toLowerCase().includes(q) ||
          (task.task_type ?? '').toLowerCase().includes(q)
        )
      })
  }, [tasks, filter, query])

  const closeTaskModal = () => {
    setSelectedTask(null)

    if (location.pathname.startsWith('/tasks/')) {
      navigate('/tasks')
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--bg)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-[0.5px] border-[var(--border)] bg-white px-5 py-4">
        <div>
          <h1 className="font-serif text-[22px] font-medium tracking-[-0.4px]">
            Tasks
          </h1>
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">
            {openTasks.length} open task{openTasks.length === 1 ? '' : 's'}
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
          className="min-w-[260px] flex-1 rounded-[8px] border-[0.5px] border-[var(--border)] bg-white px-3 py-2 text-[12px] outline-none focus:border-[rgba(193,152,173,0.5)]"
        />

        <div className="ml-auto flex rounded-lg border-[0.5px] border-[var(--border)] bg-white p-[3px]">
          {(['open', 'all', 'done', 'overdue'] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded-md px-3 py-1.5 text-[11.5px] capitalize ${
                filter === item
                  ? 'bg-[var(--tasks)] text-white'
                  : 'text-[var(--muted)] hover:bg-[#f5f3f0]'
              }`}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <p className="text-[12px] text-[var(--muted)]">Loading tasks…</p>
        ) : (
          <div className="grid gap-2">
            {visibleTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(item) => {
                  setSelectedTask(item)
                  navigate(`/tasks/${item.id}`)
                }}
                onDelete={async (item) => {
                  const { error } = await deleteTask(item.id)

                  if (error) {
                    notify(`Task delete failed: ${error.message}`)
                    return
                  }

                  notify('Task deleted')
                }}
                onToggle={async (item) => {
                  const nextStatus: TaskStatus =
                    item.status === 'done' ? 'toDo' : 'done'

                  const { error } = await updateTask(item.id, {
                    status: nextStatus,
                  })

                  if (error) {
                    notify(`Task update failed: ${error.message}`)
                  }
                }}
              />
            ))}

            {visibleTasks.length === 0 && (
              <p className="rounded-[9px] border-[0.5px] border-dashed border-[var(--border)] bg-white p-4 text-center text-[12px] text-[#c8c5c0]">
                No tasks here.
              </p>
            )}
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
                contact_id: patch.contact_id ?? null,
                goal_id: patch.goal_id ?? null,
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

import { useMemo, useState } from 'react'
import { TaskCard } from '../components/shared/TaskCard'
import { TaskModal } from '../components/shared/TaskModal'
import { useToast } from '../components/shared/Toast'
import { useTasks, type Task } from '../hooks/useTasks'

export function TasksPage() {
  const { tasks, isLoading, updateTask, deleteTask, createTask } = useTasks()
  const { notify } = useToast()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [newTitle, setNewTitle] = useState('')

  const openTasks = useMemo(() => tasks.filter((task) => task.status !== 'done'), [tasks])

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 rounded-2xl bg-white p-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl">Tasks</h1>
        <p className="text-sm text-[var(--muted)]">{openTasks.length} open tasks</p>
      </header>

      <div className="rounded-2xl bg-white p-4">
        <div className="mb-4 flex gap-2">
          <input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Quick add a task"
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2"
          />
          <button
            type="button"
            className="rounded-lg bg-[var(--jamie)] px-4 py-2 text-white"
            onClick={async () => {
              if (!newTitle.trim()) return
              const { error } = await createTask({ title: newTitle.trim() })
              if (!error) {
                setNewTitle('')
                notify('Task created')
              }
            }}
          >
            Add
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-[var(--muted)]">Loading tasks...</p>
        ) : (
          <div className="grid gap-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={setSelectedTask}
                onDelete={async (item) => {
                  await deleteTask(item.id)
                  notify('Task deleted')
                }}
                onToggle={async (item) => {
                  await updateTask(item.id, { status: item.status === 'done' ? 'toDo' : 'done' })
                }}
              />
            ))}
          </div>
        )}
      </div>

      <TaskModal
        open={Boolean(selectedTask)}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onSave={async (id, patch) => {
          await updateTask(id, patch)
          notify('Task updated')
        }}
      />
    </section>
  )
}

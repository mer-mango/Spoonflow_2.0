import { useMemo, useState } from 'react'
import { TaskCard } from '../shared/TaskCard'
import { useTasks } from '../../hooks/useTasks'

export function StepsTab({ goalId }: { goalId: string }) {
  const { tasks, createTask, updateTask, deleteTask } = useTasks()
  const [quickAdd, setQuickAdd] = useState('')
  const goalTasks = useMemo(() => tasks.filter((task) => task.goal_id === goalId), [tasks, goalId])

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={quickAdd}
          onChange={(event) => setQuickAdd(event.target.value)}
          placeholder="Add a step"
          className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        />
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          onClick={async () => {
            if (!quickAdd.trim()) return
            await createTask({ title: quickAdd.trim(), goal_id: goalId, status: 'toDo' })
            setQuickAdd('')
          }}
        >
          Add
        </button>
      </div>
      <div className="space-y-2">
        {goalTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={() => undefined}
            onDelete={(item) => void deleteTask(item.id)}
            onToggle={(item) =>
              void updateTask(item.id, { status: item.status === 'done' ? 'toDo' : 'done' })
            }
          />
        ))}
        {goalTasks.length === 0 && <p className="text-xs text-[var(--muted)]">No steps yet.</p>}
      </div>
    </div>
  )
}

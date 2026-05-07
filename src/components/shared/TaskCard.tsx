import { Badge } from './Badge'
import type { Task } from '../../hooks/useTasks'

type TaskCardProps = {
  task: Task
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  showContact?: boolean
  showGoal?: boolean
}

function dateLabel(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString()
}

export function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  const done = task.status === 'done'

  return (
    <article
      className={`rounded-xl border border-[var(--border)] p-3 ${done ? 'bg-black/5' : 'bg-white'}`}
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-1 h-5 w-5 rounded border border-[var(--border)]"
          onClick={(event) => {
            event.stopPropagation()
            onToggle(task)
          }}
          aria-label="Toggle task status"
        >
          {done ? '✓' : ''}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className={`font-medium ${done ? 'line-through text-[var(--muted)]' : ''}`}>{task.title}</h3>
            <button
              type="button"
              className="text-sm text-[var(--muted)]"
              onClick={(event) => {
                event.stopPropagation()
                onDelete(task)
              }}
            >
              Delete
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge
              label={task.status}
              variant={
                task.status === 'toDo'
                  ? 'todo'
                  : task.status === 'inProgress'
                    ? 'inProgress'
                    : task.status === 'awaitingReply'
                      ? 'awaitingReply'
                      : 'done'
              }
            />
            {task.task_type && <Badge label={task.task_type} variant="tasks" />}
            <span className="rounded-md bg-[var(--tasks)] px-2 py-1 text-xs text-[var(--text)]">{dateLabel(task.due_date)}</span>
            <span className="text-xs text-[var(--muted)]">{task.estimated_minutes}m</span>
          </div>
        </div>
      </div>
    </article>
  )
}

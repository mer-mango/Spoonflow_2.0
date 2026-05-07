import { Badge } from './Badge'
import type { Task } from '../../hooks/useTasks'

type TaskCardProps = { task: Task; onToggle: (task: Task) => void; onEdit: (task: Task) => void; onDelete: (task: Task) => void; showContact?: boolean; showGoal?: boolean }

function dateLabel(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  const done = task.status === 'done'

  return (
    <article className={`group grid cursor-pointer grid-cols-[52px_1fr_auto] overflow-hidden rounded-[10px] border-[0.5px] border-[var(--border)] bg-white transition hover:shadow-[0_2px_10px_rgba(0,0,0,0.08)] ${done ? 'opacity-60' : ''}`} onClick={() => onEdit(task)}>
      <div className="flex min-h-[68px] flex-col items-center justify-center bg-[var(--tasks)] px-1 text-center text-white">
        <span className="text-[10px] font-medium leading-none">{dateLabel(task.due_date)}</span>
      </div>
      <div className="min-w-0 p-3">
        <div className="flex items-start gap-2">
          <button type="button" className={`mt-0.5 flex h-5 w-5 min-w-5 items-center justify-center rounded border-[1.5px] ${done ? 'border-[var(--done)] bg-[var(--done)]' : 'border-[#c8c5c0]'}`} onClick={(event) => { event.stopPropagation(); onToggle(task) }} aria-label="Toggle task status">
            {done ? <span className="text-[11px] text-white">✓</span> : null}
          </button>
          <div className="min-w-0 flex-1">
            <h3 className={`truncate text-[13px] font-medium leading-snug ${done ? 'line-through text-[var(--muted)]' : 'text-[var(--text)]'}`}>{task.title}</h3>
            {task.notes && <p className="mt-1 line-clamp-1 text-[11.5px] text-[var(--muted)]">{task.notes}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge label={task.status} variant={task.status === 'toDo' ? 'todo' : task.status === 'inProgress' ? 'inProgress' : task.status === 'awaitingReply' ? 'awaitingReply' : 'done'} />
              {task.task_type && <Badge label={task.task_type} variant="tasks" />}
              <span className="rounded bg-[#f5f3f0] px-2 py-1 text-[10.5px] text-[var(--muted)]">{task.estimated_minutes}m</span>
            </div>
          </div>
        </div>
      </div>
      <button type="button" className="px-3 text-[11px] text-[var(--muted)] opacity-70 hover:text-[var(--medical)]" onClick={(event) => { event.stopPropagation(); onDelete(task) }}>Delete</button>
    </article>
  )
}

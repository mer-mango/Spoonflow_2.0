import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import type { Task, TaskStatus } from '../../hooks/useTasks'

type TaskModalProps = {
  open: boolean
  task: Task | null
  onClose: () => void
  onSave: (taskId: string, patch: Partial<Task>) => Promise<void>
}

export function TaskModal({ open, task, onClose, onSave }: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<TaskStatus>('toDo')
  const [taskType, setTaskType] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [minutes, setMinutes] = useState(30)

  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setNotes(task.notes ?? '')
    setStatus(task.status)
    setTaskType(task.task_type ?? '')
    setDueDate(task.due_date ?? '')
    setMinutes(task.estimated_minutes ?? 30)
  }, [task])

  if (!task) return null

  return (
    <Modal open={open} onClose={onClose} title="Edit Task">
      <div className="grid gap-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-lg border border-[var(--border)] px-3 py-2 font-serif text-lg" />
        <div className="grid grid-cols-2 gap-3">
          <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="rounded-lg border border-[var(--border)] px-3 py-2">
            <option value="toDo">toDo</option>
            <option value="inProgress">inProgress</option>
            <option value="awaitingReply">awaitingReply</option>
            <option value="done">done</option>
          </select>
          <input value={taskType} onChange={(e) => setTaskType(e.target.value)} placeholder="Task type" className="rounded-lg border border-[var(--border)] px-3 py-2" />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-lg border border-[var(--border)] px-3 py-2" />
          <input type="number" min={5} step={5} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="rounded-lg border border-[var(--border)] px-3 py-2" />
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} placeholder="Notes" className="rounded-lg border border-[var(--border)] px-3 py-2" />
        <div className="flex justify-end gap-2">
          <button type="button" className="rounded-lg border border-[var(--border)] px-4 py-2" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-[var(--jamie)] px-4 py-2 text-white"
            onClick={async () => {
              await onSave(task.id, {
                title,
                notes,
                status,
                task_type: taskType || null,
                due_date: dueDate || null,
                estimated_minutes: minutes,
              })
              onClose()
            }}
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  )
}

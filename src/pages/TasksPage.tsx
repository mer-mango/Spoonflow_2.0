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
  const [filter, setFilter] = useState<'open' | 'all' | 'done'>('open')

  const openTasks = useMemo(() => tasks.filter((task) => task.status !== 'done'), [tasks])
  const visibleTasks = useMemo(() => tasks.filter((task) => filter === 'all' ? true : filter === 'done' ? task.status === 'done' : task.status !== 'done'), [filter, tasks])

  const addTask = async () => {
    if (!newTitle.trim()) return
    const { error } = await createTask({ title: newTitle.trim() })
    if (!error) { setNewTitle(''); notify('Task created') }
  }

  return (
    <section className="overflow-hidden rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--bg)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-[0.5px] border-[var(--border)] bg-white px-5 py-4">
        <div><h1 className="font-serif text-[22px] font-medium tracking-[-0.4px]">Tasks</h1><p className="mt-0.5 text-[11px] text-[var(--muted)]">{openTasks.length} open tasks</p></div>
        <button type="button" className="rounded-full bg-[var(--tasks)] px-4 py-2 text-[11.5px] font-medium text-white" onClick={() => setSelectedTask({ id: '', title: '', notes: null, status: 'toDo', task_type: null, due_date: null, estimated_minutes: 30, starred: false, contact_id: null, goal_id: null })}>+ New Task</button>
      </header>
      <div className="flex flex-wrap items-center gap-2 border-b-[0.5px] border-[var(--border)] bg-[var(--bg)] px-5 py-3">
        <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Quick add a task" className="min-w-[220px] flex-1 rounded-[8px] border-[0.5px] border-[var(--border)] bg-white px-3 py-2 text-[12px] outline-none focus:border-[rgba(193,152,173,0.5)]" onKeyDown={(event) => { if (event.key === 'Enter') void addTask() }} />
        <button type="button" className="rounded-[8px] bg-[var(--tasks)] px-4 py-2 text-[12px] font-medium text-white" onClick={() => void addTask()}>Add</button>
        <div className="ml-auto flex rounded-lg border-[0.5px] border-[var(--border)] bg-white p-[3px]">
          {(['open','all','done'] as const).map((item) => <button key={item} type="button" className={`rounded-md px-3 py-1.5 text-[11.5px] capitalize ${filter === item ? 'bg-[var(--tasks)] text-white' : 'text-[var(--muted)] hover:bg-[#f5f3f0]'}`} onClick={() => setFilter(item)}>{item}</button>)}
        </div>
      </div>
      <div className="p-4">
        {isLoading ? <p className="text-[12px] text-[var(--muted)]">Loading tasks…</p> : <div className="grid gap-2">{visibleTasks.map((task) => <TaskCard key={task.id} task={task} onEdit={setSelectedTask} onDelete={async (item) => { await deleteTask(item.id); notify('Task deleted') }} onToggle={async (item) => { await updateTask(item.id, { status: item.status === 'done' ? 'toDo' : 'done' }) }} />)}{visibleTasks.length === 0 && <p className="rounded-[9px] border-[0.5px] border-dashed border-[var(--border)] bg-white p-4 text-center text-[12px] text-[#c8c5c0]">No tasks here.</p>}</div>}
      </div>
      <TaskModal open={Boolean(selectedTask)} task={selectedTask} onClose={() => setSelectedTask(null)} onSave={async (id, patch) => { if (id) { await updateTask(id, patch) } else { await createTask({ title: patch.title || 'Untitled task', notes: patch.notes ?? null, status: patch.status ?? 'toDo', task_type: patch.task_type ?? null, due_date: patch.due_date ?? null, estimated_minutes: patch.estimated_minutes ?? 30 }) } notify('Task saved') }} />
    </section>
  )
}

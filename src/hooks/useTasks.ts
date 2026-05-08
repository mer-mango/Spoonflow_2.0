import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export type TaskStatus = 'toDo' | 'inProgress' | 'awaitingReply' | 'done'

export type Task = {
  id: string
  title: string
  notes: string | null
  status: TaskStatus
  task_type: string | null
  due_date: string | null
  estimated_minutes: number
  starred: boolean
  contact_id: string | null
  goal_id: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type TaskInput = Partial<Task> & {
  title: string
}

export type TaskUpdateInput = Partial<
  Pick<
    Task,
    | 'title'
    | 'notes'
    | 'status'
    | 'task_type'
    | 'due_date'
    | 'estimated_minutes'
    | 'starred'
    | 'contact_id'
    | 'goal_id'
  >
>

const TASK_SELECT = `
  id,
  title,
  notes,
  status,
  task_type,
  due_date,
  estimated_minutes,
  starred,
  contact_id,
  goal_id,
  created_at,
  updated_at
`

function cleanText(value?: string | null) {
  const cleaned = value?.trim()
  return cleaned ? cleaned : null
}

function normalizeStatus(status?: TaskStatus | null): TaskStatus {
  return status ?? 'toDo'
}

function normalizeMinutes(minutes?: number | null) {
  if (!minutes || Number.isNaN(minutes) || minutes < 5) return 30
  return minutes
}

function prepareTaskInsert(payload: TaskInput) {
  return {
    title: payload.title.trim() || 'Untitled task',
    notes: cleanText(payload.notes),
    status: normalizeStatus(payload.status),
    task_type: cleanText(payload.task_type),
    due_date: payload.due_date || null,
    estimated_minutes: normalizeMinutes(payload.estimated_minutes),
    starred: payload.starred ?? false,
    contact_id: payload.contact_id ?? null,
    goal_id: payload.goal_id ?? null,
    updated_at: new Date().toISOString(),
  }
}

function prepareTaskUpdate(patch: TaskUpdateInput) {
  const payload: Record<string, string | number | boolean | null> = {
    updated_at: new Date().toISOString(),
  }

  if ('title' in patch && patch.title !== undefined) {
    payload.title = patch.title.trim() || 'Untitled task'
  }

  if ('notes' in patch) payload.notes = cleanText(patch.notes)
  if ('status' in patch) payload.status = normalizeStatus(patch.status)
  if ('task_type' in patch) payload.task_type = cleanText(patch.task_type)
  if ('due_date' in patch) payload.due_date = patch.due_date || null
  if ('estimated_minutes' in patch) {
    payload.estimated_minutes = normalizeMinutes(patch.estimated_minutes)
  }
  if ('starred' in patch) payload.starred = Boolean(patch.starred)
  if ('contact_id' in patch) payload.contact_id = patch.contact_id ?? null
  if ('goal_id' in patch) payload.goal_id = patch.goal_id ?? null

  return payload
}

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1
    if (a.status !== 'done' && b.status === 'done') return -1

    if (a.starred !== b.starred) return a.starred ? -1 : 1

    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
    if (a.due_date && !b.due_date) return -1
    if (!a.due_date && b.due_date) return 1

    return (b.created_at ?? '').localeCompare(a.created_at ?? '')
  })
}

function getTodayKey() {
  const today = new Date()

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')
}

function isTaskOverdue(task: Task) {
  if (!task.due_date || task.status === 'done') return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const due = new Date(`${task.due_date}T00:00:00`)
  due.setHours(0, 0, 0, 0)

  return due.getTime() < today.getTime()
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadTasks = useCallback(async () => {
    setIsLoading(true)

    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_SELECT)
      .order('created_at', { ascending: false })

    if (!error) {
      setTasks(sortTasks((data as Task[]) ?? []))
    }

    setIsLoading(false)

    return { data, error }
  }, [])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  const createTask = useCallback(async (payload: TaskInput) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        data: null,
        error: new Error('You must be signed in to create tasks.'),
      }
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...prepareTaskInsert(payload),
        user_id: user.id,
      })
      .select(TASK_SELECT)
      .single()

    if (!error && data) {
      setTasks((prev) => sortTasks([data as Task, ...prev]))
    }

    return { data, error }
  }, [])

  const updateTask = useCallback(async (id: string, patch: TaskUpdateInput) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(prepareTaskUpdate(patch))
      .eq('id', id)
      .select(TASK_SELECT)
      .single()

    if (!error && data) {
      setTasks((prev) =>
        sortTasks(prev.map((task) => (task.id === id ? (data as Task) : task))),
      )
    }

    return { data, error }
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)

    if (!error) {
      setTasks((prev) => prev.filter((task) => task.id !== id))
    }

    return { error }
  }, [])

  const bulkUpdateTasks = useCallback(async (ids: string[], patch: TaskUpdateInput) => {
    if (ids.length === 0) return { data: [], error: null }

    const { data, error } = await supabase
      .from('tasks')
      .update(prepareTaskUpdate(patch))
      .in('id', ids)
      .select(TASK_SELECT)

    if (!error && data) {
      const updatedById = new Map((data as Task[]).map((task) => [task.id, task]))

      setTasks((prev) =>
        sortTasks(prev.map((task) => updatedById.get(task.id) ?? task)),
      )
    }

    return { data, error }
  }, [])

  const bulkDeleteTasks = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return { error: null }

    const { error } = await supabase.from('tasks').delete().in('id', ids)

    if (!error) {
      setTasks((prev) => prev.filter((task) => !ids.includes(task.id)))
    }

    return { error }
  }, [])

  const openTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'done'),
    [tasks],
  )

  const doneTasks = useMemo(
    () => tasks.filter((task) => task.status === 'done'),
    [tasks],
  )

  const overdueTasks = useMemo(
    () => tasks.filter((task) => isTaskOverdue(task)),
    [tasks],
  )

  const todayTasks = useMemo(() => {
    const todayKey = getTodayKey()
    return tasks.filter((task) => task.due_date === todayKey)
  }, [tasks])

  const starredTasks = useMemo(
    () => tasks.filter((task) => task.starred),
    [tasks],
  )

  return useMemo(
    () => ({
      tasks,
      openTasks,
      doneTasks,
      overdueTasks,
      todayTasks,
      starredTasks,
      isLoading,
      loadTasks,
      createTask,
      updateTask,
      deleteTask,
      bulkUpdateTasks,
      bulkDeleteTasks,
    }),
    [
      tasks,
      openTasks,
      doneTasks,
      overdueTasks,
      todayTasks,
      starredTasks,
      isLoading,
      loadTasks,
      createTask,
      updateTask,
      deleteTask,
      bulkUpdateTasks,
      bulkDeleteTasks,
    ],
  )
}

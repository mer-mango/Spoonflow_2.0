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
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadTasks = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('id,title,notes,status,task_type,due_date,estimated_minutes,starred,contact_id,goal_id')
      .order('created_at', { ascending: false })
    if (!error) setTasks((data as Task[]) ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  const updateTask = useCallback(async (id: string, patch: Partial<Task>) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id,title,notes,status,task_type,due_date,estimated_minutes,starred,contact_id,goal_id')
      .single()
    if (!error && data) {
      setTasks((prev) => prev.map((task) => (task.id === id ? (data as Task) : task)))
    }
    return { data, error }
  }, [])

  const createTask = useCallback(async (payload: Partial<Task> & { title: string }) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: payload.title,
        notes: payload.notes ?? null,
        status: payload.status ?? 'toDo',
        task_type: payload.task_type ?? null,
        due_date: payload.due_date ?? null,
        estimated_minutes: payload.estimated_minutes ?? 30,
        starred: payload.starred ?? false,
        contact_id: payload.contact_id ?? null,
        goal_id: payload.goal_id ?? null,
      })
      .select('id,title,notes,status,task_type,due_date,estimated_minutes,starred,contact_id,goal_id')
      .single()
    if (!error && data) setTasks((prev) => [data as Task, ...prev])
    return { data, error }
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) setTasks((prev) => prev.filter((task) => task.id !== id))
    return { error }
  }, [])

  return useMemo(
    () => ({ tasks, isLoading, loadTasks, updateTask, createTask, deleteTask }),
    [tasks, isLoading, loadTasks, updateTask, createTask, deleteTask],
  )
}

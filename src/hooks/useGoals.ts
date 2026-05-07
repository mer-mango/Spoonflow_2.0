import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export type GoalStatus = 'in progress' | 'not started' | 'on hold' | 'completed'

export type Goal = {
  id: string
  title: string
  status: GoalStatus
  category: string | null
  target_date: string | null
  color: string | null
}

export type GoalJournalEntry = {
  id: string
  goal_id: string
  text: string
  created_at: string
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [journalEntries, setJournalEntries] = useState<GoalJournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadGoals = useCallback(async () => {
    setIsLoading(true)
    const [{ data: goalsData }, { data: journalData }] = await Promise.all([
      supabase.from('goals').select('id,title,status,category,target_date,color').eq('archived', false).order('created_at', { ascending: false }),
      supabase.from('goal_journal_entries').select('id,goal_id,text,created_at').order('created_at', { ascending: false }),
    ])
    setGoals((goalsData as Goal[]) ?? [])
    setJournalEntries((journalData as GoalJournalEntry[]) ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void loadGoals()
  }, [loadGoals])

  const createGoal = useCallback(async (payload: { title: string; category?: string | null }) => {
    const { data, error } = await supabase
      .from('goals')
      .insert({
        title: payload.title,
        category: payload.category ?? null,
        status: 'not started',
      })
      .select('id,title,status,category,target_date,color')
      .single()
    if (!error && data) setGoals((prev) => [data as Goal, ...prev])
    return { data, error }
  }, [])

  const updateGoal = useCallback(async (id: string, patch: Partial<Goal>) => {
    const { data, error } = await supabase
      .from('goals')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id,title,status,category,target_date,color')
      .single()
    if (!error && data) setGoals((prev) => prev.map((goal) => (goal.id === id ? (data as Goal) : goal)))
    return { data, error }
  }, [])

  const addJournalEntry = useCallback(async (goalId: string, text: string) => {
    const { data, error } = await supabase
      .from('goal_journal_entries')
      .insert({ goal_id: goalId, text })
      .select('id,goal_id,text,created_at')
      .single()
    if (!error && data) setJournalEntries((prev) => [data as GoalJournalEntry, ...prev])
    return { data, error }
  }, [])

  return useMemo(
    () => ({ goals, journalEntries, isLoading, loadGoals, createGoal, updateGoal, addJournalEntry }),
    [goals, journalEntries, isLoading, loadGoals, createGoal, updateGoal, addJournalEntry],
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export type ContentStatus =
  | 'idea'
  | 'drafting'
  | 'refining'
  | 'ready'
  | 'scheduled'
  | 'published'
  | 'archived'

export type ContentItem = {
  id: string
  title: string
  status: ContentStatus
  content_type: string | null
  platform: 'li' | 'ss' | null
  due_date: string | null
  excerpt: string | null
  updated_at: string
}

export function useContent() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadContent = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('content_items')
      .select('id,title,status,content_type,platform,due_date,excerpt,updated_at')
      .order('updated_at', { ascending: false })
    if (!error) setItems((data as ContentItem[]) ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void loadContent()
  }, [loadContent])

  const createContent = useCallback(
    async (payload: { title: string; content_type?: string | null; platform?: 'li' | 'ss' | null }) => {
      const { data, error } = await supabase
        .from('content_items')
        .insert({
          title: payload.title,
          content_type: payload.content_type ?? null,
          platform: payload.platform ?? null,
          status: 'idea',
        })
        .select('id,title,status,content_type,platform,due_date,excerpt,updated_at')
        .single()
      if (!error && data) setItems((prev) => [data as ContentItem, ...prev])
      return { data, error }
    },
    [],
  )

  const updateContent = useCallback(async (id: string, patch: Partial<ContentItem>) => {
    const { data, error } = await supabase
      .from('content_items')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id,title,status,content_type,platform,due_date,excerpt,updated_at')
      .single()
    if (!error && data) setItems((prev) => prev.map((item) => (item.id === id ? (data as ContentItem) : item)))
    return { data, error }
  }, [])

  return useMemo(
    () => ({ items, isLoading, loadContent, createContent, updateContent }),
    [items, isLoading, loadContent, createContent, updateContent],
  )
}

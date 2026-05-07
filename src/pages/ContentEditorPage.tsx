import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ContentEditor } from '../components/content/ContentEditor'
import { JamiePanel } from '../components/content/JamiePanel'
import { supabase } from '../lib/supabase'
import type { ContentStatus } from '../hooks/useContent'

type EditorItem = {
  id: string
  title: string
  status: ContentStatus
  content_type: string | null
  due_date: string | null
  body: string | null
  updated_at: string
}

const statusOptions: ContentStatus[] = ['idea', 'drafting', 'refining', 'ready', 'scheduled', 'published', 'archived']

export function ContentEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<EditorItem | null>(null)
  const [draftText, setDraftText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const saveTimeout = useRef<number | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      if (!id || id === 'new') {
        const { data } = await supabase
          .from('content_items')
          .insert({ title: 'Untitled', status: 'idea' })
          .select('id,title,status,content_type,due_date,body,updated_at')
          .single()
        if (data) {
          navigate(`/content/${data.id}`, { replace: true })
          setItem(data as EditorItem)
        }
        setIsLoading(false)
        return
      }
      const { data } = await supabase
        .from('content_items')
        .select('id,title,status,content_type,due_date,body,updated_at')
        .eq('id', id)
        .single()
      setItem((data as EditorItem) ?? null)
      setIsLoading(false)
    }
    void load()
  }, [id, navigate])

  const scheduleSave = (patch: Partial<EditorItem>) => {
    if (!item) return
    const next = { ...item, ...patch }
    setItem(next)
    if (saveTimeout.current) window.clearTimeout(saveTimeout.current)
    saveTimeout.current = window.setTimeout(async () => {
      await supabase
        .from('content_items')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', next.id)
      setItem((prev) =>
        prev ? { ...prev, updated_at: new Date().toISOString() } : prev,
      )
    }, 1000)
  }

  const lastSavedLabel = useMemo(() => {
    if (!item?.updated_at) return 'Not saved yet'
    return `Saved ${new Date(item.updated_at).toLocaleTimeString()}`
  }, [item?.updated_at])

  if (isLoading || !item) {
    return <div className="rounded-2xl bg-white p-6 text-sm text-[var(--muted)]">Loading editor...</div>
  }

  return (
    <section className="space-y-3">
      <header className="rounded-2xl bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            onClick={() => navigate('/content')}
          >
            ← Back
          </button>
          <input
            value={item.title}
            onChange={(event) => scheduleSave({ title: event.target.value })}
            className="min-w-[220px] flex-1 rounded-lg border border-[var(--border)] px-3 py-2 font-serif text-xl"
          />
          <input
            value={item.content_type ?? ''}
            onChange={(event) => scheduleSave({ content_type: event.target.value || null })}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            placeholder="Type"
          />
          <input
            type="date"
            value={item.due_date ?? ''}
            onChange={(event) => scheduleSave({ due_date: event.target.value || null })}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
          <select
            value={item.status}
            onChange={(event) => scheduleSave({ status: event.target.value as ContentStatus })}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <span className="text-xs text-[var(--muted)]">{lastSavedLabel}</span>
        </div>
      </header>

      <div className="rounded-2xl bg-white p-4">
        <ContentEditor
          initialBody={item.body ?? ''}
          onBodyChange={(html, plainText) => {
            setDraftText(plainText)
            scheduleSave({ body: html })
          }}
        />
      </div>

      <JamiePanel contentItemId={item.id} draftText={draftText} />
    </section>
  )
}

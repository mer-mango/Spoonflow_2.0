import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ContentEditor } from '../components/content/ContentEditor'
import { JamiePanel } from '../components/content/JamiePanel'
import { supabase } from '../lib/supabase'
import type { ContentStatus } from '../hooks/useContent'

type EditorItem = { id: string; title: string; status: ContentStatus; content_type: string | null; due_date: string | null; body: string | null; updated_at: string }

const statusOptions: ContentStatus[] = ['idea', 'drafting', 'refining', 'ready', 'scheduled', 'published', 'archived']
const typeOptions = ['linkedin_post', 'linkedin_article', 'linkedin_video', 'substack_note', 'substack_post']

function label(value: string | null) { return value?.replaceAll('_', ' ') || 'Type' }

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
        const { data } = await supabase.from('content_items').insert({ title: 'Untitled', status: 'idea' }).select('id,title,status,content_type,due_date,body,updated_at').single()
        if (data) { navigate(`/content/${data.id}`, { replace: true }); setItem(data as EditorItem) }
        setIsLoading(false); return
      }
      const { data } = await supabase.from('content_items').select('id,title,status,content_type,due_date,body,updated_at').eq('id', id).single()
      setItem((data as EditorItem) ?? null); setIsLoading(false)
    }
    void load()
  }, [id, navigate])

  const scheduleSave = (patch: Partial<EditorItem>) => {
    if (!item) return
    const next = { ...item, ...patch }
    setItem(next)
    if (saveTimeout.current) window.clearTimeout(saveTimeout.current)
    saveTimeout.current = window.setTimeout(async () => {
      await supabase.from('content_items').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', next.id)
      setItem((prev) => prev ? { ...prev, updated_at: new Date().toISOString() } : prev)
    }, 1000)
  }

  const lastSavedLabel = useMemo(() => item?.updated_at ? `Saved ${new Date(item.updated_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Not saved yet', [item?.updated_at])

  if (isLoading || !item) return <div className="rounded-xl border-[0.5px] border-[var(--border)] bg-white p-6 text-[12px] text-[var(--muted)]">Loading editor…</div>

  return (
    <section className="relative flex min-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-xl border-[0.5px] border-[var(--border)] bg-white">
      <header className="flex flex-wrap items-center gap-2 border-b-[0.5px] border-[var(--border)] bg-white px-4 py-2.5">
        <button type="button" className="flex items-center gap-1 text-[11px] text-[var(--muted)] hover:text-[var(--text)]" onClick={() => navigate('/content')}>‹ Content</button>
        <input value={item.title} onChange={(event) => scheduleSave({ title: event.target.value })} className="min-w-[220px] flex-1 bg-transparent font-serif text-[16px] font-medium outline-none" placeholder="Untitled" />
        <div className="h-5 w-px bg-[var(--border)]" />
        <select value={item.content_type ?? ''} onChange={(event) => scheduleSave({ content_type: event.target.value || null })} className="rounded-[7px] border-[0.5px] border-transparent bg-transparent px-2 py-1.5 text-[11.5px] outline-none hover:border-[var(--border)] hover:bg-[#f5f3f0]">
          <option value="">{label(null)}</option>{typeOptions.map((type) => <option key={type} value={type}>{label(type)}</option>)}
        </select>
        <input type="date" value={item.due_date ?? ''} onChange={(event) => scheduleSave({ due_date: event.target.value || null })} className="rounded-[7px] border-[0.5px] border-transparent bg-transparent px-2 py-1.5 text-[11.5px] outline-none hover:border-[var(--border)] hover:bg-[#f5f3f0]" />
        <select value={item.status} onChange={(event) => scheduleSave({ status: event.target.value as ContentStatus })} className="rounded-full border-[0.5px] border-transparent bg-[rgba(226,183,190,0.2)] px-3 py-1.5 text-[11px] font-medium text-[#9a6068] outline-none hover:border-[var(--border)]">
          {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <span className="ml-auto whitespace-nowrap text-[10.5px] text-[#c8c5c0]">{lastSavedLabel}</span>
      </header>
      <ContentEditor initialBody={item.body ?? ''} onBodyChange={(html, plainText) => { setDraftText(plainText); scheduleSave({ body: html }) }} />
      <JamiePanel contentItemId={item.id} draftText={draftText} />
    </section>
  )
}

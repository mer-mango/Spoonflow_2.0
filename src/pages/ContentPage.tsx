import { useMemo, useState } from 'react'
import { ContentKanban } from '../components/content/ContentKanban'
import { ContentList } from '../components/content/ContentList'
import { PreviewPanel } from '../components/content/PreviewPanel'
import { useToast } from '../components/shared/Toast'
import { useContent, type ContentItem } from '../hooks/useContent'

const filters = ['All', 'LinkedIn', 'Substack', 'Due soon'] as const

export function ContentPage() {
  const { items, isLoading, createContent, updateContent } = useContent()
  const { notify } = useToast()
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')
  const [selected, setSelected] = useState<ContentItem | null>(null)
  const [quickTitle, setQuickTitle] = useState('')
  const [quickType, setQuickType] = useState('linkedin_post')

  const filteredItems = useMemo(() => {
    const now = Date.now()
    return items.filter((item) => {
      if (filter === 'LinkedIn') return item.platform === 'li'
      if (filter === 'Substack') return item.platform === 'ss'
      if (filter === 'Due soon') {
        if (!item.due_date) return false
        return (new Date(item.due_date).getTime() - now) / (1000 * 60 * 60 * 24) <= 5
      }
      return item.status !== 'archived'
    })
  }, [filter, items])

  const selectedFresh = useMemo(() => (selected ? items.find((item) => item.id === selected.id) ?? selected : null), [items, selected])

  const saveQuick = async () => {
    if (!quickTitle.trim()) return
    const platform = quickType.startsWith('linkedin') ? 'li' : 'ss'
    const { error } = await createContent({ title: quickTitle.trim(), content_type: quickType, platform })
    if (!error) {
      setQuickTitle('')
      notify('Content idea saved')
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--bg)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-[0.5px] border-[var(--border)] bg-white px-5 py-4">
        <div>
          <h1 className="font-serif text-[22px] font-medium tracking-[-0.4px]">Content Studio</h1>
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">Capture ideas, move pieces through the pipeline, and open a focused editor when you’re ready.</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b-[0.5px] border-[var(--border)] bg-white px-4 py-2">
        {filters.map((item) => <button key={item} type="button" className={`rounded-full border-[0.5px] px-3 py-1.5 text-[11px] ${filter === item ? 'border-[var(--content)] bg-[rgba(226,183,190,0.15)] font-medium text-[#9a6068]' : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--content)] hover:text-[#9a6068]'}`} onClick={() => setFilter(item)}>{item}</button>)}
        <div className="flex flex-1 items-center gap-1.5 md:max-w-[420px]">
          <input value={quickTitle} onChange={(event) => setQuickTitle(event.target.value)} placeholder="Quick idea…" className="min-w-[140px] flex-1 rounded-[7px] border-[0.5px] border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-[11.5px] outline-none focus:bg-white focus:border-[rgba(226,183,190,0.5)]" onKeyDown={(event) => { if (event.key === 'Enter') void saveQuick() }} />
          <select value={quickType} onChange={(event) => setQuickType(event.target.value)} className="rounded-[7px] border-[0.5px] border-[var(--border)] bg-white px-2 py-1.5 text-[10.5px] text-[var(--muted)] outline-none">
            <option value="linkedin_post">LinkedIn Post</option><option value="linkedin_article">LinkedIn Article</option><option value="linkedin_video">LinkedIn Video</option><option value="substack_note">Substack Note</option><option value="substack_post">Substack Post</option>
          </select>
          <button type="button" className="rounded-[7px] bg-[#f0eaf3] px-3 py-1.5 text-[11px] font-medium text-[var(--jamie)] hover:bg-[#e6d8ed]" onClick={() => void saveQuick()}>Save</button>
        </div>
        <div className="ml-auto flex rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--bg)] p-[3px]">
          <button type="button" className={`rounded-md px-3 py-1.5 text-[11.5px] ${view === 'list' ? 'bg-white text-[var(--text)] shadow-[0_1px_4px_rgba(0,0,0,0.09)]' : 'text-[var(--muted)]'}`} onClick={() => setView('list')}>List</button>
          <button type="button" className={`rounded-md px-3 py-1.5 text-[11.5px] ${view === 'kanban' ? 'bg-white text-[var(--text)] shadow-[0_1px_4px_rgba(0,0,0,0.09)]' : 'text-[var(--muted)]'}`} onClick={() => setView('kanban')}>Kanban</button>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? <p className="text-[12px] text-[var(--muted)]">Loading content…</p> : view === 'list' ? (
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className={selectedFresh ? 'min-w-0 flex-1' : 'w-full'}><ContentList items={filteredItems} onOpen={setSelected} onUpdate={async (id, patch) => { await updateContent(id, patch) }} /></div>
            {selectedFresh && <PreviewPanel item={selectedFresh} onClose={() => setSelected(null)} />}
          </div>
        ) : <ContentKanban items={filteredItems} onOpen={setSelected} />}
      </div>
    </section>
  )
}

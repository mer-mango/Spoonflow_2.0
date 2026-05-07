import { useMemo, useState } from 'react'
import { ContentKanban } from '../components/content/ContentKanban'
import { ContentList } from '../components/content/ContentList'
import { PreviewPanel } from '../components/content/PreviewPanel'
import { useToast } from '../components/shared/Toast'
import { useContent, type ContentItem } from '../hooks/useContent'

export function ContentPage() {
  const { items, isLoading, createContent, updateContent } = useContent()
  const { notify } = useToast()
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [selected, setSelected] = useState<ContentItem | null>(null)
  const [quickTitle, setQuickTitle] = useState('')
  const [quickType, setQuickType] = useState('linkedin_post')

  const selectedFresh = useMemo(
    () => (selected ? items.find((item) => item.id === selected.id) ?? selected : null),
    [items, selected],
  )

  return (
    <section className="space-y-4">
      <header className="rounded-2xl bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl">Content</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`rounded-lg px-3 py-2 text-sm ${view === 'list' ? 'bg-[var(--jamie)] text-white' : 'bg-black/5'}`}
              onClick={() => setView('list')}
            >
              List
            </button>
            <button
              type="button"
              className={`rounded-lg px-3 py-2 text-sm ${view === 'kanban' ? 'bg-[var(--jamie)] text-white' : 'bg-black/5'}`}
              onClick={() => setView('kanban')}
            >
              Kanban
            </button>
          </div>
        </div>
      </header>

      <div className="rounded-2xl bg-white p-4">
        <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
          <input
            value={quickTitle}
            onChange={(event) => setQuickTitle(event.target.value)}
            placeholder="Quick capture"
            className="rounded-lg border border-[var(--border)] px-3 py-2"
            onKeyDown={async (event) => {
              if (event.key !== 'Enter') return
              if (!quickTitle.trim()) return
              const platform = quickType.startsWith('linkedin') ? 'li' : 'ss'
              const { error } = await createContent({
                title: quickTitle.trim(),
                content_type: quickType,
                platform,
              })
              if (!error) {
                setQuickTitle('')
                notify('Content idea saved')
              }
            }}
          />
          <select
            value={quickType}
            onChange={(event) => setQuickType(event.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2"
          >
            <option value="linkedin_post">LinkedIn Post</option>
            <option value="linkedin_article">LinkedIn Article</option>
            <option value="linkedin_video">LinkedIn Video</option>
            <option value="substack_note">Substack Note</option>
            <option value="substack_post">Substack Post</option>
          </select>
          <button
            type="button"
            className="rounded-lg bg-[var(--jamie)] px-4 py-2 text-white"
            onClick={async () => {
              if (!quickTitle.trim()) return
              const platform = quickType.startsWith('linkedin') ? 'li' : 'ss'
              const { error } = await createContent({
                title: quickTitle.trim(),
                content_type: quickType,
                platform,
              })
              if (!error) {
                setQuickTitle('')
                notify('Content idea saved')
              }
            }}
          >
            Save
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-[var(--muted)]">Loading content...</p>
        ) : view === 'list' ? (
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className={selectedFresh ? 'flex-1' : 'w-full'}>
              <ContentList
                items={items}
                onOpen={setSelected}
                onUpdate={async (id, patch) => {
                  await updateContent(id, patch)
                }}
              />
            </div>
            {selectedFresh && (
              <PreviewPanel item={selectedFresh} onClose={() => setSelected(null)} />
            )}
          </div>
        ) : (
          <ContentKanban items={items} onOpen={setSelected} />
        )}
      </div>
    </section>
  )
}

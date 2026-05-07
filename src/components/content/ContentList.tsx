import type { ContentItem, ContentStatus } from '../../hooks/useContent'

const statuses: ContentStatus[] = ['idea', 'drafting', 'refining', 'ready', 'scheduled', 'published', 'archived']

function platformLabel(item: ContentItem) {
  if (item.platform === 'li') return 'LinkedIn'
  if (item.platform === 'ss') return 'Substack'
  return 'Draft'
}

function platformColor(item: ContentItem) {
  if (item.platform === 'li') return '#0a66c2'
  if (item.platform === 'ss') return '#ff6719'
  return '#c8c5c0'
}

function statusClass(status: ContentStatus) {
  const map: Record<ContentStatus, string> = {
    idea: 'bg-[rgba(200,197,192,0.2)] text-[#888]',
    drafting: 'bg-[rgba(193,152,173,0.18)] text-[#8a5070]',
    refining: 'bg-[rgba(228,185,171,0.22)] text-[#9a6550]',
    ready: 'bg-[rgba(143,167,144,0.2)] text-[#4a7050]',
    scheduled: 'bg-[rgba(100,132,161,0.16)] text-[#537898]',
    published: 'bg-[rgba(143,167,144,0.25)] text-[#4a7050]',
    archived: 'bg-[rgba(44,44,42,0.08)] text-[var(--muted)]',
  }
  return map[status]
}

function dateLabel(date: string | null) {
  if (!date) return 'No date'
  return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function ContentList({
  items,
  onOpen,
  onUpdate,
}: {
  items: ContentItem[]
  onOpen: (item: ContentItem) => void
  onUpdate: (id: string, patch: Partial<ContentItem>) => Promise<void>
}) {
  const now = Date.now()
  const needsAttention = items.filter((item) => {
    if (!item.due_date) return false
    const delta = (new Date(item.due_date).getTime() - now) / (1000 * 60 * 60 * 24)
    return delta <= 5
  })

  const rest = items.filter((item) => !needsAttention.some((attention) => attention.id === item.id))

  const renderItem = (item: ContentItem) => (
    <article
      key={item.id}
      className="relative cursor-pointer rounded-[9px] border-[0.5px] border-[var(--border)] bg-white px-3 py-3 transition hover:border-[rgba(226,183,190,0.4)] hover:shadow-[0_2px_10px_rgba(0,0,0,0.08)]"
      onClick={() => onOpen(item)}
    >
      <div className="absolute bottom-0 left-0 top-0 w-[3px] rounded-l-[9px]" style={{ backgroundColor: platformColor(item) }} />
      <div className="grid gap-2 pl-2 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-medium leading-snug">{item.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10.5px] text-[var(--muted)]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: platformColor(item) }} />
            <span>{platformLabel(item)}</span>
            <span>·</span>
            <span>{item.content_type?.replaceAll('_', ' ') || 'No type'}</span>
          </div>
        </div>
        <select
          value={item.status}
          className={`rounded px-2 py-1 text-[10px] font-medium outline-none ${statusClass(item.status)}`}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => void onUpdate(item.id, { status: event.target.value as ContentStatus })}
        >
          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <input
          type="date"
          value={item.due_date ?? ''}
          className="rounded border-[0.5px] border-[var(--border)] bg-[#faf9f8] px-2 py-1 text-[10.5px] text-[var(--muted)] outline-none"
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => void onUpdate(item.id, { due_date: event.target.value || null })}
        />
        <span className="text-right text-[10.5px] text-[var(--muted)]">{dateLabel(item.due_date)}</span>
      </div>
    </article>
  )

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-[11px] font-medium text-[var(--muted)]"><span>⏰</span> Needs attention</h2>
        {needsAttention.length === 0 ? <p className="rounded-[9px] border-[0.5px] border-dashed border-[var(--border)] bg-white p-3 text-[11.5px] text-[#c8c5c0]">No items due in the next 5 days.</p> : needsAttention.map(renderItem)}
      </section>
      <section className="space-y-2">
        <h2 className="text-[11px] font-medium text-[var(--muted)]">All content</h2>
        {rest.length === 0 ? <p className="rounded-[9px] border-[0.5px] border-dashed border-[var(--border)] bg-white p-3 text-[11.5px] text-[#c8c5c0]">No content items yet.</p> : rest.map(renderItem)}
      </section>
    </div>
  )
}

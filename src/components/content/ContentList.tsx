import type { ContentItem, ContentStatus } from '../../hooks/useContent'
import { Badge } from '../shared/Badge'

const statuses: ContentStatus[] = ['idea', 'drafting', 'refining', 'ready', 'scheduled', 'published', 'archived']

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
      className="grid cursor-pointer gap-2 rounded-xl border border-[var(--border)] bg-white p-3 md:grid-cols-[1fr_auto_auto_auto]"
      onClick={() => onOpen(item)}
    >
      <div className="min-w-0">
        <p className="truncate font-medium">{item.title}</p>
        <p className="text-xs text-[var(--muted)]">{item.content_type || 'No type set'}</p>
      </div>
      <select
        value={item.status}
        className="rounded-md border border-[var(--border)] px-2 py-1 text-xs"
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => void onUpdate(item.id, { status: event.target.value as ContentStatus })}
      >
        {statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={item.due_date ?? ''}
        className="rounded-md border border-[var(--border)] px-2 py-1 text-xs"
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => void onUpdate(item.id, { due_date: event.target.value || null })}
      />
      <div className="flex items-center justify-end gap-2">
        <Badge label={item.platform === 'li' ? 'LinkedIn' : item.platform === 'ss' ? 'Substack' : 'Draft'} variant={item.platform === 'li' ? 'linkedin' : 'substack'} />
      </div>
    </article>
  )

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h2 className="text-sm text-[var(--muted)]">⏰ Needs attention</h2>
        {needsAttention.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--border)] bg-white p-3 text-xs text-[var(--muted)]">
            No items due in the next 5 days.
          </p>
        ) : (
          needsAttention.map(renderItem)
        )}
      </section>
      <section className="space-y-2">
        <h2 className="text-sm text-[var(--muted)]">All content</h2>
        {rest.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--border)] bg-white p-3 text-xs text-[var(--muted)]">
            No content items yet.
          </p>
        ) : (
          rest.map(renderItem)
        )}
      </section>
    </div>
  )
}

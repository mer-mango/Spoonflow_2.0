import type { ContentItem } from '../../hooks/useContent'

const columns = ['idea', 'drafting', 'refining', 'ready', 'scheduled', 'published'] as const

export function ContentKanban({
  items,
  onOpen,
}: {
  items: ContentItem[]
  onOpen: (item: ContentItem) => void
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {columns.map((column) => (
        <section key={column} className="min-h-[260px] w-[240px] shrink-0 rounded-2xl bg-white p-3">
          <h3 className="mb-2 text-sm text-[var(--muted)]">{column}</h3>
          <div className="space-y-2">
            {items
              .filter((item) => item.status === column)
              .map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className="w-full rounded-xl border border-[var(--border)] p-2 text-left"
                  onClick={() => onOpen(item)}
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-[var(--muted)]">{item.content_type || 'No type'}</p>
                </button>
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}

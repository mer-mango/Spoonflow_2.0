import type { ContentItem } from '../../hooks/useContent'

const columns = ['idea', 'drafting', 'refining', 'ready', 'scheduled', 'published'] as const

function typeLabel(type: string | null) {
  return type?.replaceAll('_', ' ') || 'No type'
}

function dateLabel(date: string | null) {
  if (!date) return 'No date'
  return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function ContentKanban({ items, onOpen }: { items: ContentItem[]; onOpen: (item: ContentItem) => void }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {columns.map((column) => {
        const columnItems = items.filter((item) => item.status === column)
        return (
          <section key={column} className="min-h-[330px] w-[250px] shrink-0">
            <div className="mb-2 flex items-center justify-between rounded-[9px] bg-white px-3 py-2">
              <h3 className="text-[12px] font-medium capitalize text-[var(--muted)]">{column}</h3>
              <span className="rounded-full bg-[#f5f3f0] px-2 py-0.5 text-[10px] text-[var(--muted)]">{columnItems.length}</span>
            </div>
            <div className="space-y-2">
              {columnItems.map((item) => (
                <button key={item.id} type="button" className="w-full rounded-[9px] border-[0.5px] border-[var(--border)] bg-white p-3 text-left transition hover:border-[rgba(226,183,190,0.4)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]" onClick={() => onOpen(item)}>
                  <p className="text-[12.5px] font-medium leading-snug">{item.title}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded bg-[rgba(226,183,190,0.22)] px-2 py-1 text-[10px] text-[#9a6068]">{typeLabel(item.content_type)}</span>
                    <span className="rounded bg-[#f5f3f0] px-2 py-1 text-[10px] text-[var(--muted)]">{dateLabel(item.due_date)}</span>
                  </div>
                </button>
              ))}
              {columnItems.length === 0 && <p className="rounded-[9px] border-[0.5px] border-dashed border-[var(--border)] bg-white p-3 text-center text-[11px] text-[#c8c5c0]">Empty</p>}
            </div>
          </section>
        )
      })}
    </div>
  )
}

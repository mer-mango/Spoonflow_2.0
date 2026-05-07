import type { ContentItem } from '../../hooks/useContent'
import { Badge } from '../shared/Badge'

function fmtDate(date: string | null) {
  if (!date) return 'No due date'
  return new Date(date).toLocaleDateString()
}

export function PreviewPanel({
  item,
  onClose,
}: {
  item: ContentItem
  onClose: () => void
}) {
  return (
    <aside className="w-full rounded-2xl border border-[var(--border)] bg-white p-4 lg:w-[320px]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h2 className="text-lg">{item.title}</h2>
        <button type="button" className="text-sm text-[var(--muted)]" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Badge label={item.status} variant="content" />
        <Badge
          label={item.platform === 'li' ? 'LinkedIn' : item.platform === 'ss' ? 'Substack' : 'Unknown'}
          variant={item.platform === 'li' ? 'linkedin' : 'substack'}
        />
      </div>
      <p className="text-sm text-[var(--muted)]">Due: {fmtDate(item.due_date)}</p>
      <p className="mt-3 text-sm">{item.excerpt || 'No excerpt yet.'}</p>
    </aside>
  )
}

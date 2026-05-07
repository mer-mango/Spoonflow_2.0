import type { ContentItem } from '../../hooks/useContent'

function fmtDate(date: string | null) {
  if (!date) return 'No due date'
  return new Date(date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })
}

function platformLabel(item: ContentItem) {
  if (item.platform === 'li') return 'LinkedIn'
  if (item.platform === 'ss') return 'Substack'
  return 'Draft'
}

export function PreviewPanel({ item, onClose }: { item: ContentItem; onClose: () => void }) {
  return (
    <aside className="w-full shrink-0 overflow-hidden rounded-[10px] border-[0.5px] border-[var(--border)] bg-white lg:w-[320px]">
      <div className="flex items-center justify-between border-b-[0.5px] border-[var(--border)] bg-white px-4 py-3">
        <p className="text-[12px] font-medium text-[var(--muted)]">Preview</p>
        <button type="button" className="text-[18px] leading-none text-[var(--muted)] hover:text-[var(--text)]" onClick={onClose}>×</button>
      </div>
      <div className="p-5">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--muted)]">{platformLabel(item)}</p>
        <h2 className="font-serif text-[18px] font-medium leading-snug tracking-[-0.2px]">{item.title}</h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded px-2 py-1 text-[10px] font-medium bg-[rgba(226,183,190,0.22)] text-[#9a6068]">{item.status}</span>
          <span className="rounded px-2 py-1 text-[10px] font-medium bg-[#f5f3f0] text-[var(--muted)]">{item.content_type?.replaceAll('_', ' ') || 'No type'}</span>
        </div>
        <p className="mt-4 text-[11.5px] text-[var(--muted)]">Due: {fmtDate(item.due_date)}</p>
        <div className="mt-4 border-t-[0.5px] border-[var(--border)] pt-4 text-[12.5px] leading-7 text-[var(--text)]">
          <p>{item.excerpt || 'No excerpt yet. Open this piece to start drafting or ask Jamie for help shaping the idea.'}</p>
        </div>
      </div>
    </aside>
  )
}

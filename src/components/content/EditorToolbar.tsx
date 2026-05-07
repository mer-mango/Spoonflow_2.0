export function EditorToolbar({
  onFormat,
  wordCount,
}: {
  onFormat: (command: string, value?: string) => void
  wordCount: number
}) {
  const openLinkedIn = () => window.open('https://www.linkedin.com/post/new', '_blank', 'noopener,noreferrer')
  const openSubstack = () => window.open('https://substack.com/publish/post/new', '_blank', 'noopener,noreferrer')

  return (
    <div className="sticky top-2 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-white p-2 text-sm">
      <button type="button" className="rounded px-2 py-1 hover:bg-black/5" onClick={() => onFormat('bold')}>
        B
      </button>
      <button type="button" className="rounded px-2 py-1 italic hover:bg-black/5" onClick={() => onFormat('italic')}>
        I
      </button>
      <button type="button" className="rounded px-2 py-1 underline hover:bg-black/5" onClick={() => onFormat('underline')}>
        U
      </button>
      <button type="button" className="rounded px-2 py-1 hover:bg-black/5" onClick={() => onFormat('formatBlock', 'h1')}>
        H1
      </button>
      <button type="button" className="rounded px-2 py-1 hover:bg-black/5" onClick={() => onFormat('formatBlock', 'h2')}>
        H2
      </button>
      <button type="button" className="rounded px-2 py-1 hover:bg-black/5" onClick={() => onFormat('insertUnorderedList')}>
        Bullets
      </button>
      <button type="button" className="rounded px-2 py-1 hover:bg-black/5" onClick={() => onFormat('formatBlock', 'blockquote')}>
        Quote
      </button>
      <button type="button" className="rounded px-2 py-1 hover:bg-black/5" onClick={openLinkedIn}>
        LinkedIn
      </button>
      <button type="button" className="rounded px-2 py-1 hover:bg-black/5" onClick={openSubstack}>
        Substack
      </button>
      <span className="ml-auto text-xs text-[var(--muted)]">{wordCount} words</span>
    </div>
  )
}

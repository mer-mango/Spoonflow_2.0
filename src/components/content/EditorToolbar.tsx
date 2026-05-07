export function EditorToolbar({ onFormat, wordCount }: { onFormat: (command: string, value?: string) => void; wordCount: number }) {
  const openLinkedIn = () => window.open('https://www.linkedin.com/post/new', '_blank', 'noopener,noreferrer')
  const openSubstack = () => window.open('https://substack.com/publish/post/new', '_blank', 'noopener,noreferrer')
  const buttonClass = 'flex h-[26px] items-center justify-center rounded-[5px] px-2 text-[12px] text-[var(--muted)] hover:bg-[#f5f3f0] hover:text-[var(--text)]'

  return (
    <div className="flex flex-wrap items-center gap-[3px] border-b-[0.5px] border-[var(--border)] bg-white px-3.5 py-1.5">
      <button type="button" className={`${buttonClass} font-serif font-bold`} onClick={() => onFormat('bold')}>B</button>
      <button type="button" className={`${buttonClass} italic`} onClick={() => onFormat('italic')}>I</button>
      <button type="button" className={`${buttonClass} underline`} onClick={() => onFormat('underline')}>U</button>
      <div className="mx-1 h-4 w-px bg-[var(--border)]" />
      <button type="button" className={buttonClass} onClick={() => onFormat('formatBlock', 'h1')}>H1</button>
      <button type="button" className={buttonClass} onClick={() => onFormat('formatBlock', 'h2')}>H2</button>
      <div className="mx-1 h-4 w-px bg-[var(--border)]" />
      <button type="button" className={buttonClass} onClick={() => onFormat('insertUnorderedList')}>•</button>
      <button type="button" className={buttonClass} onClick={() => onFormat('formatBlock', 'blockquote')}>“”</button>
      <button type="button" className={buttonClass} onClick={() => onFormat('createLink', window.prompt('Paste URL') ?? '')}>Link</button>
      <div className="ml-auto flex items-center gap-1.5">
        <span className="whitespace-nowrap text-[10px] text-[#c8c5c0]">{wordCount} words</span>
        <button type="button" className="rounded-md border-[0.5px] border-[rgba(10,102,194,0.25)] px-2.5 py-1 text-[10.5px] font-medium text-[#0a66c2] hover:bg-[rgba(10,102,194,0.06)]" onClick={openLinkedIn}>LinkedIn</button>
        <button type="button" className="rounded-md border-[0.5px] border-[rgba(255,103,25,0.25)] px-2.5 py-1 text-[10.5px] font-medium text-[#ff6719] hover:bg-[rgba(255,103,25,0.06)]" onClick={openSubstack}>Substack</button>
      </div>
    </div>
  )
}

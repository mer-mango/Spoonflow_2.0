import { useEffect, useRef, useState } from 'react'
import { EditorToolbar } from './EditorToolbar'

export function ContentEditor({ initialBody, onBodyChange }: { initialBody: string; onBodyChange: (html: string, plainText: string) => void }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [wordCount, setWordCount] = useState(0)

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== initialBody) {
      ref.current.innerHTML = initialBody || ''
      const text = ref.current.innerText.trim()
      setWordCount(text ? text.split(/\s+/).length : 0)
    }
  }, [initialBody])

  const handleInput = () => {
    if (!ref.current) return
    const html = ref.current.innerHTML
    const text = ref.current.innerText
    const count = text.trim() ? text.trim().split(/\s+/).length : 0
    setWordCount(count)
    onBodyChange(html, text)
  }

  const format = (command: string, value?: string) => {
    if (command === 'createLink' && !value) return
    document.execCommand(command, false, value)
    handleInput()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <EditorToolbar onFormat={format} wordCount={wordCount} />
      <div className="flex-1 overflow-y-auto bg-white">
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          className="mx-auto min-h-full max-w-[700px] px-10 py-8 text-[14px] leading-[1.8] text-[var(--text)] outline-none empty:before:pointer-events-none empty:before:text-[#c8c5c0] empty:before:content-[attr(data-placeholder)]"
          data-placeholder="Start writing here…"
          onInput={handleInput}
        />
      </div>
    </div>
  )
}

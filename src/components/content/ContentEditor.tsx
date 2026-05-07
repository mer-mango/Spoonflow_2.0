import { useEffect, useMemo, useRef, useState } from 'react'
import { EditorToolbar } from './EditorToolbar'

export function ContentEditor({
  initialBody,
  onBodyChange,
}: {
  initialBody: string
  onBodyChange: (html: string, plainText: string) => void
}) {
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
    document.execCommand(command, false, value)
    handleInput()
  }

  const editorClass = useMemo(
    () =>
      'mx-auto min-h-[420px] w-full max-w-[700px] rounded-2xl border border-[var(--border)] bg-white px-8 py-10 text-sm leading-8 outline-none',
    [],
  )

  return (
    <div>
      <EditorToolbar onFormat={format} wordCount={wordCount} />
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className={editorClass}
        onInput={handleInput}
      />
    </div>
  )
}

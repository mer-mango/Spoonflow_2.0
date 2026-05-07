import { useState } from 'react'

type Message = { role: 'user' | 'assistant'; content: string; createdAt: string }

export function JamieWidget({
  messages,
  isLoading,
  onSend,
  draftText,
}: {
  messages: Message[]
  isLoading: boolean
  onSend: (text: string, draftText: string) => Promise<void>
  draftText: string
}) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')

  return (
    <>
      {open && (
        <section className="fixed bottom-20 right-4 z-50 flex h-[520px] w-[360px] flex-col rounded-2xl border border-[var(--border)] bg-white shadow-xl">
          <header className="rounded-t-2xl bg-[var(--jamie)] px-4 py-3 text-white">
            <p className="font-medium">Jamie</p>
            <p className="text-xs text-white/90">Reading your draft in real time</p>
          </header>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {messages.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Ask Jamie for edits, rewrite ideas, or stronger hooks.</p>
            ) : (
              messages.map((message, idx) => (
                <article
                  key={`${message.createdAt}-${idx}`}
                  className={`rounded-xl p-2 text-sm ${
                    message.role === 'assistant' ? 'bg-black/5' : 'bg-[var(--content)]/40'
                  }`}
                >
                  {message.content}
                </article>
              ))
            )}
            {isLoading && <p className="text-xs text-[var(--muted)]">Jamie is thinking...</p>}
          </div>
          <div className="border-t border-[var(--border)] p-3">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={2}
                className="w-full rounded-lg border border-[var(--border)] px-2 py-2 text-sm"
                placeholder="Ask Jamie..."
              />
              <button
                type="button"
                className="rounded-lg bg-[var(--jamie)] px-3 py-2 text-sm text-white"
                onClick={async () => {
                  if (!input.trim()) return
                  const text = input.trim()
                  setInput('')
                  await onSend(text, draftText)
                }}
              >
                Send
              </button>
            </div>
          </div>
        </section>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 right-4 z-40 rounded-full bg-[var(--jamie)] px-4 py-3 text-sm font-medium text-white shadow-lg"
      >
        ✦ Ask Jamie
      </button>
    </>
  )
}

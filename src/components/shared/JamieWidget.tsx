import { useEffect, useRef, useState } from 'react'

type Message = { role: 'user' | 'assistant'; content: string; createdAt: string }
type JamieState = 'pill' | 'widget' | 'modal'

type SpeechRecognitionResultLike = {
  0?: { transcript?: string }
}

type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>
}

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

const chips = ['Sharpen hook', "What's missing?", 'More emotional', 'Make concise', 'Stronger ending']

function SparkleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M6.5 1 5.7 4.8 2 5.6l3.7.9.8 3.7.8-3.7 3.7-.9-3.7-.8L6.5 1Z" fill="currentColor" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="5" y="1.5" width="4" height="7" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 6.5a4 4 0 0 0 8 0M7 10.5V13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M12 2 6 12 5 8.5 2 7l10-5Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

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
  const [state, setState] = useState<JamieState>('pill')
  const [input, setInput] = useState('')
  const [attachOpen, setAttachOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [pdfName, setPdfName] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches

  useEffect(() => {
    const speechWindow = window as SpeechWindow
    const SpeechRecognitionCtor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) return

    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
      setInput(transcript)
    }
    recognition.onend = () => setIsRecording(false)
    recognitionRef.current = recognition
  }, [])

  const send = async (text = input) => {
    if (!text.trim()) return
    setInput('')
    setAttachOpen(false)
    await onSend(text.trim(), draftText)
  }

  const startVoice = () => {
    if (!recognitionRef.current) {
      setInput((prev) => `${prev}${prev ? '\n' : ''}[Voice input is not supported in this browser.]`)
      return
    }
    recognitionRef.current.start()
    setIsRecording(true)
    setAttachOpen(false)
  }

  const stopVoice = () => {
    recognitionRef.current?.stop()
    setIsRecording(false)
  }

  const messageList = (
    <div className="flex-1 space-y-2 overflow-y-auto p-3">
      {messages.length === 0 ? (
        <div className="rounded-xl border-[0.5px] border-[var(--border)] bg-[#faf9f8] p-3 text-[12px] leading-relaxed text-[var(--muted)]">
          Ask Jamie for a stronger hook, cleaner structure, tighter language, or a more Meredith-sounding ending.
        </div>
      ) : (
        messages.map((message, idx) => (
          <article
            key={`${message.createdAt}-${idx}`}
            className={`rounded-xl px-3 py-2 text-[12px] leading-relaxed ${
              message.role === 'assistant' ? 'bg-[#f5f3f0] text-[var(--text)]' : 'bg-[#f3eaf1] text-[var(--text)]'
            }`}
          >
            {message.content}
          </article>
        ))
      )}
      {isLoading && <p className="text-[11px] text-[var(--muted)]">Jamie is thinking…</p>}
      {isRecording && <p className="text-[11px] font-medium text-[var(--jamie)]">Recording voice brain dump…</p>}
      {pdfName && <p className="rounded-lg bg-[#f9f3f7] px-3 py-2 text-[11.5px] text-[var(--muted)]">Attached PDF context: {pdfName}</p>}
    </div>
  )

  const quickChips = (
    <div className="flex flex-wrap gap-1.5 border-b-[0.5px] border-[var(--border)] bg-[#faf9f8] px-3 py-2">
      {chips.map((chip) => (
        <button
          key={chip}
          type="button"
          className="rounded-full bg-[#f0eaf3] px-2.5 py-1 text-[11px] leading-none text-[var(--jamie)] hover:bg-[#e2d4ed]"
          onClick={() => void send(chip)}
        >
          {chip}
        </button>
      ))}
    </div>
  )

  const inputRow = (
    <div className="relative border-t-[0.5px] border-[var(--border)] p-3">
      {attachOpen && (
        <div className="absolute bottom-[58px] left-3 w-[190px] rounded-xl border-[0.5px] border-[var(--border)] bg-white p-1 shadow-[0_6px_20px_rgba(0,0,0,0.14)]">
          <button type="button" className="block w-full rounded-lg px-3 py-2 text-left text-[12px] hover:bg-[#f5f3f0]" onClick={startVoice}>
            Voice Brain Dump
          </button>
          <button type="button" className="block w-full rounded-lg px-3 py-2 text-left text-[12px] hover:bg-[#f5f3f0]" onClick={() => setInput((prev) => `${prev}${prev ? '\n' : ''}Brain dump: `)}>
            Text Brain Dump
          </button>
          <label className="block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-[12px] hover:bg-[#f5f3f0]">
            Upload PDF
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                setPdfName(file.name)
                setInput((prev) => `${prev}${prev ? '\n' : ''}[PDF attached for context: ${file.name}]`)
                setAttachOpen(false)
              }}
            />
          </label>
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          type="button"
          className="flex h-9 w-9 min-w-9 items-center justify-center rounded-full border-[0.5px] border-[var(--border)] text-[var(--muted)] hover:bg-[#f5f3f0]"
          onClick={() => setAttachOpen((value) => !value)}
          aria-label="Add context"
        >
          <PlusIcon />
        </button>
        <div className="flex min-h-9 flex-1 items-end gap-2 rounded-[9px] border-[0.5px] border-[var(--border)] bg-white px-3 py-2 focus-within:border-[rgba(107,35,88,0.4)]">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={1}
            className="max-h-24 min-h-[20px] flex-1 resize-none bg-transparent text-[13px] leading-5 outline-none placeholder:text-[#c8c5c0]"
            placeholder="Ask Jamie anything…"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void send()
              }
            }}
          />
          <button
            type="button"
            className={`text-[var(--muted)] hover:text-[var(--jamie)] ${isRecording ? 'text-[var(--jamie)]' : ''}`}
            onClick={isRecording ? stopVoice : startVoice}
            aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
          >
            <MicIcon />
          </button>
        </div>
        <button
          type="button"
          className="flex h-9 w-9 min-w-9 items-center justify-center rounded-full bg-[var(--jamie)] text-white hover:bg-[#5a1d4a] disabled:opacity-50"
          disabled={!input.trim() || isLoading}
          onClick={() => void send()}
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  )

  const header = (
    <header className="flex items-center justify-between rounded-t-2xl bg-[var(--jamie)] px-4 py-3 text-white">
      <div>
        <p className="flex items-center gap-1.5 text-[13px] font-medium"><SparkleIcon /> Jamie</p>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-white/85">
          <span className="h-1.5 w-1.5 rounded-full bg-[#8fa790]" /> Reading your draft in real time
        </p>
      </div>
      <button type="button" className="text-[18px] leading-none text-white/80 hover:text-white" onClick={() => setState('pill')} aria-label="Close Jamie">
        ×
      </button>
    </header>
  )

  if (state === 'modal') {
    return (
      <section className="fixed inset-0 z-[70] flex bg-white md:p-4">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-none border-[0.5px] border-[var(--border)] bg-white md:rounded-2xl">
          {header}
          {quickChips}
          {messageList}
          {inputRow}
        </div>
        <aside className="hidden w-[42%] max-w-[520px] flex-col overflow-hidden border-l-[0.5px] border-[var(--border)] bg-[#faf9f8] md:flex">
          <div className="border-b-[0.5px] border-[var(--border)] bg-white px-5 py-4">
            <p className="font-serif text-[18px] font-medium">Live draft mirror</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Jamie sees this text with every message.</p>
          </div>
          <div className="flex-1 overflow-y-auto whitespace-pre-wrap px-6 py-5 text-[13px] leading-7 text-[var(--text)]">
            {draftText || 'No draft text yet.'}
          </div>
        </aside>
      </section>
    )
  }

  return (
    <>
      {state === 'widget' && (
        <section className="fixed bottom-20 right-4 z-50 hidden h-[520px] w-[360px] flex-col overflow-hidden rounded-2xl border-[0.5px] border-[var(--border)] bg-white shadow-[0_10px_34px_rgba(0,0,0,0.18)] md:flex">
          {header}
          {quickChips}
          {messageList}
          <div className="border-t-[0.5px] border-[var(--border)] bg-[#faf9f8] px-3 py-2 text-right">
            <button type="button" className="text-[11px] font-medium text-[var(--jamie)]" onClick={() => setState('modal')}>
              Expand →
            </button>
          </div>
          {inputRow}
        </section>
      )}

      <button
        type="button"
        onClick={() => setState(isMobile ? 'modal' : state === 'widget' ? 'pill' : 'widget')}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-1.5 rounded-full bg-[var(--jamie)] px-4 py-3 text-[13px] font-medium text-white shadow-[0_6px_18px_rgba(0,0,0,0.18)] hover:bg-[#5a1d4a]"
      >
        ✦ Ask Jamie
        {messages.length > 0 && <span className="ml-1 rounded-full bg-white px-1.5 py-0.5 text-[10px] leading-none text-[var(--jamie)]">{messages.length}</span>}
      </button>
    </>
  )
}

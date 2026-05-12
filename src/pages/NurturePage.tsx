import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NurtureBuckets } from '../components/nurture/NurtureBuckets'
import { Modal } from '../components/shared/Modal'
import { useToast } from '../components/shared/Toast'
import { useNurture } from '../hooks/useNurture'

type SavedNurtureMessage = {
  id: string
  title: string
  body: string
}

const MESSAGE_STORAGE_KEY = 'spoonflow_nurture_messages'

function loadSavedMessages() {
  try {
    const saved = localStorage.getItem(MESSAGE_STORAGE_KEY)
    return saved ? (JSON.parse(saved) as SavedNurtureMessage[]) : []
  } catch {
    return []
  }
}

function saveMessages(messages: SavedNurtureMessage[]) {
  localStorage.setItem(MESSAGE_STORAGE_KEY, JSON.stringify(messages))
}

export function NurturePage() {
  const navigate = useNavigate()
  const { contacts, isLoading } = useNurture()
  const { notify } = useToast()
  const [messagesOpen, setMessagesOpen] = useState(false)
  const [savedMessages, setSavedMessages] = useState<SavedNurtureMessage[]>([])
  const [messageTitle, setMessageTitle] = useState('')
  const [messageBody, setMessageBody] = useState('')

  useEffect(() => {
    setSavedMessages(loadSavedMessages())
  }, [])

  const sortedContacts = useMemo(() => contacts, [contacts])

  const handleSaveMessage = () => {
    if (!messageTitle.trim() && !messageBody.trim()) return

    const nextMessages = [
      {
        id: crypto.randomUUID(),
        title: messageTitle.trim() || 'Untitled message',
        body: messageBody.trim(),
      },
      ...savedMessages,
    ]

    setSavedMessages(nextMessages)
    saveMessages(nextMessages)
    setMessageTitle('')
    setMessageBody('')
  }

  const handleDeleteMessage = (id: string) => {
    const nextMessages = savedMessages.filter((message) => message.id !== id)
    setSavedMessages(nextMessages)
    saveMessages(nextMessages)
  }

  const handleCopyMessage = async (body: string) => {
    await navigator.clipboard.writeText(body)
    notify('Copied nurture message')
  }

  return (
    <section className="overflow-hidden rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--bg)]">
      <header className="border-b-[0.5px] border-[var(--border)] bg-white px-5 py-4">
        <h1 className="font-serif text-[26px] font-medium tracking-[-0.4px]">
          Nurture
        </h1>
       
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b-[0.5px] border-[var(--border)] bg-[var(--bg)] px-5 py-3">
        <input
          placeholder="Search nurture contacts"
          className="max-w-[220px] flex-1 rounded-[7px] border-[0.5px] border-[var(--border)] bg-white px-3 py-2 text-[11.5px] outline-none focus:border-[rgba(143,167,144,0.5)]"
        />

        <button
          type="button"
          onClick={() => setMessagesOpen(true)}
          className="rounded-full bg-[rgba(143,167,144,0.16)] px-3 py-2 text-[11.5px] font-semibold text-[#6f8d70] transition hover:bg-[rgba(143,167,144,0.24)]"
        >
          Nurture Messages
        </button>

        <span className="ml-auto text-[11px] text-[var(--muted)]">
          {contacts.length} contacts
        </span>
      </div>

      <div className="p-4">
        {isLoading ? (
          <p className="text-[12px] text-[var(--muted)]">Loading nurture contacts…</p>
        ) : (
          <NurtureBuckets
            contacts={sortedContacts}
            onOpen={(contact) => navigate(`/contacts/${contact.id}?tab=nurture`)}
          />
        )}
      </div>

      <Modal
        open={messagesOpen}
        onClose={() => setMessagesOpen(false)}
        title="Nurture Messages"
        maxWidthClassName="max-w-2xl"
      >
        <div className="space-y-4">
          <section className="rounded-xl border border-[var(--border)] bg-white p-4">
            <p className="font-serif text-xl">Save a reusable message</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Store email or LinkedIn DM copy you use often, then copy it when you need it.
            </p>

            <div className="mt-4 space-y-3">
              <input
                value={messageTitle}
                onChange={(event) => setMessageTitle(event.target.value)}
                placeholder="Message title"
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--nurture)]"
              />

              <textarea
                value={messageBody}
                onChange={(event) => setMessageBody(event.target.value)}
                placeholder="Write the message copy here..."
                rows={5}
                className="w-full resize-y rounded-lg border border-[var(--border)] px-3 py-2 text-sm leading-6 outline-none focus:border-[var(--nurture)]"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveMessage}
                  className="rounded-lg bg-[var(--nurture)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Save Message
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            {savedMessages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[rgba(143,167,144,0.35)] bg-[rgba(143,167,144,0.06)] p-5 text-sm text-[#6f8d70]">
                No saved nurture messages yet.
              </div>
            ) : (
              savedMessages.map((message) => (
                <article
                  key={message.id}
                  className="rounded-xl border border-[var(--border)] bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text)]">{message.title}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">
                        {message.body}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => void handleCopyMessage(message.body)}
                        className="rounded-lg bg-[rgba(143,167,144,0.16)] px-3 py-2 text-xs font-semibold text-[#6f8d70]"
                      >
                        Copy
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(message.id)}
                        className="rounded-lg px-3 py-2 text-xs text-[var(--muted)] hover:bg-black/[0.04]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>
        </div>
      </Modal>
    </section>
  )
}

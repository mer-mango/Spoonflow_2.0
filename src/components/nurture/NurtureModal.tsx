import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../shared/Modal'
import type { NurtureContact, NurtureUpdateInput } from '../../hooks/useNurture'

type NurtureMethod = 'email' | 'linkedin' | 'meeting' | 'other' | 'skipped'

type NurtureLogEntry = {
  id: string
  createdAt: string
  method: NurtureMethod
  notes: string
  archived: boolean
  collapsed: boolean
}

const nurtureOptions = [
  { label: 'None', value: '' },
  { label: '2 weeks', value: '14' },
  { label: '4 weeks', value: '28' },
  { label: '6 weeks', value: '42' },
  { label: '8 weeks', value: '56' },
  { label: '10 weeks', value: '70' },
  { label: '12 weeks', value: '84' },
]

const methodOptions: Array<{ label: string; value: NurtureMethod }> = [
  { label: 'Email', value: 'email' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Meeting', value: 'meeting' },
  { label: 'Other', value: 'other' },
  { label: 'Skipped', value: 'skipped' },
]

function dateInputValue(value?: string | null) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function isoFromDateInput(value: string) {
  if (!value) return null

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12, 0, 0, 0)

  return date.toISOString()
}

function dateLabel(value?: string | null) {
  if (!value) return '—'

  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function shortDateLabel(value: string) {
  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
}

function addDaysDateInput(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function storageKey(contactId: string) {
  return `spoonflow_nurture_logs_${contactId}`
}

function loadLogs(contactId: string) {
  try {
    const saved = localStorage.getItem(storageKey(contactId))
    return saved ? (JSON.parse(saved) as NurtureLogEntry[]) : []
  } catch {
    return []
  }
}

function saveLogs(contactId: string, logs: NurtureLogEntry[]) {
  localStorage.setItem(storageKey(contactId), JSON.stringify(logs))
}

function gmailComposeUrl(email: string) {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`
}

function FieldLabel({ children }: { children: string }) {
  return (
    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
      {children}
    </label>
  )
}

export function NurtureModal({
  open,
  contact,
  onClose,
  onSave,
}: {
  open: boolean
  contact: NurtureContact | null
  onClose: () => void
  onSave: (contactId: string, patch: NurtureUpdateInput) => Promise<{ error: { message?: string } | null }>
}) {
  const [frequencyDays, setFrequencyDays] = useState('')
  const [nextNurtureDate, setNextNurtureDate] = useState('')
  const [logOpen, setLogOpen] = useState(false)
  const [draftMethod, setDraftMethod] = useState<NurtureMethod>('email')
  const [draftNotes, setDraftNotes] = useState('')
  const [logs, setLogs] = useState<NurtureLogEntry[]>([])
  const [editingLogId, setEditingLogId] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !contact) return

    setFrequencyDays(contact.nurture_frequency_days ? String(contact.nurture_frequency_days) : '')
    setNextNurtureDate(dateInputValue(contact.next_nurture_date))
    setLogOpen(false)
    setDraftMethod('email')
    setDraftNotes('')
    setEditingLogId(null)
    setLogs(loadLogs(contact.id))
  }, [open, contact])

  const visibleLogs = useMemo(
    () => logs.filter((entry) => !entry.archived),
    [logs],
  )

  if (!contact) return null

  const contextText =
    contact.notes ||
    contact.about ||
    'AI-generated context from the last interaction will appear here once connected.'

  const saveLogCollection = (nextLogs: NurtureLogEntry[]) => {
    setLogs(nextLogs)
    saveLogs(contact.id, nextLogs)
  }

  const handleFrequencyChange = (value: string) => {
    setFrequencyDays(value)

    if (value) {
      setNextNurtureDate(addDaysDateInput(Number(value)))
    } else {
      setNextNurtureDate('')
    }
  }

  const handleSaveLog = () => {
    if (!draftNotes.trim()) return

    if (editingLogId) {
      const updatedLogs = logs.map((entry) =>
        entry.id === editingLogId
          ? {
              ...entry,
              method: draftMethod,
              notes: draftNotes.trim(),
              collapsed: true,
            }
          : entry,
      )

      saveLogCollection(updatedLogs)
      setEditingLogId(null)
      setDraftNotes('')
      setDraftMethod('email')
      setLogOpen(false)
      return
    }

    const nextEntry: NurtureLogEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      method: draftMethod,
      notes: draftNotes.trim(),
      archived: false,
      collapsed: true,
    }

    saveLogCollection([nextEntry, ...logs])
    setDraftNotes('')
    setDraftMethod('email')
    setLogOpen(false)
  }

  const handleEditLog = (entry: NurtureLogEntry) => {
    setEditingLogId(entry.id)
    setDraftMethod(entry.method)
    setDraftNotes(entry.notes)
    setLogOpen(true)
  }

  const handleArchiveLog = (id: string) => {
    const updatedLogs = logs.map((entry) =>
      entry.id === id ? { ...entry, archived: true } : entry,
    )

    saveLogCollection(updatedLogs)
  }

  const handleToggleLog = (id: string) => {
    const updatedLogs = logs.map((entry) =>
      entry.id === id ? { ...entry, collapsed: !entry.collapsed } : entry,
    )

    saveLogCollection(updatedLogs)
  }

  const handleSaveChanges = async () => {
    const frequency = frequencyDays ? Number(frequencyDays) : null
    const nextDate = frequency ? isoFromDateInput(addDaysDateInput(frequency)) : isoFromDateInput(nextNurtureDate)

    await onSave(contact.id, {
      nurture_frequency_days: frequency,
      next_nurture_date: nextDate,
    })

    if (frequency) {
      setNextNurtureDate(dateInputValue(nextDate))
    }

    setLogOpen(false)
  }

  return (
    <Modal open={open} onClose={onClose} title={contact.name} maxWidthClassName="max-w-3xl">
      <div className="space-y-4">
        <section className="rounded-xl border border-[var(--border)] bg-white p-4">
          <h3 className="font-serif text-xl text-[var(--nurture)]">{contact.name}</h3>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {contact.email ? (
              <a
                href={gmailComposeUrl(contact.email)}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[rgba(143,167,144,0.14)] px-3 py-1.5 font-medium text-[#6f8d70] hover:bg-[rgba(143,167,144,0.22)]"
              >
                Email: {contact.email}
              </a>
            ) : (
              <span className="rounded-full bg-[#f5f3f0] px-3 py-1.5 text-[var(--muted)]">
                No email
              </span>
            )}

            {contact.linkedin_url && (
              <a
                href={contact.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[#f5f3f0] px-3 py-1.5 font-medium text-[var(--meeting)] hover:bg-[#ebe8e4]"
              >
                LinkedIn profile
              </a>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-serif text-xl">Nurture schedule</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Choose the cadence and confirm the next follow-up date.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <FieldLabel>Frequency</FieldLabel>
                <select
                  value={frequencyDays}
                  onChange={(event) => handleFrequencyChange(event.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--nurture)]"
                >
                  {nurtureOptions.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>Next nurture date</FieldLabel>
                <input
                  type="date"
                  value={nextNurtureDate}
                  onChange={(event) => setNextNurtureDate(event.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--nurture)]"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-white p-4">
          <h3 className="font-serif text-xl">Context</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            <span className="font-medium text-[var(--text)]">Date of last meeting:</span>{' '}
            {dateLabel(contact.next_call_date)}
          </p>
          <p className="mt-2 rounded-xl bg-[#faf9f8] p-3 text-sm leading-6 text-[var(--muted)]">
            {contextText}
          </p>
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl">Nurture log</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Record the touch, message, or reason for skipping.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingLogId(null)
                setDraftMethod('email')
                setDraftNotes('')
                setLogOpen((value) => !value)
              }}
              className="rounded-lg bg-[rgba(143,167,144,0.18)] px-3 py-2 text-xs font-semibold text-[#6f8d70]"
            >
              + Log Nurture
            </button>
          </div>

          {logOpen && (
            <div className="mt-4 rounded-xl border border-[rgba(143,167,144,0.28)] bg-[rgba(143,167,144,0.06)] p-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-[var(--nurture)]">
                  {shortDateLabel(new Date().toISOString())}
                </span>

                <select
                  value={draftMethod}
                  onChange={(event) => setDraftMethod(event.target.value as NurtureMethod)}
                  className="ml-auto rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs outline-none focus:border-[var(--nurture)]"
                >
                  {methodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={draftNotes}
                onChange={(event) => setDraftNotes(event.target.value)}
                placeholder="Write the message you sent, notes from the touch, or why you skipped it..."
                rows={4}
                className="mt-3 w-full resize-y rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-[var(--nurture)]"
              />

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveLog}
                  className="rounded-lg bg-[var(--nurture)] px-4 py-2 text-sm font-semibold text-white"
                >
                  {editingLogId ? 'Update Log' : 'Save Log'}
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {visibleLogs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[rgba(143,167,144,0.35)] bg-[rgba(143,167,144,0.06)] p-5 text-sm text-[#6f8d70]">
                No nurture touches logged yet.
              </div>
            ) : (
              visibleLogs.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-xl border border-[var(--border)] bg-[#faf9f8] p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleLog(entry.id)}
                      className="text-xs text-[var(--muted)]"
                    >
                      {entry.collapsed ? '▸' : '▾'}
                    </button>

                    <span className="text-xs font-semibold text-[var(--nurture)]">
                      {shortDateLabel(entry.createdAt)}
                    </span>

                    <span className="rounded-full bg-white px-2 py-1 text-[10.5px] font-medium capitalize text-[var(--muted)]">
                      {entry.method}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleEditLog(entry)}
                      className="ml-auto text-[10.5px] font-medium text-[var(--meeting)]"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleArchiveLog(entry.id)}
                      className="text-[10.5px] font-medium text-[var(--muted)]"
                    >
                      Archive
                    </button>
                  </div>

                  {!entry.collapsed && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text)]">
                      {entry.notes}
                    </p>
                  )}
                </article>
              ))
            )}
          </div>
        </section>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-white pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-[var(--muted)] transition hover:bg-black/[0.04]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => void handleSaveChanges()}
            className="rounded-lg bg-[var(--jamie)] px-5 py-2 text-sm font-semibold text-white"
          >
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  )
}
